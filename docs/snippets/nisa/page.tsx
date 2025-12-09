// app/nisa/page.tsx
import Link from "next/link";

export default function NisaPage() {
  return (
    <div className="space-y-4">
      {/* 外部NISAシミュレーターを埋め込み */}
      <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/60">
        <iframe
          src="https://nisa-simulator-nine.vercel.app/"
          className="h-[80vh] w-full"
          loading="lazy"
        />
      </div>
    </div>
  );
}
