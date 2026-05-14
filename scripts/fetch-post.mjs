import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PHOTOS_DIR = path.join(__dirname, "..", "docs", "photos");
const DATA_FILE = path.join(__dirname, "..", "src", "data", "photos.json");

function parseRedditUrl(url) {
  const match = url.match(/reddit\.com\/r\/(\w+)\/comments\/(\w+)/);
  if (!match) throw new Error("Invalid Reddit URL. Expected: https://reddit.com/r/subreddit/comments/postid/...");
  return { subreddit: match[1], postId: match[2] };
}

function extractYear(title) {
  const m = title.match(/\b(19\d{2}|20\d{2})\b/);
  return m ? m[1] : undefined;
}

async function downloadImage(url, filename) {
  const filepath = path.join(PHOTOS_DIR, filename);
  if (fs.existsSync(filepath)) {
    console.log(`  Already exists: ${filename}`);
    return filename;
  }
  const response = await axios.get(url, { responseType: "stream" });
  const writer = fs.createWriteStream(filepath);
  response.data.pipe(writer);
  await new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
  console.log(`  Downloaded: ${filename}`);
  return filename;
}

function getExtFromUrl(url) {
  const m = url.match(/\.(jpe?g|png|webp|gif)(\?|$)/i);
  return m ? m[1] : "jpg";
}

export async function fetchPost(url) {
  const { subreddit, postId } = parseRedditUrl(url);
  console.log(`Fetching r/${subreddit}/${postId}`);

  const { data } = await axios.get(
    `https://old.reddit.com/r/${subreddit}/comments/${postId}/.json?raw_json=1`,
    { headers: { "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0" } }
  );

  const post = data[0].data.children[0].data;
  const rawComments = data[1].data.children;

  const comments = [];

  let imageUrl, images;
  if (post.is_gallery && post.media_metadata) {
    const mediaIds = post.gallery_data?.items?.map(i => i.media_id) || Object.keys(post.media_metadata);
    images = [];
    for (let idx = 0; idx < mediaIds.length; idx++) {
      const id = mediaIds[idx];
      const meta = post.media_metadata[id];
      if (!meta || !meta.s) continue;
      const src = meta.s.u.replace(/&amp;/g, '&');
      const cleanUrl = src.replace(/^https:\/\/preview\.redd\.it\//, 'https://i.redd.it/').replace(/\?.*$/, '');
      const ext = getExtFromUrl(cleanUrl);
      const filename = `${postId}_${idx}.${ext}`;
      await downloadImage(cleanUrl, filename);
      images.push(`/photos/${filename}`);
    }
    imageUrl = images[0] || '';
  } else {
    imageUrl = post.url;
    const ext = getExtFromUrl(imageUrl);
    const localFilename = `${postId}.${ext}`;
    await downloadImage(imageUrl, localFilename);
    imageUrl = `/photos/${localFilename}`;
  }

  console.log(`\nTitle: ${post.title}`);
  if (images) console.log(`Gallery: ${images.length} images`);
  function walk(node) {
    if (node.kind === "t1") {
      const d = node.data;
      const createdAt = d.created_utc ? new Date(d.created_utc * 1000).toISOString() : undefined;
      const comment = {
        id: d.id,
        author: d.author === "[deleted]" ? "[已删除]" : d.author,
        score: d.score || 0,
        body: (d.body && d.body !== "[removed]" && d.body !== "[deleted]") ? d.body : null,
        createdAt,
        replies: [],
      };
      if (d.replies && typeof d.replies === "object") {
        const replies = d.replies.data?.children || [];
        for (const r of replies) {
          const reply = walk(r);
          if (reply) comment.replies.push(reply);
        }
      }
      return comment;
    }
    return null;
  }
  for (const c of rawComments) {
    const comment = walk(c);
    if (comment) comments.push(comment);
  }

  const year = extractYear(post.title);

  const result = {
    id: postId,
    title: post.title,
    description: post.selftext || post.title,
    imageUrl,
    postedAt: new Date(post.created_utc * 1000).toISOString().split("T")[0],
    upvotes: post.score,
    year,
    images: images && images.length > 1 ? images : undefined,
    comments,
  };

  console.log(`\nDone! ${comments.length} comments extracted.`);
  return result;
}

async function main() {
  const url = process.argv[2];
  if (!url) {
    console.error("Usage: node scripts/fetch-post.mjs <reddit-url>");
    process.exit(1);
  }

  const result = await fetchPost(url);

  let existing = [];
  if (fs.existsSync(DATA_FILE)) {
    existing = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  }

  const idx = existing.findIndex((p) => p.id === result.id);
  if (idx >= 0) {
    const prev = existing[idx];
    result.title = prev.title;
    result.description = prev.description;
    existing[idx] = result;
  } else {
    existing.push(result);
  }

  fs.writeFileSync(DATA_FILE, JSON.stringify(existing, null, 2));
  console.log(`Saved to ${DATA_FILE}`);
  console.log(`Total photos in database: ${existing.length}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(console.error);
}
