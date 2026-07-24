import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = 'Aération et entretien entre deux séjours à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Entre deux séjours, un logement fermé accumule humidité et odeurs. Nos agents aèrent et assurent un entretien léger régulier.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/conciergerie/aeration-entretien-entre-sejours` },
  openGraph: { title, description, url: `${SITE_URL}/conciergerie/aeration-entretien-entre-sejours`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function AerationEntretienEntreSejoursPage() {
  return (
    <>
    <BrandSetter category="conciergerie" label="Conciergerie" />
    <PrestationDetailPage
      category="conciergerie"
      categoryLabel="Conciergerie"
      categoryHref="/conciergerie"
      eyebrow="Conciergerie"
      title="Aération et entretien entre deux séjours"
      intro="Un logement fermé plusieurs semaines accumule humidité, odeurs de renfermé et parfois de la poussière. Nos agents aèrent régulièrement et assurent un entretien léger entre vos séjours."
      sections={[
        {
          heading: 'Un entretien léger, régulier, pour éviter les mauvaises surprises',
          body: [
            "Ce passage régulier consiste à ouvrir les fenêtres pour aérer, vérifier l'absence d'humidité ou de moisissure, et effectuer un dépoussiérage léger. C'est une prestation appréciée des propriétaires de résidence secondaire qui souhaitent retrouver un logement agréable à chaque arrivée, sans avoir à programmer un grand ménage à chaque fois.",
          ],
        },
      ]}
      tips={[
        "Précisez la fréquence de passage souhaitée entre vos séjours.",
        "Cette prestation peut être combinée avec une surveillance générale du logement.",
      ]}
      faq={[
        { q: 'Cette prestation remplace-t-elle un ménage complet ?', a: "Non, il s'agit d'un entretien léger — pour un ménage complet avant votre arrivée, consultez notre catégorie Ménage." },
        { q: 'À quelle fréquence recommandez-vous ce passage ?', a: "Un passage toutes les deux à quatre semaines est courant pour une résidence secondaire, selon la durée de vos absences." },
      ]}
      related={[
        { label: '🔑 Retour à Conciergerie', href: '/conciergerie' },
        { label: 'Surveillance de résidence secondaire', href: '/conciergerie/surveillance-residence-secondaire' },
        { label: 'Demander une intervention', href: '/demande' },
      ]}
    />
    </>
  );
}
