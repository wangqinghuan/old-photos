import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "时光相册 | 老照片收藏",
  description: "收藏来自 Reddit 的经典历史老照片，每一张都是一个故事",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 antialiased">
        {children}
      </body>
    </html>
  );
}