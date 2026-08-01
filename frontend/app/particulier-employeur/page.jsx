import Link from 'next/link';
import { SITE_URL, SITE_NAME } from '../../lib/seo';

const title = 'Particulier employeur : obligations, aides, et comment Jobber simplifie tout';
const description =
  "Dès que vous embauchez directement à domicile, vous devenez particulier employeur. Découvrez vos obligations, les aides fiscales disponibles, et ce que Jobber prend en charge à votre place.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/particulier-employeur` },
  openGraph: { title, description, url: `${SITE_URL}/particulier-employeur`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

const OBLIGATIONS = [
  {
    title: "Déclarer l'embauche à l'Urssaf",
    desc: "Au plus tôt 8 jours avant et au plus tard la veille du premier jour de travail.",
    source: { label: 'ameli.fr', href: 'https://www.ameli.fr' },
  },
  {
    title: "Vérifier l'identité du salarié",
    desc: "Et son titre de séjour s'il est étranger.",
    source: { label: 'service-public.fr', href: 'https://www.service-public.fr/particuliers/vosdroits/F1692' },
  },
  {
    title: 'Rédiger un contrat de travail',
    desc: 'Et établir un bulletin de salaire à chaque paie.',
  },
  {
    title: 'Déclarer et payer les cotisations sociales',
    desc: 'Généralement via le Cesu déclaratif ou Pajemploi pour la garde d\'enfants.',
    source: { label: 'urssaf.fr', href: 'https://www.urssaf.fr' },
  },
  {
    title: 'Faire suivre une visite médicale',
    desc: "Au salarié si l'emploi est à temps plein.",
    source: { label: 'ameli.fr', href: 'https://www.ameli.fr' },
  },
];

const SERVICES = [
  ['Aide à domicile', 'aide-personne'],
  ['Ménage', 'menage'],
  ['Jardinage', 'jardinage'],
  ['Garde d\'enfants', 'garde-enfants'],
  ['Bricolage', 'bricolage'],
  ['Cours particuliers', 'cours-particuliers'],
];

const AIDES = [
  { title: "Crédit d'impôt de 50 %", desc: 'Sur vos dépenses annuelles de services à la personne.', href: 'https://www.urssaf.fr' },
  { title: 'Exonérations de cotisations', desc: 'Selon votre âge ou votre état de santé.', href: 'https://www.urssaf.fr' },
  { title: 'La prestation CMG', desc: "De la CAF ou de la MSA, pour la garde d'un enfant de moins de 6 ans.", href: 'https://www.urssaf.fr' },
];

const SOURCES = [
  ['service-public.fr', 'https://www.service-public.fr'],
  ['ameli.fr', 'https://www.ameli.fr'],
  ['urssaf.fr', 'https://www.urssaf.fr'],
  ['legalstart.fr', 'https://www.legalstart.fr/fiches-pratiques/particulier-employeur/particulier-employeur/'],
  ['franceemploidomicile.fr', 'https://www.franceemploidomicile.fr'],
];

export default function ParticulierEmployeurPage() {
  return (
    <div>
      <section className="overflow-hidden rounded-lg border border-moss/20 bg-moss-light py-10 px-6 text-center md:px-12">
        <span className="rounded-full bg-moss px-3 py-1 text-xs font-bold uppercase tracking-wide text-paper">
          Particulier employeur
        </span>
        <h1 className="mx-auto mt-4 max-w-2xl font-display text-4xl font-bold leading-[1.1] text-ink md:text-5xl">
          Employer quelqu'un chez vous, sans les démarches.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-ink">
          Dès que vous embauchez directement à domicile, vous devenez légalement « particulier employeur ». Avec
          Jobber, on s'occupe de tout : vous gardez la simplicité, sans les obligations administratives.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/missions/new" className="rounded-md bg-moss px-6 py-3 font-medium text-paper hover:bg-moss-dark">
            Publier un besoin
          </Link>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-2xl">
        <h2 className="text-center font-display text-2xl font-semibold text-ink">Le statut de particulier employeur</h2>
        <p className="mt-4 text-slate-600">
          Dès que vous embauchez directement une personne pour intervenir chez vous — ménage, jardinage, garde
          d'enfants — vous devenez juridiquement « particulier employeur ». Ce statut vous impose plusieurs
          obligations avant même le début de la mission.
        </p>
        <ul className="mt-6 space-y-4">
          {OBLIGATIONS.map((o) => (
            <li key={o.title} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="font-display text-base font-semibold text-ink">{o.title}</div>
              <p className="mt-1 text-sm text-slate-500">
                {o.desc}
                {o.source && (
                  <>
                    {' '}
                    <a href={o.source.href} target="_blank" rel="noopener noreferrer nofollow" className="text-moss hover:underline">
                      (source : {o.source.label})
                    </a>
                  </>
                )}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-16 rounded-lg border border-moss/30 bg-moss-light p-6 md:p-10">
        <span className="label-eyebrow text-moss-dark">Avec Jobber</span>
        <h2 className="mt-2 font-display text-2xl font-semibold text-ink">On s'occupe de tout à votre place</h2>
        <p className="mt-3 max-w-2xl text-ink">
          Sur Jobber, vous restez libre de choisir votre jobber et de convenir du tarif — mais c'est Jobber qui gère
          la déclaration, le calcul et le prélèvement des charges sociales, et la facturation. Vous ne réglez que le
          prix convenu, mission après mission, sans démarche Urssaf, sans bulletin de salaire à établir vous-même.
        </p>
        <Link href="/missions/new" className="mt-5 inline-block rounded-md bg-moss px-6 py-3 font-medium text-paper hover:bg-moss-dark">
          Publier un besoin
        </Link>
      </section>

      <section className="mt-16">
        <h2 className="text-center font-display text-2xl font-semibold text-ink">Quels types de services ?</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-slate-500">
          Les services à la personne couvrent un large éventail d'activités du quotidien.
        </p>
        <div className="mx-auto mt-6 flex max-w-2xl flex-wrap justify-center gap-2">
          {SERVICES.map(([label, slug]) => (
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

      <section className="mt-16">
        <h2 className="text-center font-display text-2xl font-semibold text-ink">Avantages fiscaux et aides</h2>
        <div className="mx-auto mt-8 grid max-w-3xl gap-4 sm:grid-cols-3">
          {AIDES.map((a) => (
            <div key={a.title} className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="font-display text-base font-semibold text-ink">{a.title}</div>
              <p className="mt-1 text-sm text-slate-500">{a.desc}</p>
              <a href={a.href} target="_blank" rel="noopener noreferrer nofollow" className="mt-2 inline-block text-xs text-moss hover:underline">
                Source : urssaf.fr
              </a>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-6 max-w-xl text-center text-sm text-slate-500">
          Sur Jobber, le crédit d'impôt de 50 % s'applique directement sur vos missions éligibles.{' '}
          <Link href="/credit-impot" className="font-medium text-moss hover:underline">Simulez votre économie →</Link>
        </p>
      </section>

      <section className="mx-auto mt-16 max-w-2xl">
        <h2 className="text-center font-display text-lg font-semibold text-ink">Sources</h2>
        <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-slate-500">
          {SOURCES.map(([label, href]) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer nofollow" className="hover:text-moss hover:underline">
              {label}
            </a>
          ))}
        </div>
      </section>

      <section className="mt-16 mb-4 rounded-lg bg-moss py-10 px-6 text-center text-paper md:px-12">
        <h2 className="font-display text-2xl font-semibold">Publiez votre premier besoin</h2>
        <p className="mx-auto mt-2 max-w-xl text-paper/80">
          Décrivez votre mission, comparez les offres, et laissez Jobber gérer le reste.
        </p>
        <div className="mt-6">
          <Link href="/missions/new" className="rounded-md bg-white px-6 py-3 font-medium text-moss hover:bg-slate-100">
            Publier un besoin
          </Link>
        </div>
      </section>
    </div>
  );
}
