import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = 'Entretien du potager ou du verger à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Désherbage, taille, récolte : nos agents entretiennent votre potager ou vos arbres fruitiers tout au long de la saison.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/jardinage/entretien-potager-verger` },
  openGraph: { title, description, url: `${SITE_URL}/jardinage/entretien-potager-verger`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function EntretienPotagerVergerPage() {
  return (
    <>
    <BrandSetter category="jardinage" label="Jardinage" />
    <PrestationDetailPage
      category="jardinage"
      categoryLabel="Jardinage"
      categoryHref="/jardinage"
      eyebrow="Jardinage"
      title="Entretien du potager ou du verger"
      intro="Un potager ou un verger déjà en place demande un suivi régulier : désherbage entre les rangs, taille des arbres fruitiers, récolte au bon moment. Nos agents assurent ce suivi tout au long de la saison."
      sections={[
        {
          heading: 'Un entretien qui suit le rythme des saisons',
          body: [
            "Chaque saison a ses tâches : semis et plantations au printemps, désherbage et arrosage en été, récolte et taille à l'automne. Nos agents s'adaptent au calendrier de votre potager ou de votre verger et peuvent intervenir en passages réguliers.",
          ],
        },
      ]}
      tips={[
        "Précisez le type de cultures présentes (légumes, arbres fruitiers) pour un entretien adapté.",
        "Un passage régulier limite l'envahissement par les mauvaises herbes entre deux récoltes.",
      ]}
      faq={[
        { q: 'Récoltez-vous les fruits et légumes ?', a: "Oui, sur demande — précisez la fréquence de passage souhaitée pendant la période de récolte." },
        { q: 'Taillez-vous les arbres fruitiers ?', a: "Oui, la taille des arbres fruitiers peut être incluse — précisez le nombre d'arbres concernés." },
      ]}
      related={[
        { label: '🌱 Retour à Jardinage', href: '/jardinage' },
        { label: 'Création de potager', href: '/jardinage/creation-potager' },
        { label: 'Demander une intervention', href: '/demande' },
      ]}
    />
    </>
  );
}
