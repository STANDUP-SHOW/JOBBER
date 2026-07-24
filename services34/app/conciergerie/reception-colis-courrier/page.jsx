import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = 'Réception de colis et de courrier à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "En votre absence, nos agents réceptionnent vos colis et relèvent votre courrier, et vous les transmettent selon vos consignes.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/conciergerie/reception-colis-courrier` },
  openGraph: { title, description, url: `${SITE_URL}/conciergerie/reception-colis-courrier`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function ReceptionColisCourrierPage() {
  return (
    <>
    <BrandSetter category="conciergerie" label="Conciergerie" />
    <PrestationDetailPage
      category="conciergerie"
      categoryLabel="Conciergerie"
      categoryHref="/conciergerie"
      eyebrow="Conciergerie"
      title="Réception de colis et de courrier"
      intro="Absent au moment d'une livraison ou pendant une longue période loin de votre résidence secondaire : nos agents réceptionnent vos colis et relèvent votre courrier."
      sections={[
        {
          heading: 'Un service pratique pour les absences prolongées',
          body: [
            "Nos agents peuvent réceptionner vos colis à votre place et relever régulièrement votre boîte aux lettres pendant votre absence, pour éviter l'accumulation de courrier — un signe visible d'absence qui peut attirer l'attention.",
          ],
        },
      ]}
      tips={[
        "Précisez la fréquence de relève souhaitée pour le courrier.",
        "Pour des livraisons ponctuelles, indiquez la date prévue de réception si vous la connaissez.",
      ]}
      faq={[
        { q: 'Que faites-vous des colis reçus ?', a: "Ils sont conservés en sécurité selon vos consignes, jusqu'à votre retour ou une remise convenue avec vous." },
        { q: 'Puis-je combiner ce service avec une surveillance régulière de mon logement ?', a: "Oui, c'est une combinaison fréquente pour les résidences secondaires." },
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
