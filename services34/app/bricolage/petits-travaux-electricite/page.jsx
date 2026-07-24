import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = "Petits travaux d'électricité à Béziers, Agde, Vias, Marseillan — Services 34";
const description = "Changer une ampoule en hauteur, installer une prise ou un interrupteur : nos agents s'occupent des petites interventions électriques du quotidien.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/bricolage/petits-travaux-electricite` },
  openGraph: { title, description, url: `${SITE_URL}/bricolage/petits-travaux-electricite`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function PetitsTravauxElectricitePage() {
  return (
    <>
    <BrandSetter category="bricolage" label="Bricolage" />
    <PrestationDetailPage
      category="bricolage"
      categoryLabel="Bricolage"
      categoryHref="/bricolage"
      eyebrow="Bricolage"
      title="Petits travaux d'électricité"
      intro="Une prise à ajouter, un luminaire à installer, une ampoule difficile d'accès : nos agents interviennent sur les petites tâches électriques du quotidien."
      sections={[
        {
          heading: "Pour les interventions ponctuelles, pas les gros chantiers",
          body: [
            "Cette prestation couvre les petites interventions électriques simples : pose de luminaires, ajout d'une prise ou d'un interrupteur, installation d'un radiateur électrique d'appoint, ou encore la pose d'objets connectés. Pour une installation électrique complète ou une mise aux normes, consultez plutôt notre catégorie Électricité dédiée.",
          ],
        },
      ]}
      tips={[
        "Décrivez précisément l'intervention souhaitée : cela permet à l'agent de venir avec le matériel adapté.",
        "Pour toute installation liée au tableau électrique, une intervention plus complète peut être nécessaire — précisez-le dans votre demande.",
      ]}
      faq={[
        { q: 'Intervenez-vous sur le tableau électrique ?', a: "Pour de petites interventions ponctuelles, cela peut être possible — décrivez précisément le besoin dans votre demande." },
        { q: 'Installez-vous des objets connectés (prises, ampoules connectées) ?', a: "Oui, c'est une demande fréquente — précisez le type d'équipement souhaité." },
      ]}
      related={[
        { label: '🔧 Retour à Bricolage', href: '/bricolage' },
        { label: 'Installation électroménager', href: '/bricolage/installation-electromenager' },
        { label: 'Demander une intervention', href: '/demande' },
      ]}
    />
    </>
  );
}
