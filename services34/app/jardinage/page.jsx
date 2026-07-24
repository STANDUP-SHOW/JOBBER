import ServiceCategoryPage from '../../components/ServiceCategoryPage';
import BrandSetter from '../../components/BrandSetter';
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
    <>
    <BrandSetter category="jardinage" label="Jardinage" />
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
        { name: 'Tonte de pelouse', href: '/jardinage/tonte-de-pelouse' },
        { name: 'Taille de haie', href: '/jardinage/taille-de-haie' },
        { name: 'Débroussaillage', href: '/jardinage/debroussaillage' },
        { name: 'Désherbage', href: '/jardinage/desherbage' },
        { name: 'Élagage', href: '/jardinage/elagage' },
        { name: 'Ramassage de feuilles', href: '/jardinage/ramassage-feuilles' },
        { name: 'Entretien des massifs', href: '/jardinage/entretien-massifs' },
        { name: "Arrosage pendant l'absence", href: '/jardinage/arrosage-pendant-absence' },
        { name: 'Création de potager', href: '/jardinage/creation-potager' },
        { name: 'Plantation de fleurs et arbustes', href: '/jardinage/plantation-fleurs-arbustes' },
        { name: 'Entretien du potager ou du verger', href: '/jardinage/entretien-potager-verger' },
        { name: 'Aménagement de jardin', href: '/jardinage/amenagement-du-jardin' },
        { name: 'Montage de pergola, abri de jardin, serre', href: '/jardinage/montage-pergola-abri-serre' },
        { name: "Installation d'arrosage automatique", href: '/jardinage/installation-arrosage-automatique' },
        { name: 'Nettoyage de terrasse', href: '/jardinage/nettoyage-terrasse' },
        { name: 'Entretien de piscine (voir aussi notre page dédiée)', href: '/jardinage/entretien-piscine' },
      ]}
      faq={[
        { q: 'Proposez-vous un entretien régulier du jardin ?', a: "Oui, vous pouvez demander un passage régulier (hebdomadaire, mensuel ou selon la saison) auprès du même agent." },
        { q: 'Les déchets verts sont-ils évacués ?', a: "Précisez lors de votre demande si vous souhaitez que l'agent évacue les déchets verts en déchèterie." },
        { q: 'Intervenez-vous pour les résidences secondaires ?', a: "Oui, c'est une demande fréquente sur le littoral — nous pouvons assurer un entretien régulier même en votre absence." },
      ]}
    />
    </>
  );
}
