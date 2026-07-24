import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = 'Nettoyage électroménager à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Four encrassé, réfrigérateur à dégivrer, plaque de cuisson tachée : nos agents nettoient votre électroménager en profondeur.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/menage/nettoyage-electromenager` },
  openGraph: { title, description, url: `${SITE_URL}/menage/nettoyage-electromenager`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function NettoyageElectromenagerPage() {
  return (
    <>
    <BrandSetter category="menage" label="Ménage" />
    <PrestationDetailPage
      category="menage"
      categoryLabel="Ménage"
      categoryHref="/menage"
      eyebrow="Ménage"
      title="Nettoyage électroménager"
      intro="Four encrassé par la graisse, réfrigérateur à dégivrer, plaque de cuisson tachée : nos agents nettoient votre électroménager en profondeur, appareil par appareil."
      sections={[
        {
          heading: 'Un nettoyage souvent négligé, mais indispensable',
          body: [
            "L'intérieur d'un four ou d'un réfrigérateur demande un nettoyage spécifique, rarement fait au quotidien. Nos agents traitent ces appareils en profondeur : dégraissage du four, dégivrage et désinfection du réfrigérateur, nettoyage de la plaque de cuisson et de la hotte.",
          ],
        },
      ]}
      tips={[
        "Précisez les appareils concernés (four, réfrigérateur, plaque, hotte, lave-vaisselle).",
        "Pour un réfrigérateur, prévoyez de le vider avant l'intervention si un dégivrage est nécessaire.",
      ]}
      faq={[
        { q: 'Puis-je demander le nettoyage de plusieurs appareils en une fois ?', a: "Oui, listez tous les appareils concernés dans votre demande." },
        { q: 'Ce nettoyage peut-il être combiné à un ménage classique ?', a: "Oui, c'est une combinaison fréquente — précisez vos besoins dans la même demande." },
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
