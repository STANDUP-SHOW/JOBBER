'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';

export default function AttestationsFiscalesPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [years, setYears] = useState(null);
  const [error, setError] = useState('');
  const [openYear, setOpenYear] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login?next=/compte/attestations-fiscales');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!token) return;
    api.taxSummary(token).then(({ years }) => {
      setYears(years);
      if (years.length > 0) setOpenYear(years[0].year);
    }).catch((e) => setError(e.message));
  }, [token]);

  if (!user) return null;

  const current = years?.find((y) => y.year === openYear);

  return (
    <div className="mx-auto max-w-xl">
      <div className="flex items-center justify-between print:hidden">
        <Link href="/compte" className="text-sm font-medium text-brand">← Mon compte</Link>
        {current && (
          <button type="button" onClick={() => window.print()} className="text-sm font-medium text-brand">
            Télécharger / Imprimer
          </button>
        )}
      </div>
      <h1 className="mt-3 font-display text-2xl font-semibold text-ink">Attestations fiscales</h1>
      <p className="mt-1 text-xs text-slate-400 print:hidden">
        Récapitulatif des sommes payées via Services 34, à joindre à votre déclaration de revenus (services à la
        personne éligibles au crédit d'impôt, sous réserve de leur nature). Services 34 ne télétransmet pas votre
        déclaration à l'administration fiscale.
      </p>

      {error && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {years?.length === 0 && (
        <div className="mt-8 rounded-lg border border-dashed border-slate-200 bg-white px-4 py-10 text-center">
          <p className="text-sm font-medium text-ink">Aucune attestation fiscale</p>
          <p className="mt-1 text-sm text-slate-400">Vous trouverez ici toutes les attestations fiscales de vos prestations.</p>
        </div>
      )}

      {years?.length > 0 && (
        <>
          <div className="mt-4 flex gap-2 print:hidden">
            {years.map((y) => (
              <button
                key={y.year}
                type="button"
                onClick={() => setOpenYear(y.year)}
                className={`rounded-full px-4 py-2 text-sm font-medium ${openYear === y.year ? 'bg-brand text-white' : 'bg-paper text-slate-500'}`}
              >
                {y.year}
              </button>
            ))}
          </div>

          {current && (
            <div className="mt-4 rounded-lg border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <div className="font-display text-lg font-semibold text-ink">Attestation {current.year}</div>
                  <div className="text-xs text-slate-400">{user.firstName} {user.lastName}</div>
                </div>
                <div className="text-right">
                  <div className="font-display text-xl font-bold text-ink">{current.totalPaid.toFixed(2)} €</div>
                  <div className="text-xs text-slate-400">total payé</div>
                </div>
              </div>

              <div className="mt-3 divide-y divide-slate-100">
                {current.missions.map((m, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5 text-sm">
                    <div>
                      <div className="font-medium text-ink">{m.title}</div>
                      <div className="text-xs text-slate-400">{m.category} · {m.provider} · {new Date(m.date).toLocaleDateString('fr-FR')}</div>
                    </div>
                    <span className="font-medium text-ink">{m.amount.toFixed(2)} €</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
