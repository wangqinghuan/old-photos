import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "..", "src", "data", "photos.json");

const d = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));

let resetCount = 0;
let totalPool = 0;

d.forEach(p => {
  function walk(arr) {
    for (const c of arr) {
      if (c.originalBody && c.body && /[\u4e00-\u9fff]/.test(c.body)) {
        totalPool++;
        const ratio = c.originalBody.length / c.body.length;
        const origSentences = c.originalBody.split(/[.!?]+/).filter(s => s.trim().length > 10).length;
        const transSentences = c.body.split(/[。！？.!?]+/).filter(s => s.trim().length > 5).length;
        let isTruncated = false;
        if (ratio > 8) isTruncated = true;
        else if (ratio > 5 && origSentences >= 3 && transSentences <= 1) isTruncated = true;
        if (isTruncated) {
          c.body = c.originalBody;
          resetCount++;
        }
      }
      if (c.replies) walk(c.replies);
    }
  }
  walk(p.comments || []);
});

fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2));
console.log(`Reset ${resetCount}/${totalPool} truncated comments back to English`);
