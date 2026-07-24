import ServiceCategoryPage from '../../components/ServiceCategoryPage';
import { SITE_URL, SITE_NAME } from '../../lib/seo';

const title = 'Entretien de piscine à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Entretien régulier, remise en état, traitement de l'eau : nos agents s'occupent de votre piscine dans le biterrois et sur le littoral, toute la saison.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/piscine` },
  openGraph: { title, description, url: `${SITE_URL}/piscine`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function PiscinePage() {
  return (
    <ServiceCategoryPage
      eyebrow="Piscine"
      title="Une eau claire toute la saison"
      intro="Entretien régulier, remise en état après l'hiver, traitement de l'eau : nos agents s'occupent de votre piscine à Béziers, Agde, Vias, Marseillan et alentours."
      guarantees={[
        { icon: '🏊', title: 'Entretien régulier', desc: "Passage hebdomadaire ou selon vos besoins : nettoyage du bassin, contrôle et équilibrage de l'eau." },
        { icon: '🔧', title: 'Remise en état', desc: "Après l'hiver ou une période sans entretien, nos agents remettent votre bassin en service." },
        { icon: '🪪', title: 'Des agents de confiance', desc: "Chaque agent Services 34 est identifié et intervient au nom de l'entreprise." },
        { icon: '📍', title: 'Un service local', desc: "Idéal pour les résidences secondaires du littoral — Agde, Vias, Marseillan — même en votre absence." },
      ]}
      tasks={[
        "Entretien régulier (nettoyage, analyse et équilibrage de l'eau)",
        'Remise en état de la piscine', 'Traitement et hivernage',
        'Nettoyage du bassin et des skimmers', 'Contrôle du robot de piscine',
        'Peinture de bassin (gel coat, résine, acrylique)', 'Réparation de fissures ou de carrelage',
      ]}
      faq={[
        { q: "Intervenez-vous sur les résidences secondaires ?", a: "Oui, c'est l'une de nos prestations les plus demandées sur le littoral — nous pouvons assurer un entretien régulier même en votre absence, avec compte-rendu à chaque passage." },
        { q: 'Fournissez-vous les produits de traitement ?', a: "Précisez lors de votre demande si vous souhaitez que l'agent apporte les produits ou utilise les vôtres." },
        { q: 'Que couvre une remise en état ?', a: "Nettoyage complet du bassin, contrôle des équipements (skimmers, robot), et rééquilibrage chimique de l'eau avant la saison." },
      ]}
    />
  );
}
