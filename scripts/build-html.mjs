import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "..", "src", "data", "photos.json");
const OUT_FILE = path.join(__dirname, "..", "docs", "index.html");
const DATA_DIR = path.join(__dirname, "..", "docs", "data");

const photos = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));

function countAll(comments) {
  let n = 0;
  for (const c of comments) {
    n++;
    if (c.replies) n += countAll(c.replies);
  }
  return n;
}

const catalog = photos.map(p => ({
  id: p.id,
  title: p.title,
  description: p.description,
  imageUrl: p.imageUrl,
  year: p.year,
  location: p.location,
  upvotes: p.upvotes,
  postedAt: p.postedAt,
  commentCount: countAll(p.comments || []),
  images: p.images || undefined,
}));

const fullData = photos.map(p => ({
  id: p.id, title: p.title, description: p.description,
  imageUrl: p.imageUrl, postedAt: p.postedAt,
  upvotes: p.upvotes, year: p.year, location: p.location,
  images: p.images || undefined,
  comments: p.comments || []
}));

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.writeFileSync(path.join(DATA_DIR, "catalog.json"), JSON.stringify(catalog));
fs.writeFileSync(path.join(DATA_DIR, "photos-full.json"), JSON.stringify(fullData));
console.log(`Generated ${catalog.length} catalog entries, full data for ${fullData.length} photos`);

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<meta name="google-site-verification" content="n_kuKOzSDcDFCpO8OGHoePUqILORSJSVlmMiRgvNS54" />
<meta name="keywords" content="罕见老照片,历史老照片,世界历史照片,异国旧影,珍贵历史影像">
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>\ud83d\udcf7</text></svg>">
<script defer src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "1d4115fd2e0b4af683389875d643a0f9"}'></script>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-6C53SNFBNZ"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag("js",new Date);gtag("config","G-6C53SNFBNZ")</script>
<title>\u5f02\u56fd\u65e7\u5f71 | \u7f55\u89c1\u5386\u53f2\u8001\u7167\u7247</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:"PingFang SC","Microsoft YaHei",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#fafaf9;color:#1c1917;min-height:100vh;-webkit-font-smoothing:antialiased}
@media(prefers-color-scheme:dark){body{background:#0c0a09;color:#fafaf9}}
header{padding:64px 16px 44px;text-align:center;background:#fafaf9;border-bottom:2px solid #e7e5e4}
@media(prefers-color-scheme:dark){header{background:#0c0a09;border-color:#292524}}
header h1{font-size:2rem;font-weight:700;letter-spacing:-.03em}
header p{margin-top:6px;font-size:.9375rem;color:#78716c;line-height:1.6}
.section{max-width:640px;margin:0 auto;padding:24px 16px}
.section-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
.section-header h2{font-size:.875rem;font-weight:500;color:#a8a29e}
.section-header span{font-size:.75rem;color:#a8a29e}
.photo-grid{display:flex;flex-direction:column;gap:16px}
.photo-card{background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);border:1px solid #e7e5e4;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;transition:transform .15s}
.photo-card:active{transform:scale(.98)}
a.photo-card{text-decoration:none;color:inherit;display:block}
@media(prefers-color-scheme:dark){.photo-card{background:#1c1917;border-color:#292524}}
.photo-img{position:relative;aspect-ratio:4/3;background:#f5f5f4;overflow:hidden}
@media(prefers-color-scheme:dark){.photo-img{background:#292524}}
.photo-img img{width:100%;height:100%;object-fit:cover;display:block}
.badge{position:absolute;padding:4px 8px;border-radius:999px;font-size:.75rem;color:#fff;font-family:monospace;backdrop-filter:blur(4px)}
.badge-year{top:12px;right:12px;background:rgba(0,0,0,.7)}
.badge-comments{bottom:12px;right:12px;background:rgba(59,130,246,.85);display:flex;align-items:center;gap:4px}
.photo-info{padding:16px}
.photo-info h3{font-size:1rem;font-weight:500;line-height:1.3}
.photo-info p{margin-top:8px;font-size:.875rem;color:#a8a29e;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.photo-meta{margin-top:12px;display:flex;align-items:center;gap:8px;font-size:.75rem;color:#a8a29e}
.photo-meta .dot{color:#d6d3d1}
@media(prefers-color-scheme:dark){.photo-meta .dot{color:#44403c}}
.sort-group{display:flex;gap:4px}.sort-btn{background:none;border:none;color:#a8a29e;font-size:.875rem;font-weight:500;cursor:pointer;padding:4px 10px;border-radius:6px;transition:all .15s;-webkit-tap-highlight-color:transparent}.sort-btn.active{color:#1c1917;background:#e7e5e4}@media(prefers-color-scheme:dark){.sort-btn.active{color:#fafaf9;background:#292524}}.sort-btn:hover{color:#1c1917}@media(prefers-color-scheme:dark){.sort-btn:hover{color:#fafaf9}}
.modal{display:none;position:fixed;inset:0;z-index:100;background:#000;flex-direction:column;overflow:hidden}
.modal.active{display:flex}
.modal-top{display:flex;align-items:center;padding:8px 16px;color:#fff;z-index:2;min-height:48px}
.modal-back{background:none;border:none;color:#fff;font-size:1.5rem;cursor:pointer;padding:4px 8px 4px 0;line-height:1;display:flex;align-items:center}
.modal-back svg{width:24px;height:24px}
.modal-scroll{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch}
.modal-img-wrap{background:#000;display:flex;align-items:center;justify-content:center}
.modal-img-wrap img{width:100%;max-height:55vh;object-fit:contain;display:block}
.modal-body{padding:20px 16px 32px;color:#fff}
.modal-meta{display:flex;justify-content:space-between;align-items:center;font-size:.8125rem;color:#a8a29e;margin-bottom:12px}
.modal-title{font-size:1.1rem;font-weight:600;color:#fff;margin-bottom:8px;line-height:1.3;padding-right:16px}
.modal-desc{font-size:.9375rem;line-height:1.6;color:#e7e5e4;margin-bottom:20px}
.modal-divider{height:1px;background:#292524;margin-bottom:20px}
.comments-header{font-size:.8125rem;font-weight:600;color:#a8a29e;margin-bottom:16px;letter-spacing:.02em}
.comment{padding:12px 0;border-bottom:1px solid #1c1917}
.comment:last-child{border-bottom:none}
.comment-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;gap:8px}
.comment-author{font-size:.8125rem;font-weight:600;color:#fafaf9;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.comment-score{font-size:.75rem;color:#78716c;flex-shrink:0}
.comment-original{font-size:.75rem;color:#57534e;margin-bottom:2px;line-height:1.4}
.comment-original{font-size:.75rem;color:#57534e;margin-bottom:2px;line-height:1.4}
.comment-body{font-size:.875rem;line-height:1.5;color:#d6d3d1}
.comment-body.deleted{color:#57534e;font-style:italic}
.comment-body img{max-width:100%;border-radius:8px;margin-top:6px;display:block}
.comment-expand{display:inline-flex;align-items:center;gap:4px;margin-top:8px;padding:4px 0;background:none;border:none;color:#60a5fa;font-size:.8125rem;cursor:pointer;-webkit-tap-highlight-color:transparent}
.comment-expand:active{opacity:.7}
.comment-expand svg{width:12px;height:12px;transition:transform .2s}
.comment-expand.expanded svg{transform:rotate(90deg)}
.comment-replies{margin-top:4px;border-left:2px solid #292524;padding-left:12px}
.spinner{text-align:center;padding:20px;color:#a8a29e;font-size:.875rem}
.carousel{position:relative;width:100%;background:#000;display:flex;align-items:center;justify-content:center}
.carousel img{width:100%;max-height:55vh;object-fit:contain;display:block}
.carousel-btn{position:absolute;top:50%;transform:translateY(-50%);background:rgba(0,0,0,.5);color:#fff;border:none;width:40px;height:40px;border-radius:50%;font-size:1.3rem;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:2;transition:background .2s}
.carousel-btn:hover{background:rgba(0,0,0,.8)}
.carousel-btn.prev{left:8px}
.carousel-btn.next{right:8px}
.carousel-dots{display:flex;justify-content:center;gap:6px;padding:6px 0;background:#000}
.carousel-dot{width:6px;height:6px;border-radius:50%;background:#444;border:none;cursor:pointer;padding:0}
.carousel-dot.active{background:#fff}
.search-wrap{max-width:520px;margin:28px auto 0;position:relative}.search-wrap .search-icon{position:absolute;left:16px;top:50%;transform:translateY(-50%);color:#a8a29e;pointer-events:none}.search-wrap input{width:100%;padding:14px 16px 14px 48px;border-radius:12px;border:1px solid #e7e5e4;background:#f5f5f4;font-size:1.0625rem;outline:none;color:#1c1917;transition:border-color .2s,background .2s,box-shadow .2s;box-shadow:0 1px 3px rgba(0,0,0,.04)}.search-wrap input:focus{border-color:#60a5fa;background:#fff;box-shadow:0 0 0 4px rgba(96,165,250,.15)}@media(prefers-color-scheme:dark){.search-wrap input{background:#292524;border-color:#44403c;color:#fafaf9;box-shadow:none}.search-wrap input:focus{border-color:#3b82f6;background:#1c1917;box-shadow:0 0 0 4px rgba(59,130,246,.2)}}.search-wrap input::placeholder{color:#a8a29e}.hot-tags{max-width:520px;margin:16px auto 0;display:flex;flex-wrap:wrap;justify-content:center;gap:8px}.hot-tags .tag{display:inline-flex;padding:6px 16px;border-radius:999px;border:none;background:#f5f5f4;color:#78716c;font-size:.8125rem;cursor:pointer;transition:all .15s;user-select:none}.hot-tags .tag:hover{background:#e7e5e4;color:#1c1917}.hot-tags .tag:active{transform:scale(.96)}@media(prefers-color-scheme:dark){.hot-tags .tag{background:#292524;color:#a8a29e}.hot-tags .tag:hover{background:#44403c;color:#fafaf9}}.search-info{padding:16px 0;font-size:.875rem;color:#a8a29e;text-align:center}
</style>
</head>
<body>
<header><h1>\u5f02\u56fd\u65e7\u5f71</h1><p>\u56fe\u7247\u6765\u81ea\u56fd\u5916\u5386\u53f2\u7167\u7247\u8bba\u575b\u53ca\u56fe\u4e66\u9986\uff0c\u7f51\u53cb\u8bc4\u8bba\u7ecf\u7ffb\u8bd1\u540e\u5c55\u793a <span id="visitorCount"></span></p><div class="search-wrap"><svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg><input type="text" id="searchInput" placeholder="\u5c1d\u8bd5\u8f93\u5165\u60a8\u611f\u5174\u8da3\u7684\u5173\u952e\u8bcd\u641c\u7d22\u5386\u53f2\u7167\u7247" autocomplete="off"></div><div class="hot-tags" id="hotTags"><button class="tag" data-tag="\u4e8c\u6218">\u4e8c\u6218</button><button class="tag" data-tag="\u7eb3\u7cb9">\u7eb3\u7cb9</button><button class="tag" data-tag="\u6218\u4e89">\u6218\u4e89</button><button class="tag" data-tag="\u82cf\u8054">\u82cf\u8054</button><button class="tag" data-tag="\u5e7f\u5c9b">\u5e7f\u5c9b</button><button class="tag" data-tag="\u540d\u4eba">\u540d\u4eba</button><button class="tag" data-tag="\u7f8e\u56fd">\u7f8e\u56fd</button><button class="tag" data-tag="\u7231\u56e0\u65af\u5766">\u7231\u56e0\u65af\u5766</button><button class="tag" data-tag="\u5e0c\u7279\u52d2">\u5e0c\u7279\u52d2</button><button class="tag" data-tag="\u6234\u5b89\u5a1c">\u6234\u5b89\u5a1c</button></div></header>
<section class="section">
  <div class="section-header"><h2><span class="sort-group"><button class="sort-btn active" data-sort="newest">\u6700\u65b0</button><button class="sort-btn" data-sort="top">\u6700\u70ed</button><button class="sort-btn" data-sort="oldest">\u6700\u65e9</button></span></h2><span id="count"></span></div>
  <div class="photo-grid" id="grid"></div>
  <div id="sentinel" style="height:1px"></div>
  <div class="spinner" id="spinner" style="display:none">\u52a0\u8f7d\u4e2d...</div>
</section>

<div class="modal" id="modal">
  <div class="modal-top">
    <button class="modal-back" id="modalClose">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
    </button>
  </div>
  <div class="modal-scroll" id="modalScroll">
    <div class="carousel" id="carousel">
      <img id="modalImg" src="" alt="">
      <button class="carousel-btn prev" id="carouselPrev" style="display:none">‹</button>
      <button class="carousel-btn next" id="carouselNext" style="display:none">›</button>
    </div>
    <div class="carousel-dots" id="carouselDots"></div>
    <div class="modal-body">
      <div class="modal-meta">
        <span><span id="modalYear"></span><span id="modalPostedAt" style="margin-left:12px"></span></span>
        <span id="modalUpvotes"></span>
      </div>
      <h2 class="modal-title" id="modalTitle"></h2>
      <p class="modal-desc" id="modalDesc"></p>
      <div class="modal-divider"></div>
      <div class="comments-header" id="commentsHeader">\u8bc4\u8bba</div>
      <div id="modalComments"></div>
    </div>
  </div>
</div>

<script>
let page = 1, loading = false, hasMore = true, inSearch = false, currentSort = 'newest';
const LIMIT = 20;
const grid = document.getElementById('grid');
const sentinel = document.getElementById('sentinel');
const spinner = document.getElementById('spinner');
const countEl = document.getElementById('count');
const visitorEl = document.getElementById('visitorCount');

fetch('/api/count').then(r=>r.json()).then(d=>{
  visitorEl.textContent = '\u00b7 \u8bbf\u5ba2 ' + d.count;
}).catch(()=>{});

function esc(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function cleanReddit(s) {
  return String(s)
    .replace(/[Rr]eddit/g, '')
    .replace(/红迪/g, '')
    .replace(/[\[\(]?已?被?[Rr]eddit删?除?[\]\)]?/g, '')
    .replace(/\\/?r\\/\\S+/g, '')
    .replace(/\\/?u\\/\\S+/g, '')
    .replace(/\\s{2,}/g, ' ').trim();
}

function renderMeta(photo) {
  const parts = [];
  if (photo.upvotes > 0) parts.push(photo.upvotes.toLocaleString() + ' 赞');
  if (photo.location) parts.push(esc(photo.location));
  if (photo.postedAt) parts.push(photo.postedAt);
  return parts.join('<span class="dot"> · </span>');
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return '刚刚';
  if (diff < 3600) return Math.floor(diff / 60) + ' 分钟前';
  if (diff < 86400) return Math.floor(diff / 3600) + ' 小时前';
  if (diff < 2592000) return Math.floor(diff / 86400) + ' 天前';
  return d.toLocaleDateString('zh-CN');
}

function renderBody(text) {
  if (!text) return null;
  var imgUrls2 = [];
  var urlList = [];
  var imgRe2 = /(https?:\\\/\\\/[^\\s]+?\\.(?:jpe?g|png|webp|gif)(?:\\?[^\\s]*)?)/gi;
  var s2 = text.replace(imgRe2, function(m) { imgUrls2.push(m); return '%%IMG' + (imgUrls2.length-1) + '%%'; });
  var urlRe = /(https?:\\\/\\\/[^\\s<>]+)/gi;
  s2 = s2.replace(urlRe, function(m) { urlList.push(m); return '%%URL' + (urlList.length-1) + '%%'; });
  s2 = cleanReddit(s2);
  s2 = s2.replace(/^译文[：:]\\s*/, '');
  s2 = esc(s2);
  s2 = s2.replace(/%%IMG(\\d+)%%/g, function(_, i) { return '<img src=\"' + imgUrls2[parseInt(i)] + '\" alt=\"image\" loading=\"lazy\" style=\"max-width:100%;border-radius:8px;margin-top:6px\">'; });
  s2 = s2.replace(/%%URL(\\d+)%%/g, function(_, i) { return '<a href=\"' + urlList[parseInt(i)] + '\" target=\"_blank\" rel=\"noopener noreferrer\" style=\"color:#60a5fa;word-break:break-all\">' + urlList[parseInt(i)] + '</a>'; });
  s2 = s2.replace(/!\\[gif\\]\\(giphy\\|(\\w+)\\)/g, '<img src=\"https://media.giphy.com/media/$1/giphy.gif\" alt=\"gif\" loading=\"lazy\">');
  return s2;
}

function renderComment(comment, depth) {
  const el = document.createElement('div');
  el.className = 'comment';
  const author = comment.author ? esc(cleanReddit(comment.author)) : '\u533f\u540d';
  const body = renderBody(comment.body);
  const orig = comment.originalBody ? renderBody(comment.originalBody) : null;
  const score = comment.score || 0;
  const date = comment.createdAt ? '<span style="font-size:.7rem;color:#78716c;margin-left:8px">' + formatDate(comment.createdAt) + '</span>' : '';
  el.innerHTML = '<div class="comment-head"><span class="comment-author">' + author + '</span><span class="comment-score">' + score.toLocaleString() + ' 赞' + date + '</span></div>' + (orig ? '<div class="comment-original">' + orig + '</div>' : '') + '<div class="comment-body' + (body ? '' : ' deleted') + '">' + (body || '[\u5185\u5bb9\u5df2\u5220\u9664]') + '</div>';
  if (comment.replies && comment.replies.length > 0) {
    const btn = document.createElement('button');
    btn.className = 'comment-expand';
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg> ' + comment.replies.length + ' \u6761\u56de\u590d';
    const container = document.createElement('div');
    container.className = 'comment-replies';
    container.style.display = 'none';
    btn.addEventListener('click', () => {
      if (btn.dataset.expanded === 'true') {
        container.style.display = 'none';
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg> ' + comment.replies.length + ' \u6761\u56de\u590d';
        btn.classList.remove('expanded');
        btn.dataset.expanded = 'false';
      } else {
        if (!container.children.length) {
          comment.replies.forEach(r => {
            const re = renderComment(r, (depth || 0) + 1);
            if (re) container.appendChild(re);
          });
        }
        container.style.display = 'block';
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg> \u6536\u8d77';
        btn.classList.add('expanded');
        btn.dataset.expanded = 'true';
      }
    });
    el.appendChild(btn);
    el.appendChild(container);
  }
  return el;
}

function renderCard(photo) {
  const card = document.createElement('a');
  card.className = 'photo-card';
  card.href = '/p/' + photo.id;
  const meta = renderMeta(photo);
  const multi = photo.images && photo.images.length > 1 ? '<span class="badge badge-year" style="left:12px;right:auto">' + photo.images.length + ' 张照片</span>' : '';
  card.innerHTML = '<div class="photo-img"><img src="' + esc(photo.imageUrl) + '" alt="' + esc(photo.title) + '" loading="lazy">' + multi + (photo.year ? '<span class="badge badge-year">' + esc(photo.year) + '</span>' : '') + (photo.commentCount > 0 ? '<span class="badge badge-comments"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>' + photo.commentCount + '</span>' : '') + '</div><div class="photo-info"><h3>' + esc(photo.title) + '</h3><p>' + esc(photo.description) + '</p>' + (meta ? '<div class="photo-meta">' + meta + '</div>' : '') + (photo.matchField ? '<div style="font-size:.75rem;color:#60a5fa;margin-top:6px">' + (photo.matchField === 'title' ? '\u5339\u914d\u6807\u9898' : photo.matchField === 'description' ? '\u5339\u914d\u63cf\u8ff0' : photo.matchField === 'comment' ? '\u5339\u914d\u8bc4\u8bba' : photo.matchField === 'author' ? '\u5339\u914d\u4f5c\u8005' : '\u5339\u914d\u4f4d\u7f6e') + '</div>' : '') + '</div>';
  card.addEventListener('click', (e) => {
    e.preventDefault();
    openModal(photo.id);
  });
  return card;
}

async function loadMore() {
  if (loading || !hasMore || inSearch) return;
  loading = true;
  spinner.style.display = 'block';
  try {
    const res = await fetch('/api/photos?page=' + page + '&limit=' + LIMIT + '&sort=' + currentSort);
    const data = await res.json();
    if (data.items) {
      data.items.forEach(photo => grid.appendChild(renderCard(photo)));
    }
    page++;
    hasMore = data.hasMore;
    countEl.textContent = data.total + ' \u5f20\u7167\u7247';
  } catch (e) {
    console.error('load failed', e);
  } finally {
    loading = false;
    spinner.style.display = 'none';
  }
}

const modal = document.getElementById('modal');
const modalImg = document.getElementById('modalImg');
const modalYear = document.getElementById('modalYear');
const modalPostedAt = document.getElementById('modalPostedAt');
const modalUpvotes = document.getElementById('modalUpvotes');
const modalDesc = document.getElementById('modalDesc');
const modalTitle = document.getElementById('modalTitle');
const modalComments = document.getElementById('modalComments');
const commentsHeader = document.getElementById('commentsHeader');
const modalScroll = document.getElementById('modalScroll');
const carouselPrev = document.getElementById('carouselPrev');
const carouselNext = document.getElementById('carouselNext');
const carouselDots = document.getElementById('carouselDots');

let currentImages = [];
let currentImageIndex = 0;

function showImage(index) {
  currentImageIndex = index;
  modalImg.src = currentImages[index];
  carouselPrev.style.display = index > 0 ? 'flex' : 'none';
  carouselNext.style.display = index < currentImages.length - 1 ? 'flex' : 'none';
  const dots = carouselDots.querySelectorAll('.carousel-dot');
  dots.forEach((d, i) => d.classList.toggle('active', i === index));
}

async function openModal(photoId) {
  modal.classList.add('active');
  modalImg.src = '';
  modalComments.innerHTML = '<div style="color:#57534e;font-size:.875rem;padding:16px 0">加载评论...</div>';
  commentsHeader.textContent = '评论';
  modalYear.textContent = '';
  modalPostedAt.textContent = '';
  modalUpvotes.textContent = '';
  modalDesc.textContent = '';
  carouselDots.innerHTML = '';
  currentImages = [];
  currentImageIndex = 0;

  try {
    const res = await fetch('/api/photo/' + photoId);
    const photo = await res.json();

    currentImages = photo.images && photo.images.length > 0 ? photo.images : [photo.imageUrl];
    currentImageIndex = 0;

    if (currentImages.length > 1) {
      carouselDots.innerHTML = currentImages.map((_, i) => '<button class="carousel-dot' + (i === 0 ? ' active' : '') + '" data-index="' + i + '"></button>').join('');
      carouselDots.querySelectorAll('.carousel-dot').forEach(d => {
        d.addEventListener('click', () => showImage(parseInt(d.dataset.index)));
      });
    }

    showImage(0);

    modalImg.alt = photo.title;
    modalTitle.textContent = photo.title;
    modalYear.textContent = photo.year || '';
    modalPostedAt.textContent = photo.postedAt || '';
    modalUpvotes.textContent = (photo.upvotes > 0 ? photo.upvotes.toLocaleString() + ' 赞' : '');
    modalDesc.textContent = photo.description;

    function countEm(arr) {
      let n = 0;
      for (const c of arr) { n++; if (c.replies) n += countEm(c.replies); }
      return n;
    }
    const total = countEm(photo.comments || []);
    commentsHeader.textContent = '\u8bc4\u8bba' + (total > 0 ? ' (' + total + ')' : '');

    modalComments.innerHTML = '';
    if (photo.comments && photo.comments.length > 0) {
      photo.comments.forEach(c => {
        const el = renderComment(c, 0);
        if (el) modalComments.appendChild(el);
      });
    } else {
      modalComments.innerHTML = '<div style="color:#57534e;font-size:.875rem;padding:8px 0">\u6682\u65e0\u8bc4\u8bba</div>';
    }
  } catch (e) {
    modalComments.innerHTML = '<div style="color:#ef4444;font-size:.875rem;padding:16px 0">\u52a0\u8f7d\u5931\u8d25</div>';
  }

  modalScroll.scrollTop = 0;
}

function closeModal() {
  modal.classList.remove('active');
  modalImg.src = '';
  modalComments.innerHTML = '';
}

carouselPrev.addEventListener('click', () => { if (currentImageIndex > 0) showImage(currentImageIndex - 1); });
carouselNext.addEventListener('click', () => { if (currentImageIndex < currentImages.length - 1) showImage(currentImageIndex + 1); });
document.getElementById('modalClose').addEventListener('click', closeModal);
modal.addEventListener('click', function(e) { if (e.target === modal || e.target === modalScroll) closeModal(); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
  if (e.key === 'ArrowLeft' && currentImageIndex > 0) showImage(currentImageIndex - 1);
  if (e.key === 'ArrowRight' && currentImageIndex < currentImages.length - 1) showImage(currentImageIndex + 1);
});

const observer = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting) loadMore();
});
observer.observe(sentinel);

countEl.textContent = '\u52a0\u8f7d\u4e2d...';
loadMore();

const searchInput = document.getElementById('searchInput');
let searchTimer = null;

function exitSearch() {
  if (inSearch) {
    inSearch = false;
    grid.innerHTML = '';
    page = 1;
    hasMore = true;
    countEl.textContent = '\u52a0\u8f7d\u4e2d...';
    loadMore();
  }
}

searchInput.addEventListener('input', function() {
  clearTimeout(searchTimer);
  var q = searchInput.value.trim();
  if (!q) {
    if (inSearch) exitSearch();
    return;
  }
  searchTimer = setTimeout(function() { doSearch(q); }, 300);
});

searchInput.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    searchInput.value = '';
    searchInput.blur();
    exitSearch();
  }
});

async function doSearch(q) {
  inSearch = true;
  grid.innerHTML = '<div class="search-info">\u641c\u7d22\u4e2d...</div>';
  try {
    var res = await fetch('/api/search?q=' + encodeURIComponent(q));
    var data = await res.json();
    if (!inSearch) return;
    grid.innerHTML = '';
    if (data.items.length === 0) {
      grid.innerHTML = '<div class="search-info">\u6ca1\u6709\u627e\u5230\u5339\u914d\u7ed3\u679c</div>';
      return;
    }
    data.items.forEach(function(photo) {
      grid.appendChild(renderCard(photo));
    });
    countEl.textContent = '\u641c\u7d22: ' + data.total + ' \u4e2a\u7ed3\u679c';
  } catch (e) {
    if (inSearch) {
      grid.innerHTML = '<div class="search-info" style="color:#ef4444">\u641c\u7d22\u5931\u8d25</div>';
    }
  }
}

document.getElementById('hotTags').addEventListener('click', function(e) {
  var tag = e.target.getAttribute('data-tag');
  if (tag) {
    searchInput.value = tag;
    doSearch(tag);
  }
});

document.querySelectorAll('.sort-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var sort = this.dataset.sort;
    if (sort === currentSort) return;
    currentSort = sort;
    document.querySelectorAll('.sort-btn').forEach(function(b) { b.classList.toggle('active', b.dataset.sort === sort); });
    searchInput.value = '';
    inSearch = false;
    grid.innerHTML = '';
    page = 1;
    hasMore = true;
    countEl.textContent = '\u52a0\u8f7d\u4e2d...';
    loadMore();
  });
});
</script>
</body>
</html>`;

fs.writeFileSync(OUT_FILE, html, "utf-8");
console.log(`Built ${OUT_FILE}`);

function cleanReddit(s) {
  return String(s)
    .replace(/[Rr]eddit/g, '')
    .replace(/红迪/g, '')
    .replace(/[\[\(]?已?被?[Rr]eddit删?除?[\]\)]?/g, '')
    .replace(/\/?r\/\S+/g, '')
    .replace(/\/?u\/\S+/g, '')
    .replace(/\s{2,}/g, ' ').trim();
}

function esc(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function renderBodyHtml(text) {
  if (!text) return null;
  var imgUrls = [], urlList = [];
  var s = text.replace(/(https?:\/\/\S+?\.(?:jpe?g|png|webp|gif)(?:\?\S*)?)/gi, function(m) {
    imgUrls.push(m); return '%%IMG' + (imgUrls.length-1) + '%%';
  });
  s = s.replace(/(https?:\/\/\S+)/gi, function(m) {
    urlList.push(m); return '%%URL' + (urlList.length-1) + '%%';
  });
  s = cleanReddit(s);
  s = s.replace(/^译文[：:]\s*/, '');
  s = esc(s);
  s = s.replace(/%%IMG(\d+)%%/g, function(_, i) {
    return '<img src="' + imgUrls[parseInt(i)] + '" alt="image" loading="lazy" style="max-width:100%;border-radius:8px;margin-top:6px">';
  });
  s = s.replace(/%%URL(\d+)%%/g, function(_, i) {
    return '<a href="' + urlList[parseInt(i)] + '" target="_blank" rel="noopener noreferrer" style="color:#60a5fa;word-break:break-all">' + urlList[parseInt(i)] + '</a>';
  });
  return s;
}

function formatDate(iso) {
  if (!iso) return '';
  var d = new Date(iso), now = new Date(), diff = (now - d) / 1000;
  if (diff < 60) return '\u521a\u521a';
  if (diff < 3600) return Math.floor(diff / 60) + ' \u5206\u949f\u524d';
  if (diff < 86400) return Math.floor(diff / 3600) + ' \u5c0f\u65f6\u524d';
  if (diff < 2592000) return Math.floor(diff / 86400) + ' \u5929\u524d';
  return d.toLocaleDateString('zh-CN');
}

function renderCommentHtml(c) {
  var author = c.author ? esc(cleanReddit(c.author)) : '\u533f\u540d';
  var body = renderBodyHtml(c.body);
  var orig = c.originalBody ? renderBodyHtml(c.originalBody) : null;
  var score = c.score || 0;
  var date = c.createdAt ? '<span style="font-size:.7rem;color:#78716c;margin-left:8px">' + formatDate(c.createdAt) + '</span>' : '';
  var h = '<div class="comment"><div class="comment-head"><span class="comment-author">' + author + '</span><span class="comment-score">' + score.toLocaleString() + ' \u8d5e' + date + '</span></div>' + (orig ? '<div class="comment-original">' + orig + '</div>' : '') + '<div class="comment-body' + (body ? '' : ' deleted') + '">' + (body || '[\u5185\u5bb9\u5df2\u5220\u9664]') + '</div>';
  if (c.replies && c.replies.length > 0) {
    h += '<div class="comment-replies">';
    c.replies.forEach(function(r) { h += renderCommentHtml(r); });
    h += '</div>';
  }
  h += '</div>';
  return h;
}

// Generate standalone photo pages for SEO
var photoDir = path.join(__dirname, '..', 'docs', 'p');
photos.forEach(function(photo) {
  var dir = path.join(photoDir, photo.id);
  fs.mkdirSync(dir, { recursive: true });
  var title = esc(photo.title);
  var desc = esc((photo.description || '').slice(0, 150));
  var upvotes = photo.upvotes ? photo.upvotes.toLocaleString() + ' \u8d5e' : '';
  var year = photo.year || '';
  var commentTotal = countAll(photo.comments || []);
  var ogImg = photo.imageUrl ? 'https://oldphotos.pages.dev' + photo.imageUrl : '';
  var canonical = 'https://oldphotos.pages.dev/p/' + photo.id + '/';
  var imagesHtml = '';
  if (photo.images && photo.images.length > 0) {
    photo.images.forEach(function(img) {
      imagesHtml += '<img src="' + img + '" alt="' + title + '" style="width:100%;display:block">';
    });
  } else {
    imagesHtml = '<img src="' + photo.imageUrl + '" alt="' + title + '" style="width:100%;display:block">';
  }
  var commentsHtml = '';
  if (photo.comments && photo.comments.length > 0) {
    photo.comments.forEach(function(c) { commentsHtml += renderCommentHtml(c); });
  } else {
    commentsHtml = '<div style="color:#a8a29e;font-size:.875rem;padding:8px 0">\u6682\u65e0\u8bc4\u8bba</div>';
  }
  var pageHtml = '<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<meta name="google-site-verification" content="n_kuKOzSDcDFCpO8OGHoePUqILORSJSVlmMiRgvNS54" />\n<meta name="keywords" content="' + title + ',历史照片,老照片" />\n<title>' + title + ' - \u5f02\u56fd\u65e7\u5f71 | \u7f55\u89c1\u5386\u53f2\u8001\u7167\u7247</title>\n<meta name="description" content="' + desc + '">\n<meta property="og:title" content="' + title + '">\n<meta property="og:description" content="' + desc + '">\n<meta property="og:image" content="' + ogImg + '">\n<meta property="og:type" content="article">\n<meta property="og:url" content="' + canonical + '">\n<link rel="canonical" href="' + canonical + '">\n<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>\ud83d\udcf7</text></svg>">\n<script async src="https://www.googletagmanager.com/gtag/js?id=G-6C53SNFBNZ"></script>\n<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag("js",new Date);gtag("config","G-6C53SNFBNZ")</script>\n<style>\n*{margin:0;padding:0;box-sizing:border-box}\nbody{font-family:"PingFang SC","Microsoft YaHei",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#fafaf9;color:#1c1917;min-height:100vh}\n.page{max-width:640px;margin:0 auto;padding:16px}\n.back{margin-bottom:16px}\n.back a{color:#3b82f6;text-decoration:none;font-size:.875rem}\n.photo-img{margin-bottom:16px;background:#f5f5f4;border-radius:12px;overflow:hidden}\n.photo-img img{width:100%;display:block}\n.info{margin-bottom:20px}\n.info h1{font-size:1.2rem;font-weight:600;line-height:1.3;margin-bottom:8px}\n.info-desc{font-size:.9375rem;line-height:1.6;color:#57534e;margin-bottom:8px}\n.info-meta{font-size:.8125rem;color:#a8a29e}\nsection{margin-bottom:20px}\nsection h2{font-size:.875rem;font-weight:600;color:#a8a29e;margin-bottom:12px;letter-spacing:.02em}\n.comment{padding:12px 0;border-bottom:1px solid #e7e5e4}\n.comment:last-child{border-bottom:none}\n.comment-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;gap:8px}\n.comment-author{font-size:.8125rem;font-weight:600;color:#1c1917;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.comment-score{font-size:.75rem;color:#78716c;flex-shrink:0}\n.comment-original{font-size:.75rem;color:#a8a29e;margin-bottom:2px;line-height:1.4}\n.comment-body{font-size:.875rem;line-height:1.5;color:#44403c}\n.comment-body.deleted{color:#d6d3d1;font-style:italic}\n.comment-body img{max-width:100%;border-radius:8px;margin-top:6px;display:block}\n.comment-replies{margin-top:4px;border-left:2px solid #e7e5e4;padding-left:12px}\n@media(prefers-color-scheme:dark){body{background:#0c0a09;color:#fafaf9}.photo-img{background:#292524}.info-desc{color:#a8a29e}.comment{border-color:#292524}.comment-author{color:#fafaf9}.comment-body{color:#d6d3d1}.comment-replies{border-color:#292524}}\n</style>\n</head>\n<body>\n<div class="page">\n<div class="back"><a href="/">\u2190 \u8fd4\u56de\u9996\u9875</a></div>\n<div class="photo-img">' + imagesHtml + '</div>\n<div class="info">\n<h1>' + title + '</h1>\n' + (desc ? '<p class="info-desc">' + desc + '</p>' : '') + '\n<div class="info-meta\">' + (year ? year + ' \u00b7 ' : '') + upvotes + (photo.postedAt ? ' \u00b7 ' + photo.postedAt : '') + (commentTotal > 0 ? ' \u00b7 ' + commentTotal + ' \u6761\u8bc4\u8bba' : '') + '</div>\n</div>\n<section>\n<h2>\u8bc4\u8bba (' + commentTotal + ')</h2>\n' + commentsHtml + '\n</section>\n<div class="back" style="margin-top:24px"><a href="/">\u2190 \u8fd4\u56de\u9996\u9875</a></div>\n</div>\n</body>\n</html>';
  fs.writeFileSync(path.join(dir, 'index.html'), pageHtml, 'utf-8');
});
console.log('Generated ' + photos.length + ' photo pages');

// Sitemap
var sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
sitemap += '  <url><loc>https://oldphotos.pages.dev/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>\n';
photos.forEach(function(photo) {
  sitemap += '  <url><loc>https://oldphotos.pages.dev/p/' + photo.id + '/</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>\n';
});
sitemap += '</urlset>';
fs.writeFileSync(path.join(__dirname, '..', 'docs', 'sitemap.xml'), sitemap, 'utf-8');
console.log('Generated sitemap.xml with ' + (1 + photos.length) + ' URLs');

// Robots.txt
fs.writeFileSync(path.join(__dirname, '..', 'docs', 'robots.txt'), 'User-agent: *\nAllow: /\nSitemap: https://oldphotos.pages.dev/sitemap.xml\n', 'utf-8');
console.log('Generated robots.txt');
