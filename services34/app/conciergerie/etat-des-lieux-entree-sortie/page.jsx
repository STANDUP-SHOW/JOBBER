import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = "État des lieux d'entrée et de sortie à Béziers, Agde, Vias, Marseillan — Services 34";
const description = "Nos agents réalisent l'état des lieux d'entrée et de sortie de vos locataires, avec photos et compte-rendu détaillé.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/conciergerie/etat-des-lieux-entree-sortie` },
  openGraph: { title, description, url: `${SITE_URL}/conciergerie/etat-des-lieux-entree-sortie`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function EtatDesLieuxEntreeSortiePage() {
  return (
    <>
    <BrandSetter category="conciergerie" label="Conciergerie" />
    <PrestationDetailPage
      category="conciergerie"
      categoryLabel="Conciergerie"
      categoryHref="/conciergerie"
      eyebrow="Conciergerie"
      title="État des lieux d'entrée et de sortie"
      intro="Un état des lieux précis protège autant le propriétaire que le locataire. Nos agents documentent l'état du logement à l'arrivée comme au départ, avec photos à l'appui."
      sections={[
        {
          heading: 'Un document fiable en cas de litige',
          body: [
            "L'état des lieux couvre chaque pièce du logement : murs, sols, équipements, mobilier si le bien est meublé. Un compte-rendu photographique est associé à chaque état des lieux, utile en cas de désaccord sur l'état du bien au départ du locataire.",
          ],
        },
      ]}
      tips={[
        "Précisez si le logement est meublé : l'état des lieux inclut alors un inventaire du mobilier.",
        "Un état des lieux d'entrée et de sortie peuvent être demandés ensemble pour un même séjour.",
      ]}
      faq={[
        { q: "L'état des lieux a-t-il une valeur en cas de litige ?", a: "Le compte-rendu détaillé et photographique constitue un élément de preuve utile, bien qu'il ne remplace pas un document contractuel officiel selon votre situation locative." },
        { q: 'Pouvez-vous faire un inventaire du mobilier ?', a: "Oui, pour un logement meublé, l'inventaire peut être inclus dans l'état des lieux." },
      ]}
      related={[
        { label: '🔑 Retour à Conciergerie', href: '/conciergerie' },
        { label: 'Accueil des voyageurs', href: '/conciergerie/accueil-voyageurs' },
        { label: 'Demander une intervention', href: '/demande' },
      ]}
    />
    </>
  );
}
