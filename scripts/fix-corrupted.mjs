import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "..", "src", "data", "photos.json");

const photos = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
let fixed = 0;

for (const post of photos) {
  function walk(arr) {
    for (const c of arr) {
      if (!c.body) continue;
      const orig = c.body;

      // Strip "译文：" prefix
      c.body = c.body.replace(/^译文[：:]\s*/gm, "");

      // If body starts with URL + newline + short Chinese text, strip the hallucinated text
      const urlMatch = c.body.match(/^(https?:\/\/\S+)\n(.+)$/);
      if (urlMatch) {
        const rest = urlMatch[2].trim();
        // If the rest is purely Chinese/emoji/punctuation and short, it's likely hallucinated
        if (/^[\u4e00-\u9fff\p{So}\p{Sk}\p{Emoji_Presentation}\s，。！？、；：""''（）【】《》—…·]+$/u.test(rest) && rest.length < 80) {
          c.body = urlMatch[1];
        }
      }

      // Fix: trailing "译" after URL without colon
      c.body = c.body.replace(/^(https?:\/\/\S+)\s+译$/, "$1");

      if (c.body !== orig) fixed++;
      if (c.replies) walk(c.replies);
    }
  }
  if (post.comments) walk(post.comments);
}

fs.writeFileSync(DATA_FILE, JSON.stringify(photos, null, 2));
console.log(`Fixed ${fixed} corrupted comments`);
