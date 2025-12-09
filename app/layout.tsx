// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { SiteHeader } from '@/components/SiteHeader';
import type { ReactNode } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TidyMemo",
  description: "Memo app",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-slate-950 text-slate-100 antialiased`}
      >
        {/* どのページでも表示される共通ヘッダー */}
        <SiteHeader />

        {/* 各ページの本文 */}
        <main className="mx-auto max-w-5xl px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
