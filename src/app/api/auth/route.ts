import { auth, users } from "@/app/auth";
import { getAvailableRoomIds } from "@/app/firebase";
import { liveblocks } from "@/app/liveblocks";

interface AuthRequest {
  roomId: string | undefined;
  userId: string;
}

export async function POST(request: Request) {
  const authRequest: AuthRequest = await request.json();
  if (!authRequest.roomId) {
    return new Response("Specify roomId in auth request.", { status: 401 });
  }

  const session = liveblocks.prepareSession(authRequest.userId, {
    userInfo: {
      name: authRequest.userId,
      color: users.find((u) => u.name === authRequest.userId)?.color ?? "black", // TODO: let users specify thier own cursors
    },
  });

  const availableRooms: string[] = await getAvailableRoomIds(authRequest.userId);
  if (availableRooms.includes(authRequest.roomId)) {
    session.allow(`${authRequest.roomId}`, session.FULL_ACCESS); // wild card access to all rooms
  } else {
    return new Response("Unauthorized roomId", { status: 401 });
  }

  const { status, body } = await session.authorize();
  return new Response(body, { status });
}
