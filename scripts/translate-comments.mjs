import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import axios from "axios";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "..", "src", "data", "photos.json");

const GEMINI_KEYS = process.env.GEMINI_KEYS
  ? process.env.GEMINI_KEYS.split(",").map(k => k.trim()).filter(Boolean)
  : [];

if (!GEMINI_KEYS.length) {
  console.error("ERROR: GEMINI_KEYS environment variable not set.");
  console.error("Usage: GEMINI_KEYS=key1,key2,key3 node scripts/translate-comments.mjs");
  process.exit(1);
}

const MODELS = [
  "gemini-3.1-flash-lite-preview",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash-001",
  "gemini-2.0-flash-lite-001",
  "gemini-2.5-flash-lite",
  "gemini-flash-lite-latest",
];

const BATCH_SIZE = 10;
const TOP_LEVEL_LIMIT = 25;
const REPLY_MIN_SCORE = 15;
const MAX_OUTPUT_TOKENS = 16384;

function filterTopLevel(comments) {
  const sorted = [...comments].sort((a, b) => (b.score || 0) - (a.score || 0));
  return sorted.slice(0, TOP_LEVEL_LIMIT);
}

function filterReplies(comments) {
  return comments.filter((c) => (c.score || 0) >= REPLY_MIN_SCORE);
}

function collectEnglish(comments) {
  const items = [];
  function walk(arr) {
    for (const c of arr) {
      if (c.body && !/[\u4e00-\u9fff]/.test(c.body)) {
        items.push(c);
      }
      if (c.replies) walk(c.replies);
    }
  }
  walk(comments);
  return items;
}

