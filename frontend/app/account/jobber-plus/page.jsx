'use client';

import Link from 'next/link';
import { useAuth } from '../../../lib/auth-context';

export default function JobberPlusPage() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-xl">
      <Link href="/account" className="text-sm font-medium text-moss">← Mon compte</Link>

      <span className="label-eyebrow text-moss">Espace CORPORATE</span>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Jobber+</h1>
      <p className="mt-3 text-slate-600">
        Vous avez une entreprise de services à la personne et vous avez besoin de personnel ? Vous souhaitez créer
        une entreprise de services ?
      </p>
      <p className="mt-3 text-slate-600">
        Jobber vous accompagne et met à votre disposition <strong className="text-ink">Jobber+</strong>, une
        plateforme intelligente de gestion de votre business en ligne couplée à votre vitrine web Corporate.
      </p>

      <div className="mt-6 rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        Jobber+ arrive bientôt. Nous reviendrons vers vous avec plus de détails sur cette plateforme.
      </div>

      {user && (
        <p className="mt-6 text-center text-sm text-slate-400">
          Une question en attendant ? <Link href="/messages" className="font-medium text-moss">Contactez-nous</Link>.
        </p>
      )}
    </div>
  );
}
