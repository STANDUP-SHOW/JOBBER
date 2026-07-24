import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = 'Plantation de fleurs et arbustes à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Nouvelles fleurs, arbustes ou haie à planter : nos agents choisissent le bon emplacement et assurent une mise en terre soignée.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/jardinage/plantation-fleurs-arbustes` },
  openGraph: { title, description, url: `${SITE_URL}/jardinage/plantation-fleurs-arbustes`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function PlantationFleursArbustesPage() {
  return (
    <>
    <BrandSetter category="jardinage" label="Jardinage" />
    <PrestationDetailPage
      category="jardinage"
      categoryLabel="Jardinage"
      categoryHref="/jardinage"
      eyebrow="Jardinage"
      title="Plantation de fleurs et arbustes"
      intro="Fleurs saisonnières, arbustes persistants ou haie décorative : nos agents préparent le sol et plantent selon vos envies, en tenant compte du climat local."
      sections={[
        {
          heading: 'Des espèces adaptées au climat méditerranéen',
          body: [
            "Toutes les espèces ne résistent pas aussi bien à la sécheresse et au vent du littoral biterrois. Nos agents peuvent vous orienter vers des essences méditerranéennes peu gourmandes en eau — lauriers-roses, romarin, oliviers, agapanthes — pour un jardin qui reste beau toute l'année avec un entretien limité.",
          ],
        },
      ]}
      tips={[
        "Précisez si vous avez déjà acheté les plants ou si vous souhaitez des conseils sur le choix des espèces.",
        "L'automne et le printemps sont généralement les meilleures périodes de plantation dans la région.",
      ]}
      faq={[
        { q: 'Puis-je demander des conseils sur les espèces à planter ?', a: "Oui, nos agents peuvent vous orienter vers des espèces adaptées au climat et à l'exposition de votre jardin." },
        { q: 'Fournissez-vous les plants ?', a: "En général la fourniture reste à votre charge, sauf accord contraire précisé dans votre demande." },
      ]}
      related={[
        { label: '🌱 Retour à Jardinage', href: '/jardinage' },
        { label: 'Aménagement de jardin', href: '/jardinage/amenagement-du-jardin' },
        { label: 'Demander une intervention', href: '/demande' },
      ]}
    />
    </>
  );
}
