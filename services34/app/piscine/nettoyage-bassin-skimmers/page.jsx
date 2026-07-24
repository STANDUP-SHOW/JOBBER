import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = 'Nettoyage du bassin et des skimmers à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Parois, fond, ligne d'eau et paniers de skimmers : nos agents nettoient chaque partie de votre piscine en profondeur.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/piscine/nettoyage-bassin-skimmers` },
  openGraph: { title, description, url: `${SITE_URL}/piscine/nettoyage-bassin-skimmers`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function NettoyageBassinSkimmersPage() {
  return (
    <>
    <BrandSetter category="piscine" label="Piscine" />
    <PrestationDetailPage
      category="piscine"
      categoryLabel="Piscine"
      categoryHref="/piscine"
      eyebrow="Piscine"
      title="Nettoyage du bassin et des skimmers"
      intro="Feuilles, insectes, dépôts sur la ligne d'eau : nos agents nettoient le bassin en profondeur et vident les paniers de skimmers pour une filtration efficace."
      sections={[
        {
          heading: "Un nettoyage complet, pas seulement de surface",
          body: [
            "Ce nettoyage couvre le fond et les parois du bassin (au balai ou à l'aspirateur manuel), le nettoyage de la ligne d'eau souvent marquée par les produits solaires et le calcaire, ainsi que le vidage et le nettoyage des paniers de skimmers, essentiels au bon fonctionnement de la filtration.",
          ],
        },
      ]}
      tips={[
        "Un nettoyage régulier de la ligne d'eau évite l'accumulation de dépôts difficiles à enlever.",
        "Les paniers de skimmers doivent être vidés régulièrement, surtout après un épisode de vent qui apporte feuilles et débris.",
      ]}
      faq={[
        { q: "Nettoyez-vous aussi le filtre de la pompe ?", a: "Oui, précisez ce besoin dans votre demande — le nettoyage du filtre peut être inclus." },
        { q: "À quelle fréquence faut-il vider les skimmers ?", a: "Idéalement à chaque passage d'entretien, plus souvent en période de vent ou de chute de feuilles." },
      ]}
      related={[
        { label: '🏊 Retour à Piscine', href: '/piscine' },
        { label: 'Entretien régulier', href: '/piscine/entretien-regulier' },
        { label: 'Demander une intervention', href: '/demande' },
      ]}
    />
    </>
  );
}
