import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "..", "src", "data", "photos.json");
const OUT_FILE = path.join(__dirname, "..", "public", "index.html");

const photos = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<title>时光相册 | 老照片收藏</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#fafaf9;color:#1c1917;min-height:100vh;-webkit-font-smoothing:antialiased}
@media(prefers-color-scheme:dark){body{background:#0c0a09;color:#fafaf9}}
header{position:sticky;top:0;z-index:50;background:rgba(250,250,249,.9);backdrop-filter:blur(12px);border-bottom:1px solid #e7e5e4;padding:16px}
@media(prefers-color-scheme:dark){header{background:rgba(12,10,9,.9);border-color:#292524}}
header h1{font-size:1.25rem;font-weight:600;letter-spacing:-.02em}
header p{font-size:.75rem;color:#a8a29e;margin-top:2px}
.section{max-width:640px;margin:0 auto;padding:24px 16px}
.section-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
.section-header h2{font-size:.875rem;font-weight:500;color:#a8a29e}
.section-header span{font-size:.75rem;color:#a8a29e}
.photo-grid{display:flex;flex-direction:column;gap:16px}
.photo-card{background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);border:1px solid #e7e5e4;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;transition:transform .15s}
.photo-card:active{transform:scale(.98)}
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

/* Modal */
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
.modal-desc{font-size:.9375rem;line-height:1.6;color:#e7e5e4;margin-bottom:20px}
.modal-divider{height:1px;background:#292524;margin-bottom:20px}

/* Comments */
.comments-header{font-size:.8125rem;font-weight:600;color:#a8a29e;margin-bottom:16px;letter-spacing:.02em}
.comment{padding:12px 0;border-bottom:1px solid #1c1917}
.comment:last-child{border-bottom:none}
.comment-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;gap:8px}
.comment-author{font-size:.8125rem;font-weight:600;color:#fafaf9;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.comment-score{font-size:.75rem;color:#78716c;flex-shrink:0}
.comment-body{font-size:.875rem;line-height:1.5;color:#d6d3d1}
.comment-body.deleted{color:#57534e;font-style:italic}
.comment-body img{max-width:100%;border-radius:8px;margin-top:6px;display:block}
.comment-expand{display:inline-flex;align-items:center;gap:4px;margin-top:8px;padding:4px 0;background:none;border:none;color:#60a5fa;font-size:.8125rem;cursor:pointer;-webkit-tap-highlight-color:transparent}
.comment-expand:active{opacity:.7}
.comment-expand svg{width:12px;height:12px;transition:transform .2s}
.comment-expand.expanded svg{transform:rotate(90deg)}
.comment-replies{margin-top:4px;border-left:2px solid #292524;padding-left:12px}
</style>
</head>
<body>
<header><h1>时光相册</h1><p>收藏历史，定格瞬间</p></header>
<section class="section">
  <div class="section-header"><h2>最新收录</h2><span id="count"></span></div>
  <div class="photo-grid" id="grid"></div>
</section>

<div class="modal" id="modal">
  <div class="modal-top">
    <button class="modal-back" id="modalClose">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
    </button>
  </div>
  <div class="modal-scroll" id="modalScroll">
    <div class="modal-img-wrap" id="modalImgWrap"><img id="modalImg" src="" alt=""></div>
    <div class="modal-body">
      <div class="modal-meta">
        <span id="modalYear"></span>
        <span id="modalUpvotes"></span>
      </div>
      <p class="modal-desc" id="modalDesc"></p>
      <div class="modal-divider"></div>
      <div class="comments-header" id="commentsHeader">评论</div>
      <div id="modalComments"></div>
    </div>
  </div>
</div>

<script>
const photos = ${JSON.stringify(photos, null, 2)};

document.getElementById('count').textContent = photos.length + ' 张照片';

function esc(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function renderMeta(photo) {
  const parts = [];
  if (photo.upvotes > 0) parts.push(photo.upvotes.toLocaleString() + ' 赞');
  if (photo.location) parts.push(esc(photo.location));
  return parts.join('<span class="dot"> · </span>');
}

const grid = document.getElementById('grid');
const modal = document.getElementById('modal');
const modalImg = document.getElementById('modalImg');
const modalYear = document.getElementById('modalYear');
const modalUpvotes = document.getElementById('modalUpvotes');
const modalDesc = document.getElementById('modalDesc');
const modalComments = document.getElementById('modalComments');
const commentsHeader = document.getElementById('commentsHeader');
const modalScroll = document.getElementById('modalScroll');

let currentPhoto = null;

function countAllComments(comments) {
  let n = comments.length;
  for (const c of comments) {
    if (c.replies) n += countAllComments(c.replies);
  }
  return n;
}

function renderBody(text) {
  if (!text) return null;
  let s = esc(text);
  // Render GIPHY embeds: ![gif](giphy|ID)
  s = s.replace(/!\[gif\]\(giphy\|(\w+)\)/g, '<img src="https://media.giphy.com/media/$1/giphy.gif" alt="gif" loading="lazy">');
  return s;
}

function renderComment(comment, depth) {
  const el = document.createElement('div');
  el.className = 'comment';

  const author = comment.author ? esc(comment.author) : '匿名';
  const body = renderBody(comment.body);
  const score = comment.score || 0;

  el.innerHTML = \`<div class="comment-head"><span class="comment-author">\${author}</span><span class="comment-score">\${score.toLocaleString()}</span></div><div class="comment-body\${body ? '' : ' deleted'}">\${body || '[内容已删除]'}</div>\`;

  if (comment.replies && comment.replies.length > 0) {
    const btn = document.createElement('button');
    btn.className = 'comment-expand';
    btn.innerHTML = \`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg> \${comment.replies.length} 条回复\`;

    const container = document.createElement('div');
    container.className = 'comment-replies';
    container.style.display = 'none';

    btn.addEventListener('click', () => {
      if (btn.dataset.expanded === 'true') {
        container.style.display = 'none';
        btn.innerHTML = \`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg> \${comment.replies.length} 条回复\`;
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
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg> 收起';
        btn.classList.add('expanded');
        btn.dataset.expanded = 'true';
      }
    });

    el.appendChild(btn);
    el.appendChild(container);
  }

  return el;
}

function renderCards() {
  photos.forEach((photo, idx) => {
    const card = document.createElement('div');
    card.className = 'photo-card';
    const totalComments = countAllComments(photo.comments || []);
    const meta = renderMeta(photo);
    card.innerHTML = \`
      <div class="photo-img">
        <img src="\${esc(photo.imageUrl)}" alt="\${esc(photo.title)}" loading="lazy">
        \${photo.year ? '<span class="badge badge-year">' + esc(photo.year) + '</span>' : ''}
        \${totalComments > 0 ? '<span class="badge badge-comments"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>' + totalComments + '</span>' : ''}
      </div>
      <div class="photo-info">
        <h3>\${esc(photo.title)}</h3>
        <p>\${esc(photo.description)}</p>
        \${meta ? '<div class="photo-meta">' + meta + '</div>' : ''}
      </div>
    \`;
    card.addEventListener('click', () => openModal(idx));
    grid.appendChild(card);
  });
}

function openModal(idx) {
  currentPhoto = photos[idx];
  modalImg.src = currentPhoto.imageUrl;
  modalImg.alt = currentPhoto.title;

  modalYear.textContent = currentPhoto.year || '';
  modalUpvotes.textContent = (currentPhoto.upvotes > 0 ? currentPhoto.upvotes.toLocaleString() + ' 赞' : '');

  modalDesc.textContent = currentPhoto.description;

  const total = countAllComments(currentPhoto.comments || []);
  commentsHeader.textContent = '评论' + (total > 0 ? ' (' + total + ')' : '');

  modalComments.innerHTML = '';
  if (currentPhoto.comments && currentPhoto.comments.length > 0) {
    currentPhoto.comments.forEach(c => {
      const el = renderComment(c, 0);
      if (el) modalComments.appendChild(el);
    });
  } else {
    modalComments.innerHTML = '<div style="color:#57534e;font-size:.875rem;padding:8px 0">暂无评论</div>';
  }

  modalScroll.scrollTop = 0;
  modal.classList.add('active');
}

function closeModal() {
  modal.classList.remove('active');
  modalImg.src = '';
}

document.getElementById('modalClose').addEventListener('click', closeModal);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

renderCards();
</script>
</body>
</html>`;

fs.writeFileSync(OUT_FILE, html, "utf-8");
console.log(`Built ${OUT_FILE} — ${photos.length} photos`);
