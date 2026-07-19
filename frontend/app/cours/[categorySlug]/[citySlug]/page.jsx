import { notFound } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '../../../../lib/api';
import { SEO_LESSON_CATEGORIES } from '../../../../lib/seoLessonCategories';
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
  return Object.keys(SEO_LESSON_CATEGORIES).flatMap((categorySlug) =>
    SEO_CITIES.map((city) => ({ categorySlug, citySlug: city.slug }))
  );
}

export async function generateMetadata({ params }) {
  const seo = SEO_LESSON_CATEGORIES[params.categorySlug];
  const city = SEO_CITIES.find((c) => c.slug === params.citySlug);
  if (!seo || !city) return {};
  const title = `${seo.title} à ${city.name}`;
  const description = `${seo.intro} Trouvez ${seo.teacher} à ${city.name} qui se déplace chez vous, ou proposez vos propres cours sur ${SITE_NAME}.`;
  const url = `${SITE_URL}/cours/${params.categorySlug}/${params.citySlug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
  };
}

export default async function LessonCategoryCityPage({ params }) {
  const seo = SEO_LESSON_CATEGORIES[params.categorySlug];
  const city = SEO_CITIES.find((c) => c.slug === params.citySlug);
  if (!seo || !city) return notFound();
  const category = await getCategory(params.categorySlug);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: seo.title,
    provider: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    areaServed: { '@type': 'City', name: city.name },
    description: `${seo.intro} Disponible à ${city.name} et ses environs.`,
  };

  const faq = [
    {
      q: `Combien coûte un cours avec ${seo.teacher} à ${city.name} ?`,
      a: "Le tarif horaire est fixé librement par chaque jobber lorsqu'il répond à votre demande de cours — vous comparez plusieurs propositions avant de choisir. Il n'y a pas de tarif imposé.",
    },
    {
      q: `Comment trouver ${seo.teacher} rapidement à ${city.name} ?`,
      a: `Publiez gratuitement votre demande de cours en quelques minutes : décrivez ce que vous souhaitez apprendre et votre adresse à ${city.name}. Les jobbers qui proposent des cours dans ce domaine vous répondent directement.`,
    },
    {
      q: 'Comment savoir si le jobber est vraiment qualifié pour enseigner ?',
      a: "Chaque jobber qui active l'option « Proposer des cours » coche une déclaration sur l'honneur : il certifie détenir un titre professionnel dans la catégorie enseignée, ou justifier de plus de 3 ans d'expérience.",
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
  const otherCategories = Object.entries(SEO_LESSON_CATEGORIES).filter(([slug]) => slug !== params.categorySlug);

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <nav className="text-xs text-slate-400">
        <Link href="/" className="hover:text-moss">Accueil</Link>
        {' · '}
        <Link href={`/cours/${params.categorySlug}`} className="hover:text-moss">{seo.title}</Link>
        {' · '}
        <span>{city.name}</span>
      </nav>

      <span className="mt-2 block label-eyebrow text-moss">{city.region}</span>
      <h1 className="mt-2 font-display text-4xl font-semibold text-ink">{seo.title} à {city.name}</h1>
      <p className="mt-3 max-w-2xl text-slate-600">
        {seo.intro} Trouvez {seo.teacher} disponible à {city.name} et dans les environs pour un cours pratique, chez vous.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={category ? `/missions/new?type=lesson&categoryId=${category.id}` : '/missions/new?type=lesson'}
          className="rounded-md bg-purple-600 px-5 py-3 font-medium text-white hover:bg-purple-700"
        >
          Demander un cours à {city.name}
        </Link>
        <Link
          href="/auth/register"
          className="rounded-md border border-slate-200 px-5 py-3 font-medium text-ink hover:border-moss hover:text-moss-dark"
        >
          Proposer mes cours à {city.name}
        </Link>
      </div>

      {category?.services?.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold text-ink">Ce que vous pouvez apprendre</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {category.services.map((s) => (
              <li key={s.id} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600">
                {s.name}
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
              href={`/cours/${params.categorySlug}/${c.slug}`}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-500 hover:border-moss hover:text-moss-dark"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-ink">Autres cours à {city.name}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {otherCategories.map(([slug, s]) => (
            <Link
              key={slug}
              href={`/cours/${slug}/${city.slug}`}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-500 hover:border-moss hover:text-moss-dark"
            >
              {s.title}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-ink">Vous cherchez plutôt {seo.teacher} pour réaliser des travaux ?</h2>
        <p className="mt-2 text-sm text-slate-600">
          Si vous préférez confier la tâche plutôt que l'apprendre, retrouvez {seo.teacher} disponible à {city.name}.
        </p>
        <Link
          href={`/services/${params.categorySlug}/${city.slug}`}
          className="mt-3 inline-block rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-moss hover:border-moss"
        >
          Publier une mission à {city.name} →
        </Link>
      </section>
    </div>
  );
}
