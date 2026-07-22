import { notFound } from 'next/navigation';
import Link from 'next/link';
import { SEO_CITIES } from '../../../lib/seoCities';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

export async function generateStaticParams() {
  return SEO_CITIES.map((city) => ({ citySlug: city.slug }));
}

export async function generateMetadata({ params }) {
  const city = SEO_CITIES.find((c) => c.slug === params.citySlug);
  if (!city) return {};
  const title = `Recruter du personnel à ${city.name} rapidement — Jobber Entreprise`;
  const description = `Recrutez à la tâche à ${city.name} : personnel disponible, prêt à travailler, en quelques heures et quelques clics. Facturé directement par ${SITE_NAME}, sans charges ni engagement.`;
  const url = `${SITE_URL}/recruter/${params.citySlug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
  };
}

const FAQ_BASE = [
  {
    q: 'Combien de temps faut-il pour recruter quelqu\'un ?',
    a: 'Publiez votre besoin en quelques clics : les jobbers disponibles dans votre zone peuvent répondre en quelques heures, parfois pour une mission dès aujourd\'hui.',
  },
  {
    q: 'Comment sont facturées les missions ?',
    a: "Vous êtes facturé directement par Jobber : chaque prestation payée génère une facture récapitulant le détail de la mission — prestataire, date, durée et montant.",
  },
  {
    q: 'Puis-je garder les mêmes collaborateurs ?',
    a: "Oui : gardez le contact avec vos jobbers de confiance et proposez-leur des missions à la journée, à la semaine ou sur des heures récurrentes.",
  },
];

export default function RecruterCityPage({ params }) {
  const city = SEO_CITIES.find((c) => c.slug === params.citySlug);
  if (!city) return notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Recrutement de personnel à la tâche',
    provider: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    areaServed: { '@type': 'City', name: city.name },
    description: `Recrutement de personnel à la tâche à ${city.name}, facturé directement par Jobber.`,
  };

  const faq = [
    { q: `Comment recruter du personnel à ${city.name} rapidement ?`, a: `Publiez votre besoin en quelques clics : décrivez la mission et la date souhaitée à ${city.name}. Le personnel disponible dans votre zone vous répond directement.` },
    ...FAQ_BASE,
  ];

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };

  const otherCities = SEO_CITIES.filter((c) => c.slug !== city.slug).slice(0, 12);

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <nav className="text-xs text-slate-400">
        <Link href="/" className="hover:text-moss">Accueil</Link>
        {' · '}
        <Link href="/entreprises" className="hover:text-moss">Entreprises</Link>
        {' · '}
        <span>{city.name}</span>
      </nav>

      <span className="mt-2 block label-eyebrow text-moss">{city.region}</span>
      <h1 className="mt-2 font-display text-4xl font-semibold text-ink">Recrutez du personnel à {city.name}, rapidement</h1>
      <p className="mt-3 max-w-2xl text-slate-600">
        Personnel disponible, prêt à travailler rapidement. Recrutez en quelques heures, en quelques clics — même
        pour une mission aujourd'hui. Vous êtes facturé directement par Jobber, sans charges ni frais fixes de
        personnel.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/auth/register-entreprise" className="rounded-md bg-moss px-5 py-3 font-medium text-paper hover:bg-moss-dark">
          Créer un compte entreprise
        </Link>
        <Link href="/missions/new" className="rounded-md border border-slate-200 px-5 py-3 font-medium text-ink hover:border-moss hover:text-moss-dark">
          Publier un besoin à {city.name}
        </Link>
      </div>

      <section className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          ['⚡', 'En quelques heures', 'Publiez votre mission et recevez des réponses de personnel disponible à ' + city.name + ' le jour même.'],
          ['🖱️', 'En quelques clics', 'Décrivez le besoin, la compétence recherchée et la date — aucune paperasse, aucun engagement.'],
          ['🧾', 'Facturé par Jobber', 'Une facture détaillée est émise directement par Jobber à chaque mission payée.'],
        ].map(([icon, title, desc]) => (
          <div key={title} className="rounded-lg border border-slate-200 bg-white p-5">
            <span className="text-2xl">{icon}</span>
            <div className="mt-2 font-display text-base font-semibold text-ink">{title}</div>
            <p className="mt-1 text-sm text-slate-500">{desc}</p>
          </div>
        ))}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-ink">Questions fréquentes</h2>
        <div className="mt-3 space-y-4">
          {faq.map((f) => (
            <div key={f.q}>
              <div className="font-medium text-ink">{f.q}</div>
              <p className="mt-1 text-sm text-slate-600">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-ink">Recruter dans d'autres villes</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {otherCities.map((c) => (
            <Link
              key={c.slug}
              href={`/recruter/${c.slug}`}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-500 hover:border-moss hover:text-moss-dark"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
