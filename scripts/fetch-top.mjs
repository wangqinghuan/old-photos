import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PHOTOS_DIR = path.join(__dirname, "..", "docs", "photos");
const DATA_FILE = path.join(__dirname, "..", "src", "data", "photos.json");

const USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0";

// Gemini config for Chinese-interest scoring
const GEMINI_KEYS = process.env.GEMINI_KEYS
  ? process.env.GEMINI_KEYS.split(",").map(k => k.trim()).filter(Boolean)
  : [];

if (!GEMINI_KEYS.length) {
  console.warn("WARNING: GEMINI_KEYS not set. Chinese-interest scoring will use keyword fallback.");
}

const SCORE_MODEL = "gemini-2.0-flash";

// China-related keywords to filter out
const CHINA_KEYWORDS = /(^|[^a-z])/i;
const CHINA_WORDS = [
  "china", "chinese", "tibet", "xinjiang", "hong kong",
  "taiwan", "tiananmen", "mao", "beijing", "shanghai",
  "macau", "wuhan", "ccp", "communist", "cultural revolution",
  "great leap", "taiping", "boxer", "ming dynasty", "qing dynasty",
  "sun yat", "chiang", "taipei", "shenzhen", "guangzhou",
];

function isChinaRelated(title) {
  const lower = title.toLowerCase();
  return CHINA_WORDS.some(w => lower.includes(w));
}

function getExtFromUrl(url) {
  const m = url.match(/\.(jpe?g|png|webp|gif)(\?|$)/i);
  return m ? m[1] : "jpg";
}

async function downloadImage(url, filename) {
  const filepath = path.join(PHOTOS_DIR, filename);
  if (fs.existsSync(filepath)) {
    console.log(`  Image already exists: ${filename}`);
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

function extractYear(title) {
  const m = title.match(/\b(19\d{2}|20\d{2})\b/);
  return m ? m[1] : undefined;
}

function filterComments(comments) {
  const TOP_LEVEL_LIMIT = 25;
  const REPLY_MIN_SCORE = 15;

  const sorted = [...comments].sort((a, b) => (b.score || 0) - (a.score || 0));
  const topLevel = sorted.slice(0, TOP_LEVEL_LIMIT);

  function filterReplies(arr) {
    const filtered = arr.filter(c => (c.score || 0) >= REPLY_MIN_SCORE);
    for (const c of filtered) {
      if (c.replies && c.replies.length) {
        c.replies = filterReplies(c.replies);
      }
    }
    return filtered;
  }

  for (const c of topLevel) {
    if (c.replies && c.replies.length) {
      c.replies = filterReplies(c.replies);
    }
  }

  return topLevel;
}

const FAME_NAMES = [
  "einstein", "churchill", "chaplin", "marilyn", "monroe", "hitler", "stalin",
  "lincoln", "kennedy", "elvis", "presley", "beatles", "lennon",
  "michael jackson", "princess diana", "princess", "napoleon", "shakespeare",
  "mozart", "beethoven", "curie", "edison", "tesla", "columbus", "washington",
  "freud", "darwin", "marx", "lenin", "gandhi", "mandela",
  "armstrong", "apollo", "newton", "picasso", "van gogh",
  "da vinci", "michelangelo", "muhammad ali", "pele", "maradona",
  "queen elizabeth", "anne frank", "titanic", "hollywood", "nobel",
  "president", "king", "queen", "empire", "royal",
];

const INTEREST_TOPICS = [
  "world war", "wwii", "ww2", "wwi", "ww1", "cold war", "vietnam",
  "great depression", "nazi", "soviet", "nuclear", "atomic",
  "first flight", "first man", "first woman", "moon landing",
  "olympic", "holocaust", "auschwitz", "berlin wall",
  "pearl harbor", "hiroshima", "normandy", "d-day",
  "revolution", "prohibition", "civil war",
  "child", "baby", "mother", "father", "family", "love", "kiss",
  "oldest", "youngest", "last", "surviving",
  "rare", "only known", "only photo", "iconic", "famous", "legendary", "historic",
];

function keywordScore(title) {
  const lower = title.toLowerCase();
  let score = 0;
  for (const name of FAME_NAMES) {
    if (lower.includes(name)) { score += 4; break; }
  }
  for (const topic of INTEREST_TOPICS) {
    if (lower.includes(topic)) { score += 2; break; }
  }
  return score;
}

async function scoreChineseInterest(titles) {
  if (titles.length === 0) return [];

  const batch = titles.map((t, i) => `[${i}] ${t}`).join("\n");
  const prompt = `为以下 Reddit 罕见历史照片帖子的标题打分（1-10分）：

${batch}

评分标准：
10分 = 中国普通网民都知道的全球级名人/重大事件（如爱因斯坦、二战、梦露、泰坦尼克号等）
7-9分 = 全球知名度高，多数中国人听说过
4-6分 = 特定领域知名，部分中国人可能知道
1-3分 = 只有西方本地人才听说过的话题

只返回纯 JSON 数字数组，格式如 [8,3,6]，不要有任何其他文字。`;

  for (const key of GEMINI_KEYS) {
    try {
      const resp = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${SCORE_MODEL}:generateContent?key=${key}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 200 },
        }
      );
      const text = resp.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const cleaned = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed) && parsed.length === titles.length) {
        console.log(`  Gemini scored ${titles.length} titles`);
        return parsed;
      }
    } catch (e) {
      console.log(`  Gemini key ${key.slice(0, 15)}... failed: ${e.message}`);
    }
  }

  // Fallback: use keyword scoring
  console.log("  Gemini unavailable, using keyword scoring");
  return titles.map(t => keywordScore(t) || 5);
}

