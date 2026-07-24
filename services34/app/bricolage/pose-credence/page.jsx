import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = 'Pose de crédence à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Crédence de cuisine posée proprement, découpes comprises : nos agents s'occupent de l'installation, quel que soit le matériau.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/bricolage/pose-credence` },
  openGraph: { title, description, url: `${SITE_URL}/bricolage/pose-credence`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function PoseCredencePage() {
  return (
    <>
    <BrandSetter category="bricolage" label="Bricolage" />
    <PrestationDetailPage
      category="bricolage"
      categoryLabel="Bricolage"
      categoryHref="/bricolage"
      eyebrow="Bricolage"
      title="Pose de crédence"
      intro="Une crédence bien posée protège vos murs et change complètement l'allure d'une cuisine. Nos agents s'occupent de la découpe et de la fixation."
      sections={[
        {
          heading: 'Une pose adaptée à chaque matériau',
          body: [
            "Crédence en stratifié, en verre, en carrelage ou en aluminium composite : chaque matériau a ses contraintes de découpe et de fixation. Précisez le matériau choisi dans votre demande pour que l'agent prépare l'intervention en conséquence.",
          ],
        },
      ]}
      tips={[
        "Prenez les mesures de la zone à couvrir avant votre demande, cela facilite le devis.",
        "Si des découpes sont nécessaires autour des prises électriques, signalez-le à l'agent.",
      ]}
      faq={[
        { q: 'Dois-je fournir la crédence ?', a: "Oui, la fourniture reste en général à votre charge — l'agent s'occupe de la pose." },
        { q: 'Faut-il retirer une ancienne crédence avant la pose ?', a: "Si nécessaire, précisez-le dans votre demande : la dépose de l'ancienne crédence peut être incluse dans l'intervention." },
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
