import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = 'Nettoyage de terrasse à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Terrasse encrassée par la mousse, le pollen ou les embruns : nos agents nettoient dalles, bois et carrelage extérieur en profondeur.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/jardinage/nettoyage-terrasse` },
  openGraph: { title, description, url: `${SITE_URL}/jardinage/nettoyage-terrasse`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function NettoyageTerrassePage() {
  return (
    <>
    <BrandSetter category="jardinage" label="Jardinage" />
    <PrestationDetailPage
      category="jardinage"
      categoryLabel="Jardinage"
      categoryHref="/jardinage"
      eyebrow="Jardinage"
      title="Nettoyage de terrasse"
      intro="Mousse, taches, dépôts verts ou traces d'embruns : nos agents nettoient votre terrasse en profondeur, quel que soit le matériau."
      sections={[
        {
          heading: 'Une méthode adaptée à chaque revêtement',
          body: [
            "Dalles en pierre, carrelage extérieur, bois exotique ou composite : chaque matériau demande une méthode de nettoyage différente pour éviter de l'abîmer. Nos agents utilisent un nettoyage haute pression maîtrisé ou un traitement plus doux selon la fragilité du support.",
          ],
        },
        {
          heading: "Une prestation utile en bord de mer",
          body: [
            "À Agde, Vias ou Marseillan, la proximité du littoral favorise l'apparition de mousse et de dépôts salins sur les terrasses extérieures. Un entretien régulier permet de conserver l'aspect d'origine du revêtement plus longtemps.",
          ],
        },
      ]}
      tips={[
        "Précisez le type de revêtement (pierre, bois, composite, carrelage) pour un traitement adapté.",
        "Un nettoyage en fin d'hiver prépare la terrasse pour la saison estivale.",
      ]}
      faq={[
        { q: 'Utilisez-vous un nettoyeur haute pression ?', a: "Oui, quand le matériau le permet. Pour les surfaces plus fragiles, une méthode plus douce est utilisée." },
        { q: 'Traitez-vous aussi les allées et le mobilier de jardin ?', a: "Oui, précisez les zones et éléments concernés dans votre demande." },
      ]}
      related={[
        { label: '🌱 Retour à Jardinage', href: '/jardinage' },
        { label: 'Entretien de piscine', href: '/jardinage/entretien-piscine' },
        { label: 'Demander une intervention', href: '/demande' },
      ]}
    />
    </>
  );
}
