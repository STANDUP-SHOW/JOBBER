import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = 'Aide au rangement à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Placards encombrés, pièce désordonnée, tri avant un déménagement : nos agents vous aident à réorganiser votre intérieur.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/menage/aide-au-rangement` },
  openGraph: { title, description, url: `${SITE_URL}/menage/aide-au-rangement`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function AideAuRangementPage() {
  return (
    <>
    <BrandSetter category="menage" label="Ménage" />
    <PrestationDetailPage
      category="menage"
      categoryLabel="Ménage"
      categoryHref="/menage"
      eyebrow="Ménage"
      title="Aide au rangement"
      intro="Placards à réorganiser, pièce encombrée, tri avant un déménagement : nos agents vous aident à retrouver un intérieur ordonné, à votre rythme."
      sections={[
        {
          heading: "Un accompagnement, pas seulement une exécution",
          body: [
            "L'aide au rangement se fait avec vous : l'agent vous accompagne dans le tri et l'organisation, sans jamais se débarrasser de quoi que ce soit sans votre accord. C'est particulièrement utile avant un déménagement, après un tri saisonnier ou simplement pour repartir sur un intérieur plus fonctionnel.",
          ],
        },
      ]}
      tips={[
        "Précisez les pièces ou zones à traiter en priorité.",
        "Si le rangement s'inscrit dans la préparation d'un déménagement, signalez-le pour une organisation adaptée.",
      ]}
      faq={[
        { q: "L'agent décide-t-il seul de ce qui est gardé ou jeté ?", a: "Non, le tri se fait toujours avec votre accord — l'agent vous accompagne, il ne décide jamais à votre place." },
        { q: 'Pouvez-vous aider à préparer des cartons avant un déménagement ?', a: "Oui, précisez ce besoin dans votre demande." },
      ]}
      related={[
        { label: '🧹 Retour à Ménage', href: '/menage' },
        { label: 'Ménage à domicile', href: '/menage/menage-a-domicile' },
        { label: 'Demander une intervention', href: '/demande' },
      ]}
    />
    </>
  );
}
