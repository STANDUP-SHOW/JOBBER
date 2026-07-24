import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = "Arrosage pendant l'absence à Béziers, Agde, Vias, Marseillan — Services 34";
const description = "Résidence secondaire ou départ en vacances : nos agents arrosent votre jardin et vos plantes pendant votre absence, en toute confiance.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/jardinage/arrosage-pendant-absence` },
  openGraph: { title, description, url: `${SITE_URL}/jardinage/arrosage-pendant-absence`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function ArrosagePendantAbsencePage() {
  return (
    <>
    <BrandSetter category="jardinage" label="Jardinage" />
    <PrestationDetailPage
      category="jardinage"
      categoryLabel="Jardinage"
      categoryHref="/jardinage"
      eyebrow="Jardinage"
      title="Arrosage pendant l'absence"
      intro="Vous partez en vacances ou possédez une résidence secondaire sur le littoral : nos agents arrosent jardin, potager et plantes en pot selon le calendrier que vous définissez."
      sections={[
        {
          heading: "Un service précieux pour les résidences secondaires",
          body: [
            "Le littoral entre Agde, Vias et Marseillan compte de nombreuses résidences secondaires, avec un climat estival sec qui rend l'arrosage régulier indispensable. Nos agents interviennent selon la fréquence que vous choisissez, en toute autonomie pendant votre absence.",
          ],
        },
      ]}
      tips={[
        "Précisez les zones à arroser (pelouse, massifs, potager, pots) et la fréquence souhaitée.",
        "Vous pouvez combiner cet arrosage avec un passage d'entretien général du jardin.",
      ]}
      faq={[
        { q: 'Comment l\'agent accède-t-il à mon jardin en mon absence ?', a: "Les modalités d'accès (code, boîte à clés, voisin) sont à convenir directement avec l'agent lors de la validation de la mission." },
        { q: 'Puis-je demander un arrosage régulier sur plusieurs semaines ?', a: "Oui, précisez la fréquence et la durée souhaitées dans votre demande." },
      ]}
      related={[
        { label: '🌱 Retour à Jardinage', href: '/jardinage' },
        { label: 'Entretien des massifs', href: '/jardinage/entretien-massifs' },
        { label: 'Demander une intervention', href: '/demande' },
      ]}
    />
    </>
  );
}
