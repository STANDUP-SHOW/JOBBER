import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = 'Taille de haie à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Haie dense, haie fleurie ou haie de bord de mer : nos agents taillent vos haies avec un geste net et évacuent les déchets si besoin.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/jardinage/taille-de-haie` },
  openGraph: { title, description, url: `${SITE_URL}/jardinage/taille-de-haie`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function TailleDeHaiePage() {
  return (
    <>
    <BrandSetter category="jardinage" label="Jardinage" />
    <PrestationDetailPage
      category="jardinage"
      categoryLabel="Jardinage"
      categoryHref="/jardinage"
      eyebrow="Jardinage"
      title="Taille de haie"
      intro="Une haie bien taillée délimite votre jardin avec netteté et reste en bonne santé. Nos agents interviennent avec du matériel professionnel, quelle que soit la hauteur."
      sections={[
        {
          heading: 'Deux périodes de taille par an, en général',
          body: [
            "La plupart des haies se taillent au printemps puis à la fin de l'été, en dehors des périodes de nidification. Nos agents peuvent aussi intervenir en taille ponctuelle si votre haie a pris trop d'ampleur.",
          ],
        },
      ]}
      tips={[
        "Précisez la longueur et la hauteur approximatives de la haie pour un devis adapté.",
        "Pour une haie en bordure de rue ou de voisinage, vérifiez les règles de hauteur applicables dans votre commune.",
      ]}
      faq={[
        { q: 'Évacuez-vous les déchets de taille ?', a: "Oui, sur demande — précisez-le lors de votre demande d'intervention." },
        { q: 'Taillez-vous les haies très hautes ?', a: "Oui, avec le matériel adapté — indiquez la hauteur approximative pour que l'agent vienne équipé en conséquence." },
      ]}
      related={[
        { label: '🌱 Retour à Jardinage', href: '/jardinage' },
        { label: 'Tonte de pelouse', href: '/jardinage/tonte-de-pelouse' },
        { label: 'Demander une intervention', href: '/demande' },
      ]}
    />
    </>
  );
}
