import Link from 'next/link';
import { SITE_URL, SITE_NAME } from '../../lib/seo';

const title = 'Recrutez à la tâche, pas à durée déterminée — Jobber Entreprise';
const description =
  "Oubliez l'intérim et le CDD : constituez votre équipe de collaborateurs à la tâche et gérez-la comme vos salariés grâce à Jobber+. Vous ne payez qu'une fois le travail effectué, sans charges ni frais fixes.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/entreprises` },
  openGraph: { title, description, url: `${SITE_URL}/entreprises`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

const STEPS = [
  ['01', 'Publiez vos besoins', 'Décrivez la mission, la compétence recherchée et la date — comme vous le feriez pour un intérimaire, mais sans agence.'],
  ['02', 'Constituez votre horde de collaborateurs', 'Comparez les profils, choisissez vos jobbers dans des domaines bien précis et faites-en votre équipe de confiance.'],
  ['03', 'Gérez-les comme vos salariés', 'Grâce à Jobber+ : plannings, missions, employés, factures — tout est centralisé et simplifié.'],
  ['04', 'Payez une fois le travail effectué', "Aucune avance, aucun engagement. Vous réglez la mission seulement quand elle est terminée et validée."],
];

const PILLARS = [
  ['📅', 'Plannings', 'Visualisez qui intervient, où et quand, sans jongler entre plusieurs outils.'],
  ['📝', 'Missions', 'Publiez, suivez et clôturez vos missions en quelques clics.'],
  ['🧑‍🤝‍🧑', 'Employés', 'Retrouvez tous vos collaborateurs habituels et leurs domaines de compétence.'],
  ['🧾', 'Factures', 'Une facture générée automatiquement à chaque prestation payée — prête pour votre comptabilité.'],
];

const COMPARISON = [
  ['Charges sociales et cotisations', 'À votre charge sur toute la durée du contrat', 'Aucune — vous incluez le coût dans votre devis'],
  ['Engagement', "Contrat sur une durée, même si le besoin est ponctuel", "À la tâche, sans aucun engagement"],
  ['Gestion RH', 'Contrats, fiches de paie, agences d\'intérim', 'Centralisée dans Jobber+'],
  ['Paiement', "D'avance ou au mois, que le travail soit fini ou non", "Uniquement une fois la mission terminée et validée"],
  ['Frais d\'agence', 'Commission d\'intérim en plus du salaire', 'Frais fixes et transparents, inclus à la mission'],
];

const PLANS = [
  { name: 'Sans abonnement', price: null, detail: '10 € de frais par mission — gratuit pour le jobber' },
  { name: 'Entreprise 20', price: '49,90 €', detail: '20 missions par mois sans frais' },
  { name: 'Entreprise 50', price: '99,90 €', detail: '50 missions par mois sans frais' },
  { name: 'Entreprise Illimité', price: '149,90 €', detail: 'Missions illimitées, 0 frais' },
];

export default function EntreprisesPage() {
  return (
    <div>
      <section className="overflow-hidden rounded-lg border border-moss/20 bg-moss-light py-10 px-6 text-center md:px-12">
        <span className="rounded-full bg-moss px-3 py-1 text-xs font-bold uppercase tracking-wide text-paper">
          Nouveau · Espace Entreprise
        </span>
        <h1 className="mx-auto mt-4 max-w-2xl font-display text-4xl font-bold leading-[1.1] text-ink md:text-5xl">
          La nouvelle façon de recruter.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-ink">
          Oubliez l'intérim, oubliez le CDD. <strong>Recrutez à la tâche, ni plus ni moins.</strong>
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/auth/register" className="rounded-md bg-moss px-6 py-3 font-medium text-paper hover:bg-moss-dark">
            Créer un compte entreprise
          </Link>
          <Link href="/missions/new" className="rounded-md border border-moss/30 bg-white px-6 py-3 font-medium text-moss hover:border-moss">
            Publier un premier besoin
          </Link>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-2xl text-center">
        <h2 className="font-display text-2xl font-semibold text-ink">Un CDD vous engage. Une mission vous libère.</h2>
        <p className="mt-3 text-slate-600">
          Un contrat d'intérim ou un CDD vous engage sur la durée, avec des charges, des frais fixes et une gestion
          RH lourde — même quand le besoin est ponctuel. Jobber renverse le modèle : vous ne payez que le travail
          réellement effectué, et plus aucun frais de personnel à porter entre deux missions.
        </p>
      </section>

      <section className="mt-16">
        <h2 className="text-center font-display text-2xl font-semibold text-ink">Comment ça marche</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {STEPS.map(([n, heading, desc]) => (
            <div key={n} className="flex gap-4 rounded-lg border border-slate-200 bg-white p-5">
              <span className="font-display text-3xl text-moss">{n}</span>
              <div>
                <div className="font-display text-lg font-medium text-ink">{heading}</div>
                <p className="mt-1 text-sm text-slate-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 rounded-lg border border-moss/20 bg-moss-light p-6 md:p-10">
        <span className="label-eyebrow text-moss">L'application</span>
        <h2 className="mt-2 font-display text-2xl font-semibold text-ink">Jobber+ : votre équipe à la tâche, tout simplifié</h2>
        <p className="mt-2 max-w-2xl text-slate-600">
          Constituez-vous une horde de collaborateurs dans des domaines bien précis et gérez-les comme vos salariés,
          sans quitter Jobber+.
        </p>
        <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map(([icon, name, desc]) => (
            <div key={name} className="rounded-lg bg-white p-5">
              <span className="text-2xl">{icon}</span>
              <div className="mt-2 font-display text-base font-semibold text-ink">{name}</div>
              <p className="mt-1 text-sm text-slate-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-center font-display text-2xl font-semibold text-ink">Intérim / CDD, ou Jobber Entreprise ?</h2>
        <div className="mt-8 overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="p-4 font-medium text-slate-500"> </th>
                <th className="p-4 font-medium text-slate-500">Intérim / CDD</th>
                <th className="p-4 font-medium text-moss-dark">Jobber Entreprise</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map(([label, before, after]) => (
                <tr key={label} className="border-t border-slate-100">
                  <td className="p-4 font-medium text-ink">{label}</td>
                  <td className="p-4 text-slate-500">{before}</td>
                  <td className="p-4 font-medium text-ink">{after}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-center font-display text-2xl font-semibold text-ink">Plus de charges, plus de frais fixes de personnel</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
          Vous recrutez à la tâche et incluez ces frais directement dans votre prestation. Choisissez la formule
          adaptée au volume de missions que vous publiez chaque mois.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => (
            <div key={plan.name} className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="font-display text-lg font-semibold text-ink">{plan.name}</div>
              {plan.price && (
                <div className="mt-1">
                  <span className="font-display text-2xl font-bold text-ink">{plan.price}</span>
                  <span className="text-sm text-slate-400"> / mois</span>
                </div>
              )}
              <p className="mt-2 text-sm text-slate-500">{plan.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 mb-4 rounded-lg bg-moss py-10 px-6 text-center text-paper md:px-12">
        <h2 className="font-display text-2xl font-semibold">Prêt à changer votre façon de recruter ?</h2>
        <p className="mx-auto mt-2 max-w-xl text-paper/80">
          Créez votre compte entreprise en quelques minutes et publiez votre première mission dès aujourd'hui.
        </p>
        <div className="mt-6">
          <Link href="/auth/register" className="rounded-md bg-white px-6 py-3 font-medium text-moss hover:bg-slate-100">
            Créer un compte entreprise
          </Link>
        </div>
      </section>
    </div>
  );
}
