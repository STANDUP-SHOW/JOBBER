import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = "Fixation d'étagères à Béziers, Agde, Vias, Marseillan — Services 34";
const description = "Étagères murales posées droites et solides, adaptées à votre type de mur : nos agents interviennent chez vous rapidement.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/bricolage/fixation-etageres` },
  openGraph: { title, description, url: `${SITE_URL}/bricolage/fixation-etageres`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function FixationEtageresPage() {
  return (
    <>
    <BrandSetter category="bricolage" label="Bricolage" />
    <PrestationDetailPage
      category="bricolage"
      categoryLabel="Bricolage"
      categoryHref="/bricolage"
      eyebrow="Bricolage"
      title="Fixation d'étagères"
      intro="Une étagère mal fixée, c'est le risque qu'elle finisse par céder. Nos agents posent vos étagères droites et solidement ancrées, quel que soit le type de mur."
      sections={[
        {
          heading: 'Le bon ancrage pour chaque mur',
          body: [
            "Béton, placo, brique ou bois : chaque type de mur demande une fixation adaptée. C'est justement ce qui distingue une étagère bien posée d'une étagère qui finit par bouger — nos agents identifient le support avant de choisir les chevilles adaptées.",
          ],
        },
      ]}
      tips={[
        "Précisez le nombre d'étagères à poser et, si vous le savez, le type de mur concerné.",
        "Pour des charges lourdes (livres, bibliothèque), signalez-le à l'agent afin qu'il prévoie une fixation renforcée.",
      ]}
      faq={[
        { q: 'Faut-il que je fournisse les étagères ?', a: "Oui, l'agent s'occupe de la pose — les étagères et le système de fixation restent à votre charge, sauf accord contraire précisé lors de la demande." },
        { q: 'Combien d\'étagères peuvent être posées en une intervention ?', a: "Cela dépend du temps disponible — précisez le nombre souhaité pour une estimation adaptée." },
      ]}
      related={[
        { label: '🔧 Retour à Bricolage', href: '/bricolage' },
        { label: 'Accrocher un tableau ou un miroir', href: '/bricolage/accrocher-tableau-miroir' },
        { label: 'Demander une intervention', href: '/demande' },
      ]}
    />
    </>
  );
}
