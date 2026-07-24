import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = 'Contrôle du robot de piscine à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Robot qui ne nettoie plus correctement ou qui bloque : nos agents contrôlent, nettoient et règlent votre robot de piscine.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/piscine/controle-robot-piscine` },
  openGraph: { title, description, url: `${SITE_URL}/piscine/controle-robot-piscine`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function ControleRobotPiscinePage() {
  return (
    <>
    <BrandSetter category="piscine" label="Piscine" />
    <PrestationDetailPage
      category="piscine"
      categoryLabel="Piscine"
      categoryHref="/piscine"
      eyebrow="Piscine"
      title="Contrôle du robot de piscine"
      intro="Un robot mal réglé ou encrassé perd en efficacité. Nos agents contrôlent son fonctionnement, nettoient les filtres et ajustent les réglages si besoin."
      sections={[
        {
          heading: "Un contrôle simple qui prolonge la durée de vie du robot",
          body: [
            "Le contrôle comprend la vérification du bon déplacement du robot dans le bassin, le nettoyage de ses filtres internes (souvent oublié, ce qui réduit fortement son efficacité), et un contrôle visuel des câbles et brosses. Un entretien régulier limite les pannes prématurées.",
          ],
        },
      ]}
      tips={[
        "Précisez la marque et le modèle de votre robot si vous le connaissez.",
        "Les filtres du robot doivent être nettoyés régulièrement, idéalement à chaque passage d'entretien.",
      ]}
      faq={[
        { q: 'Réparez-vous les pannes du robot ?', a: "Pour un simple contrôle et nettoyage, oui. En cas de panne mécanique ou électronique plus poussée, une intervention spécialisée peut être nécessaire." },
        { q: "Est-ce que tous les types de robots sont pris en charge ?", a: "La plupart des robots électriques ou hydrauliques courants — précisez le modèle dans votre demande." },
      ]}
      related={[
        { label: '🏊 Retour à Piscine', href: '/piscine' },
        { label: 'Nettoyage du bassin et des skimmers', href: '/piscine/nettoyage-bassin-skimmers' },
        { label: 'Demander une intervention', href: '/demande' },
      ]}
    />
    </>
  );
}
