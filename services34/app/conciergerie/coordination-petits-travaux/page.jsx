import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = 'Coordination de petits travaux à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Vous êtes loin de votre bien mais des petits travaux doivent être suivis sur place : nos agents coordonnent pour vous.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/conciergerie/coordination-petits-travaux` },
  openGraph: { title, description, url: `${SITE_URL}/conciergerie/coordination-petits-travaux`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function CoordinationPetitsTravauxPage() {
  return (
    <>
    <BrandSetter category="conciergerie" label="Conciergerie" />
    <PrestationDetailPage
      category="conciergerie"
      categoryLabel="Conciergerie"
      categoryHref="/conciergerie"
      eyebrow="Conciergerie"
      title="Coordination de petits travaux"
      intro="Vous ne pouvez pas être sur place pour suivre de petits travaux dans votre résidence secondaire ? Nos agents assurent la coordination sur site en votre absence."
      sections={[
        {
          heading: 'Un relais fiable sur place',
          body: [
            "Nos agents peuvent accueillir les intervenants, vérifier l'avancement des travaux et vous transmettre un compte-rendu avec photos. C'est un service particulièrement utile pour les propriétaires de résidence secondaire qui vivent loin de Béziers ou de la région.",
          ],
        },
      ]}
      tips={[
        "Décrivez la nature des travaux et les intervenants prévus dans votre demande.",
        "Un compte-rendu avec photos peut vous être transmis après chaque passage.",
      ]}
      faq={[
        { q: "L'agent peut-il valider les travaux à ma place ?", a: "Non, l'agent assure une présence et un suivi, mais la validation finale des travaux reste de votre responsabilité." },
        { q: "Puis-je demander un compte-rendu photo à chaque étape ?", a: "Oui, précisez cette préférence dans votre demande." },
      ]}
      related={[
        { label: '🔑 Retour à Conciergerie', href: '/conciergerie' },
        { label: "Ouverture pour un artisan ou un prestataire", href: '/conciergerie/ouverture-artisan-prestataire' },
        { label: 'Demander une intervention', href: '/demande' },
      ]}
    />
    </>
  );
}
