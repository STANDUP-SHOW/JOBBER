import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = 'Ménage à domicile à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Ménage régulier ou ponctuel : nos agents entretiennent votre logement avec sérieux, à la fréquence qui vous convient.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/menage/menage-a-domicile` },
  openGraph: { title, description, url: `${SITE_URL}/menage/menage-a-domicile`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function MenageADomicilePage() {
  return (
    <>
    <BrandSetter category="menage" label="Ménage" />
    <PrestationDetailPage
      category="menage"
      categoryLabel="Ménage"
      categoryHref="/menage"
      eyebrow="Ménage"
      title="Ménage à domicile"
      intro="Sols, poussière, cuisine, salle de bain : nos agents assurent un ménage complet et régulier de votre logement, avec le même soin à chaque passage."
      sections={[
        {
          heading: 'Un agent régulier pour un suivi de qualité',
          body: [
            "Dans la mesure du possible, nous privilégions un même agent d'un passage à l'autre pour un ménage récurrent : il connaît votre logement, vos habitudes et vos priorités, ce qui rend chaque intervention plus efficace.",
          ],
        },
      ]}
      tips={[
        "Précisez la surface de votre logement et les pièces à traiter en priorité.",
        "Indiquez si vous préférez que l'agent utilise vos produits d'entretien ou apporte les siens.",
      ]}
      faq={[
        { q: 'Puis-je demander le même agent à chaque passage ?', a: "Dans la mesure du possible, oui — nous privilégions la régularité pour un ménage récurrent." },
        { q: 'Dois-je être présent pendant le ménage ?', a: "Non, si vous préférez confier un accès (clés, code), cela peut être convenu directement avec l'agent." },
      ]}
      related={[
        { label: '🧹 Retour à Ménage', href: '/menage' },
        { label: 'Ménage de printemps', href: '/menage/menage-de-printemps' },
        { label: 'Demander une intervention', href: '/demande' },
      ]}
    />
    </>
  );
}
