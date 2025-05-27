import { getUserColor } from "@/app/actions";
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

  const color = await getUserColor(authRequest.userId);
  const session = liveblocks.prepareSession(authRequest.userId, {
    userInfo: {
      name: authRequest.userId,
      color: color ?? "black",
    },
  });

  const availableRooms: string[] = await getAvailableRoomIds(
    authRequest.userId
  );
  if (availableRooms.includes(authRequest.roomId)) {
    session.allow(`${authRequest.roomId}`, session.FULL_ACCESS); // wild card access to all rooms
  } else {
    return new Response("Unauthorized roomId", { status: 401 });
  }

  const { status, body } = await session.authorize();
  return new Response(body, { status });
}
