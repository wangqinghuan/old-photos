"use client";

import { useState } from "react";
import type { Photo } from "@/types/photo";

interface Props {
  photo: Photo;
  onClose: () => void;
}

export default function PhotoModal({ photo, onClose }: Props) {
  const [showComments, setShowComments] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black" onClick={onClose}>
      <div className="flex items-center justify-between p-4 text-white">
        <span className="text-sm truncate">{photo.title}</span>
        <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="text-2xl leading-none">&times;</button>
      </div>

      <div className="flex-1 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
        <img src={photo.imageUrl} alt={photo.title} className="max-w-full max-h-full object-contain" />
      </div>

      <div className="bg-white dark:bg-stone-900 rounded-t-2xl p-5 max-h-[45vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between text-sm text-stone-500">
          {photo.year && <span>{photo.year}</span>}
          <span>{photo.upvotes.toLocaleString()} 赞</span>
        </div>
        <p className="mt-2 text-sm">{photo.description}</p>

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
                      <span className="text-xs text-stone-400">+{c.score}</span>
                    </div>
                    <p className="text-stone-600 dark:text-stone-300">{c.body}</p>
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
