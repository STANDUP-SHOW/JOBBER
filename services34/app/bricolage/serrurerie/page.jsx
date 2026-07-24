import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = 'Serrurerie à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Changement de serrure, ajustement d'une porte qui ferme mal, remplacement de cylindre : nos agents interviennent sur vos petits travaux de serrurerie.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/bricolage/serrurerie` },
  openGraph: { title, description, url: `${SITE_URL}/bricolage/serrurerie`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function SerruriePage() {
  return (
    <>
    <BrandSetter category="bricolage" label="Bricolage" />
    <PrestationDetailPage
      category="bricolage"
      categoryLabel="Bricolage"
      categoryHref="/bricolage"
      eyebrow="Bricolage"
      title="Serrurerie"
      intro="Un cylindre à changer, une porte qui ferme mal, une serrure à renforcer : nos agents s'occupent des interventions de serrurerie courantes, hors urgence."
      sections={[
        {
          heading: 'Sécuriser ou réparer, sans attendre une panne',
          body: [
            "Remplacement de cylindre, ajustement d'une porte qui frotte ou ferme mal, pose d'un verrou supplémentaire : ces interventions se planifient à l'avance. Pour une porte claquée ou une perte de clés en urgence, contactez un serrurier disponible immédiatement plutôt que de passer par une demande planifiée.",
          ],
        },
      ]}
      tips={[
        "Précisez le type de serrure ou de cylindre concerné si vous le connaissez.",
        "Pour un simple ajustement de porte qui ferme mal, cette prestation suffit généralement.",
      ]}
      faq={[
        { q: "Intervenez-vous en cas de porte claquée en urgence ?", a: "Non, cette prestation concerne les interventions planifiées. En cas d'urgence, contactez un serrurier disponible immédiatement." },
        { q: 'Fournissez-vous la nouvelle serrure ou le cylindre ?', a: "En général la fourniture reste à votre charge — précisez vos besoins pour que l'agent vienne préparé." },
      ]}
      related={[
        { label: '🔧 Retour à Bricolage', href: '/bricolage' },
        { label: 'Remplacer une porte ou une poignée', href: '/bricolage/remplacer-porte-poignee' },
        { label: 'Demander une intervention', href: '/demande' },
      ]}
    />
    </>
  );
}
