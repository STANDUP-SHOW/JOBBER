import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = 'Réparation de fissures ou de carrelage à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Fissure sur le bassin ou carrelage descellé : nos agents réparent avant que le problème ne s'aggrave et n'entraîne une fuite.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/piscine/reparation-fissures-carrelage` },
  openGraph: { title, description, url: `${SITE_URL}/piscine/reparation-fissures-carrelage`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function ReparationFissuresCarrelagePage() {
  return (
    <>
    <BrandSetter category="piscine" label="Piscine" />
    <PrestationDetailPage
      category="piscine"
      categoryLabel="Piscine"
      categoryHref="/piscine"
      eyebrow="Piscine"
      title="Réparation de fissures ou de carrelage"
      intro="Une fissure sur le bassin ou un carrelage descellé n'est jamais anodin : cela peut entraîner une perte d'eau progressive. Nos agents réparent avant que le problème ne s'aggrave."
      sections={[
        {
          heading: 'Une réparation qui évite les fuites',
          body: [
            "Les petites fissures superficielles se traitent avec un mastic ou un enduit adapté au contact de l'eau. Un carrelage descellé est reposé avec un joint et un mortier résistants à l'immersion prolongée. Pour une fissure plus importante ou une perte d'eau constatée, un diagnostic plus approfondi peut être nécessaire.",
          ],
        },
      ]}
      tips={[
        "Si vous constatez une baisse anormale du niveau d'eau, signalez-le : cela peut indiquer une fissure à traiter en priorité.",
        "Précisez l'emplacement de la fissure ou du carrelage concerné (fond, paroi, plage) pour une évaluation adaptée.",
      ]}
      faq={[
        { q: 'Une petite fissure est-elle dangereuse ?', a: "Une fissure superficielle n'est généralement pas grave si elle est traitée rapidement, avant qu'elle ne s'agrandisse ou n'entraîne une fuite." },
        { q: 'Intervenez-vous sur les bassins en coque polyester ?', a: "Oui, précisez le type de bassin (béton, coque, liner) dans votre demande pour une réparation adaptée." },
      ]}
      related={[
        { label: '🏊 Retour à Piscine', href: '/piscine' },
        { label: 'Peinture de bassin', href: '/piscine/peinture-bassin' },
        { label: 'Demander une intervention', href: '/demande' },
      ]}
    />
    </>
  );
}
