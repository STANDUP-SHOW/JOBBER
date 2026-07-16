import Link from 'next/link';
import { API_URL } from '../lib/api';
import CategoryGrid from '../components/CategoryGrid';
import MissionCard from '../components/MissionCard';
import { SEO_CATEGORIES } from '../lib/seoCategories';

async function getData() {
  try {
    const [catRes, missionsRes] = await Promise.all([
      fetch(`${API_URL}/api/categories`, { cache: 'no-store' }),
      fetch(`${API_URL}/api/missions?status=OPEN`, { cache: 'no-store' }),
    ]);
    const categories = catRes.ok ? (await catRes.json()).categories : [];
    const missions = missionsRes.ok ? (await missionsRes.json()).missions : [];
    return { categories, missions: missions.slice(0, 6) };
  } catch {
    return { categories: [], missions: [] };
  }
}

export default async function HomePage() {
  const { categories, missions } = await getData();

  return (
    <div>
      <section className="grid items-center gap-10 py-6 md:grid-cols-2">
        <div>
          <div className="font-display text-6xl font-bold tracking-tight text-moss md:text-7xl">
            Job<span className="text-ochre">b</span>er
          </div>
          <span className="mt-4 block label-eyebrow text-moss">Service à domicile, pour tout, pour tous</span>
          <h1 className="mt-3 font-display text-5xl font-semibold leading-[1.05] text-ink">
            Un coup de main de confiance, <span className="text-moss">à deux clics</span>.
          </h1>
          <p className="mt-4 max-w-md text-slate-600">
            Décrivez votre besoin, recevez des propositions de prestataires vérifiés près de chez vous, et payez en
            toute sécurité une fois la mission terminée.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/missions/new" className="rounded-md bg-moss px-5 py-3 font-medium text-paper hover:bg-moss-dark">
              Publier un besoin
            </Link>
            <Link href="/auth/register" className="rounded-md border border-slate-200 px-5 py-3 font-medium text-ink hover:border-moss hover:text-moss-dark">
              Devenir prestataire
            </Link>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <span className="label-eyebrow text-ochre-dark">Comment ça marche</span>
          <ol className="mt-4 space-y-4">
            {[
              ['01', 'Décrivez votre mission', 'Catégorie, adresse, date souhaitée, durée estimée.'],
              ['02', 'Comparez les offres', 'Les prestataires postulent avec leur tarif horaire.'],
              ['03', 'Payez en sécurité', "L'argent est bloqué en séquestre puis versé une fois le travail validé."],
            ].map(([n, title, desc]) => (
              <li key={n} className="flex gap-4">
                <span className="font-display text-2xl text-moss">{n}</span>
                <div>
                  <div className="font-medium text-ink">{title}</div>
                  <div className="text-sm text-slate-500">{desc}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="font-display text-2xl font-semibold text-ink">Toutes les catégories</h2>
        <div className="mt-5">
          <CategoryGrid categories={categories} />
        </div>
      </section>

      <section className="mt-16">
        <h2 className="font-display text-2xl font-semibold text-ink">Nos services, partout en France</h2>
        <p className="mt-1 text-sm text-slate-500">Trouvez le bon professionnel près de chez vous, quel que soit votre besoin.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {Object.entries(SEO_CATEGORIES).map(([slug, s]) => (
            <Link
              key={slug}
              href={`/services/${slug}`}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-ink hover:border-moss hover:text-moss-dark"
            >
              {s.title}
            </Link>
          ))}
        </div>
      </section>

      {missions.length > 0 && (
        <section className="mt-16">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-semibold text-ink">Missions ouvertes récemment</h2>
            <Link href="/missions/new" className="text-sm font-medium text-moss hover:underline">Publier la mienne →</Link>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {missions.map((m) => <MissionCard key={m.id} mission={m} />)}
          </div>
        </section>
      )}
    </div>
  );
}
