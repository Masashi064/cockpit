// app/tax-calculator/page.tsx
import Link from 'next/link';

export default function NisaPage() {
  return (
    <div className="space-y-4">
      {/* 既存の nisa.html を iframe で埋め込む */}
      <div className="overflow-hidden rounded-xl bg-white shadow">
        <iframe src="/nisa.html" className="h-[80vh] w-full" />
      </div>
    </div>
  );
}
