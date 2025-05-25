import { liveblocks } from "@/app/liveblocks";
import { getAvailableRoomIds } from "@/app/firebase";
import { NextRequest } from "next/server";

interface RoomsRequest {
  userId: string;
}

export async function GET(request: NextRequest) {
  try {
    // TODO: this is not secure lol but idc rn
    const searchParams = new URL(request.url).searchParams;
    const userId = searchParams.get("userId")

    console.log(searchParams);
    if (!userId) {
      return new Response(JSON.stringify({ error: "Specify userid" }), {
        status: 500,
      });
    }

    // you can filter available rooms via the liveblocks permissions associated with
    // a user id (with liveblocks.getRooms()), but that requires me to fully understand how lb perms work,
    // and I'm not quite there yet, ill swap this shitty work around out later
    const roomIds = await getAvailableRoomIds(userId);
    const result = await Promise.all(
      roomIds.map(async (roomId: string) => await liveblocks.getRoom(roomId))
    );

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
    });
  }
}
