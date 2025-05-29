import { liveblocks } from "@/app/liveblocks";

export async function GET(request: Request, props: { params: any }) {
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
    // TODO: Ritesh is REALLY lazy. There's definitely a better way to do this. Hopefully.
    if (typeof doc.maindoc === "string") {
      doc.maindoc = doc.maindoc.replaceAll('<heading level="2">', "<h2>");
      doc.maindoc = doc.maindoc.replaceAll("</heading>", "</h2>");
      doc.maindoc = doc.maindoc.replaceAll("<paragraph>", "<p>");
      doc.maindoc = doc.maindoc.replaceAll("</paragraph>", "</p>");
      doc.maindoc = doc.maindoc.replaceAll("[[", "");
      doc.maindoc = doc.maindoc.replaceAll("]]", "");
      doc.maindoc = doc.maindoc.replaceAll("<p></p>", "");
      doc.maindoc = doc.maindoc.replaceAll(
        '<inlineaicomponent prompt="',
        "<strong>"
      );
      doc.maindoc = doc.maindoc.replaceAll("</inlineaicomponent>", "</strong>");
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
