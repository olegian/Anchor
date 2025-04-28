import { initializeApp }  from "firebase/app";
import { collection, getDocs, getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBx_ZTTR4GAUsnvQ6rUlHo4_CoPLGff5l8",
  authDomain: "gitgpt-62f86.firebaseapp.com",
  projectId: "gitgpt-62f86",
  storageBucket: "gitgpt-62f86.firebasestorage.app",
  messagingSenderId: "83232147437",
  appId: "1:83232147437:web:975a4f2d3083ff97d709e4"
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "")


export async function fetchDocument(name: string) {
    const query_snapshot = await getDocs(collection(db, "documents"))
    const contents = query_snapshot.docs[0].data().contents;
    return contents;
}

