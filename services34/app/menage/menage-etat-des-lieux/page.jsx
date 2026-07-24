import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = "Ménage d'état des lieux à Béziers, Agde, Vias, Marseillan — Services 34";
const description = "Avant une remise de clés ou un état des lieux d'entrée, nos agents assurent un ménage complet pour un logement impeccable.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/menage/menage-etat-des-lieux` },
  openGraph: { title, description, url: `${SITE_URL}/menage/menage-etat-des-lieux`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function MenageEtatDesLieuxPage() {
  return (
    <>
    <BrandSetter category="menage" label="Ménage" />
    <PrestationDetailPage
      category="menage"
      categoryLabel="Ménage"
      categoryHref="/menage"
      eyebrow="Ménage"
      title="Ménage d'état des lieux"
      intro="Que ce soit avant un état des lieux d'entrée ou de sortie, un logement impeccable évite les mauvaises surprises. Nos agents assurent un ménage complet, prêt pour l'inspection."
      sections={[
        {
          heading: "Un ménage pensé pour l'inspection",
          body: [
            "Un état des lieux se joue souvent sur des détails : propreté des sols, des vitres, de l'électroménager, absence de traces dans les sanitaires. Nos agents connaissent les points de vigilance habituels et s'assurent que le logement est prêt à être inspecté.",
          ],
        },
      ]}
      tips={[
        "Prévoyez cette prestation quelques jours avant la date officielle de l'état des lieux.",
        "Précisez si le logement est vide ou encore meublé au moment du ménage.",
      ]}
      faq={[
        { q: 'Le ménage couvre-t-il aussi l\'électroménager (four, réfrigérateur) ?', a: "Oui, précisez-le dans votre demande — c'est un point souvent vérifié lors d'un état des lieux." },
        { q: 'Intervenez-vous en cas de délai très court avant la remise des clés ?', a: "Faites votre demande dès que possible, en précisant l'urgence — nous ferons au mieux selon la disponibilité des agents." },
      ]}
      related={[
        { label: '🧹 Retour à Ménage', href: '/menage' },
        { label: 'Nettoyage de fin de bail', href: '/menage/nettoyage-fin-de-bail' },
        { label: 'Demander une intervention', href: '/demande' },
      ]}
    />
    </>
  );
}
