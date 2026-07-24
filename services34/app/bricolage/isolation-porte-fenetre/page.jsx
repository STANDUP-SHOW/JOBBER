import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = 'Isolation de porte ou fenêtre à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Courants d'air, sensation de froid près des ouvertures : nos agents posent des joints d'isolation pour améliorer le confort de votre logement.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/bricolage/isolation-porte-fenetre` },
  openGraph: { title, description, url: `${SITE_URL}/bricolage/isolation-porte-fenetre`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function IsolationPorteFenetrePage() {
  return (
    <>
    <BrandSetter category="bricolage" label="Bricolage" />
    <PrestationDetailPage
      category="bricolage"
      categoryLabel="Bricolage"
      categoryHref="/bricolage"
      eyebrow="Bricolage"
      title="Isolation de porte ou fenêtre"
      intro="Un courant d'air persistant ou une facture de chauffage qui grimpe : nos agents posent des joints d'isolation sur vos portes et fenêtres pour limiter les déperditions."
      sections={[
        {
          heading: 'Une amélioration simple et rapide du confort',
          body: [
            "Joints en mousse, en silicone ou balai de porte : le choix dépend du type d'ouverture et de l'ampleur des courants d'air constatés. Cette intervention ne remplace pas un changement complet de menuiserie, mais améliore sensiblement l'isolation au quotidien.",
          ],
        },
      ]}
      tips={[
        "Repérez les zones où le courant d'air est le plus perceptible avant l'intervention.",
        "Pour des menuiseries anciennes ou très abîmées, un remplacement complet peut être plus adapté qu'une simple isolation.",
      ]}
      faq={[
        { q: 'Combien de temps dure ce type de pose ?', a: "Cela dépend du nombre d'ouvertures à traiter — l'agent vous donne une estimation selon votre demande." },
        { q: 'Est-ce que cela fonctionne sur de vieilles fenêtres ?', a: "Dans la plupart des cas oui, sauf si la menuiserie est trop déformée — l'agent pourra vous conseiller sur place." },
      ]}
      related={[
        { label: '🔧 Retour à Bricolage', href: '/bricolage' },
        { label: 'Remplacer une porte ou une poignée', href: '/bricolage/remplacer-porte-poignee' },
        { label: 'Demander une intervention', href: '/demande' },
      ]}
    />
    </>
  );
}
