import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import axios from "axios";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "..", "src", "data", "photos.json");

const geminiKey = process.env.GEMINI_API_KEY;

async function translate(text) {
  if (!text || /[\u4e00-\u9fff]/.test(text)) return text;
  if (geminiKey) {
    try {
      const { data } = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        { contents: [{ parts: [{ text: `翻译成地道中文（保持语气，只输出译文）：\n${text}` }] }] },
        { timeout: 30000 }
      );
      const result = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (result) return result;
    } catch (e) {
      const msg = e.response?.data?.error?.message || e.message;
      if (msg.includes("quota") || msg.includes("limit")) {
        console.error("  Gemini额度用完，切换到Google");
      } else {
        console.error("  Gemini失败(" + msg + ")，切换到Google");
      }
    }
  }
  try {
    const { data } = await axios.get("https://translate.googleapis.com/translate_a/single", {
      params: { client: "gtx", sl: "en", tl: "zh-CN", dt: "t", q: text },
      timeout: 10000,
    });
    return data?.[0]?.map(s => s[0]).filter(Boolean).join('') || text;
  } catch {
    return text;
  }
}

// Filter config
const TOP_LEVEL_LIMIT = 25;
const REPLY_MIN_SCORE = 15;

function filterTopLevel(comments) {
  const sorted = [...comments].sort((a, b) => (b.score || 0) - (a.score || 0));
  return sorted.slice(0, TOP_LEVEL_LIMIT);
}

function filterReplies(comments) {
  return comments.filter((c) => (c.score || 0) >= REPLY_MIN_SCORE);
}

async function processPost(post) {
  if (!post.comments || !post.comments.length) return;

  // 1. Filter top-level comments
  post.comments = filterTopLevel(post.comments);

  // 2. Recursively filter and translate
  async function walk(arr) {
    for (const c of arr) {
      if (c.replies && c.replies.length) {
        c.replies = filterReplies(c.replies);
        await walk(c.replies);
      }
    }
  }
  await walk(post.comments);

  // 3. Translate all English comments to Chinese
  let translated = 0;
  let skipped = 0;

  async function translateWalk(arr) {
    for (const c of arr) {
      if (c.body && !/[\u4e00-\u9fff]/.test(c.body)) {
        const orig = c.body;
        c.body = await translate(c.body);
        if (c.body !== orig) translated++;
        else skipped++;
        await new Promise((r) => setTimeout(r, 300)); // rate limit
      } else {
        skipped++;
      }
      if (c.replies) await translateWalk(c.replies);
    }
  }
  await translateWalk(post.comments);

  console.log(`  Translated: ${translated}, Skipped (already CN/empty): ${skipped}`);
}

async function main() {
  const photos = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));

  for (const post of photos) {
    if (!post.comments?.length) continue;
    console.log(`\nProcessing ${post.id} (${post.comments.length} top-level)...`);
    await processPost(post);

    // Count final stats
    let total = 0, cn = 0;
    function count(arr) {
      for (const c of arr) {
        total++;
        if (/[\u4e00-\u9fff]/.test(c.body || "")) cn++;
        if (c.replies) count(c.replies);
      }
    }
    count(post.comments);
    console.log(`  Final: ${total} total, ${cn} Chinese`);

    fs.writeFileSync(DATA_FILE, JSON.stringify(photos, null, 2));
    console.log(`  Saved progress to ${DATA_FILE}`);
  }
}

main().catch(console.error);
