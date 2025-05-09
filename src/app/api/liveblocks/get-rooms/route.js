export async function GET() {
  try {
    const response = await fetch("https://api.liveblocks.io/v2/rooms", {
      headers: {
        Authorization: `Bearer ${process.env.LB_KEY}`,
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: "Failed" });
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
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
