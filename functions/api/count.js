export async function onRequest(context) {
  const { request, env } = context;

  // Local dev: KV binding isn't real, return mock
  if (typeof env.OLD_PHOTOS_COUNTER?.get !== "function") {
    return new Response(JSON.stringify({ count: 1 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const count = await env.OLD_PHOTOS_COUNTER.get("visitors");
    const newCount = (parseInt(count) || 0) + 1;
    await env.OLD_PHOTOS_COUNTER.put("visitors", String(newCount));

    const now = new Date();
    const visit = {
      time: now.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" }),
      ua: (request.headers.get("User-Agent") || "").slice(0, 80),
      ref: (request.headers.get("Referer") || "").slice(0, 120),
      ip: request.headers.get("CF-IPCountry") || request.headers.get("X-Forwarded-For") || ""
    };
    const raw = await env.OLD_PHOTOS_COUNTER.get("recent_visits");
    const list = raw ? JSON.parse(raw) : [];
    list.unshift(visit);
    if (list.length > 50) list.length = 50;
    await env.OLD_PHOTOS_COUNTER.put("recent_visits", JSON.stringify(list));

    return new Response(JSON.stringify({ count: newCount + 80000 }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache"
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ count: 0 }), {
      headers: { "Content-Type": "application/json" }
    });
  }
}
