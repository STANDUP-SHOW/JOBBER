import Link from 'next/link';

export default function CategoryGrid({ categories }) {
  if (!categories?.length) {
    return <p className="text-slate-400">Aucune catégorie pour le moment — lancez le seed backend (`npm run seed`).</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {categories.map((cat, i) => (
        <Link
          key={cat.id}
          href={`/missions/new?categoryId=${cat.id}`}
          className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-moss hover:shadow-md"
        >
          <span className="label-eyebrow text-slate-400">{String(i + 1).padStart(2, '0')}</span>
          <div className="mt-3 text-3xl">{cat.icon}</div>
          <div className="mt-2 font-display text-lg font-medium text-ink group-hover:text-moss-dark">{cat.name}</div>
          <div className="mt-1 text-xs text-slate-400">{cat.services?.length || 0} prestations</div>
        </Link>
      ))}
    </div>
  );
}
