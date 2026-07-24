import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = 'Nettoyage de logement insalubre à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Logement très encombré ou fortement dégradé : nos agents interviennent avec discrétion et sans jugement pour redonner un cadre de vie sain.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/menage/nettoyage-logement-insalubre` },
  openGraph: { title, description, url: `${SITE_URL}/menage/nettoyage-logement-insalubre`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function NettoyageLogementInsalubrePage() {
  return (
    <>
    <BrandSetter category="menage" label="Ménage" />
    <PrestationDetailPage
      category="menage"
      categoryLabel="Ménage"
      categoryHref="/menage"
      eyebrow="Ménage"
      title="Nettoyage de logement insalubre"
      intro="Logement très encombré, entretien laissé de côté depuis longtemps, situation d'urgence après un événement de vie difficile : nos agents interviennent avec discrétion, sans jugement, pour redonner un cadre de vie sain."
      sections={[
        {
          heading: 'Une intervention progressive, adaptée à chaque situation',
          body: [
            "Ce type de nettoyage se fait souvent en plusieurs étapes : évacuation des déchets et de l'encombrement, désinfection des surfaces, puis remise en état complète. Nos agents s'adaptent à l'ampleur de la situation et avancent à un rythme respectueux des personnes concernées, qu'il s'agisse de votre logement ou de celui d'un proche.",
          ],
        },
      ]}
      tips={[
        "Décrivez la situation aussi précisément que possible dans votre demande, cela aide à préparer l'intervention adaptée.",
        "Pour les situations les plus importantes, plusieurs interventions peuvent être nécessaires.",
      ]}
      faq={[
        { q: 'Cette prestation est-elle confidentielle ?', a: "Oui, nos agents interviennent avec discrétion et professionnalisme, sans jugement sur la situation rencontrée." },
        { q: "Puis-je faire cette demande pour le logement d'un proche ?", a: "Oui, précisez la situation dans votre demande — nous nous adapterons en conséquence." },
      ]}
      related={[
        { label: '🧹 Retour à Ménage', href: '/menage' },
        { label: 'Aide au rangement', href: '/menage/aide-au-rangement' },
        { label: 'Demander une intervention', href: '/demande' },
      ]}
    />
    </>
  );
}
