import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = 'Peinture de bassin à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Bassin terni ou revêtement usé : nos agents appliquent une nouvelle peinture (gel coat, résine, acrylique) pour redonner de l'éclat à votre piscine.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/piscine/peinture-bassin` },
  openGraph: { title, description, url: `${SITE_URL}/piscine/peinture-bassin`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function PeintureBassinPage() {
  return (
    <>
    <BrandSetter category="piscine" label="Piscine" />
    <PrestationDetailPage
      category="piscine"
      categoryLabel="Piscine"
      categoryHref="/piscine"
      eyebrow="Piscine"
      title="Peinture de bassin (gel coat, résine, acrylique)"
      intro="Un revêtement terni, décoloré ou qui s'écaille peut être rénové sans changer le bassin. Nos agents appliquent une nouvelle peinture adaptée à votre type de piscine."
      sections={[
        {
          heading: 'Le bon revêtement selon votre bassin',
          body: [
            "Peinture résine, gel coat ou acrylique : le choix dépend du matériau d'origine du bassin (béton, coque polyester) et du budget souhaité. La résine offre la meilleure durabilité, l'acrylique est plus économique mais demande un renouvellement plus fréquent. Nos agents vous conseillent selon votre situation.",
          ],
        },
      ]}
      tips={[
        "Cette prestation nécessite un bassin vidé et sec — planifiez l'intervention en dehors de la saison de baignade.",
        "Précisez le matériau actuel du bassin (béton, coque) si vous le connaissez.",
      ]}
      faq={[
        { q: 'Combien de temps le bassin doit-il rester vide ?', a: "Le temps de préparation, d'application et de séchage varie selon le type de peinture — l'agent vous donnera un calendrier précis." },
        { q: 'La peinture dure-t-elle plusieurs années ?', a: "Oui, selon le type choisi — la résine offre généralement la meilleure durabilité dans le temps." },
      ]}
      related={[
        { label: '🏊 Retour à Piscine', href: '/piscine' },
        { label: 'Réparation de fissures ou de carrelage', href: '/piscine/reparation-fissures-carrelage' },
        { label: 'Demander une intervention', href: '/demande' },
      ]}
    />
    </>
  );
}
