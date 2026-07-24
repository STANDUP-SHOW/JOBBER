import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = 'Repassage à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Un panier de linge qui s'accumule ? Nos agents s'occupent du repassage à votre domicile, chemises, draps et linge du quotidien.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/menage/repassage` },
  openGraph: { title, description, url: `${SITE_URL}/menage/repassage`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function RepassagePage() {
  return (
    <>
    <BrandSetter category="menage" label="Ménage" />
    <PrestationDetailPage
      category="menage"
      categoryLabel="Ménage"
      categoryHref="/menage"
      eyebrow="Ménage"
      title="Repassage"
      intro="Chemises, draps, linge de table, vêtements du quotidien : nos agents s'occupent du repassage à votre domicile, souvent en complément d'un ménage."
      sections={[
        {
          heading: 'Un service pratique, seul ou combiné au ménage',
          body: [
            "Le repassage peut être demandé seul ou combiné à une prestation de ménage dans la même intervention. Précisez le volume approximatif de linge à traiter pour que l'agent puisse s'organiser efficacement.",
          ],
        },
      ]}
      tips={[
        "Précisez le type de linge à repasser (chemises, draps, linge de table) et le volume approximatif.",
        "Vous pouvez combiner le repassage avec un ménage à domicile dans la même demande.",
      ]}
      faq={[
        { q: 'Puis-je combiner repassage et ménage dans la même intervention ?', a: "Oui, c'est une combinaison fréquente — précisez vos deux besoins dans la même demande." },
        { q: 'Faut-il fournir la table et le fer à repasser ?', a: "En général l'agent utilise votre matériel — précisez si vous souhaitez qu'il apporte le sien." },
      ]}
      related={[
        { label: '🧹 Retour à Ménage', href: '/menage' },
        { label: 'Ménage à domicile', href: '/menage/menage-a-domicile' },
        { label: 'Demander une intervention', href: '/demande' },
      ]}
    />
    </>
  );
}
