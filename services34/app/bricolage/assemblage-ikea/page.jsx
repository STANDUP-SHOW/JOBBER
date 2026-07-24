import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = 'Assemblage de meubles IKEA à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Fatigué des notices IKEA ? Nos agents assemblent vos meubles en kit rapidement et proprement, dans toute la région biterroise.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/bricolage/assemblage-ikea` },
  openGraph: { title, description, url: `${SITE_URL}/bricolage/assemblage-ikea`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function AssemblageIkeaPage() {
  return (
    <>
    <BrandSetter category="bricolage" label="Bricolage" />
    <PrestationDetailPage
      category="bricolage"
      categoryLabel="Bricolage"
      categoryHref="/bricolage"
      eyebrow="Bricolage"
      title="Assemblage de meubles IKEA"
      intro="Étagères, dressing, meuble TV ou cuisine complète : nos agents assemblent vos meubles en kit, y compris les modèles les plus complexes."
      sections={[
        {
          heading: 'Un service pensé pour le mobilier en kit',
          body: [
            "Les meubles en kit demandent de la précision : bon ordre de montage, bon serrage des fixations, bonne lecture des notices. Nos agents ont l'habitude de ce type de mobilier et interviennent aussi bien pour une seule pièce que pour l'ameublement complet d'un logement.",
          ],
        },
        {
          heading: 'Idéal après un déménagement',
          body: [
            "C'est une prestation particulièrement demandée après un emménagement : plusieurs meubles à monter en une seule fois, dans un délai court. N'hésitez pas à indiquer le nombre et le type de meubles dans votre demande.",
          ],
        },
      ]}
      tips={[
        "Précisez si les meubles sont déjà livrés sur place ou encore à réceptionner.",
        "Pour un dressing ou une cuisine complète, comptez une intervention plus longue — l'agent peut vous conseiller sur la durée nécessaire.",
      ]}
      faq={[
        { q: 'Montez-vous toutes les marques de meubles en kit, ou seulement IKEA ?', a: "Nos agents montent tout type de meuble en kit, IKEA ou non. Précisez simplement la marque et le modèle si vous le connaissez." },
        { q: 'Combien de temps pour monter une cuisine complète ?', a: "Cela dépend du nombre d'éléments — décrivez votre projet dans la demande pour recevoir une estimation adaptée." },
      ]}
      related={[
        { label: '🔧 Retour à Bricolage', href: '/bricolage' },
        { label: 'Montage de meubles', href: '/bricolage/montage-de-meubles' },
        { label: 'Demander une intervention', href: '/demande' },
      ]}
    />
    </>
  );
}
