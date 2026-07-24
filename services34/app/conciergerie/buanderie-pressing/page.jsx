import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = 'Buanderie-Pressing pour location saisonnière à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Linge de lit, de toilette et de table lavé en pressing entre chaque location : nos agents collectent, déposent et remplacent votre linge, facturé par couchage.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/conciergerie/buanderie-pressing` },
  openGraph: { title, description, url: `${SITE_URL}/conciergerie/buanderie-pressing`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function BuanderiePressingPage() {
  return (
    <>
    <BrandSetter category="conciergerie" label="Conciergerie" />
    <PrestationDetailPage
      category="conciergerie"
      categoryLabel="Conciergerie"
      categoryHref="/conciergerie"
      eyebrow="Conciergerie"
      title="Buanderie-Pressing"
      intro="Entre deux locataires, le linge doit être propre, sans exception. Nos agents collectent le linge de votre logement, le déposent en pressing et le remplacent, selon vos besoins : linge de lit, linge de toilette, linge de table."
      sections={[
        {
          heading: 'Un contrat simple, basé sur le nombre de couchages',
          body: [
            "Le tarif est établi selon le nombre de couchages occupés dans votre logement, et non selon une formule forfaitaire complexe. Chaque couchage utilisé donne lieu à un pack complet de linge propre, prêt pour le locataire suivant.",
          ],
        },
      ]}
      methods={{
        heading: 'Le pack complet — 15 € par couchage',
        options: [
          { title: 'Linge de lit', desc: 'Drap housse, drap, housse de couette, taie de traversin, taie d\'oreiller.' },
          { title: 'Linge de toilette', desc: '3 serviettes de toilette.' },
          { title: 'Linge de table', desc: 'Une serviette de table et une nappe.' },
        ],
      }}
      tips={[
        "Un pack complémentaire de chiffons de nettoyage et torchons peut être ajouté à votre demande.",
        "En hiver, des plaids supplémentaires peuvent être inclus sur simple demande.",
        "Précisez le nombre de couchages occupés lors de chaque rotation locative pour un tarif exact.",
      ]}
      faq={[
        { q: 'Le tarif de 15 € par couchage couvre-t-il tout le linge nécessaire ?', a: "Oui, il couvre le pack complet par couchage : linge de lit, 3 serviettes de toilette, une serviette de table et une nappe. Les chiffons de nettoyage et les plaids d'hiver sont proposés en complément." },
        { q: 'Le linge est-il lavé en pressing ou sur place ?', a: "Nos agents collectent le linge utilisé, le déposent en pressing, puis le remplacent par du linge propre avant l'arrivée du locataire suivant." },
        { q: 'Puis-je combiner cette prestation avec la Gestion complète ?', a: "Oui, la Buanderie-Pressing est incluse dans la formule Gestion complète, ou peut être demandée seule si vous gérez le reste vous-même." },
      ]}
      related={[
        { label: '🔑 Retour à Conciergerie', href: '/conciergerie' },
        { label: 'Gestion complète', href: '/conciergerie/gestion-complete' },
        { label: 'Demander une intervention', href: '/demande' },
      ]}
    />
    </>
  );
}
