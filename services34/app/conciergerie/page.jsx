import ServiceCategoryPage from '../../components/ServiceCategoryPage';
import BrandSetter from '../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../lib/seo';

const title = 'Conciergerie à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Surveillance de résidence secondaire, accueil de locataires, remise de clés : nos agents veillent sur votre bien dans le biterrois et sur le littoral, toute l'année.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/conciergerie` },
  openGraph: { title, description, url: `${SITE_URL}/conciergerie`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function ConciergeriePage() {
  return (
    <>
    <BrandSetter category="conciergerie" label="Conciergerie" />
    <ServiceCategoryPage
      category="conciergerie"
      eyebrow="Conciergerie"
      title="Une présence de confiance quand vous n'êtes pas là"
      intro="Résidence secondaire ou location saisonnière : nos agents veillent sur votre bien, accueillent vos locataires et gèrent les imprévus à Béziers, Agde, Vias, Marseillan et alentours."
      guarantees={[
        { icon: '🏡', title: 'Gestion complète clé en main', desc: "Jardin, ménage, linge, accueil des voyageurs et entretien de la piscine : une seule formule pour ne plus rien gérer vous-même." },
        { icon: '🔑', title: 'Gestion des clés', desc: "Remise et récupération des clés, ouverture pour un artisan ou un livreur en votre absence." },
        { icon: '🏠', title: 'Surveillance régulière', desc: "Passages réguliers dans votre résidence secondaire pour vérifier que tout est en ordre." },
        { icon: '🧳', title: 'Accueil des locataires', desc: "Pour vos locations saisonnières : accueil des voyageurs, état des lieux d'entrée et de sortie." },
        { icon: '🔑', title: 'Des agents fiables et discrets', desc: "Chaque agent conciergerie est habitué à la gestion de résidences secondaires et intervient en toute discrétion, y compris en votre absence." },
      ]}
      tasks={[
        { name: 'Gestion complète (location saisonnière clé en main)', href: '/conciergerie/gestion-complete', icon: '🏡' },
        { name: 'Buanderie-Pressing', href: '/conciergerie/buanderie-pressing', icon: '👔' },
        { name: 'Surveillance de résidence secondaire pendant votre absence', href: '/conciergerie/surveillance-residence-secondaire', icon: '👁️' },
        { name: 'Remise et gestion des clés', href: '/conciergerie/remise-gestion-cles', icon: '🔑' },
        { name: 'Accueil des voyageurs (location saisonnière)', href: '/conciergerie/accueil-voyageurs', icon: '🧳' },
        { name: "État des lieux d'entrée et de sortie", href: '/conciergerie/etat-des-lieux-entree-sortie', icon: '📋' },
        { name: 'Réception de colis et de courrier', href: '/conciergerie/reception-colis-courrier', icon: '📬' },
        { name: 'Relevé de compteurs (eau, électricité)', href: '/conciergerie/releve-compteurs', icon: '🔢' },
        { name: "Ouverture pour un artisan ou un prestataire", href: '/conciergerie/ouverture-artisan-prestataire', icon: '🚪' },
        { name: 'Coordination de petits travaux en votre absence', href: '/conciergerie/coordination-petits-travaux', icon: '🛠️' },
        { name: 'Aération et entretien courant entre deux séjours', href: '/conciergerie/aeration-entretien-entre-sejours', icon: '🌬️' },
      ]}
      faq={[
        { q: 'Proposez-vous un forfait pour les locations saisonnières ?', a: "Chaque demande de conciergerie est traitée au cas par cas selon la fréquence des séjours et les prestations souhaitées (accueil, ménage, état des lieux). Décrivez votre besoin, nous vous recontactons rapidement." },
        { q: 'Puis-je demander une simple surveillance ponctuelle ?', a: "Oui, un passage ponctuel pour vérifier votre résidence secondaire pendant votre absence est tout à fait possible." },
        { q: 'Gérez-vous la remise des clés à mes locataires ?', a: "Oui, nos agents peuvent accueillir vos locataires, leur remettre les clés et réaliser l'état des lieux d'entrée." },
      ]}
    />
    </>
  );
}
