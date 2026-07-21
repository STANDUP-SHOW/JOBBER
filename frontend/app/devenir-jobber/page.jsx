import Link from 'next/link';
import { SITE_URL, SITE_NAME } from '../../lib/seo';

const title = 'Bienvenue dans le Jobbing — Devenir Jobber';
const description =
  "Jobber, ce sont des missions variées toute l'année, sans lien avec un CDD, un CDI ou une mission d'intérim. Travaillez à votre rythme, devenez expert reconnu, et soyez payé le jour même.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/devenir-jobber` },
  openGraph: { title, description, url: `${SITE_URL}/devenir-jobber`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

const STEPS = [
  ['01', 'Choisissez vos missions', 'Des missions variées, publiées toute l\'année, dans vos domaines de compétence.'],
  ['02', 'Travaillez à votre rythme', 'Plus vous remplissez de missions, plus vous gagnez. Aucun engagement, aucun horaire imposé.'],
  ['03', 'Devenez un expert reconnu', 'Plus vous réussissez de missions, plus votre expérience parle pour vous — et plus les gens voudront vous faire travailler.'],
  ['04', 'Soyez payé le jour même', 'Terminez une mission aujourd\'hui, retrouvez votre argent sur votre compte Jobber ce soir.'],
];

export default function DevenirJobberPage() {
  return (
    <div>
      <section className="overflow-hidden rounded-lg border border-ochre/30 bg-ochre-light py-10 px-6 text-center md:px-12">
        <span className="rounded-full bg-ink px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
          Le Jobbing
        </span>
        <h1 className="mx-auto mt-4 max-w-2xl font-display text-4xl font-bold leading-[1.1] text-ink md:text-5xl">
          Bienvenue dans le Jobbing.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-ink">
          Des missions variées, toute l'année. <strong>Sans aucun lien avec une entreprise</strong> — pas de CDD, pas
          de CDI, pas de mission d'intérim. Ici, vous faites ce que vous savez faire de mieux, et vous êtes payé
          pour ça.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/auth/register" className="rounded-md bg-ink px-6 py-3 font-medium text-white hover:bg-ink/90">
            Devenir Jobber
          </Link>
          <Link href="/missions" className="rounded-md border border-ink/20 bg-white px-6 py-3 font-medium text-ink hover:border-ink">
            Voir les missions disponibles
          </Link>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-2xl text-center">
        <h2 className="font-display text-2xl font-semibold text-ink">Votre expérience parle pour vous</h2>
        <p className="mt-3 text-slate-600">
          Pas besoin de vous inscrire dans une agence d'intérim, ni d'envoyer votre CV. À votre rythme : plus vous
          travaillez, plus vous remplissez de missions, plus vous gagnez d'argent.
        </p>
      </section>

      <section className="mt-16">
        <h2 className="text-center font-display text-2xl font-semibold text-ink">Comment ça marche</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {STEPS.map(([n, heading, desc]) => (
            <div key={n} className="flex gap-4 rounded-lg border border-slate-200 bg-white p-5">
              <span className="font-display text-3xl text-ochre-dark">{n}</span>
              <div>
                <div className="font-display text-lg font-medium text-ink">{heading}</div>
                <p className="mt-1 text-sm text-slate-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 rounded-lg border border-ochre/30 bg-ochre-light p-6 md:p-10">
        <span className="label-eyebrow text-ochre-dark">La reconnaissance</span>
        <h2 className="mt-2 font-display text-2xl font-semibold text-ink">Le badge « Jobber de confiance »</h2>
        <p className="mt-2 max-w-2xl text-slate-700">
          Plus vous réussissez de missions, plus vous devenez un expert reconnu. Vos offres sont mises en avant,
          notamment sur les missions publiées par les entreprises qui recrutent en récurrent — un moyen simple de
          vous démarquer et de gagner en visibilité, mission après mission.
        </p>
      </section>

      <section className="mx-auto mt-16 max-w-2xl text-center">
        <h2 className="font-display text-2xl font-semibold text-ink">Devenez le collaborateur récurrent de plusieurs clients</h2>
        <p className="mt-3 text-slate-600">
          Particuliers ou entreprises, beaucoup de demandeurs cherchent à retravailler avec le même jobber de
          confiance. Toute la facturation est gérée par Jobber en interne : vous recevez directement vos factures
          de prestation, sans aucune démarche de votre côté.
        </p>
      </section>

      <section className="mt-16">
        <h2 className="text-center font-display text-2xl font-semibold text-ink">Paiement immédiat, fini le mois d'attente</h2>
        <div className="mx-auto mt-8 grid max-w-3xl gap-4 sm:grid-cols-3">
          {[
            ['💰', 'Crédité aussitôt', 'Dès que votre mission est validée et payée, l\'argent est crédité sur votre porte-monnaie Jobber.'],
            ['⚡', 'Virement à volonté', 'Déclenchez le virement vers votre compte bancaire en un clic, ou activez le virement automatique.'],
            ['🌙', 'Le soir même', 'Vous trouvez une mission, vous travaillez aujourd\'hui, vous avez l\'argent ce soir sur votre compte.'],
          ].map(([icon, title, desc]) => (
            <div key={title} className="rounded-lg border border-slate-200 bg-white p-5">
              <span className="text-2xl">{icon}</span>
              <div className="mt-2 font-display text-base font-semibold text-ink">{title}</div>
              <p className="mt-1 text-sm text-slate-500">{desc}</p>
            </div>
          ))}
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
