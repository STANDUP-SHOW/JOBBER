import ServiceCategoryPage from '../../components/ServiceCategoryPage';
import BrandSetter from '../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../lib/seo';

const title = 'Ménage à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Ménage ponctuel ou régulier, nettoyage de fin de bail, vitres, repassage : des agents de confiance pour l'entretien de votre logement dans le biterrois.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/menage` },
  openGraph: { title, description, url: `${SITE_URL}/menage`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function MenagePage() {
  return (
    <>
    <BrandSetter category="menage" label="Ménage" />
    <ServiceCategoryPage
      category="menage"
      eyebrow="Ménage"
      title="Un intérieur impeccable, sans y passer votre temps"
      intro="Ménage ponctuel ou récurrent, nettoyage de fin de bail, vitres : nos agents s'occupent de l'entretien de votre logement à Béziers, Agde, Vias, Marseillan et alentours."
      guarantees={[
        { icon: '🔁', title: 'Ponctuel ou régulier', desc: "Un grand ménage avant un événement ou un passage chaque semaine, à vous de choisir la fréquence." },
        { icon: '🧴', title: 'Vos produits ou les nôtres', desc: "Précisez si vous préférez que l'agent utilise vos produits d'entretien ou apporte les siens." },
        { icon: '🪪', title: 'Des agents de confiance', desc: "Chaque agent Services 34 est identifié et intervient au nom de l'entreprise." },
        { icon: '📍', title: 'Un service local', desc: "Nous intervenons exclusivement à Béziers, Agde, Vias, Marseillan et dans les communes du pourtour biterrois." },
      ]}
      tasks={[
        { name: 'Ménage à domicile', href: '/menage/menage-a-domicile', icon: '🧹' },
        { name: 'Ménage de printemps', href: '/menage/menage-de-printemps', icon: '🌸' },
        { name: "Ménage d'état des lieux", href: '/menage/menage-etat-des-lieux', icon: '📋' },
        { name: 'Ménage de location saisonnière', href: '/menage/menage-location-saisonniere', icon: '🏖️' },
        { name: "Ménage après un événement", href: '/menage/menage-apres-evenement', icon: '🎉' },
        { name: 'Nettoyage de vitres', href: '/menage/nettoyage-vitres', icon: '🪟' },
        { name: 'Repassage', href: '/menage/repassage', icon: '👕' },
        { name: 'Aide au rangement', href: '/menage/aide-au-rangement', icon: '📦' },
        { name: 'Nettoyage après travaux', href: '/menage/nettoyage-apres-travaux', icon: '🪣' },
        { name: 'Nettoyage de fin de bail', href: '/menage/nettoyage-fin-de-bail', icon: '🔑' },
        { name: 'Nettoyage électroménager', href: '/menage/nettoyage-electromenager', icon: '🧼' },
        { name: 'Nettoyage textile (canapé, tapis, matelas)', href: '/menage/nettoyage-textile', icon: '🛋️' },
        { name: 'Nettoyage de logement insalubre', href: '/menage/nettoyage-logement-insalubre', icon: '🧴' },
      ]}
      faq={[
        { q: 'Puis-je demander un ménage récurrent ?', a: "Oui, précisez la fréquence souhaitée (hebdomadaire, bimensuelle…) lors de votre demande — nous vous proposons un agent régulier dans la mesure du possible." },
        { q: 'Le ménage de location saisonnière est-il possible entre deux locataires ?', a: "Oui, c'est l'une de nos prestations les plus demandées sur le littoral (Agde, Vias, Marseillan) entre deux séjours." },
        { q: 'Intervenez-vous pour un état des lieux ?', a: "Oui, nos agents interviennent avant une remise de clés ou un état des lieux de sortie." },
      ]}
    />
    </>
  );
}
