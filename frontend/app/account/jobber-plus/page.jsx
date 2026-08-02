'use client';

import Link from 'next/link';
import AccountBackButton from '../../../components/AccountBackButton';

export default function JobberPlusPage() {
  return (
    <div className="max-w-xl">
      <AccountBackButton />

      <span className="label-eyebrow text-moss">Plateforme Corporate</span>
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

      <div className="mt-6 space-y-3">
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
          <p className="mt-2 text-xs text-slate-400">Offerte avec la formule Entreprise Illimité.</p>
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
          <p className="mt-2 text-xs text-slate-400">Offerte avec la formule Entreprise Illimité.</p>
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
