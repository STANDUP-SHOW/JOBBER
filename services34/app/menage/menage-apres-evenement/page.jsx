import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = 'Ménage après un événement à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Anniversaire, réception, fête de famille : nos agents remettent votre logement en ordre le lendemain, sans que vous ayez à vous en occuper.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/menage/menage-apres-evenement` },
  openGraph: { title, description, url: `${SITE_URL}/menage/menage-apres-evenement`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function MenageApresEvenementPage() {
  return (
    <>
    <BrandSetter category="menage" label="Ménage" />
    <PrestationDetailPage
      category="menage"
      categoryLabel="Ménage"
      categoryHref="/menage"
      eyebrow="Ménage"
      title="Ménage après un événement"
      intro="Après une fête, un anniversaire ou une réception, nos agents s'occupent du nettoyage complet du logement pendant que vous profitez de votre lendemain."
      sections={[
        {
          heading: "Un ménage complet, sans effort de votre part",
          body: [
            "Vaisselle, sols, surfaces, poubelles, rangement du mobilier déplacé : après un événement, le nettoyage peut vite devenir une corvée. Nos agents s'en occupent pour vous, souvent dès le lendemain matin si vous le souhaitez.",
          ],
        },
      ]}
      tips={[
        "Précisez le nombre approximatif d'invités et la nature de l'événement pour un devis adapté.",
        "Vous pouvez planifier l'intervention pour le lendemain matin de l'événement.",
      ]}
      faq={[
        { q: 'Intervenez-vous le lendemain matin d\'une soirée ?', a: "Oui, précisez le créneau souhaité dans votre demande — nous nous organisons selon la disponibilité des agents." },
        { q: 'La vaisselle est-elle incluse ?', a: "Oui, précisez ce besoin dans votre demande." },
      ]}
      related={[
        { label: '🧹 Retour à Ménage', href: '/menage' },
        { label: 'Ménage à domicile', href: '/menage/menage-a-domicile' },
        { label: 'Demander une intervention', href: '/demande' },
      ]}
    />
    </>
  );
}
