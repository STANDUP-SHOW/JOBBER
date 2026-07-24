import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = 'Remise et gestion des clés à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Locataires, artisans, famille : nos agents gèrent la remise et la récupération des clés de votre logement selon vos consignes.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/conciergerie/remise-gestion-cles` },
  openGraph: { title, description, url: `${SITE_URL}/conciergerie/remise-gestion-cles`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function RemiseGestionClesPage() {
  return (
    <>
    <BrandSetter category="conciergerie" label="Conciergerie" />
    <PrestationDetailPage
      category="conciergerie"
      categoryLabel="Conciergerie"
      categoryHref="/conciergerie"
      eyebrow="Conciergerie"
      title="Remise et gestion des clés"
      intro="Vous n'êtes pas sur place pour remettre les clés à un locataire, un artisan ou un proche ? Nos agents s'en occupent selon les consignes que vous leur donnez."
      sections={[
        {
          heading: 'Une gestion fiable de vos accès',
          body: [
            "Que ce soit pour une remise ponctuelle ou une gestion récurrente (location saisonnière, passage d'artisans), nos agents assurent la remise et la récupération des clés selon un planning défini avec vous. Vous restez informé de chaque remise effectuée.",
          ],
        },
      ]}
      tips={[
        "Précisez les personnes autorisées à recevoir les clés et le créneau prévu pour chaque remise.",
        "Pour une gestion récurrente, un même agent peut être désigné comme référent.",
      ]}
      faq={[
        { q: 'Puis-je demander une gestion récurrente sur toute la saison ?', a: "Oui, précisez votre calendrier de séjours ou de passages dans votre demande." },
        { q: 'Serai-je informé à chaque remise de clés ?', a: "Oui, vous recevez une confirmation à chaque remise ou récupération effectuée." },
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
