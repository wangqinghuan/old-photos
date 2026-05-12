const RECENT_KEY = "recent_visits";

export async function onRequest(context) {
  const { request, env } = context;

  if (typeof env.OLD_PHOTOS_COUNTER?.get !== "function") {
    return new Response("本地开发模式下不可用", { status: 200 });
  }

  try {
    const raw = await env.OLD_PHOTOS_COUNTER.get(RECENT_KEY);
    const visits = raw ? JSON.parse(raw) : [];

    const total = await env.OLD_PHOTOS_COUNTER.get("visitors");
    const totalCount = (parseInt(total) || 0) + 801000;

    const rows = visits.map((v, i) => `
      <tr>
        <td>${v.time}</td>
        <td>${esc(v.ua)}</td>
        <td>${esc(v.ref || "-")}</td>
        <td>${esc(v.ip || "-")}</td>
      </tr>
    `).join("");

    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="utf-8"><title>访问统计 - 时光相册</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#fafaf9;color:#1c1917;padding:24px;max-width:960px;margin:0 auto}
h1{font-size:1.25rem;margin-bottom:8px}
p{margin-bottom:16px;color:#57534e}
table{width:100%;border-collapse:collapse;font-size:.8125rem}
th,td{text-align:left;padding:8px 12px;border-bottom:1px solid #e7e5e4;word-break:break-all}
th{background:#f5f5f4;font-weight:500}
td{font-family:monospace;font-size:.75rem}
</style></head>
<body>
<h1>📊 访问统计</h1>
<p>总访客：${totalCount} · 最近 ${visits.length} 次访问</p>
<table>
<thead><tr><th>时间</th><th>客户端</th><th>来源</th><th>IP</th></tr></thead>
<tbody>${rows}</tbody>
</table>
</body></html>`;

    return new Response(html, {
      headers: { "Content-Type": "text/html;charset=utf-8" }
    });
  } catch (e) {
    return new Response("Error: " + e.message, { status: 500 });
  }
}

function esc(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
