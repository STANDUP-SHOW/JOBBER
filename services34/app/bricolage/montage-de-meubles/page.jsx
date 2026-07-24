import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = 'Montage de meubles à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Canapé, lit, meubles de cuisine ou de salle de bain : nos agents montent vos meubles rapidement, avec leur propre outillage.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/bricolage/montage-de-meubles` },
  openGraph: { title, description, url: `${SITE_URL}/bricolage/montage-de-meubles`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function MontageMeublesPage() {
  return (
    <>
    <BrandSetter category="bricolage" label="Bricolage" />
    <PrestationDetailPage
      category="bricolage"
      categoryLabel="Bricolage"
      categoryHref="/bricolage"
      eyebrow="Bricolage"
      title="Montage de meubles"
      intro="Un nouveau canapé, un lit, une armoire à monter ? Nos agents s'en occupent avec leur propre outillage, pour un montage solide et sans mauvaise surprise."
      sections={[
        {
          heading: 'Un montage propre, quel que soit le meuble',
          body: [
            "Meuble en kit, meuble massif à assembler ou simple remontage après un déménagement : nos agents interviennent sur tout type de mobilier, dans le salon, la chambre ou la cuisine.",
            "Chaque intervention est cadrée à l'avance : nombre de meubles, type de mobilier et délai souhaité sont précisés dans votre demande, pour que l'agent arrive préparé.",
          ],
        },
        {
          heading: 'Pourquoi ne pas le faire soi-même ?',
          body: [
            "Entre les notices peu claires, les outils manquants et le temps que ça prend, faire appel à un agent reste souvent plus simple — surtout pour plusieurs meubles à la suite ou du mobilier volumineux.",
          ],
        },
      ]}
      tips={[
        "Indiquez le nombre de meubles à monter dans votre demande : cela permet d'estimer une durée d'intervention réaliste.",
        "Gardez les notices et la visserie d'origine à disposition si vous les avez conservées, cela accélère le montage.",
      ]}
      faq={[
        { q: 'Dois-je fournir les outils ?', a: "Non, l'agent vient avec son propre outillage (visseuse, niveau, clés…)." },
        { q: 'Prenez-vous en charge le retrait des emballages ?', a: "Précisez-le dans votre demande — la plupart de nos agents peuvent évacuer les cartons et emballages si vous le souhaitez." },
      ]}
      related={[
        { label: '🔧 Retour à Bricolage', href: '/bricolage' },
        { label: 'Demander une intervention', href: '/demande' },
      ]}
    />
    </>
  );
}
