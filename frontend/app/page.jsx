import Link from 'next/link';
import { API_URL } from '../lib/api';
import CategoryGrid from '../components/CategoryGrid';
import MissionCard from '../components/MissionCard';
import { SEO_CATEGORIES } from '../lib/seoCategories';
import { SEO_LESSON_CATEGORIES } from '../lib/seoLessonCategories';
import Logo from '../components/Logo';
import AudienceBlock from '../components/AudienceBlock';

async function getData() {
  try {
    const [catRes, missionsRes] = await Promise.all([
      fetch(`${API_URL}/api/categories`, { cache: 'no-store' }),
      fetch(`${API_URL}/api/missions?status=OPEN&type=TASK`, { cache: 'no-store' }),
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
      <section className="py-6 text-center">
        <div className="flex items-center justify-center gap-2">
          <Logo className="h-14 w-14 md:h-16 md:w-16" />
          <div className="font-display text-6xl font-bold tracking-tight text-moss md:text-7xl">
            Job<span className="text-ochre">b</span>er
          </div>
        </div>
        <span className="mt-4 block font-display text-base font-bold uppercase tracking-wide text-moss">L'humain au service de l'humain</span>
        <h1 className="mx-auto mt-3 max-w-2xl font-display text-4xl font-semibold leading-[1.1] text-ink md:text-5xl">
          Un coup de main de confiance, <span className="text-moss">à deux clics</span>.
        </h1>
      </section>

      <AudienceBlock
        eyebrow="Vous avez un besoin ?"
        title="Décrivez votre besoin, recevez des propositions en quelques minutes."
        description="Ménage, bricolage, jardinage, déménagement… Publiez votre mission et recevez des propositions de prestataires vérifiés près de chez vous."
        sectionClass="border border-slate-200 bg-white"
        eyebrowClass="text-moss"
        points={[
          { icon: '📝', title: 'Votre mission', desc: 'Catégorie, adresse, date souhaitée, durée estimée.' },
          { icon: '📊', title: 'Comparez les offres', desc: "En moins de 10 minutes : nulle part ailleurs vous n'aurez un devis aussi vite." },
          { icon: '🔒', title: 'Payez en sécurité', desc: "L'argent est bloqué en séquestre puis versé une fois le travail validé." },
        ]}
        buttons={[
          { href: '/missions/new', label: 'Publier un besoin', variant: 'moss' },
        ]}
      />

      <section className="mt-6 flex flex-col items-center gap-4 rounded-lg border-2 border-moss bg-moss-light px-6 py-6 text-center md:flex-row md:justify-between md:text-left">
        <div>
          <div className="font-display text-xl font-bold text-ink">Crédit d'impôt !</div>
          <p className="mt-1 text-sm text-ink">
            50 % de la prestation réalisée sur Jobber est remboursée par l'État.
          </p>
          <p className="mt-0.5 text-sm text-moss-dark">Voir les services éligibles au crédit d'impôt →</p>
        </div>
        <Link href="/credit-impot" className="shrink-0 rounded-md bg-moss px-5 py-3 font-medium text-paper hover:bg-moss-dark">
          En savoir plus
        </Link>
      </section>

      <AudienceBlock
        reverse
        eyebrow="Vous voulez jobber ?"
        title="Arrondissez vos fins de mois. Augmentez vos revenus."
        description={
          <>
            Jobbez à plein temps ou sur votre temps libre. Que vous soyez <strong>particulier ou travailleur indépendant</strong>,
            Jobber c'est des centaines de missions par semaine, près de chez vous.
          </>
        }
        sectionClass="bg-ochre"
        eyebrowClass="text-white"
        points={[
          { icon: '💶', title: 'Fixez votre tarif', desc: 'Vous répondez aux missions au prix que vous choisissez.' },
          { icon: '📅', title: 'Travaillez quand vous voulez', desc: 'À plein temps ou entre deux missions, selon votre disponibilité.' },
          { icon: '📍', title: 'Près de chez vous', desc: "Choisissez votre zone d'intervention et vos catégories de compétence." },
        ]}
        buttons={[
          { href: '/auth/register', label: 'Devenir Jobber', variant: 'primary' },
          { href: '/devenir-jobber', label: 'En savoir plus', variant: 'outline' },
        ]}
      />

      <AudienceBlock
        eyebrow="Vous voulez apprendre un métier pour Jobber ?"
        title="Apprenez avec un pro, on passe direct à la pratique."
        description="Vous souhaitez apprendre ? Bonne nouvelle ! Sur Jobber, vous apprenez avec un pro. Demandez des cours de jardinage, de ménage, d'électricité, de plomberie… nos jobbers viennent chez vous vous apprendre !"
        sectionClass="border border-purple-200 bg-purple-50"
        eyebrowClass="text-purple-700"
        points={[
          { icon: '🎓', title: 'Formation accessible à tous', desc: 'Accès à la formation professionnelle pour tous, sans démarches administratives.' },
          { icon: '⏰', title: 'À votre rythme', desc: 'Vous apprenez un métier à votre rythme, sur votre temps libre.' },
          { icon: '🤝', title: 'Partagez votre expérience', desc: 'Vous partagez votre expérience et transmettez vos valeurs.' },
        ]}
        buttons={[
          { href: '/lessons', label: 'Voir les leçons proposées', variant: 'purple' },
          { href: '/missions/new?type=lesson', label: 'Demander un cours', variant: 'purple-outline' },
        ]}
      />

      <section className="mt-16 rounded-lg border border-ink/10 bg-ink px-6 py-10 text-center md:px-10">
        <p className="mx-auto max-w-2xl font-display text-2xl font-semibold leading-snug text-white md:text-3xl">
          Avec Jobber, les tarifs sont transparents et identiques à toutes les missions. Jobber est la plateforme la
          moins chère en France pour les prestations de service.
        </p>
        <Link href="/frais" className="mt-6 inline-block rounded-md bg-white px-6 py-3 font-medium text-ink hover:bg-slate-100">
          Voir les tarifs
        </Link>
      </section>

      <AudienceBlock
        reverse
        eyebrow="Votre entreprise a des besoins de collaborateurs ?"
        title="Recrutez à la tâche. Oubliez l'intérim."
        description="Oubliez l'intérim, oubliez le CDD. Constituez-vous une horde de collaborateurs dans des domaines bien précis et gérez-les comme vos salariés grâce à Jobber+ : plannings, missions, employés, factures, tout est simplifié. Vous ne payez qu'une fois le travail effectué."
        sectionClass="border border-moss/20 bg-moss-light"
        eyebrowClass="text-moss-dark"
        points={[
          { icon: '📋', title: 'Recruter sans démarches administratives', desc: "Jobber s'occupe de tout." },
          { icon: '💶', title: 'Facturé à la prestation', desc: 'À l\'heure de travail effectif, sans perte.' },
          { icon: '🧘', title: 'Oubliez vos soucis de personnel', desc: 'Plus besoin de contrat, de congés payés, de pauses, d\'absences…' },
        ]}
        buttons={[
          { href: '/auth/register-entreprise', label: 'Ouvrir un compte entreprise', variant: 'moss' },
          { href: '/entreprises', label: 'En savoir plus', variant: 'outline' },
        ]}
      />

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

      <section className="mt-16">
        <h2 className="font-display text-2xl font-semibold text-ink">Nos cours, partout en France</h2>
        <p className="mt-1 text-sm text-slate-500">Apprenez en pratique avec un pro, directement chez vous.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {Object.entries(SEO_LESSON_CATEGORIES).map(([slug, s]) => (
            <Link
              key={slug}
              href={`/cours/${slug}`}
              className="rounded-full border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 hover:border-purple-400"
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
