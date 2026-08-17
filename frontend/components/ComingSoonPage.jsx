'use client';

export default function ComingSoonPage({ title }) {
  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-semibold text-ink">{title}</h1>
      <p className="mt-4 rounded-lg border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-400">
        Bientôt disponible.
      </p>
    </div>
  );
}
