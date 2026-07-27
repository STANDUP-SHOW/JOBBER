import Link from 'next/link';
import { CATEGORY_COLORS } from '../lib/categoryColors';

export default function ServiceCategoryPage({ category, eyebrow, title, intro, guarantees, tasks, faq }) {
  const color = CATEGORY_COLORS[category];
  return (
    <div>
      <section
        className="overflow-hidden rounded-lg border py-10 px-6 text-center md:px-12"
        style={{ backgroundColor: `${color}1A`, borderColor: `${color}33` }}
      >
        <span className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide text-white" style={{ backgroundColor: color }}>
          {eyebrow}
        </span>
        <h1 className="mx-auto mt-4 max-w-2xl font-display text-4xl font-bold leading-[1.1] text-ink md:text-5xl">
          {title}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-ink">{intro}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href={`/demande?categorie=${category}`} className="rounded-md px-6 py-3 font-medium text-white transition-opacity hover:opacity-90" style={{ backgroundColor: color }}>
            Demander une intervention {eyebrow}
          </Link>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-center font-display text-2xl font-semibold text-ink">Nos prestations</h2>
        <p className="mx-auto mt-1 max-w-md text-center text-sm text-slate-400">Cliquez sur une prestation pour en savoir plus.</p>
        <div className="mx-auto mt-8 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {tasks.map((t) => {
            const name = typeof t === 'string' ? t : t.name;
            const href = typeof t === 'string' ? null : t.href;
            const icon = typeof t === 'string' ? null : t.icon;
            const Tag = href ? Link : 'div';
            return (
              <Tag
                key={name}
                {...(href ? { href } : {})}
                className={`flex min-h-[7.5rem] flex-col items-center justify-center gap-2 rounded-lg p-4 text-center text-white ${href ? 'transition-opacity hover:opacity-90' : ''}`}
                style={{ backgroundColor: color }}
              >
                {icon && <span className="text-2xl leading-none">{icon}</span>}
                <span className="text-sm font-medium leading-tight">{name}</span>
              </Tag>
            );
          })}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-center font-display text-2xl font-semibold text-ink">Pourquoi passer par Services 34</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {guarantees.map((g) => (
            <div key={g.title} className="rounded-lg border border-slate-200 bg-white p-5">
              <span className="text-2xl">{g.icon}</span>
              <div className="mt-2 font-display text-lg font-semibold text-ink">{g.title}</div>
              <p className="mt-1 text-sm text-slate-500">{g.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {faq && (
        <section className="mx-auto mt-16 max-w-2xl">
          <h2 className="text-center font-display text-2xl font-semibold text-ink">Questions fréquentes</h2>
          <div className="mt-8 space-y-3">
            {faq.map(({ q, a }) => (
              <details key={q} className="group rounded-lg border border-slate-200 bg-white p-4">
                <summary className="cursor-pointer list-none font-display text-base font-medium text-ink marker:content-none">
                  {q}
                </summary>
                <p className="mt-2 text-sm text-slate-600">{a}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      <section className="mt-16 mb-4 rounded-lg py-10 px-6 text-center text-white md:px-12" style={{ backgroundColor: color }}>
        <h2 className="font-display text-2xl font-semibold">Un agent {eyebrow} Services 34 près de chez vous</h2>
        <p className="mx-auto mt-2 max-w-xl text-white/85">
          Béziers, Agde, Vias, Marseillan et les communes environnantes — décrivez votre besoin, un agent {eyebrow} Services 34 vous recontacte rapidement.
        </p>
        <div className="mt-6">
          <Link href={`/demande?categorie=${category}`} className="inline-block rounded-md bg-white px-6 py-3 font-medium hover:bg-slate-100" style={{ color }}>
            Demander une intervention {eyebrow}
          </Link>
        </div>
      </section>
    </div>
  );
}
