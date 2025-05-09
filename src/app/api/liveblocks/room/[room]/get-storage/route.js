import { liveblocks } from "@/app/liveblocks";

export async function GET(request, props) {
  const params = await props.params;

  const room = params.room;

  try {
    const response = await fetch(
      `https://api.liveblocks.io/v2/rooms/${room}/storage`,
      {
        headers: {
          Authorization: `Bearer ${process.env.LB_KEY}`,
        },
      }
    );

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch room storage" }),
        { status: response.status }
      );
    }

    const data = await response.json();

    const doc = await liveblocks.getYjsDocument(room, {
      format: true,
    });
    if (doc.maindoc) {
      doc.maindoc = doc.maindoc.replaceAll("<paragraph>", "<p>");
      doc.maindoc = doc.maindoc.replaceAll("</paragraph>", "</p>");
    }

    return new Response(
      JSON.stringify({
        data: data,
        doc: doc,
        room: room,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Liveblocks error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
}
