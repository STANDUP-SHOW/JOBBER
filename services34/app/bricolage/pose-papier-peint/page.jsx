import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = 'Pose de papier peint à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Un papier peint bien posé, sans bulles ni raccords visibles : nos agents préparent les murs et posent votre papier peint avec soin.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/bricolage/pose-papier-peint` },
  openGraph: { title, description, url: `${SITE_URL}/bricolage/pose-papier-peint`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function PosePapierPeintPage() {
  return (
    <>
    <BrandSetter category="bricolage" label="Bricolage" />
    <PrestationDetailPage
      category="bricolage"
      categoryLabel="Bricolage"
      categoryHref="/bricolage"
      eyebrow="Bricolage"
      title="Pose de papier peint"
      intro="Uni, à motifs ou en lés larges : la pose de papier peint demande de la précision pour éviter bulles et raccords visibles. Nos agents s'en chargent, mur par mur."
      sections={[
        {
          heading: 'Une pose qui commence par la préparation du mur',
          body: [
            "Un mur mal préparé se voit à travers le papier peint. Nos agents vérifient l'état du support avant de poser — un mur abîmé ou avec de l'ancien papier peint résiduel doit d'abord être traité.",
          ],
        },
      ]}
      tips={[
        "Précisez la surface approximative à couvrir et si le papier peint est déjà en votre possession.",
        "Pour un papier peint à motifs avec raccord, signalez-le : cela demande un calcul de métrage un peu différent.",
      ]}
      faq={[
        { q: 'Retirez-vous aussi l\'ancien papier peint ?', a: "Oui, c'est possible — précisez-le dans votre demande, cette étape s'ajoute au temps d'intervention." },
        { q: 'Dois-je fournir le papier peint ?', a: "Oui, en général la fourniture reste à votre charge, l'agent s'occupe de la pose." },
      ]}
      related={[
        { label: '🔧 Retour à Bricolage', href: '/bricolage' },
        { label: 'Peinture intérieure', href: '/bricolage/peinture-interieure' },
        { label: 'Demander une intervention', href: '/demande' },
      ]}
    />
    </>
  );
}
