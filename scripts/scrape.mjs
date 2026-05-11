import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUBREDDIT = "OldPhotosInReality";
const OUTPUT_FILE = path.join(__dirname, "photos.json");

async function fetchPosts(after) {
  const url = `https://www.reddit.com/r/${SUBREDDIT}/hot.json?limit=100${after ? `&after=${after}` : ""}`;
  
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "OldPhotosWebsite/1.0 (for educational purposes)",
      },
    });

    const data = response.data;
    const posts = data.data.children.map((child) => child.data);
    
    return {
      posts,
      after: data.data.after,
    };
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    throw error;
  }
}

function extractYearFromTitle(title) {
  const yearMatch = title.match(/\b(19\d{2}|20\d{2})\b/);
  return yearMatch ? yearMatch[1] : undefined;
}

function extractLocationFromTitle(title) {
  const locationPatterns = [
    /(?:in|at|拍摄于)\s+([^,\n]+)/i,
    /([^,\n]+)\s*,\s*\d{4}/,
  ];

  for (const pattern of locationPatterns) {
    const match = title.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  return undefined;
}

function extractDescription(post) {
  if (post.selftext && post.selftext.trim()) {
    return post.selftext.trim();
  }

  const titleClean = post.title
    .replace(/\s*\[\d{4}\]\s*$/, "")
    .replace(/\s*\(\d{4}\)\s*$/, "");

  return titleClean;
}

async function scrape() {
  console.log(`Starting to scrape r/${SUBREDDIT}...`);

  let allPosts = [];
  let after = null;

  for (let page = 0; page < 3; page++) {
    console.log(`Fetching page ${page + 1}...`);
    const result = await fetchPosts(after);
    allPosts = allPosts.concat(result.posts);
    after = result.after;

    if (!after) break;

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log(`Found ${allPosts.length} posts`);

  const photos = [];

  for (const post of allPosts) {
    if (!post.url) continue;

    const isImage = post.url.includes("i.redd.it") ||
      post.url.includes("i.imgur.com") ||
      post.preview?.images;

    if (!isImage && !post.url.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
      continue;
    }

    let imageUrl = post.url;
    if (post.preview?.images?.[0]?.source?.url) {
      imageUrl = post.preview.images[0].source.url.replace(/&amp;/g, "&");
    }

    const photo = {
      id: post.id,
      title: post.title
        .replace(/\[.*?\]/g, "")
        .replace(/\(.*?\)/g, "")
        .trim(),
      description: extractDescription(post),
      imageUrl,
      sourceUrl: `https://reddit.com${post.permalink}`,
      author: post.author || "anonymous",
      postedAt: new Date(post.created_utc * 1000).toISOString().split("T")[0],
      upvotes: post.score,
      year: extractYearFromTitle(post.title),
      location: extractLocationFromTitle(post.title),
    };

    photos.push(photo);
  }

  console.log(`Processed ${photos.length} photos`);

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(photos, null, 2));
  console.log(`Saved to ${OUTPUT_FILE}`);

  return photos;
}

scrape().catch(console.error);