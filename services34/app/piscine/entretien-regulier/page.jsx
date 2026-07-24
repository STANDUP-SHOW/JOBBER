import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = "Entretien régulier de piscine à Béziers, Agde, Vias, Marseillan — Services 34";
const description = "Nettoyage, analyse et équilibrage de l'eau chaque semaine : nos agents assurent un entretien régulier de votre piscine tout au long de la saison.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/piscine/entretien-regulier` },
  openGraph: { title, description, url: `${SITE_URL}/piscine/entretien-regulier`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function EntretienRegulierPage() {
  return (
    <>
    <BrandSetter category="piscine" label="Piscine" />
    <PrestationDetailPage
      category="piscine"
      categoryLabel="Piscine"
      categoryHref="/piscine"
      eyebrow="Piscine"
      title="Entretien régulier"
      intro="Nettoyage du bassin, analyse de l'eau, ajustement des produits : nos agents assurent un passage régulier pour garder votre piscine prête à l'usage toute la saison."
      sections={[
        {
          heading: "Un suivi hebdomadaire, adapté à la saison",
          body: [
            "L'entretien régulier comprend le nettoyage des parois et du fond, le contrôle du taux de chlore et du pH, et l'ajustement des produits si nécessaire. Sous le climat chaud de la région biterroise, un passage hebdomadaire en pleine saison permet de garder une eau claire et équilibrée.",
          ],
        },
      ]}
      tips={[
        "Un entretien régulier limite fortement le risque d'eau verte ou trouble en pleine saison.",
        "Précisez si vous souhaitez un compte-rendu à chaque passage, utile pour les résidences secondaires.",
      ]}
      faq={[
        { q: 'À quelle fréquence intervenez-vous ?', a: "Un passage hebdomadaire est courant en haute saison, mais la fréquence peut être ajustée selon vos besoins." },
        { q: 'Puis-je demander cet entretien pour une résidence secondaire ?', a: "Oui, c'est l'une de nos prestations les plus demandées sur le littoral, avec compte-rendu à chaque passage." },
      ]}
      related={[
        { label: '🏊 Retour à Piscine', href: '/piscine' },
        { label: 'Contrôle du robot de piscine', href: '/piscine/controle-robot-piscine' },
        { label: 'Demander une intervention', href: '/demande' },
      ]}
    />
    </>
  );
}
