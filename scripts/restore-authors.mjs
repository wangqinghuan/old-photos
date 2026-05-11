import * as fs from "fs";

const DATA_FILE = "src/data/photos.json";

const RAW_DUMPS = {
  "1mucf8l": "/tmp/reddit_1mucf8l.json",
  "1mws6gv": "/tmp/reddit_1mws6gv.json",
};

// Build author map from raw Reddit JSON
function buildAuthorMap(filepath) {
  const raw = JSON.parse(fs.readFileSync(filepath, "utf-8"));
  const comments = raw[1]?.data?.children || [];
  const map = {};

  function walk(node) {
    if (node.kind !== "t1") return;
    const d = node.data;
    map[d.id] = d.author === "[deleted]" ? "[已删除]" : d.author;
    if (d.replies && typeof d.replies === "object" && d.replies.data?.children) {
      for (const r of d.replies.data.children) walk(r);
    }
  }

  for (const c of comments) walk(c);
  return map;
}

const photos = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));

for (const [postId, dumpFile] of Object.entries(RAW_DUMPS)) {
  if (!fs.existsSync(dumpFile)) {
    console.log(`${postId}: no raw dump`);
    continue;
  }

  const authorMap = buildAuthorMap(dumpFile);
  console.log(`${postId}: ${Object.keys(authorMap).length} authors in dump`);

  const post = photos.find((p) => p.id === postId);
  if (!post) { console.log(`  post not found`); continue; }

  let restored = 0;
  function walk(arr) {
    for (const c of arr) {
      if (authorMap[c.id]) {
        c.author = authorMap[c.id];
        restored++;
      }
      if (c.replies) walk(c.replies);
    }
  }
  walk(post.comments);
  console.log(`  restored ${restored} authors`);
}

fs.writeFileSync(DATA_FILE, JSON.stringify(photos, null, 2));
console.log("Done");
