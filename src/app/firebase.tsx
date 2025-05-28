import { initializeApp } from "firebase/app";
import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  setDoc,
  updateDoc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_PROJECT_ID + ".firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_PROJECT_ID + ".firebasestorage.app",
  messagingSenderId: "83232147437", // honestly no clue what these are
  appId: "1:83232147437:web:975a4f2d3083ff97d709e4",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "");

export async function fetchDocument(name: string) {
  const query_snapshot = await getDocs(collection(db, "documents"));
  const contents = query_snapshot.docs[0].data().contents;
  return contents;
}

async function saltAndHash(rawPassword: string) {
  const password = "salt:" + rawPassword;

  const data = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return hashHex;
}

export async function getAllUsers(): Promise<
  { fullname: string; color: string; name: string }[] | null
> {
  const snapshot = await getDocs(collection(db, "users"));
  const users: { fullname: string; color: string; name: string }[] = [];
  snapshot.docs.forEach((user) => {
    const data = user.data();
    users.push({
      fullname: data.fullname,
      color: data.color,
      name: data.name,
    });
  });
  return users.filter((user) => user.name); // Exclude admin user
}

export async function findUser(name: string, password: string) {
  // const snapshot = await getDocs(collection(db, `users`));
  // snapshot.docs.forEach((v) => {
  //   console.log(v);
  // });

  const userEntry = await getDoc(doc(db, "users", name));
  if (!userEntry) {
    // not able to find user Entry
    return { status: 401, message: "unable to authenticate" };
  }

  const provided = await saltAndHash(password);
  const target = userEntry.get("password");
  if (provided === target) {
    const fullname = userEntry.get("fullname");
    const color = userEntry.get("color");
    console.log("found user", fullname);

    return { status: 200, fullname, color };
  } else {
    return { status: 401, message: "unable to authenticate" };
  }
}

export async function registerUser(
  username: string,
  password: string,
  fullname: string,
  color: string
) {
  // TODO: add duplicate username detection
  const doesUsernameExist = await getAllUsers().then((users) => {
    return users?.some((user) => user.name === username);
  });

  if (doesUsernameExist) {
    throw new Error("Username already exists");
  }

  const shPassword = await saltAndHash(password);

  await setDoc(doc(db, "users", username), {
    name: username,
    password: shPassword,
    fullname: fullname,
    color: color,
    allowedRooms: [],
  });
}

export async function disallowAccessToRoomId(roomId: string) {
  const userDocs = await getDocs(collection(db, "users"));
  const users: any = [];
  userDocs.forEach((user) => {
    users.push(user.data());
  });

  // fuck this this is far from ideal but im so tired
  for (const idx in users) {
    if (users[idx]["name"]) {
      await disallowUserAccessToRoomId(users[idx]["name"], roomId);
    }
  }
}

export async function updateColor(username: string, newColor: string) {
  await updateDoc(doc(db, "users", username), {
    color: newColor,
  });
}

export async function getAvailableRoomIds(username: string) {
  const userEntry = await getDoc(doc(db, "users", username));
  return userEntry.get("allowedRooms");
}

export async function allowAccessToRoomId(username: string, roomId: string) {
  await updateDoc(doc(db, "users", username), {
    allowedRooms: arrayUnion(roomId),
  });
}

export async function disallowUserAccessToRoomId(
  username: string,
  roomId: string
) {
  await updateDoc(doc(db, "users", username), {
    allowedRooms: arrayRemove(roomId),
  });
}

export async function getUserInfo(
  username: string
): Promise<{ name: string; color: string }> {
  const userInfo = await getDoc(doc(db, "users", username));
  return {
    name: userInfo.get("fullname"),
    color: userInfo.get("color"),
  };
}
