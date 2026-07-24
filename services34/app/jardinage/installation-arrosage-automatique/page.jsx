import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = "Installation d'arrosage automatique à Béziers, Agde, Vias, Marseillan — Services 34";
const description = "Fini l'arrosage à la main : nos agents installent un système d'arrosage automatique programmable, adapté à votre jardin.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/jardinage/installation-arrosage-automatique` },
  openGraph: { title, description, url: `${SITE_URL}/jardinage/installation-arrosage-automatique`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function InstallationArrosageAutomatiquePage() {
  return (
    <>
    <BrandSetter category="jardinage" label="Jardinage" />
    <PrestationDetailPage
      category="jardinage"
      categoryLabel="Jardinage"
      categoryHref="/jardinage"
      eyebrow="Jardinage"
      title="Installation d'arrosage automatique"
      intro="Un système d'arrosage automatique bien conçu fait gagner du temps et économise l'eau. Nos agents installent et programment votre système, de la pelouse au potager."
      sections={[
        {
          heading: 'Particulièrement utile sous le climat sec du littoral',
          body: [
            "Avec les étés chauds et secs de la région biterroise, un arrosage automatique programmé aux heures fraîches (tôt le matin ou en soirée) limite l'évaporation et assure un arrosage régulier même en votre absence. Nos agents adaptent le système — goutte-à-goutte, tuyaux poreux ou asperseurs — selon les zones à arroser.",
          ],
        },
      ]}
      tips={[
        "Précisez les zones à couvrir (pelouse, massifs, potager) : le type de système varie selon les besoins.",
        "Un programmateur permet de définir des horaires d'arrosage même lorsque vous êtes absent.",
      ]}
      faq={[
        { q: 'Fournissez-vous le matériel ?', a: "Précisez votre besoin dans la demande — la fourniture peut être incluse selon accord avec l'agent." },
        { q: "Le système est-il raccordé automatiquement à mon arrivée d'eau ?", a: "Oui, l'installation comprend le raccordement au point d'eau existant et la programmation du système." },
      ]}
      related={[
        { label: '🌱 Retour à Jardinage', href: '/jardinage' },
        { label: "Arrosage pendant l'absence", href: '/jardinage/arrosage-pendant-absence' },
        { label: 'Demander une intervention', href: '/demande' },
      ]}
    />
    </>
  );
}
