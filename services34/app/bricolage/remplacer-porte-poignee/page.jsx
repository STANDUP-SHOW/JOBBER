import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = 'Remplacer une porte ou une poignée à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Porte qui ferme mal, poignée cassée ou usée : nos agents remplacent portes et poignées intérieures rapidement.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/bricolage/remplacer-porte-poignee` },
  openGraph: { title, description, url: `${SITE_URL}/bricolage/remplacer-porte-poignee`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function RemplacerPortePoigneePage() {
  return (
    <>
    <BrandSetter category="bricolage" label="Bricolage" />
    <PrestationDetailPage
      category="bricolage"
      categoryLabel="Bricolage"
      categoryHref="/bricolage"
      eyebrow="Bricolage"
      title="Remplacer une porte ou une poignée"
      intro="Une poignée qui tourne dans le vide, une porte qui frotte ou ne ferme plus correctement : nos agents diagnostiquent et remplacent ce qu'il faut."
      sections={[
        {
          heading: 'Du simple réglage au remplacement complet',
          body: [
            "Parfois, un simple réglage des charnières ou de la gâche suffit à régler le problème. Dans d'autres cas, la poignée ou la porte elle-même doit être changée. Décrivez le problème rencontré dans votre demande pour que l'agent vienne préparé.",
          ],
        },
      ]}
      tips={[
        "Si vous avez déjà la nouvelle poignée ou porte, précisez-le — sinon l'agent peut vous conseiller sur le modèle adapté.",
        "Prenez si possible une photo du problème (porte voilée, gâche abîmée…) pour affiner votre demande.",
      ]}
      faq={[
        { q: 'Remplacez-vous aussi les portes extérieures ?', a: "Cette prestation concerne principalement les portes intérieures. Pour une porte d'entrée, précisez-le dans votre demande afin que l'agent évalue la faisabilité." },
        { q: 'Puis-je juste faire réparer une porte qui grince ou frotte ?', a: "Oui, un simple ajustement (charnières, rabotage léger) peut suffire — décrivez le souci rencontré." },
      ]}
      related={[
        { label: '🔧 Retour à Bricolage', href: '/bricolage' },
        { label: 'Serrurerie', href: '/bricolage/serrurerie' },
        { label: 'Demander une intervention', href: '/demande' },
      ]}
    />
    </>
  );
}
