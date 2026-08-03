import Link from 'next/link';
import { SITE_URL, SITE_NAME } from '../../lib/seo';
import { SUBSCRIPTION_COLORS } from '../../lib/subscriptionColors';

const title = "Offre de lancement Jobber+ — cadeau de naissance & Jobber Gold offert";
const description =
  "Jobber+ est en bêta depuis le 01/08/2026 : 20 premières missions sans aucun frais de plateforme pour les jobbers, et la carte Jobber Gold offerte pour toute inscription avant le 15 septembre 2026.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/offre-lancement` },
  openGraph: { title, description, url: `${SITE_URL}/offre-lancement`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

const goldColor = SUBSCRIPTION_COLORS.JOBBER_GOLD;

export default function OffreLancementPage() {
  return (
    <div>
      <section className="overflow-hidden rounded-lg border border-ochre/40 bg-ochre-light py-10 px-6 text-center md:px-12">
        <span className="rounded-full bg-ochre px-3 py-1 text-xs font-bold uppercase tracking-wide text-ink">
          Offre de lancement — en ligne depuis le 01/08/2026
        </span>
        <h1 className="mx-auto mt-4 max-w-2xl font-display text-4xl font-bold leading-[1.1] text-ink md:text-5xl">
          Notre cadeau de naissance, pour les premiers jobbers de la plateforme.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-ink">
          Jobber+ est actuellement en bêta-test : les missions affichées servent à effectuer nos derniers réglages.
          Mais vous pouvez déjà vous inscrire comme jobber et profiter de deux avantages de lancement.
        </p>
      </section>

      <section className="mt-16 grid gap-8 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-6 md:p-8">
          <span className="text-3xl">🎁</span>
          <h2 className="mt-3 font-display text-xl font-semibold text-ink">Le cadeau de naissance</h2>
          <p className="mt-2 text-sm text-slate-600">
            Sur vos <strong>20 premières missions</strong> réalisées sur Jobber+, aucun frais de plateforme n'est
            prélevé. Vous encaissez l'intégralité de ce que le client paie.
          </p>
        </div>

        <div
          className="rounded-lg p-6 md:p-8"
          style={{ backgroundColor: goldColor.bg, color: goldColor.text }}
        >
          <span className="text-3xl">⭐</span>
          <h2 className="mt-3 font-display text-xl font-semibold">Jobber Gold offert</h2>
          <p className="mt-2 text-sm opacity-90">
            Tout nouveau jobber inscrit avant le <strong>15 septembre 2026</strong> reçoit la carte{' '}
            <strong>Jobber Gold</strong> — 20 missions par mois sans aucun frais — inclus gratuitement, sans carte
            bancaire demandée. Un badge Gold apparaît sur votre profil.
          </p>
        </div>
      </section>

      <section className="mt-16 rounded-lg border border-slate-200 bg-white p-6 text-center md:p-10">
        <h2 className="font-display text-2xl font-semibold text-moss">Jobber Gold, en détail</h2>
        <div
          className="mx-auto mt-6 max-w-sm rounded-lg p-5 text-left"
          style={{ backgroundColor: goldColor.bg, color: goldColor.text }}
        >
          <div className="flex items-center justify-between">
            <div className="font-display text-lg font-bold">Jobber Gold</div>
            <div className="text-right">
              <div className="font-display text-xl font-bold">20 €</div>
              <div className="text-xs opacity-75">/ mois</div>
            </div>
          </div>
          <ul className="mt-3 space-y-1.5 text-sm opacity-90">
            <li>✓ 20 missions par mois sans aucun frais</li>
            <li>✓ Pas de carte bancaire demandée pour l'offre de lancement</li>
            <li>✓ Pastille & badge Gold sur votre profil</li>
          </ul>
        </div>
        <p className="mx-auto mt-6 max-w-xl text-sm text-slate-500">
          Après le 15 septembre 2026 ou une fois vos missions gratuites du cadeau de naissance épuisées, retrouvez
          le détail de toutes nos cartes et de nos frais sur la page{' '}
          <Link href="/frais" className="font-medium text-moss hover:underline">Nos frais</Link>.
        </p>
      </section>

      <section className="mt-16 mb-4 rounded-lg bg-ink py-10 px-6 text-center text-white md:px-12">
        <h2 className="font-display text-2xl font-semibold">Prêt à devenir jobber ?</h2>
        <p className="mx-auto mt-2 max-w-xl text-white/80">
          Inscrivez-vous avant le 15 septembre 2026 pour profiter du cadeau de naissance et de la carte Gold
          offerte.
        </p>
        <div className="mt-6">
          <Link href="/auth/register" className="rounded-md bg-white px-6 py-3 font-medium text-ink hover:bg-slate-100">
            Je m'inscris comme jobber
          </Link>
        </div>
      </section>
    </div>
  );
}
