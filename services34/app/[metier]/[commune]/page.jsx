import Link from 'next/link';
import { notFound } from 'next/navigation';
import BrandSetter from '../../../components/BrandSetter';
import { METIERS, METIERS_BY_SLUG } from '../../../lib/metiers';
import { COMMUNES, COMMUNES_BY_SLUG } from '../../../lib/communes';
import { CATEGORY_COLORS } from '../../../lib/categoryColors';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

// Full métier × commune matrix (112 × 153 ≈ 17 000 URLs) is listed in the
// sitemap so it's fully crawlable, but only a small seed is pre-rendered at
// build time — the rest render on first request and are cached for 30 days.
// Rendering all ~17 000 at build time would make the build impractically
// slow; dynamicParams keeps every combination reachable regardless.
export const dynamicParams = true;
export const revalidate = 2592000;

export function generateStaticParams() {
  return METIERS.map((m) => ({ metier: m.slug, commune: 'beziers' }));
}

export async function generateMetadata({ params }) {
  const metier = METIERS_BY_SLUG[params.metier];
  const commune = COMMUNES_BY_SLUG[params.commune];
  if (!metier || !commune) return {};

  const title = `${metier.term} à ${commune.name} — ${SITE_NAME}`;
  const description = `${metier.term} à ${commune.name} : nos agents ${metier.categoryLabel} interviennent rapidement dans votre commune, devis avant intervention. Services 34, secteur de Béziers.`;
  const url = `${SITE_URL}/${metier.slug}/${commune.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
  };
}

// `term` mixes two grammatical shapes — task phrases ("Ménage à domicile")
// and job titles ("Peintre en bâtiment") — that don't take the same
// articles/prepositions in French. Templates below always reference term as
// a standalone label (quoted or sentence-initial) so both shapes stay
// grammatical without needing per-entry gender/agreement metadata.
const INTRO_TEMPLATES = [
  (term, commune) => `${term} à ${commune} : nos agents Services 34 interviennent rapidement dans votre commune, avec un devis clair avant toute intervention.`,
  (term, commune) => `À ${commune}, nos agents assurent la prestation « ${term} » pour les particuliers, avec le même sérieux que sur l'ensemble de notre secteur d'intervention.`,
  (term, commune) => `Vous recherchez « ${term} » à ${commune} ? Services 34 met à votre disposition des agents de confiance, disponibles dans votre commune et ses environs.`,
  (term, commune) => `${term} à ${commune} : nos agents locaux interviennent rapidement, avec un tarif validé avant le début de la prestation.`,
  (term, commune) => `Pour « ${term} » à ${commune}, Services 34 vous met en relation avec un agent local, identifié et disponible près de chez vous.`,
];

const LOCAL_TEMPLATES = [
  (term, commune) => `${commune} fait partie du secteur couvert par Services 34, dans l'arrondissement de Béziers. Nos agents y assurent la prestation « ${term} », ponctuelle ou récurrente selon votre besoin.`,
  (term, commune) => `Que vous soyez résident permanent ou propriétaire d'une résidence secondaire à ${commune}, un agent Services 34 peut être sollicité pour « ${term} », à la fréquence qui vous convient.`,
  (term, commune) => `Services 34 couvre l'ensemble du secteur autour de Béziers, dont ${commune}. La demande « ${term} » se fait en ligne, avec un tarif communiqué avant l'intervention.`,
];

function pickRelated(list, currentSlug, count, keyFn) {
  const idx = list.findIndex((x) => keyFn(x) === currentSlug);
  const start = idx === -1 ? 0 : idx;
  const out = [];
  for (let i = 1; out.length < count && i <= list.length; i++) {
    const candidate = list[(start + i) % list.length];
    if (keyFn(candidate) !== currentSlug) out.push(candidate);
  }
  return out;
}

function pick(templates, seed) {
  let sum = 0;
  for (let i = 0; i < seed.length; i++) sum += seed.charCodeAt(i);
  return templates[sum % templates.length];
}

