export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const photoId = url.searchParams.get("id");

  if (!photoId) {
    return new Response(JSON.stringify({ error: "Missing photo id" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  if (typeof env.OLD_PHOTOS_COUNTER?.get !== "function") {
    return new Response(JSON.stringify({ upvotes: 0 }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  const key = `upvote_${photoId}`;

  if (request.method === "POST") {
    const current = parseInt(await env.OLD_PHOTOS_COUNTER.get(key)) || 0;
    await env.OLD_PHOTOS_COUNTER.put(key, String(current + 1));
    return new Response(JSON.stringify({ upvotes: current + 1 }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Cache-Control": "no-cache" },
    });
  }

  const upvotes = parseInt(await env.OLD_PHOTOS_COUNTER.get(key)) || 0;
  return new Response(JSON.stringify({ upvotes }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=60" },
  });
}
