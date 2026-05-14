"use client";

import { useState, useEffect } from "react";

interface Props {
  photo: any;
  onClose: () => void;
}

export default function PhotoModal({ photo, onClose }: Props) {
  const [showComments, setShowComments] = useState(false);
  const images = photo.images?.length > 0 ? photo.images : [photo.imageUrl];
  const [imgIdx, setImgIdx] = useState(0);
  const [upvotes, setUpvotes] = useState(0);
  const [upvoted, setUpvoted] = useState(false);

  useEffect(() => {
    const key = "uv_" + photo.id;
    if (localStorage.getItem(key)) { setUpvoted(true); setUpvotes(-1); return; }
    fetch("/api/upvote?id=" + photo.id).then(r=>r.json()).then(d => setUpvotes(d.upvotes || 0)).catch(()=>{});
  }, [photo.id]);

  async function handleUpvote() {
    const key = "uv_" + photo.id;
    if (upvoted || localStorage.getItem(key)) return;
    try {
      const res = await fetch("/api/upvote?id=" + photo.id, { method: "POST" });
      const data = await res.json();
      setUpvotes(data.upvotes);
      setUpvoted(true);
      localStorage.setItem(key, "1");
    } catch {}
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black" onClick={onClose}>
      <div className="flex items-center justify-between p-4 text-white">
        <span className="text-sm truncate">{photo.title}</span>
        <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="text-2xl leading-none">&times;</button>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 relative" onClick={(e) => e.stopPropagation()}>
        {images.length > 1 && imgIdx > 0 && (
          <button onClick={() => setImgIdx(i=>i-1)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white w-10 h-10 rounded-full text-xl flex items-center justify-center z-10">‹</button>
        )}
        <img src={images[imgIdx]} alt={photo.title} className="max-w-full max-h-full object-contain" />
        {images.length > 1 && imgIdx < images.length - 1 && (
          <button onClick={() => setImgIdx(i=>i+1)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white w-10 h-10 rounded-full text-xl flex items-center justify-center z-10">›</button>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex justify-center gap-1.5 pb-1 bg-black">
          {images.map((_, i) => (
            <button key={i} onClick={() => setImgIdx(i)} className={`w-1.5 h-1.5 rounded-full p-0 ${i===imgIdx?'bg-white':'bg-neutral-600'}`} />
          ))}
        </div>
      )}

      <div className="bg-white dark:bg-stone-900 rounded-t-2xl p-5 max-h-[45vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between text-sm text-stone-500">
          {photo.year && <span>{photo.year}</span>}
          <span>{photo.upvotes.toLocaleString()} 赞</span>
        </div>
        <p className="mt-2 text-sm">{photo.description}</p>

        <button onClick={handleUpvote}
          className="mt-3 flex items-center gap-1 px-4 py-1.5 rounded-full text-xs border cursor-pointer"
          style={{ borderColor: upvoted ? "#3b82f6" : "#444", color: upvoted ? "#3b82f6" : "#a8a29e", background: "none" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill={upvoted ? "#3b82f6" : "none"} stroke="currentColor" strokeWidth="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
          {upvoted ? "已赞" : upvotes}
        </button>

        {photo.comments.length > 0 && (
          <>
            <button onClick={() => setShowComments(!showComments)} className="mt-4 w-full py-2 bg-stone-100 dark:bg-stone-800 rounded-xl text-sm font-medium">
              {showComments ? "收起评论" : `查看评论 (${photo.comments.length}条)`}
            </button>
            {showComments && (
              <div className="mt-3 space-y-3">
                {photo.comments.map((c) => (
                  <div key={c.id} className="bg-stone-50 dark:bg-stone-800 rounded-xl p-3 text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{c.author}</span>
                      <span className="text-xs text-stone-400">+{c.score}{c.createdAt ? ' · ' + formatDate(c.createdAt) : ''}</span>
                    </div>
                    <p className="text-stone-600 dark:text-stone-300">{renderBody(c.body)}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {photo.sourceUrl && (
          <a href={photo.sourceUrl} target="_blank" rel="noopener noreferrer"
            className="mt-4 block text-center py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-xl text-sm font-medium">
            查看 Reddit 原文
          </a>
        )}
      </div>
    </div>
  );
}
