import Link from 'next/link';
import { SITE_URL, SITE_NAME } from '../../lib/seo';

const title = "Intervention urgente à domicile — Services 34";
const description = "Une urgence à la maison ? Plomberie, électricité, jardin, ménage avant réception : un agent Services 34 intervient tout de suite, dans quelques heures ou sous 24h, à votre convenance.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/urgence` },
  openGraph: { title, description, url: `${SITE_URL}/urgence`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

const EXAMPLES = [
  ['🚰', 'Plomberie', 'Une fuite, un robinet cassé, une évacuation bouchée.'],
  ['⚡', 'Électricité', 'Une panne de courant, un disjoncteur qui saute en continu.'],
  ['🌱', 'Jardin', 'Une haie qui déborde avant la visite d\'un notaire ou d\'un acheteur.'],
  ['🔧', 'Bricolage', 'Une porte qui ne ferme plus, une réparation urgente avant un déménagement.'],
  ['🧹', 'Ménage avant réception', 'Un logement à remettre en état avant l\'arrivée d\'invités.'],
  ['🧹', 'Ménage après soirée', 'Un nettoyage complet le lendemain d\'une fête ou d\'un événement.'],
];

export default function UrgencePage() {
  return (
    <div>
      <section className="overflow-hidden rounded-lg bg-clay py-10 px-6 text-center text-white md:px-12">
        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-clay">
          Urgence
        </span>
        <h1 className="mx-auto mt-4 max-w-2xl font-display text-4xl font-bold leading-[1.1] md:text-5xl">
          Une urgence à la maison ? On s'en occupe tout de suite.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-white/90">
          Plomberie, électricité, jardin, bricolage, ménage avant ou après un événement : quel que soit le domaine,
          un agent Services 34 peut intervenir en priorité.
        </p>
        <div className="mt-7">
          <Link href="/demande" className="rounded-md bg-white px-6 py-3 font-medium text-clay hover:bg-white/90">
            Demander une intervention urgente
          </Link>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-center font-display text-2xl font-semibold text-ink">C'est vous qui décidez du délai</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-500">
          Dans votre demande, précisez le niveau d'urgence qui correspond à votre situation.
        </p>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-5 text-center">
            <div className="font-display text-lg font-semibold text-ink">Tout de suite</div>
            <p className="mt-1 text-sm text-slate-500">Un agent disponible à proximité se rend chez vous dans l'heure.</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 text-center">
            <div className="font-display text-lg font-semibold text-ink">Dans quelques heures</div>
            <p className="mt-1 text-sm text-slate-500">L'intervention est casée entre deux missions déjà prévues dans le secteur.</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 text-center">
            <div className="font-display text-lg font-semibold text-ink">Sous 24h</div>
            <p className="mt-1 text-sm text-slate-500">Votre demande est ajoutée en priorité au planning d'un agent pour le lendemain.</p>
          </div>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-center font-display text-2xl font-semibold text-ink">Comment ça marche</h2>
        <div className="mx-auto mt-8 max-w-2xl space-y-4">
          <div className="flex gap-4 rounded-lg border border-slate-200 bg-white p-5">
            <span className="font-display text-2xl text-clay">1</span>
            <div>
              <div className="font-display text-base font-medium text-ink">Vous cochez "Urgent" dans votre demande</div>
              <p className="mt-1 text-sm text-slate-500">Précisez le délai qui vous convient : tout de suite, dans quelques heures, ou sous 24h.</p>
            </div>
          </div>
          <div className="flex gap-4 rounded-lg border border-slate-200 bg-white p-5">
            <span className="font-display text-2xl text-clay">2</span>
            <div>
              <div className="font-display text-base font-medium text-ink">Nous identifions les agents disponibles sur votre secteur</div>
              <p className="mt-1 text-sm text-slate-500">Un agent déjà en déplacement entre deux missions peut souvent passer chez vous sans détour important.</p>
            </div>
          </div>
          <div className="flex gap-4 rounded-lg border border-slate-200 bg-white p-5">
            <span className="font-display text-2xl text-clay">3</span>
            <div>
              <div className="font-display text-base font-medium text-ink">Votre demande est ajoutée au planning de l'agent</div>
              <p className="mt-1 text-sm text-slate-500">Vous recevez une confirmation avec l'heure d'arrivée estimée, dans le délai choisi.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-center font-display text-2xl font-semibold text-ink">Une urgence, dans n'importe quel domaine</h2>
        <div className="mx-auto mt-8 grid max-w-3xl gap-4 sm:grid-cols-2">
          {EXAMPLES.map(([icon, title, desc]) => (
            <div key={title} className="flex gap-3 rounded-lg border border-slate-200 bg-white p-4">
              <span className="text-2xl">{icon}</span>
              <div>
                <div className="font-display text-base font-semibold text-ink">{title}</div>
                <p className="mt-1 text-sm text-slate-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 mb-4 rounded-lg bg-ink py-10 px-6 text-center text-white md:px-12">
        <h2 className="font-display text-2xl font-semibold">Une urgence maintenant ?</h2>
        <p className="mx-auto mt-2 max-w-xl text-white/80">
          Décrivez votre besoin, cochez "Urgent" et choisissez le délai qui vous convient.
        </p>
        <div className="mt-6">
          <Link href="/demande" className="rounded-md bg-white px-6 py-3 font-medium text-ink hover:bg-slate-100">
            Demander une intervention
          </Link>
        </div>
      </section>
    </div>
  );
}
