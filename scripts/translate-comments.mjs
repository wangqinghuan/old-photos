import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import axios from "axios";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "..", "src", "data", "photos.json");

const GEMINI_KEYS = [
  "REVOKED_GEMINI_KEY_1",
  "REVOKED_GEMINI_KEY_2",
];

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

async function translateWithModels(texts, postId, batchNum, totalBatches) {
  if (texts.length === 0) return texts;

  const batch = texts.map((t, i) => `[${i}] ${t}`).join("\n");
  const prompt = `翻译以下英文评论为地道中文。保持原文语气，包括俚语、缩写、口语。每条前面有编号 [N]，只输出译文内容，格式为 [N] 后直接跟译文，不要加"译文："前缀。\n\n${batch}`;

  let lastError = null;

  for (const key of GEMINI_KEYS) {
    for (const model of MODELS) {
      try {
        const { data } = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
          { contents: [{ parts: [{ text: prompt }] }] },
          { timeout: 60000 }
        );

        const result = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (!result) {
          console.log(`  Batch ${batchNum}/${totalBatches}: ${model} returned empty, trying next`);
          continue;
        }

        const parsed = [];
        for (const line of result.split("\n")) {
          const m = line.match(/^\[(\d+)\]\s*(.*)/);
          if (m) parsed[parseInt(m[1])] = m[2];
        }

        const translated = texts.map((t, i) => parsed[i] || null);
        const keyShort = key.slice(0, 38) + '...';
        console.log(`  Batch ${batchNum}/${totalBatches}: [${model}] OK`);
        return { model, translated };
      } catch (e) {
        const status = e.response?.status;
        const msg = e.response?.data?.error?.message || e.message;
        const keyShort = key.slice(0, 38) + '...';
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

  const prompt = `翻译以下英文为地道中文，只输出译文内容，不要加"译文："等前缀：\n\n${text}`;

  for (const key of GEMINI_KEYS) {
    for (const model of MODELS) {
      try {
        const { data } = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
          { contents: [{ parts: [{ text: prompt }] }] },
          { timeout: 30000 }
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
        batch[j].body = translated[j];
        batchTranslated++;
        console.log(`→ [${model || "FAILED"}] Translated: ${translated[j].slice(0, 200)}`);
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
