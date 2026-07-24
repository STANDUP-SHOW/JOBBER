import Link from 'next/link';

export default function ServiceCategoryPage({ eyebrow, title, intro, guarantees, tasks, faq }) {
  return (
    <div>
      <section className="overflow-hidden rounded-lg border border-brand/20 bg-brand-light py-10 px-6 text-center md:px-12">
        <span className="rounded-full bg-brand px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
          {eyebrow}
        </span>
        <h1 className="mx-auto mt-4 max-w-2xl font-display text-4xl font-bold leading-[1.1] text-ink md:text-5xl">
          {title}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-ink">{intro}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/demande" className="rounded-md bg-brand px-6 py-3 font-medium text-white hover:bg-brand-dark">
            Demander une intervention
          </Link>
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

      <section className="mt-16">
        <h2 className="text-center font-display text-2xl font-semibold text-ink">Nos prestations</h2>
        <div className="mx-auto mt-6 flex max-w-3xl flex-wrap justify-center gap-2">
          {tasks.map((t) => (
            <span key={t} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-ink">
              {t}
            </span>
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

      <section className="mt-16 mb-4 rounded-lg bg-ink py-10 px-6 text-center text-white md:px-12">
        <h2 className="font-display text-2xl font-semibold">Une intervention près de chez vous</h2>
        <p className="mx-auto mt-2 max-w-xl text-white/80">
          Béziers, Agde, Vias, Marseillan et les communes environnantes — décrivez votre besoin, un agent Services 34 vous recontacte rapidement.
        </p>
        <div className="mt-6">
          <Link href="/demande" className="rounded-md bg-white px-6 py-3 font-medium text-ink hover:bg-slate-100">
            Demander une intervention
          </Link>
        </div>
      </section>
    </div>
  );
}
