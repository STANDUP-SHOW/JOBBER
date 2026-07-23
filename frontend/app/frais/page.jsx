import Link from 'next/link';
import { SITE_URL, SITE_NAME } from '../../lib/seo';
import { SUBSCRIPTION_COLORS } from '../../lib/subscriptionColors';

const title = 'Nos frais, en toute transparence — Jobber';
const description =
  "Parlons argent. La version gratuite de Jobber donne accès à toutes les fonctionnalités : 2,50 € au demandeur et 2,50 € au jobber par mission réalisée, ou plus aucun frais avec un abonnement.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/frais` },
  openGraph: { title, description, url: `${SITE_URL}/frais`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

const MANAGER_PLANS = [
  { key: null, name: 'Sans abonnement', price: null, detail: '2,50 € de frais par mission réalisée' },
  { key: 'MANAGER_BOSS', name: 'Manager Boss', price: '10 €', detail: '10 missions par mois sans frais' },
  { key: 'MANAGER_HOLDER', name: 'Manager Holder', price: '20 €', detail: 'Missions illimitées sans frais' },
];

const JOBBER_PLANS = [
  { key: null, name: 'Sans abonnement', price: null, detail: '2,50 € de frais par mission décrochée' },
  { key: 'JOBBER_SILVER', name: 'Jobber Silver', price: '15 €', detail: '10 missions par mois sans frais' },
  { key: 'JOBBER_GOLD', name: 'Jobber Gold', price: '20 €', detail: '20 missions par mois sans frais' },
  { key: 'JOBBER_PLATINUM', name: 'Jobber Platine', price: '29,99 €', detail: 'Missions illimitées sans frais' },
];

function PlanTable({ title, plans }) {
  return (
    <div>
      <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
      <div className="mt-4 space-y-3">
        {plans.map((plan) => {
          const color = SUBSCRIPTION_COLORS[plan.key];
          return (
            <div
              key={plan.name}
              className={`rounded-lg p-4 ${color ? '' : 'border border-slate-200 bg-white'}`}
              style={color ? { backgroundColor: color.bg, color: color.text } : undefined}
            >
              <div className="flex items-center justify-between">
                <div className="font-display text-base font-bold">{plan.name}</div>
                {plan.price && (
                  <div className="font-display text-lg font-bold">
                    {plan.price} <span className={`text-sm font-normal ${color ? 'opacity-80' : 'text-slate-400'}`}>/ mois</span>
                  </div>
                )}
              </div>
              <p className={`mt-1 text-sm ${color ? 'opacity-90' : 'text-slate-500'}`}>{plan.detail}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function FraisPage() {
  return (
    <div>
      <section className="overflow-hidden rounded-lg border border-moss/20 bg-moss-light py-10 px-6 text-center md:px-12">
        <span className="rounded-full bg-moss px-3 py-1 text-xs font-bold uppercase tracking-wide text-paper">
          Parlons argent
        </span>
        <h1 className="mx-auto mt-4 max-w-2xl font-display text-4xl font-bold leading-[1.1] text-ink md:text-5xl">
          Voici nos frais, en toute transparence.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-ink">
          Qu'on veuille en gagner ou en économiser, Jobber est devenu notre plateforme d'échange. Alors parlons
          argent — sans surprise.
        </p>
      </section>

      <section className="mx-auto mt-16 max-w-2xl text-center">
        <h2 className="font-display text-2xl font-semibold text-moss">La version gratuite donne accès à tout</h2>
        <p className="mt-3 font-semibold text-ink">
          La version gratuite de Jobber donne accès à toutes les fonctionnalités de la plateforme. Avec les
          abonnements, la seule chose qui change, ce sont les prélèvements sur vos missions.
        </p>
      </section>

      <section className="mt-16 rounded-lg border border-slate-200 bg-white p-6 text-center md:p-10">
        <h2 className="font-display text-2xl font-semibold text-moss">Sans aucun abonnement</h2>
        <p className="mx-auto mt-3 max-w-xl text-lg text-ink">
          Pour une mission réalisée, Jobber prélève <strong>2,50 €</strong> au demandeur et <strong>2,50 €</strong>{' '}
          au jobber. Le manager et le jobber peuvent s'abonner pour ne plus avoir aucun frais à payer sur leurs
          missions.
        </p>
        <div className="mx-auto mt-6 max-w-xl rounded-lg bg-ink p-5 text-left">
          <p className="text-sm font-bold text-ochre">
            Concernant la formule sans abonnement à 2,50 € la mission : vous n'aurez jamais rien à payer à Jobber —
            les frais sont déduits seulement au moment de la transaction, quand la mission est réalisée et validée
            par le manager.
          </p>
          <p className="mt-2 text-sm font-bold text-ochre">
            Publier une mission, répondre aux offres, décrocher des missions, c'est entièrement GRATUIT !
          </p>
        </div>
      </section>

      <section className="mt-16 grid gap-10 sm:grid-cols-2">
        <PlanTable title="Récapitulatif des abonnements — Manager" plans={MANAGER_PLANS} />
        <PlanTable title="Récapitulatif des abonnements — Jobber" plans={JOBBER_PLANS} />
      </section>

      <section className="mt-16 mb-4 rounded-lg bg-ink py-10 px-6 text-center text-white md:px-12">
        <h2 className="font-display text-2xl font-semibold">Prêt à réduire vos frais ?</h2>
        <p className="mx-auto mt-2 max-w-xl text-white/80">
          Gérez votre abonnement directement depuis votre compte.
        </p>
        <div className="mt-6">
          <Link href="/account/subscription" className="rounded-md bg-white px-6 py-3 font-medium text-ink hover:bg-slate-100">
            Voir les abonnements
          </Link>
        </div>
      </section>
    </div>
  );
}
