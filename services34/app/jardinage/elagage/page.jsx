import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = 'Élagage à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Branches gênantes, arbre trop dense, sécurité avant tempête : nos agents élaguent vos arbres pour un jardin sûr et harmonieux.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/jardinage/elagage` },
  openGraph: { title, description, url: `${SITE_URL}/jardinage/elagage`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function ElagagePage() {
  return (
    <>
    <BrandSetter category="jardinage" label="Jardinage" />
    <PrestationDetailPage
      category="jardinage"
      categoryLabel="Jardinage"
      categoryHref="/jardinage"
      eyebrow="Jardinage"
      title="Élagage"
      intro="Branches basses, arbre trop dense ou risque de chute avant les vents forts : nos agents élaguent vos arbres pour un jardin plus sûr et plus dégagé."
      sections={[
        {
          heading: 'Une intervention utile pour la sécurité et la lumière',
          body: [
            "Un élagage régulier limite le risque de chute de branches, notamment avant les épisodes de vent fort ou de tramontane fréquents dans la région biterroise. Il permet aussi de redonner de la lumière au jardin et d'éviter que les branches n'empiètent sur une propriété voisine ou la voie publique.",
          ],
        },
      ]}
      tips={[
        "Précisez la hauteur approximative de l'arbre et le type d'intervention souhaité (allègement, dégagement, sécurité).",
        "Pour un arbre de grande hauteur ou proche d'un réseau électrique, signalez-le : cela peut nécessiter une évaluation particulière.",
      ]}
      faq={[
        { q: "Évacuez-vous les branches coupées ?", a: "Oui, sur demande — précisez-le dans votre demande d'intervention." },
        { q: 'Élaguez-vous les arbres de grande hauteur ?', a: "Pour les arbres de hauteur importante ou nécessitant un équipement spécifique, indiquez-le : cela permet d'orienter votre demande vers l'agent le plus adapté." },
      ]}
      related={[
        { label: '🌱 Retour à Jardinage', href: '/jardinage' },
        { label: 'Taille de haie', href: '/jardinage/taille-de-haie' },
        { label: 'Demander une intervention', href: '/demande' },
      ]}
    />
    </>
  );
}
