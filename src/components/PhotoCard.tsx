"use client";

import { useState } from "react";
import PhotoModal from "./PhotoModal";

interface Props {
  photo: any;
}

export default function PhotoCard({ photo }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <>
      <button
        className="w-full text-left bg-white dark:bg-stone-900 rounded-2xl overflow-hidden shadow-sm border border-stone-200 dark:border-stone-800 transition-transform active:scale-[0.98] cursor-pointer touch-manipulation"
        onClick={() => setIsModalOpen(true)}
        type="button"
      >
        <div className="relative aspect-[4/3] bg-stone-100 dark:bg-stone-800 overflow-hidden">
          {imgError ? (
            <div className="w-full h-full flex items-center justify-center text-stone-400 dark:text-stone-500 text-sm">
              <div className="text-center">
                <svg className="w-8 h-8 mx-auto mb-1 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                图片加载失败
              </div>
            </div>
          ) : (
            <img
              src={photo.imageUrl}
              alt={photo.title}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          )}
          {photo.year && (
            <span className="absolute top-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-full text-xs text-white font-mono">
              {photo.year}
            </span>
          )}
          {photo.comments.length > 0 && (
            <span className="absolute bottom-3 right-3 px-2 py-1 bg-blue-500/80 backdrop-blur-sm rounded-full text-xs text-white flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {photo.comments.length}
            </span>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-medium text-base leading-snug">{photo.title}</h3>
          <p className="mt-2 text-sm text-stone-500 dark:text-stone-400 line-clamp-2">
            {photo.description}
          </p>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-stone-400 dark:text-stone-500">
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                {photo.upvotes > 0 ? photo.upvotes.toLocaleString() : '0'}
              </span>
              {photo.location && (
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {photo.location}
                </span>
              )}
            </div>
            <time className="text-xs text-stone-400 dark:text-stone-500">
              {new Date(photo.postedAt).toLocaleDateString("zh-CN", { month: "short", day: "numeric" })}
            </time>
          </div>
        </div>
      </button>

      {isModalOpen && <PhotoModal photo={photo} onClose={() => setIsModalOpen(false)} />}
    </>
  );
}