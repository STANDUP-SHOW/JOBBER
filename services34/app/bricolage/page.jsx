import ServiceCategoryPage from '../../components/ServiceCategoryPage';
import BrandSetter from '../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../lib/seo';

const title = 'Bricolage à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Montage de meubles, petites réparations, fixations murales, petits travaux d'électricité et de plomberie : nos agents bricoleurs interviennent chez vous dans le biterrois.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/bricolage` },
  openGraph: { title, description, url: `${SITE_URL}/bricolage`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function BricolagePage() {
  return (
    <>
    <BrandSetter category="bricolage" label="Bricolage" />
    <ServiceCategoryPage
      eyebrow="Bricolage"
      title="Un coup de main pour tous vos petits travaux"
      intro="Montage de meubles, fixations, petites réparations : nos agents interviennent rapidement à Béziers, Agde, Vias, Marseillan et alentours, avec leur propre outillage."
      guarantees={[
        { icon: '🧰', title: 'Des agents équipés', desc: "Nos agents se déplacent avec leur propre outillage professionnel — vous n'avez rien à fournir." },
        { icon: '📋', title: 'Un devis avant intervention', desc: "Le tarif est validé avant le début des travaux, sans mauvaise surprise sur la facture." },
        { icon: '🪪', title: 'Des agents de confiance', desc: "Chaque agent Services 34 est identifié et intervient au nom de l'entreprise, jamais en son nom propre." },
        { icon: '📍', title: 'Un service local', desc: "Nous intervenons exclusivement à Béziers, Agde, Vias, Marseillan et dans les communes du pourtour biterrois." },
      ]}
      tasks={[
        { name: 'Montage de meubles', href: '/bricolage/montage-de-meubles' },
        { name: 'Assemblage IKEA', href: '/bricolage/assemblage-ikea' },
        { name: "Fixation d'étagères", href: '/bricolage/fixation-etageres' },
        { name: 'Accrocher un tableau ou un miroir', href: '/bricolage/accrocher-tableau-miroir' },
        { name: 'Pose de tringles à rideaux', href: '/bricolage/pose-tringles-rideaux' },
        { name: 'Remplacer une porte ou une poignée', href: '/bricolage/remplacer-porte-poignee' },
        { name: 'Pose de crédence', href: '/bricolage/pose-credence' },
        { name: 'Peinture intérieure', href: '/bricolage/peinture-interieure' },
        { name: 'Pose de papier peint', href: '/bricolage/pose-papier-peint' },
        { name: 'Boucher un trou, enduire un mur', href: '/bricolage/boucher-trou-enduire-mur' },
        { name: "Petits travaux d'électricité", href: '/bricolage/petits-travaux-electricite' },
        { name: 'Petits travaux de plomberie', href: '/bricolage/petits-travaux-plomberie' },
        { name: 'Installation électroménager', href: '/bricolage/installation-electromenager' },
        { name: 'Serrurerie', href: '/bricolage/serrurerie' },
        { name: 'Isolation de porte ou fenêtre', href: '/bricolage/isolation-porte-fenetre' },
        { name: 'Petites réparations diverses', href: '/bricolage/petites-reparations' },
      ]}
      faq={[
        { q: 'Dans quelles communes intervenez-vous ?', a: "Nous intervenons à Béziers, Agde, Vias, Marseillan et dans toutes les communes situées dans un rayon d'environ 50 km autour de Béziers." },
        { q: "Dois-je fournir l'outillage ?", a: "Non, nos agents se déplacent avec leur propre matériel. Précisez simplement la nature des travaux lors de votre demande." },
        { q: 'Comment se passe la facturation ?', a: "Vous recevez un tarif avant intervention. Le paiement est géré directement avec Services 34, aucune démarche administrative de votre côté." },
      ]}
    />
    </>
  );
}
