export default function GuaranteesGrid({ items }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((g) => (
        <div key={g.title} className="rounded-lg border border-slate-200 bg-white p-4">
          <span className="text-2xl">{g.icon}</span>
          <div className="mt-2 font-display text-base font-semibold text-ink">{g.title}</div>
          <p className="mt-1 text-sm text-slate-500">{g.desc}</p>
        </div>
      ))}
    </div>
  );
}
