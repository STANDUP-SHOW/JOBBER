import Link from 'next/link';
import { SITE_URL, SITE_NAME } from '../../lib/seo';

const title = 'Guide du Jobbing : définition, statuts et comment bien démarrer';
const description =
  "Qu'est-ce que le jobbing, qui peut devenir jobber, et comment s'y prendre ? Un guide complet, avec les statuts compatibles (micro-entrepreneur, salarié, étudiant) et les étapes pour bien démarrer sur Jobber+.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/guide-du-jobbing` },
  openGraph: { title, description, url: `${SITE_URL}/guide-du-jobbing`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

const ELIGIBLE = [
  'Salarié en poste', 'Chercheur d\'emploi', 'Étudiant', 'Retraité', 'Auto-entrepreneur', 'Fonctionnaire',
];

const STEPS = [
  {
    n: '01',
    title: 'Choisir la bonne plateforme',
    desc: "Selon votre zone d'intervention, le type de missions recherchées, et les conditions de travail proposées.",
    onJobber: "Sur Jobber, vous définissez votre zone d'intervention et vos catégories de compétences dès l'inscription — les missions correspondantes vous sont proposées automatiquement.",
  },
  {
    n: '02',
    title: 'Définir ses compétences',
    desc: 'Aucune qualification formelle requise pour la plupart des missions.',
    onJobber: "Cochez vos domaines de compétence et le niveau qui vous correspond (Passionné, Expert, Professionnel) — ajoutez votre SIRET pour le niveau Professionnel.",
  },
  {
    n: '03',
    title: 'Créer un profil détaillé',
    desc: 'Mettez en avant vos compétences et actualisez régulièrement votre profil.',
    onJobber: "Votre profil Jobber affiche vos avis, votre note moyenne et vos badges de confiance, mission après mission.",
  },
];

const ACTIVITIES = [
  ['Bricolage', 'bricolage'],
  ["Garde d'animaux", 'garde-animaux'],
  ['Informatique', 'informatique'],
  ["Garde d'enfants", 'garde-enfants'],
  ['Ménage', 'menage'],
  ['Cours particuliers', 'cours-particuliers'],
  ['Déménagement', 'demenagement'],
];

export default function GuideDuJobbingPage() {
  return (
    <div>
      <section className="overflow-hidden rounded-lg border border-ochre/30 bg-ochre-light py-10 px-6 text-center md:px-12">
        <span className="rounded-full bg-ink px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
          Guide du Jobbing
        </span>
        <h1 className="mx-auto mt-4 max-w-2xl font-display text-4xl font-bold leading-[1.1] text-ink md:text-5xl">
          Le jobbing en France, expliqué simplement.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-ink">
          Définition, statuts compatibles, et les 3 étapes pour bien démarrer.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/auth/register" className="rounded-md bg-ink px-6 py-3 font-medium text-white hover:bg-ink/90">
            Devenir Jobber
          </Link>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-2xl">
        <h2 className="text-center font-display text-2xl font-semibold text-ink">Qu'est-ce que le jobbing ?</h2>
        <p className="mt-4 text-slate-600">
          Le jobbing est un modèle de travail né aux États-Unis : des plateformes en ligne mettent en relation des
          personnes disponibles pour des missions ponctuelles avec des particuliers ou des entreprises qui ont un
          besoin précis à combler.{' '}
          <a
            href="https://fr.indeed.com/conseils-carrieres/trouver-un-emploi/devenir-jobber-completer-salaire"
            target="_blank" rel="noopener noreferrer nofollow"
            className="text-moss hover:underline"
          >
            (source : indeed.com)
          </a>
        </p>
        <p className="mt-4 text-slate-600">
          Contrairement à un contrat classique, le jobber choisit librement les missions qui l'intéressent, à son
          rythme — sans lien de subordination avec un employeur unique.
        </p>
      </section>

      <section className="mt-16">
        <h2 className="text-center font-display text-2xl font-semibold text-ink">Qui peut devenir jobber ?</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-slate-500">
          Aucun statut particulier n'est exigé au départ — le jobbing est ouvert à tous.
        </p>
        <div className="mx-auto mt-6 flex max-w-2xl flex-wrap justify-center gap-2">
          {ELIGIBLE.map((label) => (
            <span key={label} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-ink">
              {label}
            </span>
          ))}
        </div>
        <p className="mx-auto mt-4 max-w-xl text-center text-xs text-slate-400">
          Les auto-entrepreneurs et les fonctionnaires peuvent également jobber en complément de leur activité
          principale.
        </p>
      </section>

      <section className="mt-16">
        <h2 className="text-center font-display text-2xl font-semibold text-ink">3 étapes pour bien démarrer</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-1 lg:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-lg border border-slate-200 bg-white p-5">
              <span className="font-display text-3xl text-ochre-dark">{s.n}</span>
              <div className="mt-2 font-display text-lg font-medium text-ink">{s.title}</div>
              <p className="mt-1 text-sm text-slate-500">{s.desc}</p>
              <p className="mt-3 rounded-md bg-moss-light px-3 py-2 text-sm text-moss-dark">{s.onJobber}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-2xl text-center">
        <h2 className="font-display text-2xl font-semibold text-ink">Vos revenus doivent être déclarés</h2>
        <p className="mt-3 text-slate-600">
          Comme tout revenu, l'argent gagné en jobbing doit être déclaré aux impôts.{' '}
          <a
            href="https://fr.indeed.com/conseils-carrieres/trouver-un-emploi/devenir-jobber-completer-salaire"
            target="_blank" rel="noopener noreferrer nofollow"
            className="text-moss hover:underline"
          >
            (source : indeed.com)
          </a>{' '}
          Sur Jobber, chaque mission payée génère une facture qui facilite votre déclaration.
        </p>
      </section>

      <section className="mt-16">
        <h2 className="text-center font-display text-2xl font-semibold text-ink">Exemples de missions jobbing</h2>
        <div className="mx-auto mt-6 flex max-w-2xl flex-wrap justify-center gap-2">
          {ACTIVITIES.map(([label, slug]) => (
            <Link
              key={slug}
              href={`/services/${slug}`}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-ink hover:border-moss hover:text-moss-dark"
            >
              {label}
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-xl">
        <h2 className="text-center font-display text-lg font-semibold text-ink">Source</h2>
        <div className="mt-4 text-center text-sm text-slate-500">
          <a
            href="https://fr.indeed.com/conseils-carrieres/trouver-un-emploi/devenir-jobber-completer-salaire"
            target="_blank" rel="noopener noreferrer nofollow"
            className="hover:text-moss hover:underline"
          >
            indeed.com — Devenir jobber pour compléter son salaire
          </a>
        </div>
      </section>

      <section className="mt-16 mb-4 rounded-lg bg-ink py-10 px-6 text-center text-white md:px-12">
        <h2 className="font-display text-2xl font-semibold">Prêt à commencer le Jobbing ?</h2>
        <p className="mx-auto mt-2 max-w-xl text-white/80">
          Créez votre compte en quelques minutes et postulez à votre première mission dès aujourd'hui.
        </p>
        <div className="mt-6">
          <Link href="/auth/register" className="rounded-md bg-white px-6 py-3 font-medium text-ink hover:bg-slate-100">
            Devenir Jobber
          </Link>
        </div>
      </section>
    </div>
  );
}
