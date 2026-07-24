import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = 'Petits travaux de plomberie à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Robinet qui fuit, joint à refaire, siphon bouché : nos agents interviennent sur les petits soucis de plomberie du quotidien.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/bricolage/petits-travaux-plomberie` },
  openGraph: { title, description, url: `${SITE_URL}/bricolage/petits-travaux-plomberie`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function PetitsTravauxPlomberiePage() {
  return (
    <>
    <BrandSetter category="bricolage" label="Bricolage" />
    <PrestationDetailPage
      category="bricolage"
      categoryLabel="Bricolage"
      categoryHref="/bricolage"
      eyebrow="Bricolage"
      title="Petits travaux de plomberie"
      intro="Un robinet qui goutte, un joint à changer, une évacuation lente : nos agents s'occupent des petites interventions de plomberie sans attendre l'urgence."
      sections={[
        {
          heading: "Des interventions simples, avant que le problème ne s'aggrave",
          body: [
            "Cette prestation couvre les petites réparations et remplacements courants : changement de joint, de flexible, de mousseur, débouchage d'évier ou de lavabo, remplacement d'un robinet ou d'un mécanisme de chasse d'eau. Pour une fuite importante ou un dégât des eaux, il est préférable de contacter un plombier en urgence.",
          ],
        },
      ]}
      tips={[
        "Si possible, coupez l'arrivée d'eau du point concerné avant l'intervention pour limiter les désagréments.",
        "Précisez si le remplacement nécessite l'achat d'une pièce spécifique — l'agent pourra vous conseiller.",
      ]}
      faq={[
        { q: 'Intervenez-vous en cas de fuite active ?', a: "Pour une fuite mineure et localisée, oui. En cas d'urgence importante, contactez d'abord un plombier disponible en urgence." },
        { q: 'Fournissez-vous les pièces de remplacement ?', a: "En général la fourniture reste à votre charge, sauf accord contraire avec l'agent." },
      ]}
      related={[
        { label: '🔧 Retour à Bricolage', href: '/bricolage' },
        { label: "Petits travaux d'électricité", href: '/bricolage/petits-travaux-electricite' },
        { label: 'Demander une intervention', href: '/demande' },
      ]}
    />
    </>
  );
}
