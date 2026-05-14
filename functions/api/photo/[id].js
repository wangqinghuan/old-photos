export async function onRequest(context) {
  const { request, params } = context;
  const photoId = params.id;

  try {
    const resp = await fetch(new URL("/data/photos-full.json", request.url));
    const photos = await resp.json();
    const photo = photos.find((p) => p.id === photoId);

    if (!photo) {
      return new Response(JSON.stringify({ error: "Photo not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(photo), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
