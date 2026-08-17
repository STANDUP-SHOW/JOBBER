'use client';

import Link from 'next/link';

const MISSION_PLANS = [
  { name: 'Sans carte', price: null, detail: '10 € de frais par mission — gratuit pour le jobber' },
  { name: 'Entreprise 20', price: '99,90 €', detail: '20 missions par mois sans frais' },
  { name: 'Entreprise 50', price: '199,90 €', detail: '50 missions par mois sans frais' },
  { name: 'Entreprise Illimité', price: '499,90 €', detail: 'Tout inclus — missions illimitées, aucun frais de mission' },
];

export default function JobberPlusPage() {
  return (
    <div className="max-w-3xl">

      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Un back-office de gestion privé</h1>
      <p className="mt-3 text-slate-600">
        Vous avez une entreprise de services à la personne et vous avez besoin de personnel ? Vous souhaitez créer
        votre propre entreprise de services ?
      </p>
      <p className="mt-3 text-slate-600">
        Jobber vous accompagne et met à votre disposition une plateforme en ligne SEO professionnelle, à votre
        marque, pour une présence en ligne importante sur le secteur de votre choix. Gestion intégrale — manuelle
        ou automatique — pensée pour être rentable dès la mise en route.
      </p>

      <h2 className="mt-8 font-display text-lg font-semibold text-ink">Tarifs cartes missions</h2>
      <div className="mt-4 space-y-3">
        {MISSION_PLANS.map((plan) => (
          <div key={plan.name} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="font-display text-base font-semibold text-ink">{plan.name}</div>
              {plan.price && (
                <div className="text-right">
                  <div className="font-display text-lg font-bold text-ink">{plan.price}</div>
                  <div className="text-xs text-slate-400">/ mois</div>
                </div>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-500">{plan.detail}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-8 font-display text-lg font-semibold text-ink">Options facultatives</h2>
      <div className="mt-4 space-y-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="font-display text-base font-semibold text-ink">Plateforme Corporate de sous-traitance jobbers</div>
            <div className="text-right">
              <div className="font-display text-lg font-bold text-ink">50 €</div>
              <div className="text-xs text-slate-400">TTC / mois</div>
            </div>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Votre back-office privé pour gérer vos demandes, vos jobbers et vos clients — comme Jobber+ le fait
            pour ses propres partenaires Corporate.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="rounded-md bg-yellow-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-800">
              Offert
            </span>
            <span className="text-xs text-slate-400">avec Entreprise Illimité, durant toute la durée de la carte.</span>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="font-display text-base font-semibold text-ink">Création site SEO secteur</div>
            <div className="text-right">
              <div className="font-display text-lg font-bold text-ink">249,90 €</div>
              <div className="text-xs text-slate-400">une fois</div>
            </div>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Un site vitrine optimisé pour le référencement local sur votre secteur d'activité et votre zone
            géographique.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="rounded-md bg-yellow-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-800">
              Offert
            </span>
            <span className="text-xs text-slate-400">avec Entreprise Illimité, durant toute la durée de la carte.</span>
          </div>
        </div>
      </div>

      <p className="mt-6 text-center text-sm">
        <Link href="/plateforme-corporate" className="font-medium text-moss hover:underline">
          Voir le détail de la plateforme (SEO, back-office, pilote automatique) →
        </Link>
      </p>

      <p className="mt-3 text-center text-sm text-slate-400">
        Une question ? <Link href="/messages" className="font-medium text-moss">Contactez-nous</Link>.
      </p>
    </div>
  );
}
