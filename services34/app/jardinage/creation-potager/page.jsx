import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = 'Création de potager à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Envie de cultiver vos propres légumes ? Nos agents créent votre potager de A à Z : préparation de la terre, structuration des rangs, premières plantations.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/jardinage/creation-potager` },
  openGraph: { title, description, url: `${SITE_URL}/jardinage/creation-potager`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function CreationPotagerPage() {
  return (
    <>
    <BrandSetter category="jardinage" label="Jardinage" />
    <PrestationDetailPage
      category="jardinage"
      categoryLabel="Jardinage"
      categoryHref="/jardinage"
      eyebrow="Jardinage"
      title="Création de potager"
      intro="D'un coin de jardin en friche à un potager organisé et productif : nos agents préparent le terrain, structurent les rangs et vous aident à démarrer vos premières plantations."
      sections={[
        {
          heading: 'Une création pensée pour votre terrain',
          body: [
            "Chaque potager commence par une préparation du sol : désherbage, bêchage, apport éventuel de terreau ou de compost. Nos agents peuvent ensuite structurer l'espace en rangs, en carrés ou en buttes selon la configuration de votre jardin et vos envies.",
          ],
        },
        {
          heading: 'Adapté au climat sec du littoral',
          body: [
            "Sous le climat méditerranéen de la région biterroise, le choix de l'emplacement et du système d'arrosage est déterminant pour la réussite d'un potager. Nos agents peuvent vous conseiller sur l'exposition et, si besoin, coupler la création avec l'installation d'un arrosage automatique.",
          ],
        },
      ]}
      tips={[
        "Précisez la surface souhaitée et si vous avez déjà une idée des légumes à cultiver.",
        "Un potager en bac ou en carré demande moins d'entretien qu'un potager en pleine terre — une option à considérer selon votre disponibilité.",
      ]}
      faq={[
        { q: 'Fournissez-vous la terre, le compost ou les plants ?', a: "Précisez vos besoins dans la demande — la fourniture de matériaux peut être incluse selon accord avec l'agent." },
        { q: 'Pouvez-vous aussi installer un arrosage automatique pour le potager ?', a: "Oui, vous pouvez combiner les deux prestations dans la même demande." },
      ]}
      related={[
        { label: '🌱 Retour à Jardinage', href: '/jardinage' },
        { label: 'Installation d\'arrosage automatique', href: '/jardinage/installation-arrosage-automatique' },
        { label: 'Demander une intervention', href: '/demande' },
      ]}
    />
    </>
  );
}
