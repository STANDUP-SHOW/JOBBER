import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = 'Accrocher un tableau ou un miroir à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Un tableau ou un miroir accroché droit, bien centré et solidement fixé : une petite intervention que nos agents réalisent rapidement.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/bricolage/accrocher-tableau-miroir` },
  openGraph: { title, description, url: `${SITE_URL}/bricolage/accrocher-tableau-miroir`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function AccrocherTableauMiroirPage() {
  return (
    <>
    <BrandSetter category="bricolage" label="Bricolage" />
    <PrestationDetailPage
      category="bricolage"
      categoryLabel="Bricolage"
      categoryHref="/bricolage"
      eyebrow="Bricolage"
      title="Accrocher un tableau ou un miroir"
      intro="Un cadre de travers ou un miroir mal fixé, ça se voit. Nos agents s'occupent de la pose, avec le bon système de fixation selon le poids et le type de mur."
      sections={[
        {
          heading: "Une pose adaptée au poids de l'objet",
          body: [
            "Un petit cadre léger et un grand miroir ne se fixent pas de la même façon. Nos agents évaluent le poids approximatif de l'objet et le type de mur pour choisir la fixation adaptée — et éviter toute chute.",
          ],
        },
      ]}
      tips={[
        "Indiquez le poids approximatif de l'objet à accrocher si vous le connaissez.",
        "Pour plusieurs cadres à aligner, précisez-le : l'agent peut les positionner de façon cohérente.",
      ]}
      faq={[
        { q: 'Pouvez-vous accrocher plusieurs objets en une seule intervention ?', a: "Oui, indiquez le nombre d'objets à accrocher dans votre demande." },
        { q: "Que se passe-t-il si le mur est fragile ?", a: "L'agent adapte la fixation en conséquence — n'hésitez pas à le signaler dans votre demande si vous savez que le mur est particulier (cloison légère, mur ancien…)." },
      ]}
      related={[
        { label: '🔧 Retour à Bricolage', href: '/bricolage' },
        { label: "Fixation d'étagères", href: '/bricolage/fixation-etageres' },
        { label: 'Demander une intervention', href: '/demande' },
      ]}
    />
    </>
  );
}
