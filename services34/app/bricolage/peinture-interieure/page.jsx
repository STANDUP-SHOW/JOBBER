import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = 'Peinture intérieure à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Rafraîchir une pièce ou repeindre un logement entier : nos agents appliquent une peinture soignée, protection des sols et meubles comprise.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/bricolage/peinture-interieure` },
  openGraph: { title, description, url: `${SITE_URL}/bricolage/peinture-interieure`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function PeintureInterieurePage() {
  return (
    <>
    <BrandSetter category="bricolage" label="Bricolage" />
    <PrestationDetailPage
      category="bricolage"
      categoryLabel="Bricolage"
      categoryHref="/bricolage"
      eyebrow="Bricolage"
      title="Peinture intérieure"
      intro="Une pièce à rafraîchir ou un logement entier à repeindre : nos agents préparent les surfaces et appliquent une peinture nette, en respectant le nombre de couches souhaité."
      sections={[
        {
          heading: 'Une préparation soignée avant la peinture',
          body: [
            "La qualité d'une peinture se joue avant tout dans la préparation : protection des sols et du mobilier, rebouchage des petits trous, ponçage si nécessaire. Nos agents ne se contentent pas d'appliquer la peinture, ils préparent la surface pour un rendu durable.",
          ],
        },
      ]}
      steps={[
        { title: 'Protection de la pièce', desc: "Sols et meubles sont protégés avant toute intervention." },
        { title: 'Préparation des murs', desc: "Petits trous rebouchés, surfaces poncées si besoin." },
        { title: "Application de la peinture", desc: "Une ou plusieurs couches selon le rendu souhaité et la couleur choisie." },
        { title: 'Finitions', desc: "Contrôle des bords et retouches avant la fin de l'intervention." },
      ]}
      tips={[
        "Précisez la surface approximative et le nombre de pièces concernées pour un devis adapté.",
        "Si vous avez déjà choisi votre peinture, indiquez-le — sinon l'agent peut vous conseiller.",
      ]}
      faq={[
        { q: 'Dois-je acheter la peinture moi-même ?', a: "En général oui, sauf si vous demandez à l'agent de s'en charger — précisez-le dans votre demande." },
        { q: 'Combien de temps faut-il pour repeindre une pièce ?', a: "Cela dépend de la surface et du nombre de couches — l'agent vous donne une estimation après avoir pris connaissance de votre demande." },
      ]}
      related={[
        { label: '🔧 Retour à Bricolage', href: '/bricolage' },
        { label: 'Pose de papier peint', href: '/bricolage/pose-papier-peint' },
        { label: 'Demander une intervention', href: '/demande' },
      ]}
    />
    </>
  );
}
