import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = 'Installation électroménager à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Lave-linge, four, plaque de cuisson, hotte : nos agents raccordent et installent votre électroménager en toute sécurité.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/bricolage/installation-electromenager` },
  openGraph: { title, description, url: `${SITE_URL}/bricolage/installation-electromenager`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function InstallationElectromenagerPage() {
  return (
    <>
    <BrandSetter category="bricolage" label="Bricolage" />
    <PrestationDetailPage
      category="bricolage"
      categoryLabel="Bricolage"
      categoryHref="/bricolage"
      eyebrow="Bricolage"
      title="Installation électroménager"
      intro="Un nouvel appareil vient d'arriver et il faut le raccorder correctement : nos agents installent votre électroménager, branchements et fixations compris."
      sections={[
        {
          heading: 'Un raccordement propre pour chaque appareil',
          body: [
            "Lave-linge, lave-vaisselle, four encastrable, plaque de cuisson, hotte aspirante, réfrigérateur : chaque appareil a ses propres contraintes de raccordement (eau, électricité, évacuation, gaz pour certains modèles). Décrivez l'appareil concerné dans votre demande pour que l'agent prépare l'intervention.",
          ],
        },
      ]}
      tips={[
        "Vérifiez que l'appareil est livré et accessible avant l'intervention.",
        "Pour un appareil encastrable, précisez les dimensions du meuble prévu.",
      ]}
      faq={[
        { q: 'Évacuez-vous aussi l\'ancien appareil ?', a: "Précisez-le dans votre demande, cela peut être ajouté à l'intervention selon la situation." },
        { q: 'Installez-vous les appareils au gaz ?', a: "Pour certains appareils, oui — indiquez le type d'appareil concerné, cela peut nécessiter une vérification spécifique." },
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
