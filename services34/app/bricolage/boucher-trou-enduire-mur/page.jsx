import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = 'Boucher un trou, enduire un mur à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Trous de chevilles, fissures légères ou mur à enduire avant peinture : nos agents remettent vos murs à neuf.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/bricolage/boucher-trou-enduire-mur` },
  openGraph: { title, description, url: `${SITE_URL}/bricolage/boucher-trou-enduire-mur`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function BoucherTrouEnduireMurPage() {
  return (
    <>
    <BrandSetter category="bricolage" label="Bricolage" />
    <PrestationDetailPage
      category="bricolage"
      categoryLabel="Bricolage"
      categoryHref="/bricolage"
      eyebrow="Bricolage"
      title="Boucher un trou, enduire un mur"
      intro="Avant une nouvelle couche de peinture ou simplement pour effacer les traces d'anciens meubles, nos agents rebouchent et lissent vos murs."
      sections={[
        {
          heading: 'Utile avant une remise en état ou un état des lieux',
          body: [
            "Trous de chevilles, petits impacts ou fissures superficielles : cette intervention prépare le mur pour une nouvelle peinture, ou simplement pour retrouver une surface propre — une prestation fréquente avant un état des lieux de sortie.",
          ],
        },
      ]}
      tips={[
        "Précisez le nombre de trous ou la surface concernée pour un devis adapté.",
        "Le temps de séchage de l'enduit doit être respecté avant toute peinture — l'agent peut vous conseiller sur le délai.",
      ]}
      faq={[
        { q: 'Pouvez-vous aussi repeindre après le rebouchage ?', a: "Oui, vous pouvez combiner cette prestation avec une peinture intérieure dans la même demande." },
        { q: 'Traitez-vous les fissures plus importantes ?', a: "Pour de petites fissures superficielles, oui. Pour des fissures structurelles, signalez-le : cela peut nécessiter une évaluation différente." },
      ]}
      related={[
        { label: '🔧 Retour à Bricolage', href: '/bricolage' },
        { label: 'Peinture intérieure', href: '/bricolage/peinture-interieure' },
        { label: 'Demander une intervention', href: '/demande' },
      ]}
    />
    </>
  );
}
