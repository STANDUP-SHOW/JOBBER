import ServiceCategoryPage from '../../components/ServiceCategoryPage';
import { SITE_URL, SITE_NAME } from '../../lib/seo';

const title = 'Jardinage à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Tonte de pelouse, taille de haie, entretien des espaces verts : nos agents jardiniers entretiennent votre extérieur dans le biterrois, toute l'année.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/jardinage` },
  openGraph: { title, description, url: `${SITE_URL}/jardinage`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function JardinagePage() {
  return (
    <ServiceCategoryPage
      eyebrow="Jardinage"
      title="Un jardin entretenu, été comme hiver"
      intro="Tonte, taille de haie, entretien des massifs et des équipements extérieurs : nos agents s'occupent de votre jardin à Béziers, Agde, Vias, Marseillan et alentours."
      guarantees={[
        { icon: '🌱', title: 'Entretien complet', desc: "De la simple tonte à l'entretien saisonnier complet, nos agents s'adaptent à la taille de votre extérieur." },
        { icon: '🧰', title: 'Matériel professionnel', desc: "Nos agents interviennent avec leur propre matériel (tondeuse, taille-haie, débroussailleuse…)." },
        { icon: '🪪', title: 'Des agents de confiance', desc: "Chaque agent Services 34 est identifié et intervient au nom de l'entreprise." },
        { icon: '📍', title: 'Un service local', desc: "Nous intervenons exclusivement à Béziers, Agde, Vias, Marseillan et dans les communes du pourtour biterrois." },
      ]}
      tasks={[
        'Tonte de pelouse', 'Taille de haie', 'Débroussaillage', 'Désherbage', 'Élagage',
        'Ramassage de feuilles', 'Entretien des massifs', "Arrosage pendant l'absence",
        'Création de potager', 'Plantation de fleurs et arbustes', 'Entretien du potager ou du verger',
        'Montage de pergola, abri de jardin, serre', 'Installation d\'arrosage automatique',
        'Nettoyage de terrasse', 'Entretien de piscine (voir aussi notre page dédiée)',
      ]}
      faq={[
        { q: 'Proposez-vous un entretien régulier du jardin ?', a: "Oui, vous pouvez demander un passage régulier (hebdomadaire, mensuel ou selon la saison) auprès du même agent." },
        { q: 'Les déchets verts sont-ils évacués ?', a: "Précisez lors de votre demande si vous souhaitez que l'agent évacue les déchets verts en déchèterie." },
        { q: 'Intervenez-vous pour les résidences secondaires ?', a: "Oui, c'est une demande fréquente sur le littoral — nous pouvons assurer un entretien régulier même en votre absence." },
      ]}
    />
  );
}
