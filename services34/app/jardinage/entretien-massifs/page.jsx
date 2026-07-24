import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = 'Entretien des massifs à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Massifs de fleurs ou d'arbustes entretenus toute l'année : désherbage, taille légère, paillage. Nos agents s'en occupent régulièrement.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/jardinage/entretien-massifs` },
  openGraph: { title, description, url: `${SITE_URL}/jardinage/entretien-massifs`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function EntretienMassifsPage() {
  return (
    <>
    <BrandSetter category="jardinage" label="Jardinage" />
    <PrestationDetailPage
      category="jardinage"
      categoryLabel="Jardinage"
      categoryHref="/jardinage"
      eyebrow="Jardinage"
      title="Entretien des massifs"
      intro="Un massif de fleurs ou d'arbustes demande un entretien régulier pour rester dense et fleuri. Nos agents désherbent, taillent légèrement et paillent selon les besoins de la saison."
      sections={[
        {
          heading: 'Un entretien complet, adapté à chaque massif',
          body: [
            "L'entretien d'un massif combine plusieurs gestes : désherbage entre les plants, taille légère des vivaces défleuries, paillage pour limiter la repousse des mauvaises herbes et retenir l'humidité — un point important sous le climat sec et venté du littoral biterrois.",
          ],
        },
      ]}
      tips={[
        "Précisez le type de plantes présentes dans le massif : certaines demandent un entretien spécifique selon la saison.",
        "Un paillage estival aide les massifs à mieux résister à la sécheresse.",
      ]}
      faq={[
        { q: 'Fournissez-vous le paillage ?', a: "Précisez votre besoin dans la demande — la fourniture peut être incluse ou laissée à votre charge selon la situation." },
        { q: 'À quelle fréquence faut-il entretenir un massif ?', a: "Un passage mensuel ou saisonnier est courant, selon la densité et le type de plantations." },
      ]}
      related={[
        { label: '🌱 Retour à Jardinage', href: '/jardinage' },
        { label: 'Désherbage', href: '/jardinage/desherbage' },
        { label: 'Demander une intervention', href: '/demande' },
      ]}
    />
    </>
  );
}
