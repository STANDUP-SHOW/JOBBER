import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = "Aménagement de jardin à Béziers, Agde, Vias, Marseillan — Services 34";
const description = "Jardin méditerranéen, zen, contemporain : nos agents vous accompagnent pour repenser votre extérieur, du plan initial à la plantation.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/jardinage/amenagement-du-jardin` },
  openGraph: { title, description, url: `${SITE_URL}/jardinage/amenagement-du-jardin`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function AmenagementJardinPage() {
  return (
    <>
    <BrandSetter category="jardinage" label="Jardinage" />
    <PrestationDetailPage
      category="jardinage"
      categoryLabel="Jardinage"
      categoryHref="/jardinage"
      eyebrow="Jardinage"
      title="Aménagement de jardin"
      intro="Un extérieur bien pensé se vit autant qu'une maison bien décorée. Nos agents vous aident à donner une nouvelle allure à votre jardin, qu'il s'agisse d'un réaménagement ou d'une création complète."
      sections={[
        {
          heading: 'Quel style pour votre jardin ?',
          body: [
            "Avant toute intervention, tout est question d'ambiance recherchée : jardin méditerranéen, zen, contemporain, à l'anglaise… Un aménagement peut rester simple — quelques massifs et une allée repensée — ou plus ambitieux, avec une réorganisation complète de l'espace.",
            "Sur le littoral biterrois, le style méditerranéen a une résonance particulière : bien exposé plein sud, il s'accorde naturellement avec le climat de la région.",
          ],
        },
        {
          heading: 'Le jardin méditerranéen, une évidence à Béziers, Agde et Marseillan',
          body: [
            "Le jardin méditerranéen mise sur des essences résistantes à la sécheresse — yucca, mimosa, palmiers — associées à des plantes grasses (sédums, aloès) et aromatiques (romarin, thym, lavande). Bien choisi, il demande peu d'arrosage une fois installé, un vrai atout dans notre région.",
          ],
        },
        {
          heading: 'Le jardin zen, pour une ambiance apaisée',
          body: [
            "Inspiré des jardins japonais, ce style associe végétaux, minéral et eau — bambous, pierres, petits bassins — dans un agencement précis. Il convient particulièrement aux extérieurs de taille modeste où chaque élément a sa place.",
          ],
        },
      ]}
      tips={[
        "Définissez vos envies avant de commencer : style souhaité, usages (repas, potager, coin détente, piscine…), et contraintes du terrain.",
        "Le sol, l'exposition et le relief de votre parcelle conditionnent le choix des végétaux — un point que l'agent évalue avec vous avant de proposer un plan.",
        "Jouer sur les hauteurs, les volumes et les couleurs des végétaux donne du relief à un espace, même petit.",
      ]}
      faq={[
        { q: 'Comment aménager l\'entrée de ma maison ?', a: "Une allée nette, quelques plantes grimpantes ou fleuries (rosiers, glycine) et un éclairage discret suffisent souvent à transformer une entrée. C'est un projet que nos agents traitent volontiers en complément d'un aménagement plus large." },
        { q: 'Quel est le prix d\'un aménagement de jardin ?', a: "Le tarif dépend de l'ampleur du projet (surface, végétaux, éventuels travaux de terrassement). Décrivez votre projet, un agent Services 34 vous propose un devis adapté." },
        { q: 'Peut-on aménager un jardin en pente ?', a: "Oui, avec des solutions adaptées (terrasses, murets, plantations couvre-sol pour stabiliser la terre). C'est un point à évoquer dès votre demande pour que l'agent puisse évaluer le terrain." },
      ]}
      related={[
        { label: '🌱 Retour à Jardinage', href: '/jardinage' },
        { label: 'Débroussaillage', href: '/jardinage/debroussaillage' },
        { label: 'Demander une intervention', href: '/demande' },
      ]}
    />
    </>
  );
}
