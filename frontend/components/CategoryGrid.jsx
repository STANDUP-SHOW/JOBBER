import Link from 'next/link';

const TILE_COLORS = [
  '#FDE1E7', // pink
  '#DCEAFE', // blue
  '#D6F5E8', // mint
  '#FDEAD6', // peach
  '#E7E1FB', // lavender
  '#FFF3C4', // yellow
  '#D6F0F5', // teal
  '#FBE1D6', // coral
  '#E1F5D6', // lime
];

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
          className="group flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md text-2xl"
            style={{ backgroundColor: TILE_COLORS[i % TILE_COLORS.length] }}
          >
            {cat.icon}
          </span>
          <div className="min-w-0">
            <div className="truncate font-medium text-ink">{cat.name}</div>
            <div className="text-xs text-slate-400">{cat.services?.length || 0} prestations</div>
          </div>
        </Link>
      ))}
    </div>
  );
}