async function fetchPostData(postId) {
  const { data } = await axios.get(
    `https://old.reddit.com/r/RareHistoricalPhotos/comments/${postId}/.json?raw_json=1`,
    { headers: { "User-Agent": USER_AGENT } }
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

  // Filter to top 25 + replies >= 15
  const filteredComments = filterComments(comments);

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
    comments: filteredComments,
  };

  return result;
}

async function main() {
  const COLLECT_TARGET = 60;
  const PROCESS_TARGET = 30;
  const MAX_CHECKED = 1000;
  fs.mkdirSync(PHOTOS_DIR, { recursive: true });

  // Read existing data
  let existing = [];
  if (fs.existsSync(DATA_FILE)) {
    existing = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  }
  const existingIds = new Set(existing.map(p => p.id));
  console.log(`Existing photos: ${existingIds.size}`);

  const candidates = [];
  let after = null;
  let totalChecked = 0;
  let totalSkippedExisting = 0;
  let totalSkippedChina = 0;
  let totalSkippedNonImage = 0;
  let totalPages = 0;

  while (candidates.length < COLLECT_TARGET && totalChecked < MAX_CHECKED) {
    let url = `https://old.reddit.com/r/RareHistoricalPhotos/top.json?t=all&limit=100`;
    if (after) url += `&after=${after}`;

    console.log(`\nFetching listing... (${candidates.length}/${COLLECT_TARGET} candidates, ${totalChecked}/${MAX_CHECKED} checked)`);
    const { data } = await axios.get(url, { headers: { "User-Agent": USER_AGENT } });
    const posts = data.data.children;
    if (!posts || posts.length === 0) break;

    for (const child of posts) {
      const p = child.data;
      const id = p.id;
      const title = p.title || "";
      totalChecked++;

      if (existingIds.has(id)) {
        totalSkippedExisting++;
        continue;
      }

      if (isChinaRelated(title)) {
        console.log(`  SKIP (China): ${id} - ${title.slice(0, 60)}`);
        totalSkippedChina++;
        continue;
      }

      // Must be an image post
      const urlDomain = (p.url || "").toLowerCase();
      const isGallery = p.is_gallery;
      if (!isGallery && !urlDomain.includes("i.redd.it") && !urlDomain.includes("preview.redd.it") && !urlDomain.match(/\.(jpe?g|png|webp|gif)/)) {
        totalSkippedNonImage++;
        continue;
      }

      candidates.push({ id, title, data: p });
      console.log(`  CANDIDATE ${candidates.length}: ${id} - ${title.slice(0, 60)}... (${p.score} upvotes)`);

      if (candidates.length >= COLLECT_TARGET) break;
    }

    totalPages++;
    after = data.data.after;
    if (!after) break;

    // Small delay between pages
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\n=== Summary ===`);
  console.log(`Total checked: ${totalChecked}`);
  console.log(`Skipped (already exist): ${totalSkippedExisting}`);
  console.log(`Skipped (China-related): ${totalSkippedChina}`);
  console.log(`Skipped (non-image): ${totalSkippedNonImage}`);
  console.log(`Candidates found: ${candidates.length}`);

  if (candidates.length === 0) {
    console.log("No new candidates found. Exiting.");
    return;
  }

  // Score candidates for Chinese audience interest
  console.log(`\n=== Scoring ${candidates.length} candidates for Chinese interest ===`);
  const scores = await scoreChineseInterest(candidates.map(c => c.title));
  candidates.forEach((c, i) => {
    c.score = scores[i] || 5;
    console.log(`  Score ${c.score}: ${c.title.slice(0, 60)}`);
  });
  candidates.sort((a, b) => b.score - a.score);

  const selected = candidates.slice(0, PROCESS_TARGET);
  console.log(`\nSelected top ${selected.length} for processing:`);
  selected.forEach(c => console.log(`  [${c.score}] ${c.title.slice(0, 60)}`));

  // Process selected candidates: fetch details, download, add to photos.json
  let added = 0;
  for (const candidate of selected) {
    console.log(`\n--- Processing ${candidate.id}: ${candidate.title.slice(0, 60)}... ---`);
    try {
      const postData = await fetchPostData(candidate.id);
      // Prepend to existing array
      existing.unshift(postData);
      fs.writeFileSync(DATA_FILE, JSON.stringify(existing, null, 2));
      added++;
      console.log(`  Added ${candidate.id} (#${added}/${selected.length})`);
    } catch (e) {
      console.error(`  FAILED to fetch ${candidate.id}: ${e.message}`);
    }

    // Delay between posts to be polite to Reddit
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`\nDone! Added ${added} new photos. Total: ${existing.length}`);
  if (candidates.length > PROCESS_TARGET) {
    console.log(`Skipped ${candidates.length - PROCESS_TARGET} lower-scored candidates.`);
  }
}

main().catch(console.error);
