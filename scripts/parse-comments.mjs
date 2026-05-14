import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "..", "src", "data", "photos.json");

const POSTS = [
  { id: "1mucf8l", file: "/tmp/reddit_1mucf8l.json" },
  { id: "1mws6gv", file: "/tmp/reddit_1mws6gv.json" },
];

function walk(node) {
  if (node.kind !== "t1") return null;
  const d = node.data;
  const createdAt = d.created_utc ? new Date(d.created_utc * 1000).toISOString() : undefined;
  const comment = {
    id: d.id,
    author: d.author === "[deleted]" ? "[已删除]" : d.author,
    score: d.score || 0,
    body: d.body && d.body !== "[removed]" && d.body !== "[deleted]" ? d.body : null,
    createdAt,
    replies: [],
  };
  if (d.replies && typeof d.replies === "object" && d.replies.data?.children) {
    for (const r of d.replies.data.children) {
      const reply = walk(r);
      if (reply) comment.replies.push(reply);
    }
  }
  return comment;
}

function countAll(arr) {
  return arr.length + arr.reduce((s, c) => s + countAll(c.replies || []), 0);
}

const photos = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));

for (const post of POSTS) {
  const raw = JSON.parse(fs.readFileSync(post.file, "utf-8"));
  const rawComments = raw[1]?.data?.children || [];

  const newComments = [];
  for (const c of rawComments) {
    const comment = walk(c);
    if (comment) newComments.push(comment);
  }

  console.log(`${post.id}: ${countAll(newComments)} total comments`);

  const existing = photos.find((p) => p.id === post.id);
  if (!existing) continue;

  // Build lookup of existing comments by Reddit ID
  const existingMap = {};
  function idx(arr) {
    for (const c of arr) {
      existingMap[c.id] = c;
      if (c.replies) idx(c.replies);
    }
  }
  idx(existing.comments || []);

  // Preserve Chinese translations where IDs match
  function merge(arr) {
    for (const c of arr) {
      const old = existingMap[c.id];
      if (old && old.body) c.body = old.body;
      if (c.replies) merge(c.replies);
    }
  }
  merge(newComments);

  // Count how many translations were preserved
  let preserved = 0;
  function countPreserved(arr) {
    for (const c of arr) {
      const old = existingMap[c.id];
      if (old && old.body) preserved++;
      if (c.replies) countPreserved(c.replies);
    }
  }
  countPreserved(newComments);
  console.log(`  Preserved translations: ${preserved}/${countAll(newComments)}`);

  existing.comments = newComments;
}

fs.writeFileSync(DATA_FILE, JSON.stringify(photos, null, 2));
console.log(`\nSaved ${DATA_FILE}`);
