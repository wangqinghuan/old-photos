import type { Photo } from "@/types/photo";
import PhotoList from "@/components/PhotoList";
import photosData from "@/data/photos.json";

const photos: Photo[] = photosData;

export default function Home() {
  return (
    <main className="min-h-screen pb-20">
      <header className="sticky top-0 z-50 bg-stone-50/90 dark:bg-stone-950/90 backdrop-blur-md border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-xl font-semibold tracking-tight">时光相册</h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">收藏历史，定格瞬间</p>
        </div>
      </header>

      <section className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-stone-500 dark:text-stone-400">最新收录</h2>
          <span className="text-xs text-stone-400 dark:text-stone-500">{photos.length} 张照片</span>
        </div>
        <PhotoList photos={photos} />
      </section>
    </main>
  );
}