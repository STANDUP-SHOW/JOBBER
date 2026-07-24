import Link from 'next/link';
import { CATEGORY_COLORS } from '../lib/categoryColors';

export default function PrestationDetailPage({
  category, categoryLabel, categoryHref,
  eyebrow, title, intro, sections, steps, tips, methods, faq, related,
}) {
  const color = CATEGORY_COLORS[category];

  return (
    <div>
      <nav className="text-xs text-slate-400">
        <Link href="/" className="hover:text-ink">Accueil</Link>
        <span className="mx-1.5">›</span>
        <Link href={categoryHref} className="hover:text-ink">{categoryLabel}</Link>
        <span className="mx-1.5">›</span>
        <span className="text-slate-500">{title}</span>
      </nav>

      <span className="mt-4 block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide text-white w-fit" style={{ backgroundColor: color }}>
        {eyebrow}
      </span>
      <h1 className="mt-3 font-display text-3xl font-bold text-ink md:text-4xl">{title}</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">{intro}</p>

      <div className="mt-10 max-w-2xl space-y-8">
        {sections.map((s) => (
          <section key={s.heading}>
            <h2 className="font-display text-xl font-semibold text-ink">{s.heading}</h2>
            {s.body.map((p, i) => <p key={i} className="mt-2 text-slate-600">{p}</p>)}
          </section>
        ))}
      </div>

      <div className="mt-10 rounded-lg p-6 text-center text-white md:p-8" style={{ backgroundColor: color }}>
        <p className="font-display text-lg font-semibold">Un agent Services 34 près de chez vous</p>
        <p className="mt-1 text-sm text-white/85">Béziers, Agde, Vias, Marseillan et alentours — devis avant intervention.</p>
        <Link href="/demande" className="mt-4 inline-block rounded-md bg-white px-5 py-2.5 text-sm font-semibold" style={{ color }}>
          Demander une intervention
        </Link>
      </div>

      {steps && (
        <section className="mt-10 max-w-2xl">
          <h2 className="font-display text-xl font-semibold text-ink">Comment ça se passe</h2>
          <div className="mt-4 space-y-4">
            {steps.map((step, i) => (
              <div key={step.title} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold text-white" style={{ backgroundColor: color }}>
                  {i + 1}
                </span>
                <div>
                  <div className="font-display text-base font-semibold text-ink">{step.title}</div>
                  <p className="mt-1 text-sm text-slate-600">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {methods && (
        <section className="mt-10 max-w-2xl">
          <h2 className="font-display text-xl font-semibold text-ink">{methods.heading}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {methods.options.map((m) => (
              <div key={m.title} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="font-display text-base font-semibold text-ink">{m.title}</div>
                <p className="mt-1 text-sm text-slate-600">{m.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {tips && (
        <section className="mt-10 max-w-2xl rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="font-display text-base font-semibold text-ink">À savoir</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-slate-600">
            {tips.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        </section>
      )}

      {faq && (
        <section className="mt-10 max-w-2xl">
          <h2 className="font-display text-xl font-semibold text-ink">Questions fréquentes</h2>
          <div className="mt-4 space-y-3">
            {faq.map(({ q, a }) => (
              <details key={q} className="group rounded-lg border border-slate-200 bg-white p-4">
                <summary className="cursor-pointer list-none font-display text-base font-medium text-ink marker:content-none">{q}</summary>
                <p className="mt-2 text-sm text-slate-600">{a}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {related && (
        <section className="mt-10 max-w-2xl">
          <h2 className="font-display text-base font-semibold text-ink">Voir aussi</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {related.map((r) => (
              <Link key={r.href} href={r.href} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-ink hover:border-slate-300">
                {r.label}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