export default function MetierCommunePage({ params }) {
  const metier = METIERS_BY_SLUG[params.metier];
  const commune = COMMUNES_BY_SLUG[params.commune];
  if (!metier || !commune) notFound();

  const color = CATEGORY_COLORS[metier.category];
  const seed = `${metier.slug}-${commune.slug}`;
  const intro = pick(INTRO_TEMPLATES, seed)(metier.term, commune.name);
  const local = pick(LOCAL_TEMPLATES, seed + 'x')(metier.term, commune.name);

  const otherCommunes = pickRelated(COMMUNES, commune.slug, 8, (c) => c.slug);
  const otherMetiers = pickRelated(
    METIERS.filter((m) => m.category === metier.category),
    metier.slug,
    6,
    (m) => m.slug,
  );

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: metier.term,
    areaServed: { '@type': 'City', name: commune.name },
    provider: { '@type': 'LocalBusiness', name: SITE_NAME, url: SITE_URL },
    url: `${SITE_URL}/${metier.slug}/${commune.slug}`,
  };

  return (
    <>
      <BrandSetter category={metier.category} label={metier.categoryLabel} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div>
        <nav className="text-xs text-slate-400">
          <Link href="/" className="hover:text-ink">Accueil</Link>
          <span className="mx-1.5">›</span>
          <Link href={metier.parentHref} className="hover:text-ink">{metier.categoryLabel}</Link>
          <span className="mx-1.5">›</span>
          <span className="text-slate-500">{metier.term} à {commune.name}</span>
        </nav>

        <span className="mt-4 block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide text-white w-fit" style={{ backgroundColor: color }}>
          {metier.categoryLabel}
        </span>
        <h1 className="mt-3 font-display text-3xl font-bold text-ink md:text-4xl">
          {metier.term} à {commune.name}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-600">{intro}</p>

        <div className="mt-10 max-w-2xl space-y-6">
          <section>
            <h2 className="font-display text-xl font-semibold text-ink">Un service disponible dans votre commune</h2>
            <p className="mt-2 text-slate-600">{local}</p>
          </section>
        </div>

        <div className="mt-10 grid max-w-2xl gap-4 sm:grid-cols-3">
          {[
            { icon: '📋', text: 'Devis avant intervention' },
            { icon: '🪪', text: 'Agents identifiés et de confiance' },
            { icon: '📍', text: 'Disponible dans les communes du secteur' },
          ].map((g) => (
            <div key={g.text} className="rounded-lg border border-slate-200 bg-white p-4 text-center">
              <span className="text-2xl">{g.icon}</span>
              <p className="mt-2 text-sm font-medium text-ink">{g.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 max-w-2xl rounded-lg p-6 text-center text-white md:p-8" style={{ backgroundColor: color }}>
          <p className="font-display text-lg font-semibold">Un agent {metier.categoryLabel} Services 34 à {commune.name}</p>
          <p className="mt-1 text-sm text-white/85">Devis avant intervention, sans engagement.</p>
          <Link href={`/demande?categorie=${metier.category}`} className="mt-4 inline-block rounded-md bg-white px-5 py-2.5 text-sm font-semibold" style={{ color }}>
            Demander une intervention {metier.categoryLabel}
          </Link>
        </div>

        <section className="mt-10 max-w-2xl">
          <h2 className="font-display text-xl font-semibold text-ink">Questions fréquentes</h2>
          <div className="mt-4 space-y-3">
            <details className="group rounded-lg border border-slate-200 bg-white p-4">
              <summary className="cursor-pointer list-none font-display text-base font-medium text-ink marker:content-none">
                Proposez-vous « {metier.term} » à {commune.name} ?
              </summary>
              <p className="mt-2 text-sm text-slate-600">
                Oui, nos agents {metier.categoryLabel} interviennent à {commune.name} et dans les communes voisines du secteur Services 34.
              </p>
            </details>
            <details className="group rounded-lg border border-slate-200 bg-white p-4">
              <summary className="cursor-pointer list-none font-display text-base font-medium text-ink marker:content-none">
                Comment obtenir un devis ?
              </summary>
              <p className="mt-2 text-sm text-slate-600">
                Décrivez votre besoin en quelques clics depuis notre page de demande, vous recevez une proposition avant toute intervention.
              </p>
            </details>
          </div>
        </section>

        <section className="mt-10 max-w-2xl">
          <h2 className="font-display text-base font-semibold text-ink">En savoir plus</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={metier.parentHref} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-ink hover:border-slate-300">
              {metier.term} — la prestation en détail
            </Link>
            <Link href={`/demande?categorie=${metier.category}`} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-ink hover:border-slate-300">
              Demander une intervention
            </Link>
          </div>
        </section>

        {otherMetiers.length > 0 && (
          <section className="mt-8 max-w-2xl">
            <h2 className="font-display text-base font-semibold text-ink">Autres services {metier.categoryLabel} à {commune.name}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {otherMetiers.map((m) => (
                <Link key={m.slug} href={`/${m.slug}/${commune.slug}`} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-ink hover:border-slate-300">
                  {m.term}
                </Link>
              ))}
            </div>
          </section>
        )}

        {otherCommunes.length > 0 && (
          <section className="mt-8 max-w-2xl">
            <h2 className="font-display text-base font-semibold text-ink">{metier.term}, aussi disponible dans ces communes</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {otherCommunes.map((c) => (
                <Link key={c.slug} href={`/${metier.slug}/${c.slug}`} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-ink hover:border-slate-300">
                  {c.name}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
