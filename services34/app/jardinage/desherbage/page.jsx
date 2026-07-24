import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = 'Désherbage à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Allées, massifs, terrasses envahis par les mauvaises herbes : nos agents désherbent manuellement ou mécaniquement selon vos préférences.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/jardinage/desherbage` },
  openGraph: { title, description, url: `${SITE_URL}/jardinage/desherbage`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function DesherbagePage() {
  return (
    <>
    <BrandSetter category="jardinage" label="Jardinage" />
    <PrestationDetailPage
      category="jardinage"
      categoryLabel="Jardinage"
      categoryHref="/jardinage"
      eyebrow="Jardinage"
      title="Désherbage"
      intro="Allées, massifs, pieds de mur, joints de terrasse : nos agents désherbent en profondeur pour retrouver un extérieur net."
      sections={[
        {
          heading: 'Manuel ou mécanique, selon la surface',
          body: [
            "Depuis l'interdiction des désherbants chimiques pour les particuliers, le désherbage se fait principalement à la main, à la binette ou avec des outils thermiques ou électriques adaptés aux joints et zones difficiles d'accès. Nos agents choisissent la méthode la plus efficace selon la surface et le type de mauvaises herbes.",
          ],
        },
      ]}
      tips={[
        "Précisez les zones concernées (allée, massif, terrasse) : la méthode de désherbage peut varier selon la surface.",
        "Un désherbage régulier limite la repousse et facilite l'entretien suivant.",
      ]}
      faq={[
        { q: 'Utilisez-vous des produits chimiques ?', a: "Non, l'usage de désherbants chimiques est interdit aux particuliers en France — nos agents utilisent des méthodes manuelles ou mécaniques." },
        { q: 'Le désherbage empêche-t-il la repousse ?', a: "Un désherbage régulier limite fortement la repousse, mais un passage d'entretien reste conseillé selon la saison." },
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
