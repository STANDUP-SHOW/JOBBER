import Link from 'next/link';
import { SITE_URL, SITE_NAME } from '../../lib/seo';

const title = 'Plateforme Corporate — votre entreprise de services, pilotée en ligne';
const description =
  "Votre propre plateforme de services à la personne : un site optimisé pour le référencement local ville par ville, et un back-office complet pour piloter demandes, jobbers, devis et factures.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/plateforme-corporate` },
  openGraph: { title, description, url: `${SITE_URL}/plateforme-corporate`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

const EXAMPLE_PAGES = [
  { url: 'services34.fr/jardinage', query: 'jardinier à Vias' },
  { url: 'services34.fr/menage', query: 'femme de ménage à Colombiers' },
  { url: 'services34.fr/bricolage', query: 'bricoleur à Béziers' },
  { url: 'services34.fr/piscine', query: 'entretien piscine à Cers' },
];

const BACK_OFFICE_FEATURES = [
  { icon: '📥', title: 'Demandes reçues', desc: "Chaque demande soumise sur votre site arrive instantanément dans votre back-office, avec l'adresse, le besoin et les coordonnées du client." },
  { icon: '🚀', title: 'Publier sur Jobber ou traiter en agence', desc: "Pour chaque demande, un choix : la publier sur le réseau Jobber pour recevoir des offres de jobbers, ou la traiter vous-même en interne." },
  { icon: '📨', title: 'Offres Jobber', desc: "Les propositions des jobbers arrivent tarifées, prêtes à être acceptées ou refusées d'un clic." },
  { icon: '🧑‍🤝‍🧑', title: 'Employés actifs / off', desc: "Votre équipe de jobbers de confiance, embauchée directement, disponible pour vos missions traitées en agence." },
  { icon: '📅', title: 'Plannings', desc: "Affectez vos missions à un planning ou à un employé, visualisez qui intervient où et quand." },
  { icon: '📋', title: 'Missions en cours / terminées', desc: "Suivi complet, côté Jobber comme côté agence, jusqu'à la mission terminée." },
  { icon: '🧾', title: 'Factures', desc: "Facture agence et facture jobber générées automatiquement, prêtes pour votre comptabilité." },
  { icon: '👥', title: 'Membres inscrits', desc: "La liste de vos clients inscrits sur votre site, avec leur historique de demandes." },
  { icon: '💬', title: 'Messagerie & contact', desc: "Un formulaire de contact et une messagerie intégrée pour échanger avec vos clients." },
  { icon: '🗺️', title: 'Zone d’intervention', desc: "Définissez votre zone de chalandise — c'est elle qui détermine les communes ciblées par votre référencement." },
];

const AUTOPILOT_STEPS = [
  'Un client trouve votre site sur Google et fait une demande en ligne.',
  'Vous recevez la demande instantanément dans votre back-office.',
  'Le pilote automatique accepte la demande et la publie sur Jobber.',
  'Les jobbers répondent avec leurs offres.',
  'Le pilote applique automatiquement votre marge sur la meilleure offre reçue.',
  'Un devis client, margé, généré automatiquement à votre en-tête, part au format numérique.',
  'Le client accepte le devis en ligne.',
  'Paiement en ligne si souhaité — l’argent reste en séquestre jusqu’à la mission terminée.',
  'La mission est réalisée par le jobber sous-traitant : vous ne rencontrez ni le client, ni le jobber.',
  'Votre facture est générée automatiquement.',
];

export default function PlateformeCorporatePage() {
  return (
    <div>
      <section className="overflow-hidden rounded-lg border border-moss/20 bg-moss-light py-10 px-6 text-center md:px-12">
        <span className="rounded-full bg-moss px-3 py-1 text-xs font-bold uppercase tracking-wide text-paper">
          Plateforme Corporate
        </span>
        <h1 className="mx-auto mt-4 max-w-2xl font-display text-4xl font-bold leading-[1.1] text-ink md:text-5xl">
          Votre propre entreprise de services, pilotée en ligne.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-ink">
          Un site à votre marque, optimisé pour être trouvé partout dans votre secteur, couplé à un back-office complet
          pour piloter demandes, jobbers, devis et factures — sans quitter votre écran.
        </p>
      </section>

      <section className="mt-16">
        <span className="text-sm font-semibold uppercase tracking-wide text-moss">Le site SEO</span>
        <h2 className="mt-2 font-display text-2xl font-semibold text-ink">
          Un référencement local, ville par ville, métier par métier
        </h2>
        <p className="mt-3 max-w-2xl text-slate-600">
          Chaque métier proposé sur votre site (jardinage, ménage, bricolage, piscine…) obtient sa propre page,
          déclinée pour chacune des communes de votre zone d'action — jusqu'à 150 communes autour de vous. Résultat :
          votre site répond directement aux recherches Google de vos futurs clients, commune par commune.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {EXAMPLE_PAGES.map((p) => (
            <div key={p.url} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="font-mono text-sm text-moss-dark">{p.url}</div>
              <div className="mt-1 text-sm text-slate-500">
                Trouvé sur Google en cherchant « <span className="font-medium text-ink">{p.query}</span> »
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-lg bg-ink p-5 text-sm text-white">
          <p>
            <strong className="text-ochre">Nom de domaine adapté aux requêtes Google.</strong> Un nom de domaine
            comme services34.fr correspond directement à ce que tapent vos clients : le service recherché + votre
            département. Les URLs suivent la même logique — services34.fr/jardinage, services34.fr/menage — pour
            que chaque page réponde exactement à une recherche.
          </p>
        </div>
      </section>

      <section className="mt-16">
        <span className="text-sm font-semibold uppercase tracking-wide text-moss">Le back-office</span>
        <h2 className="mt-2 font-display text-2xl font-semibold text-ink">Tout votre business, dans un seul écran</h2>
        <p className="mt-3 max-w-2xl text-slate-600">
          Le même back-office que celui utilisé par nos propres partenaires Corporate (comme Services 34) — chaque
          demande, chaque jobber, chaque facture, centralisés et à jour en temps réel.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BACK_OFFICE_FEATURES.map((f) => (
            <div key={f.title} className="rounded-lg border border-slate-200 bg-white p-4">
              <span className="text-2xl">{f.icon}</span>
              <div className="mt-2 font-display text-base font-semibold text-ink">{f.title}</div>
              <p className="mt-1 text-sm text-slate-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 rounded-lg border-2 border-moss bg-white p-6 md:p-10">
        <span className="rounded-full bg-ochre px-3 py-1 text-xs font-bold uppercase tracking-wide text-ink">
          Prochainement
        </span>
        <h2 className="mt-4 font-display text-2xl font-semibold text-ink">Le pilote automatique</h2>
        <p className="mt-3 max-w-2xl text-slate-600">
          À venir : une fois activé, le pilote automatique prend en charge le cycle complet d'une demande — de sa
          réception sur votre site jusqu'à votre facture, sans intervention de votre part.
        </p>

        <ol className="mt-6 space-y-3">
          {AUTOPILOT_STEPS.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-moss text-xs font-bold text-white">
                {i + 1}
              </span>
              <span className="text-sm text-ink">{step}</span>
            </li>
          ))}
        </ol>

        <div className="mt-6 rounded-lg bg-moss-light p-5 text-sm text-ink">
          Voilà, c'est fait : vous êtes en vacances, mais votre entreprise travaille toute seule, pilotée par notre
          intelligence. Votre plateforme encaisse toute seule — il ne vous reste qu'à la faire connaître un maximum.
        </div>
      </section>

      <section className="mt-16 mb-4 rounded-lg bg-ink py-10 px-6 text-center text-white md:px-12">
        <h2 className="font-display text-2xl font-semibold">Prêt à lancer votre plateforme ?</h2>
        <p className="mx-auto mt-2 max-w-xl text-white/80">
          Discutons de votre secteur, de votre zone d'action et de votre nom de domaine.
        </p>
        <div className="mt-6">
          <Link href="/account/jobber-plus" className="rounded-md bg-white px-6 py-3 font-medium text-ink hover:bg-slate-100">
            Voir les tarifs
          </Link>
        </div>
      </section>
    </div>
  );
}
