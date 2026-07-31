import Link from 'next/link';
import { SITE_URL, SITE_NAME } from '../../lib/seo';

const title = 'Jobber pour Entreprises et Corporates';
const description =
  "Découvrez comment fonctionnent les missions publiées par des entreprises et des partenaires Corporate sur Jobber+ : missions standard, GET Mission, et conditions pour y accéder.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/travailler-avec-les-entreprises` },
  openGraph: { title, description, url: `${SITE_URL}/travailler-avec-les-entreprises`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

const AUDIENCES = [
  {
    icon: '🏢',
    title: 'Entreprises',
    desc: "Des professionnels qui ont des besoins ponctuels dans leur établissement, pour des employés à la mission — tous secteurs de métiers confondus. Selon la mission, vous intervenez sans matériel requis, avec le matériel fourni par l'entreprise, ou avec votre propre matériel moyennant indemnisation.",
  },
  {
    icon: '🤝',
    title: 'Corporates',
    desc: "Des entreprises partenaires de Jobber+ qui vendent des prestations à leurs clients et sous-traitent leur réalisation à des jobbers de confiance via notre plateforme.",
    partners: ['services34.fr', 'batijob.fr', 'mecanoexpress.fr'],
  },
];

const MISSION_TYPES = [
  {
    label: 'Mission standard',
    desc: "Ponctuelle, récurrente sur plusieurs dates, ou sur plusieurs jours consécutifs. Vous fixez votre tarif — l'entreprise retient la meilleure offre parmi celles reçues.",
  },
  {
    label: 'GET Mission',
    highlight: true,
    desc: "L'entreprise a fixé tous les termes de la mission, y compris un tarif non négociable. Si vous cochez toutes les conditions requises (véhicule, matériel) et disposez des badges de fiabilité demandés, vous pouvez GET (« prendre ») la mission instantanément — premier arrivé, premier servi : la mission est pour vous.",
  },
];

const CONDITIONS = [
  ['🪪', 'Professionnel indépendant', "Numéro SIRET valide, en activité, vérifié par Jobber+ (badge « Jobber+ PRO »)."],
  ['📍', 'Géolocalisation active', "Activez votre position 10 minutes avant le début de la mission, et gardez-la active jusqu'à sa fin."],
  ['🏅', 'Badges de fiabilité', "Disposez des badges requis par l'entreprise ou le corporate pour candidater ou GET la mission."],
];

export default function TravaillerAvecLesEntreprisesPage() {
  return (
    <div>
      <section className="overflow-hidden rounded-lg border border-moss/20 bg-moss-light py-10 px-6 text-center md:px-12">
        <span className="rounded-full bg-moss px-3 py-1 text-xs font-bold uppercase tracking-wide text-paper">
          Missions Entreprises &amp; Corporate
        </span>
        <h1 className="mx-auto mt-4 max-w-2xl font-display text-4xl font-bold leading-[1.1] text-ink md:text-5xl">
          Jobber pour Entreprises et Corporates.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-ink">
          Des missions professionnelles, publiées par des établissements ou des partenaires Jobber+, avec des
          conditions et des garanties adaptées à leurs besoins.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/auth/register" className="rounded-md bg-moss px-6 py-3 font-medium text-paper hover:bg-moss-dark">
            Devenir Jobber
          </Link>
          <Link href="/missions" className="rounded-md border border-moss/30 bg-white px-6 py-3 font-medium text-moss hover:border-moss">
            Voir les missions disponibles
          </Link>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-center font-display text-2xl font-semibold text-ink">Entreprises et Corporates, quelle différence ?</h2>
        <div className="mx-auto mt-8 grid max-w-3xl gap-5 sm:grid-cols-2">
          {AUDIENCES.map((a) => (
            <div key={a.title} className="rounded-lg border border-slate-200 bg-white p-6">
              <span className="text-2xl">{a.icon}</span>
              <div className="mt-2 font-display text-lg font-semibold text-ink">{a.title}</div>
              <p className="mt-1 text-sm text-slate-500">{a.desc}</p>
              {a.partners && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {a.partners.map((p) => (
                    <span key={p} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-ink">
                      {p}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-center font-display text-2xl font-semibold text-ink">2 types de missions</h2>
        <div className="mx-auto mt-8 grid max-w-3xl gap-5 sm:grid-cols-2">
          {MISSION_TYPES.map((m) => (
            <div
              key={m.label}
              className={`rounded-lg border p-6 ${m.highlight ? 'border-moss bg-moss-light/40' : 'border-slate-200 bg-white'}`}
            >
              <div className="font-display text-lg font-semibold text-ink">{m.label}</div>
              <p className="mt-2 text-sm text-slate-600">{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 rounded-lg border border-slate-200 bg-white p-6 md:p-10">
        <span className="label-eyebrow text-moss">Prérequis</span>
        <h2 className="mt-2 font-display text-2xl font-semibold text-ink">Conditions pour travailler avec les entreprises</h2>
        <div className="mt-7 grid gap-5 sm:grid-cols-3">
          {CONDITIONS.map(([icon, name, desc]) => (
            <div key={name}>
              <span className="text-2xl">{icon}</span>
              <div className="mt-2 font-display text-base font-semibold text-ink">{name}</div>
              <p className="mt-1 text-sm text-slate-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 mb-4 rounded-lg bg-ink py-10 px-6 text-center text-white md:px-12">
        <h2 className="font-display text-2xl font-semibold">Prêt à travailler avec des entreprises ?</h2>
        <p className="mx-auto mt-2 max-w-xl text-white/80">
          Créez votre compte, renseignez votre numéro SIRET pour obtenir le badge Jobber+ PRO, et accédez aux
          missions publiées par les entreprises et nos partenaires Corporate.
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
