import { SITE_URL, SITE_NAME } from '../../lib/seo';

const title = 'Jobber en toute confiance';
const description = "Vérification d'identité, paiement sécurisé, avis vérifiés : découvrez les garanties qui protègent demandeurs et jobbers sur Jobber.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/confiance` },
  openGraph: { title, description, url: `${SITE_URL}/confiance`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

const GUARANTEES = [
  {
    icon: '🪪',
    title: "Des profils vérifiés",
    desc: "Tout jobber peut demander la vérification de son profil : pièce d'identité, justificatif de domicile et relevé d'identité bancaire sont contrôlés avant l'affichage du badge « ✓ Vérifié ». Les jobbers qui déclarent un statut professionnel doivent en plus fournir un numéro SIRET valide, affiché avec le badge « PRO ».",
  },
  {
    icon: '⭐',
    title: 'Des compétences et des avis authentiques',
    desc: "Chaque jobber ne peut candidater que dans les catégories où il a déclaré ses compétences. Après chaque mission, le demandeur laisse un avis public et une note, visibles sur le profil du jobber — impossible pour lui de les modifier.",
  },
  {
    icon: '🏅',
    title: 'Des jobbers reconnus, mission après mission',
    desc: "Des badges (Première mission, Jobber confirmé, Expert, Jobber de confiance, Multi-compétences) sont attribués automatiquement selon le nombre de missions réalisées et la qualité des avis reçus, pour vous aider à repérer les profils les plus fiables.",
  },
  {
    icon: '🔒',
    title: "L'argent en sécurité jusqu'à la fin de la mission",
    desc: "Dès la réservation, le montant de la mission est prélevé et bloqué en séquestre par notre prestataire de paiement Stripe. Il n'est versé au jobber qu'une fois le demandeur ait validé la bonne exécution de la mission.",
  },
  {
    icon: '💬',
    title: 'Une messagerie pour rester en contact',
    desc: "Une fois la mission réservée, demandeur et jobber peuvent échanger directement depuis la messagerie intégrée pour organiser l'intervention, sans avoir à partager leurs coordonnées personnelles.",
  },
  {
    icon: '📋',
    title: "Un crédit d'impôt de 50 % sur les services éligibles",
    desc: "Les prestations réalisées dans une catégorie de services à la personne (ménage, jardinage, garde d'enfants, bricolage, aide à domicile…) ouvrent droit à un crédit d'impôt. Consultez notre page dédiée pour simuler votre économie.",
  },
];

export default function ConfiancePage() {
  return (
    <div>
      <section className="overflow-hidden rounded-lg border border-moss/20 bg-moss-light py-10 px-6 text-center md:px-12">
        <span className="rounded-full bg-moss px-3 py-1 text-xs font-bold uppercase tracking-wide text-paper">
          Confiance et sécurité
        </span>
        <h1 className="mx-auto mt-4 max-w-2xl font-display text-4xl font-bold leading-[1.1] text-ink md:text-5xl">
          Le service à domicile, en toute sérénité.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-ink">
          Jobber, ce n'est pas qu'une simple mise en relation : c'est un ensemble de garanties concrètes qui
          protègent demandeurs et jobbers, du premier contact au paiement final.
        </p>
      </section>

      <section className="mt-16">
        <div className="grid gap-6 sm:grid-cols-2">
          {GUARANTEES.map((g) => (
            <div key={g.title} className="rounded-lg border border-slate-200 bg-white p-5">
              <span className="text-2xl">{g.icon}</span>
              <div className="mt-2 font-display text-lg font-semibold text-ink">{g.title}</div>
              <p className="mt-1 text-sm text-slate-500">{g.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
