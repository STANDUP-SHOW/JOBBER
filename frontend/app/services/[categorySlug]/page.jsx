import { notFound } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '../../../lib/api';
import { SEO_CATEGORIES } from '../../../lib/seoCategories';
import { SEO_CITIES } from '../../../lib/seoCities';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

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
  return Object.keys(SEO_CATEGORIES).map((categorySlug) => ({ categorySlug }));
}

export async function generateMetadata({ params }) {
  const seo = SEO_CATEGORIES[params.categorySlug];
  if (!seo) return {};
  const title = `Trouvez ${seo.worker} partout en France`;
  const description = `${seo.intro} Comparez les profils, choisissez votre tarif, payez en toute sécurité sur ${SITE_NAME}.`;
  const url = `${SITE_URL}/services/${params.categorySlug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
  };
}

export default async function CategoryServicePage({ params }) {
  const seo = SEO_CATEGORIES[params.categorySlug];
  if (!seo) return notFound();
  const category = await getCategory(params.categorySlug);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: seo.title,
    provider: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    areaServed: { '@type': 'Country', name: 'France' },
    description: seo.intro,
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <span className="label-eyebrow text-moss">Services à domicile</span>
      <h1 className="mt-2 font-display text-4xl font-semibold text-ink">Trouvez {seo.worker} près de chez vous</h1>
      <p className="mt-3 max-w-2xl text-slate-600">{seo.intro}</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={category ? `/missions/new?categoryId=${category.id}` : '/missions/new'}
          className="rounded-md bg-moss px-5 py-3 font-medium text-paper hover:bg-moss-dark"
        >
          Publier un besoin
        </Link>
        <Link
          href="/auth/register"
          className="rounded-md border border-slate-200 px-5 py-3 font-medium text-ink hover:border-moss hover:text-moss-dark"
        >
          Devenir {seo.worker.replace(/^(un|une) /, '')}
        </Link>
      </div>

      {category?.services?.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-2xl font-semibold text-ink">Nos prestations en {seo.title.toLowerCase()}</h2>
          <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {category.services.map((s) => (
              <li key={s.id} className="rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm text-ink">
                {s.name}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold text-ink">{seo.title} disponible dans votre ville</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {SEO_CITIES.map((city) => (
            <Link
              key={city.slug}
              href={`/services/${params.categorySlug}/${city.slug}`}
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-ink hover:border-moss hover:text-moss-dark"
            >
              {seo.title} à {city.name}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
