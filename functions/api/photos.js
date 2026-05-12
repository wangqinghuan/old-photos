export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page")) || 1;
  const limit = Math.min(parseInt(url.searchParams.get("limit")) || 20, 100);

  try {
    const resp = await fetch(new URL("/data/catalog.json", request.url));
    const catalog = await resp.json();

    const start = (page - 1) * limit;
    const items = catalog.slice(start, start + limit);
    const hasMore = start + limit < catalog.length;

    return new Response(JSON.stringify({ items, page, limit, hasMore, total: catalog.length }), {
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
