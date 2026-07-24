import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = 'Nettoyage de vitres à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Fenêtres, baies vitrées, vérandas : nos agents nettoient vos vitres sans traces, à l'intérieur comme à l'extérieur.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/menage/nettoyage-vitres` },
  openGraph: { title, description, url: `${SITE_URL}/menage/nettoyage-vitres`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function NettoyageVitresPage() {
  return (
    <>
    <BrandSetter category="menage" label="Ménage" />
    <PrestationDetailPage
      category="menage"
      categoryLabel="Ménage"
      categoryHref="/menage"
      eyebrow="Ménage"
      title="Nettoyage de vitres"
      intro="Fenêtres, baies vitrées, vérandas ou vitrines : nos agents nettoient vos vitres sans traces, y compris en hauteur ou dans les zones difficiles d'accès."
      sections={[
        {
          heading: 'Un résultat sans traces, intérieur et extérieur',
          body: [
            "Le nettoyage de vitres demande une technique particulière pour éviter les traces et les auréoles. Nos agents traitent l'intérieur comme l'extérieur des vitrages, y compris les baies vitrées et vérandas fréquentes dans les logements du littoral.",
          ],
        },
      ]}
      tips={[
        "Précisez le nombre de fenêtres ou la surface vitrée approximative.",
        "Pour des vitres en étage difficiles d'accès, signalez-le : cela peut nécessiter du matériel adapté.",
      ]}
      faq={[
        { q: 'Nettoyez-vous aussi les volets et encadrements ?', a: "Précisez ce besoin dans votre demande, cela peut être ajouté à l'intervention." },
        { q: 'Intervenez-vous sur des vitres en hauteur ?', a: "Oui, dans la limite des équipements de sécurité disponibles — signalez la configuration dans votre demande." },
      ]}
      related={[
        { label: '🧹 Retour à Ménage', href: '/menage' },
        { label: 'Ménage de printemps', href: '/menage/menage-de-printemps' },
        { label: 'Demander une intervention', href: '/demande' },
      ]}
    />
    </>
  );
}
