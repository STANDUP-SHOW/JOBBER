'use client';

import Link from 'next/link';

export default function ComingSoonPage({ title }) {
  return (
    <div className="mx-auto max-w-xl">
      <Link href="/account" className="text-sm font-medium text-moss">← Mon compte</Link>
      <h1 className="mt-3 font-display text-2xl font-semibold text-ink">{title}</h1>
      <p className="mt-4 rounded-lg border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-400">
        Bientôt disponible.
      </p>
    </div>
  );
}
