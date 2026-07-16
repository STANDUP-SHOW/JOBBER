import { notFound } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '../../../../lib/api';
import { SEO_CATEGORIES } from '../../../../lib/seoCategories';
import { SEO_CITIES } from '../../../../lib/seoCities';
import { SITE_URL, SITE_NAME } from '../../../../lib/seo';

export const revalidate = 3600;

async function getCategory(slug) {
  try {
    const res = await fetch(`${API_URL}/api/categories`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const { categories } = await res.json();
    return categories.find((c) => c.slug === slug) || null;
  } catch {
    return null;
  }
}

export async function generateStaticParams() {
  return Object.keys(SEO_CATEGORIES).flatMap((categorySlug) =>
    SEO_CITIES.map((city) => ({ categorySlug, citySlug: city.slug }))
  );
}

export async function generateMetadata({ params }) {
  const seo = SEO_CATEGORIES[params.categorySlug];
  const city = SEO_CITIES.find((c) => c.slug === params.citySlug);
  if (!seo || !city) return {};
  const article = seo.worker.startsWith('une') ? "d'une" : "d'un";
  const title = `${seo.title} à ${city.name}`;
  const description = `Besoin ${article} ${seo.title.toLowerCase()} à ${city.name} ? ${seo.intro} Publiez votre besoin gratuitement sur ${SITE_NAME}.`;
  const url = `${SITE_URL}/services/${params.categorySlug}/${params.citySlug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
  };
}

export default async function CategoryCityPage({ params }) {
  const seo = SEO_CATEGORIES[params.categorySlug];
  const city = SEO_CITIES.find((c) => c.slug === params.citySlug);
  if (!seo || !city) return notFound();
  const category = await getCategory(params.categorySlug);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: seo.title,
    provider: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    areaServed: { '@type': 'City', name: city.name },
    description: `${seo.intro} Disponible à ${city.name} et ses environs.`,
  };

  const faq = [
    {
      q: `Combien coûte ${seo.worker} à ${city.name} ?`,
      a: "Le tarif horaire est fixé librement par chaque prestataire lorsqu'il répond à votre demande — vous comparez plusieurs propositions avant de choisir. Il n'y a pas de tarif imposé.",
    },
    {
      q: `Comment trouver ${seo.worker} rapidement à ${city.name} ?`,
      a: `Publiez gratuitement votre besoin en quelques minutes : décrivez la mission, la date souhaitée et votre adresse à ${city.name}. Les prestataires disponibles dans votre zone vous répondent directement.`,
    },
    {
      q: 'Le paiement est-il sécurisé ?',
      a: "Oui : le montant est bloqué en séquestre au moment de l'acceptation de l'offre, puis versé au prestataire une fois la mission validée.",
    },
  ];

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  const otherCities = SEO_CITIES.filter((c) => c.slug !== city.slug).slice(0, 12);
  const otherCategories = Object.entries(SEO_CATEGORIES).filter(([slug]) => slug !== params.categorySlug);

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <nav className="text-xs text-slate-400">
        <Link href="/" className="hover:text-moss">Accueil</Link>
        {' · '}
        <Link href={`/services/${params.categorySlug}`} className="hover:text-moss">{seo.title}</Link>
        {' · '}
        <span>{city.name}</span>
      </nav>

      <span className="mt-2 block label-eyebrow text-moss">{city.region}</span>
      <h1 className="mt-2 font-display text-4xl font-semibold text-ink">Trouvez {seo.worker} à {city.name}</h1>
      <p className="mt-3 max-w-2xl text-slate-600">
        {seo.intro} Publiez votre besoin gratuitement et recevez des propositions {seo.plural} disponibles à {city.name} et dans les environs.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={category ? `/missions/new?categoryId=${category.id}` : '/missions/new'}
          className="rounded-md bg-moss px-5 py-3 font-medium text-paper hover:bg-moss-dark"
        >
          Publier un besoin à {city.name}
        </Link>
        <Link
          href="/auth/register"
          className="rounded-md border border-slate-200 px-5 py-3 font-medium text-ink hover:border-moss hover:text-moss-dark"
        >
          Proposer mes services à {city.name}
        </Link>
      </div>

      {category?.services?.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold text-ink">Prestations disponibles</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {category.services.map((s) => (
              <li key={s.id} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600">
                {s.name}
              </li>
            ))}
          </ul>
        </section>
      )}

      {category?.equipment?.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold text-ink">Le matériel utilisé par nos prestataires</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {category.equipment.slice(0, 8).map((e) => (
              <li key={e.id} className="rounded-full bg-moss-light px-3 py-1.5 text-sm text-moss-dark">
                {e.name}
              </li>
            ))}
          </ul>
        </section>
      )}

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
        <h2 className="font-display text-xl font-semibold text-ink">Autres villes</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {otherCities.map((c) => (
            <Link
              key={c.slug}
              href={`/services/${params.categorySlug}/${c.slug}`}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-500 hover:border-moss hover:text-moss-dark"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-ink">Autres services à {city.name}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {otherCategories.map(([slug, s]) => (
            <Link
              key={slug}
              href={`/services/${slug}/${city.slug}`}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-500 hover:border-moss hover:text-moss-dark"
            >
              {s.title}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
