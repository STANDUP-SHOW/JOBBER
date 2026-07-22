import Link from 'next/link';

const BUTTON_STYLES = {
  primary: 'bg-ink text-white hover:bg-ink/90',
  moss: 'bg-moss text-paper hover:bg-moss-dark',
  outline: 'border border-ink/20 bg-white text-ink hover:border-ink',
  purple: 'bg-purple-600 text-white hover:bg-purple-700',
  'purple-outline': 'border border-purple-300 bg-white text-purple-700 hover:border-purple-500',
};

export default function AudienceBlock({
  eyebrow,
  title,
  description,
  points,
  buttons,
  reverse = false,
  sectionClass,
  eyebrowClass,
}) {
  return (
    <section className={`mt-16 grid items-center gap-10 rounded-lg p-6 md:grid-cols-2 md:p-10 ${sectionClass}`}>
      <div className={reverse ? 'md:order-2' : ''}>
        <span className={`block font-display text-base font-bold uppercase tracking-wide ${eyebrowClass}`}>{eyebrow}</span>
        <h2 className="mt-3 font-display text-3xl font-semibold leading-[1.1] text-ink md:text-4xl">{title}</h2>
        <p className="mt-3 max-w-md text-slate-700">{description}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          {buttons.map((b) => (
            <Link
              key={b.href}
              href={b.href}
              className={`inline-block rounded-md px-5 py-3 font-medium ${BUTTON_STYLES[b.variant || 'primary']}`}
            >
              {b.label}
            </Link>
          ))}
        </div>
      </div>
      <div className={`rounded-lg bg-white p-6 ${reverse ? 'md:order-1' : ''}`}>
        <ul className="space-y-4">
          {points.map((p) => (
            <li key={p.title} className="flex gap-3">
              <span className="text-2xl">{p.icon}</span>
              <div>
                <div className="font-medium text-ink">{p.title}</div>
                <div className="text-sm text-slate-500">{p.desc}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
