import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = 'Traitement et hivernage de piscine à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Fin de saison : nos agents préparent votre piscine pour l'hiver, hivernage actif ou passif selon votre équipement.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/piscine/traitement-hivernage` },
  openGraph: { title, description, url: `${SITE_URL}/piscine/traitement-hivernage`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function TraitementHivernagePage() {
  return (
    <>
    <BrandSetter category="piscine" label="Piscine" />
    <PrestationDetailPage
      category="piscine"
      categoryLabel="Piscine"
      categoryHref="/piscine"
      eyebrow="Piscine"
      title="Traitement et hivernage"
      intro="En fin de saison, un hivernage bien réalisé protège votre piscine et facilite la remise en service au printemps. Nos agents adaptent la méthode à votre équipement."
      sections={[
        {
          heading: 'Hivernage actif ou passif, selon votre équipement',
          body: [
            "L'hivernage actif maintient une filtration réduite tout l'hiver et convient aux régions à hiver doux comme le littoral biterrois. L'hivernage passif arrête complètement la filtration et protège davantage contre le gel, mais demande un traitement plus poussé. Nos agents vous conseillent sur la méthode la plus adaptée à votre installation.",
          ],
        },
      ]}
      tips={[
        "Le climat doux de la région permet souvent un hivernage actif, moins contraignant à la remise en route.",
        "Précisez le type d'équipement de filtration présent pour un hivernage adapté.",
      ]}
      faq={[
        { q: 'Quelle est la différence entre hivernage actif et passif ?', a: "L'hivernage actif maintient une filtration réduite, l'hivernage passif arrête complètement le système — le choix dépend de votre équipement et du climat local." },
        { q: 'Quand faut-il hiverner sa piscine ?', a: "Généralement lorsque la température de l'eau descend durablement sous 15°C, souvent en fin d'automne dans la région." },
      ]}
      related={[
        { label: '🏊 Retour à Piscine', href: '/piscine' },
        { label: 'Remise en état de la piscine', href: '/piscine/remise-en-etat' },
        { label: 'Demander une intervention', href: '/demande' },
      ]}
    />
    </>
  );
}
