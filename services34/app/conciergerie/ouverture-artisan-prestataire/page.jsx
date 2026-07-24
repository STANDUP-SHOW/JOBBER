import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = 'Ouverture pour un artisan ou un prestataire à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Un artisan doit intervenir chez vous mais vous ne pouvez pas être présent ? Nos agents ouvrent le logement et supervisent la visite.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/conciergerie/ouverture-artisan-prestataire` },
  openGraph: { title, description, url: `${SITE_URL}/conciergerie/ouverture-artisan-prestataire`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function OuvertureArtisanPrestatairePage() {
  return (
    <>
    <BrandSetter category="conciergerie" label="Conciergerie" />
    <PrestationDetailPage
      category="conciergerie"
      categoryLabel="Conciergerie"
      categoryHref="/conciergerie"
      eyebrow="Conciergerie"
      title="Ouverture pour un artisan ou un prestataire"
      intro="Un plombier, un électricien ou un livreur doit intervenir chez vous, mais vous êtes absent : nos agents ouvrent le logement et sont présents le temps de la visite."
      sections={[
        {
          heading: "Une présence rassurante en votre absence",
          body: [
            "Nos agents accueillent le professionnel à l'heure convenue, lui donnent accès aux zones concernées et restent présents pendant l'intervention si vous le souhaitez. Vous recevez un retour sur le déroulement de la visite.",
          ],
        },
      ]}
      tips={[
        "Précisez l'heure de rendez-vous convenue avec le professionnel et la nature de son intervention.",
        "Indiquez si l'agent doit rester présent pendant toute l'intervention ou seulement pour l'ouverture.",
      ]}
      faq={[
        { q: "L'agent reste-t-il présent pendant toute l'intervention ?", a: "Selon votre demande, il peut rester présent ou simplement ouvrir puis fermer le logement — précisez votre préférence." },
        { q: 'Puis-je organiser plusieurs interventions le même jour ?', a: "Oui, précisez le planning prévu dans votre demande." },
      ]}
      related={[
        { label: '🔑 Retour à Conciergerie', href: '/conciergerie' },
        { label: 'Remise et gestion des clés', href: '/conciergerie/remise-gestion-cles' },
        { label: 'Demander une intervention', href: '/demande' },
      ]}
    />
    </>
  );
}
