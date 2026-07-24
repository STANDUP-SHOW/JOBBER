import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = 'Relevé de compteurs à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Eau, électricité : nos agents relèvent vos compteurs et vous transmettent les index, pratique en votre absence ou entre deux locataires.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/conciergerie/releve-compteurs` },
  openGraph: { title, description, url: `${SITE_URL}/conciergerie/releve-compteurs`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function ReleveCompteursPage() {
  return (
    <>
    <BrandSetter category="conciergerie" label="Conciergerie" />
    <PrestationDetailPage
      category="conciergerie"
      categoryLabel="Conciergerie"
      categoryHref="/conciergerie"
      eyebrow="Conciergerie"
      title="Relevé de compteurs"
      intro="Changement de fournisseur, fin de bail, suivi de consommation en votre absence : nos agents relèvent vos compteurs d'eau et d'électricité et vous transmettent les index."
      sections={[
        {
          heading: 'Un relevé utile à plusieurs moments clés',
          body: [
            "Le relevé de compteurs est souvent nécessaire lors d'un changement de locataire, d'un changement de fournisseur d'énergie, ou simplement pour suivre votre consommation à distance si vous n'êtes pas sur place. Nos agents notent les index avec précision et vous les transmettent.",
          ],
        },
      ]}
      tips={[
        "Précisez les compteurs concernés (eau, électricité, éventuellement gaz) et leur emplacement si possible.",
        "Ce relevé peut être combiné avec un état des lieux d'entrée ou de sortie.",
      ]}
      faq={[
        { q: 'Pouvez-vous combiner le relevé avec un état des lieux ?', a: "Oui, c'est une combinaison fréquente lors d'un changement de locataire." },
        { q: 'Sous quel délai recevrai-je les index relevés ?', a: "Ils vous sont transmis rapidement après le passage de l'agent." },
      ]}
      related={[
        { label: '🔑 Retour à Conciergerie', href: '/conciergerie' },
        { label: "État des lieux d'entrée et de sortie", href: '/conciergerie/etat-des-lieux-entree-sortie' },
        { label: 'Demander une intervention', href: '/demande' },
      ]}
    />
    </>
  );
}
