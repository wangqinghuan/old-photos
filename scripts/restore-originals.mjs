import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import axios from "axios";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DATA_FILE = path.join(__dirname, "..", "src", "data", "photos.json");

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

const SKIP_PATTERNS = [
  /^https?:\/\//i,
  /^!\[gif\]\(/i,
  /^[😂👍💯🙏❤️🫶💔💖😢😭🙌😊😁🎉🔥👏⭐💪🙏🕊️👑💯✅✨💜😍🤣😘🥰😎🤗🤔🙄😴🤤😈👻💀☠️👽🤖🎃😺😸😹😻😼😽🙀😿😾🫶🫰🫵🫱🫲🫳🫴]+$/,
  /^[\u{1F300}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}]+$/u,
  /^\+1$/i,
  /^[😢😂👍💯🙏🫶💔💖]+$/,
];

function isPureEmojiOrLink(body) {
  if (!body) return true;
  const s = body.trim();
  if (!s) return true;
  for (const re of SKIP_PATTERNS) {
    if (re.test(s)) return true;
  }
  return false;
}

async function restorePost(post) {
  if (!post.comments || post.comments.length === 0) return;

  // Check if all comments already have originalBody
  function allHaveOrig(arr) {
    for (const c of arr) {
      if (!c.originalBody && !isPureEmojiOrLink(c.body)) return false;
      if (c.replies && !allHaveOrig(c.replies)) return false;
    }
    return true;
  }
  if (allHaveOrig(post.comments)) {
    console.log(`${post.id}: all done, skipping`);
    return;
  }

  console.log(`\n${post.id}: fetching from Reddit...`);
  let redditData;
  try {
    const { data } = await axios.get(
      `https://old.reddit.com/r/RareHistoricalPhotos/comments/${post.id}/.json?raw_json=1`,
      { headers: { "User-Agent": USER_AGENT }, timeout: 30000 }
    );
    redditData = data;
  } catch (e) {
    console.log(`  FAILED: ${e.message}`);
    return;
  }

  const rawComments = redditData[1].data.children;

  // Build map of comment id -> original body from Reddit
  const originalMap = new Map();
  function walk(nodes) {
    for (const node of nodes) {
      if (node.kind === "t1") {
        const d = node.data;
        originalMap.set(d.id, d.body || "");
        if (d.replies && d.replies.data && d.replies.data.children) {
          walk(d.replies.data.children);
        }
      }
    }
  }
  walk(rawComments);

  // Merge originalBody into our data
  let restored = 0;
  let skipped = 0;
  function merge(arr) {
    for (const c of arr) {
      if (!c.originalBody) {
        if (isPureEmojiOrLink(c.body)) {
          skipped++;
        } else {
          const orig = originalMap.get(c.id);
          if (orig && orig !== "[deleted]" && orig !== "[removed]") {
            c.originalBody = orig;
            restored++;
          } else {
            skipped++;
          }
        }
      }
      if (c.replies) merge(c.replies);
    }
  }
  merge(post.comments);
  console.log(`  restored: ${restored}, skipped (emoji/link/no-match): ${skipped}`);
}

async function main() {
  const photos = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  console.log(`Loaded ${photos.length} photos`);

  for (let i = 0; i < photos.length; i++) {
    await restorePost(photos[i]);
    fs.writeFileSync(DATA_FILE, JSON.stringify(photos, null, 2));
    console.log(`  [${i + 1}/${photos.length}] Saved`);
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log("\nAll done!");
}

main().catch(console.error);
