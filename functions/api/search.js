export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();

  if (!q) {
    return new Response(JSON.stringify({ items: [], total: 0 }), {
      headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=300" },
    });
  }

  try {
    const resp = await fetch(new URL("/data/photos-full.json", request.url));
    const photos = await resp.json();
    const results = [];

    for (const photo of photos) {
      const match = findMatch(photo, q);
      if (match) {
        results.push({
          id: photo.id,
          title: photo.title,
          description: photo.description,
          imageUrl: photo.imageUrl,
          postedAt: photo.postedAt,
          year: photo.year,
          location: photo.location,
          upvotes: photo.upvotes,
          commentCount: countAll(photo.comments || []),
          images: photo.images || undefined,
          matchField: match.field,
          matchSnippet: match.snippet,
        });
      }
    }

    return new Response(JSON.stringify({ items: results, total: results.length }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

function findMatch(photo, q) {
  if (photo.title && includesCi(photo.title, q)) {
    return { field: "title", snippet: photo.title };
  }
  if (photo.description && includesCi(photo.description, q)) {
    const idx = photo.description.toLowerCase().indexOf(q);
    const start = Math.max(0, idx - 30);
    const end = Math.min(photo.description.length, idx + q.length + 30);
    return {
      field: "description",
      snippet: (start > 0 ? "..." : "") + photo.description.slice(start, end) + (end < photo.description.length ? "..." : ""),
    };
  }
  if (photo.location && includesCi(photo.location, q)) {
    return { field: "location", snippet: photo.location };
  }
  return searchComments(photo.comments || [], q);
}

function includesCi(text, q) {
  return text.toLowerCase().indexOf(q) !== -1;
}

function searchComments(comments, q) {
  for (const c of comments) {
    if (c.body && includesCi(c.body, q)) {
      const idx = c.body.toLowerCase().indexOf(q);
      const start = Math.max(0, idx - 30);
      const end = Math.min(c.body.length, idx + q.length + 30);
      return {
        field: "comment",
        snippet: (start > 0 ? "..." : "") + c.body.slice(start, end) + (end < c.body.length ? "..." : ""),
      };
    }
    if (c.author && includesCi(c.author, q)) {
      return { field: "author", snippet: c.author };
    }
    if (c.replies) {
      const r = searchComments(c.replies, q);
      if (r) return r;
    }
  }
  return null;
}

function countAll(comments) {
  let n = 0;
  for (const c of comments) {
    n++;
    if (c.replies) n += countAll(c.replies);
  }
  return n;
}
