import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = 'Montage de pergola, abri de jardin, serre à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Nouvelle pergola, abri de jardin ou serre à monter : nos agents assemblent votre équipement extérieur avec précision et solidité.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/jardinage/montage-pergola-abri-serre` },
  openGraph: { title, description, url: `${SITE_URL}/jardinage/montage-pergola-abri-serre`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function MontagePergolaAbriSerrePage() {
  return (
    <>
    <BrandSetter category="jardinage" label="Jardinage" />
    <PrestationDetailPage
      category="jardinage"
      categoryLabel="Jardinage"
      categoryHref="/jardinage"
      eyebrow="Jardinage"
      title="Montage de pergola, abri de jardin, serre"
      intro="Pergola pour se protéger du soleil, abri de jardin pour ranger votre matériel, serre pour prolonger la saison de culture : nos agents montent vos équipements extérieurs avec précision."
      sections={[
        {
          heading: 'Un montage stable, adapté à chaque structure',
          body: [
            "Chaque structure a ses propres exigences : ancrage au sol pour une pergola exposée au vent, mise à niveau pour un abri de jardin, fixation adaptée pour une serre. Nos agents suivent les instructions du fabricant et vérifient la stabilité de l'ensemble avant de terminer l'intervention.",
          ],
        },
      ]}
      tips={[
        "Précisez le type de structure et si le kit est déjà livré et présent sur place.",
        "Pour une pergola fixée en façade, vérifiez si une autorisation d'urbanisme est nécessaire selon la taille de la structure.",
      ]}
      faq={[
        { q: 'Dois-je fournir le kit de montage ?', a: "Oui, en général la fourniture reste à votre charge — l'agent s'occupe de l'assemblage et de la fixation." },
        { q: 'Montez-vous les structures ancrées au sol (dalle, plots béton) ?', a: "Oui, précisez le type d'ancrage prévu dans votre demande." },
      ]}
      related={[
        { label: '🌱 Retour à Jardinage', href: '/jardinage' },
        { label: 'Aménagement de jardin', href: '/jardinage/amenagement-du-jardin' },
        { label: 'Demander une intervention', href: '/demande' },
      ]}
    />
    </>
  );
}
