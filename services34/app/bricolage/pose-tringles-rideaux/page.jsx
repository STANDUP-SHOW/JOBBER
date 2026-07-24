import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = 'Pose de tringles à rideaux à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Tringles droites, bien fixées et de niveau : nos agents posent vos tringles à rideaux dans toute la région biterroise.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/bricolage/pose-tringles-rideaux` },
  openGraph: { title, description, url: `${SITE_URL}/bricolage/pose-tringles-rideaux`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function PoseTringlesRideauxPage() {
  return (
    <>
    <BrandSetter category="bricolage" label="Bricolage" />
    <PrestationDetailPage
      category="bricolage"
      categoryLabel="Bricolage"
      categoryHref="/bricolage"
      eyebrow="Bricolage"
      title="Pose de tringles à rideaux"
      intro="Une tringle bien droite, bien fixée, et adaptée au poids de vos rideaux : nos agents s'occupent de la pose, fenêtre par fenêtre."
      sections={[
        {
          heading: "Une pose au niveau, quel que soit le nombre de fenêtres",
          body: [
            "Que ce soit pour une seule fenêtre ou l'ensemble d'un logement, nos agents posent vos tringles avec un niveau à bulle pour un résultat net, et choisissent une fixation adaptée au poids de vos rideaux ou voilages.",
          ],
        },
      ]}
      tips={[
        "Indiquez le nombre de fenêtres concernées dans votre demande.",
        "Si vos rideaux sont lourds (occultants, doublés), signalez-le pour une fixation renforcée.",
      ]}
      faq={[
        { q: 'Dois-je fournir les tringles ?', a: "Oui, en général le matériel (tringles, embouts, fixations) reste à votre charge, sauf si vous précisez le contraire dans votre demande." },
        { q: 'Posez-vous aussi les rails de rideaux motorisés ?', a: "Précisez ce besoin spécifique dans votre demande — l'agent vous confirmera s'il peut s'en charger." },
      ]}
      related={[
        { label: '🔧 Retour à Bricolage', href: '/bricolage' },
        { label: 'Demander une intervention', href: '/demande' },
      ]}
    />
    </>
  );
}