function isTranslatable(text) {
  if (!text) return false;
  const t = text.trim();
  if (/^https?:\/\/\S+/i.test(t)) return false;
  if (/^[\s\p{So}\p{Sk}\p{Emoji_Presentation}]+$/u.test(t)) return false;
  if (/^[\s\-*_~`>#|]+$/.test(t)) return false;
  if (/^!\[.*\]\(.*\)$/.test(t)) return false;
  if (/^\[deleted\]\s*\S*$/i.test(t)) return false;
  return true;
}

function isValidTranslation(original, translated) {
  if (!translated || translated === original) return false;
  const ratio = original.length / translated.length;
  const origSentences = original.split(/[.!?]+/).filter(s => s.trim().length > 10).length;
  const transSentences = translated.split(/[。！？.!?]+/).filter(s => s.trim().length > 5).length;
  if (ratio > 8) return false;
  if (origSentences >= 3 && transSentences <= 1 && ratio > 4) return false;
  return true;
}

async function translateWithModels(texts, postId, batchNum, totalBatches) {
  if (texts.length === 0) return texts;

  const batch = texts.map((t, i) => `[${i}] ${t}`).join("\n\n");
  const prompt = `翻译以下英文评论为地道中文。保持原文语气，包括俚语、缩写、口语。
重要：必须逐句完整翻译，不得省略任何内容。如果原文有多个句子，译文必须包含全部句子。
每条前面有编号 [N]，翻译内容从 [N] 后面开始，可以换行持续到下一个编号前。
格式示例：
[0] 这是第一句。
这是第二句，接在上行后面。
[1] 下一条评论的翻译。

${batch}`;

  let lastError = null;

  for (const model of MODELS) {
    const startKeyIdx = (batchNum - 1) % GEMINI_KEYS.length;
    for (let k = 0; k < GEMINI_KEYS.length; k++) {
      const key = GEMINI_KEYS[(startKeyIdx + k) % GEMINI_KEYS.length];
      try {
        const { data } = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
          { contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: MAX_OUTPUT_TOKENS } },
          { timeout: 120000 }
        );

        const result = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (!result) {
          console.log(`  Batch ${batchNum}/${totalBatches}: ${model} returned empty, trying next`);
          continue;
        }

        // Parse multi-line translations: [N] captures everything until next [N] or end
        const parsed = [];
        const lines = result.split("\n");
        let currentIdx = -1;
        for (const line of lines) {
          const m = line.match(/^\[(\d+)\]\s*(.*)/);
          if (m) {
            currentIdx = parseInt(m[1]);
            parsed[currentIdx] = m[2].replace(/^译文[：:]\s*/, "");
          } else if (currentIdx >= 0 && line.trim()) {
            const stripped = line.replace(/^译文[：:]\s*/, "");
            parsed[currentIdx] += "\n" + stripped;
          }
        }

        const translated = texts.map((t, i) => parsed[i] || null);

        // Validate translations: require 50%+ of translatable comments to pass
        let validCount = 0;
        let translatableCount = 0;
        for (let i = 0; i < texts.length; i++) {
          if (isTranslatable(texts[i])) {
            translatableCount++;
            if (isValidTranslation(texts[i], translated[i])) validCount++;
          }
        }
        const threshold = translatableCount <= 2 ? translatableCount : Math.ceil(translatableCount * 0.5);
        if (validCount < threshold) {
          console.log(`  Batch ${batchNum}/${totalBatches}: ${model} returned ${validCount}/${translatableCount} valid (need ${threshold}), trying next`);
          continue;
        }

        console.log(`  Batch ${batchNum}/${totalBatches}: [${model}] OK (${validCount}/${translatableCount} valid)`);
        return { model, translated };
      } catch (e) {
        const status = e.response?.status;
        const msg = e.response?.data?.error?.message || e.message;
        console.log(`  Batch ${batchNum}/${totalBatches}: [${model}] ${status} ${msg.slice(0, 60)}`);
        lastError = e;
        if (status === 400) {
          continue;
        }
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }

  console.log(`  Batch ${batchNum}/${totalBatches}: ALL MODELS FAILED, keeping original`);
  return { model: null, translated: texts.map(() => null) };
}

async function translateField(text, label) {
  if (!text || /[\u4e00-\u9fff]/.test(text)) return text;

  const prompt = `翻译以下英文为地道中文，保留原文的所有信息，不要省略任何内容，只输出译文：\n\n${text}`;

  for (const model of MODELS) {
    for (let k = 0; k < GEMINI_KEYS.length; k++) {
      const key = GEMINI_KEYS[k];
      try {
        const { data } = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
          { contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: MAX_OUTPUT_TOKENS } },
          { timeout: 60000 }
        );

        const result = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (result) {
          console.log(`  ${label}: [${model}] ${result.slice(0, 80)}`);
          return result;
        }
      } catch (e) {
        const status = e.response?.status;
        const msg = e.response?.data?.error?.message || e.message;
        console.log(`  ${label}: [${model}] ${status} ${msg.slice(0, 60)}`);
      }
      await new Promise(r => setTimeout(r, 500));
    }
  }

  console.log(`  ${label}: ALL MODELS FAILED`);
  return text;
}

async function processPost(post) {
  if (!post.comments || !post.comments.length) return;

  post.comments = filterTopLevel(post.comments);

  async function walk(arr) {
    for (const c of arr) {
      if (c.replies && c.replies.length) {
        c.replies = filterReplies(c.replies);
        await walk(c.replies);
      }
    }
  }
  await walk(post.comments);

  console.log(`\n===== Post ${post.id} =====`);

  // Translate title
  if (post.title && !/[\u4e00-\u9fff]/.test(post.title)) {
    console.log(`Original title: ${post.title}`);
    const t = await translateField(post.title.slice(0, 2000), "Translated title");
    if (t !== post.title) post.title = t;
  }

  // Translate description
  if (post.description && !/[\u4e00-\u9fff]/.test(post.description)) {
    console.log(`Original description: ${post.description.slice(0, 120)}`);
    const d = await translateField(post.description.slice(0, 2000), "Translated description");
    if (d !== post.description) post.description = d;
  }

  // Collect English comments
  const english = collectEnglish(post.comments);
  if (english.length === 0) {
    console.log("  No English comments to translate");
    return;
  }

  console.log(`  ${english.length} English comments to translate`);

  let totalTranslated = 0;
  let totalFailed = 0;

  for (let i = 0; i < english.length; i += BATCH_SIZE) {
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(english.length / BATCH_SIZE);
    const batch = english.slice(i, i + BATCH_SIZE);
    const texts = batch.map(c => c.body);

    // Print each original comment
    for (let j = 0; j < batch.length; j++) {
      const comment = batch[j];
      const globalIdx = i + j + 1;
      console.log(`--- Comment ${globalIdx}/${english.length} ---`);
      console.log(`Author: ${comment.author} (score: ${comment.score})`);
      console.log(`Original: ${(comment.body || "").slice(0, 200)}`);
    }

    const { model, translated } = await translateWithModels(texts, post.id, batchNum, totalBatches);

    let batchTranslated = 0;
    let batchFailed = 0;
    for (let j = 0; j < batch.length; j++) {
      const globalIdx = i + j + 1;
      if (translated[j] && translated[j] !== texts[j]) {
        if (isTranslatable(texts[j])) {
          batch[j].body = translated[j];
          batchTranslated++;
          console.log(`→ [${model || "FAILED"}] Translated: ${translated[j].slice(0, 200)}`);
        } else {
          batchFailed++;
          console.log(`→ [SKIPPED] Non-translatable, keeping original`);
        }
      } else {
        batchFailed++;
        if (translated[j] === null || translated[j] === texts[j]) {
          console.log(`→ [FAILED] Keeping original`);
        }
      }
    }

    totalTranslated += batchTranslated;
    totalFailed += batchFailed;
    console.log(`  Batch ${batchNum}/${totalBatches}: ${batchTranslated} translated, ${batchFailed} failed`);

    if (i + BATCH_SIZE < english.length) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  console.log(`===== Done: ${post.id} (${totalTranslated} translated, ${totalFailed} failed) =====`);
}

async function main() {
  const photos = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));

  // Only process posts that still have English content
  for (const post of photos) {
    if (!post.comments?.length) continue;

    // Check if any English content remains
    let hasEnglish = false;
    if (post.title && !/[\u4e00-\u9fff]/.test(post.title)) hasEnglish = true;
    if (post.description && !/[\u4e00-\u9fff]/.test(post.description)) hasEnglish = true;
    if (!hasEnglish) {
      const english = collectEnglish(post.comments);
      if (english.length === 0) continue;
    }

    await processPost(post);
    fs.writeFileSync(DATA_FILE, JSON.stringify(photos, null, 2));
    console.log(`  Saved progress`);
  }

  console.log("\nAll done!");
}

main().catch(console.error);
