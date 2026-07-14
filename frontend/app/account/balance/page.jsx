'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';

function dateHeader(date) {
  const label = new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function BalancePage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [authLoading, user]);

  useEffect(() => {
    if (!token) return;
    api.spendingHistory(token).then(({ entries }) => setHistory(entries)).catch(() => {});
  }, [token]);

  if (!user) return null;

  const creditBalance = user.creditBalance ?? 0;

  const groups = [];
  for (const entry of history) {
    const header = dateHeader(entry.date);
    let group = groups.find((g) => g.header === header);
    if (!group) { group = { header, entries: [] }; groups.push(group); }
    group.entries.push(entry);
  }

  return (
    <div className="mx-auto max-w-xl">
      <Link href="/account" className="text-sm font-medium text-moss">← Mon compte</Link>
      <h1 className="mt-3 font-display text-2xl font-semibold text-ink">Mon solde</h1>

      <div className="mt-4 text-center">
        <div className="font-display text-4xl font-bold text-ink">{creditBalance.toFixed(2).replace(/\.00$/, '')} €</div>
        <p className="mt-1 text-sm text-slate-500">Montant total disponible pour payer vos prochains services.</p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-moss p-4 text-white">
          <div className="text-sm font-semibold">Cagnotte</div>
          <div className="mt-6 text-2xl font-bold">{creditBalance.toFixed(2).replace(/\.00$/, '')} €</div>
          <p className="mt-1 text-xs text-white/80">Montant des remboursements, cartes cadeaux et promotions.</p>
          <button
            type="button"
            disabled={creditBalance <= 0}
            className="mt-3 w-full rounded-full bg-white/20 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            ⇄ Remboursement
          </button>
        </div>
        <div className="rounded-2xl bg-ink p-4 text-white">
          <div className="text-sm font-semibold">Heures de service réservées en CESU</div>
          <div className="mt-6 text-2xl font-bold">~0h / 0 €</div>
          <p className="mt-1 text-xs text-white/70">Vos tickets CESU vous permettent de pré-réserver des heures de service.</p>
          <Link href="/account/cesu" className="mt-3 block w-full rounded-full bg-white py-2 text-center text-xs font-semibold text-ink">
            + Voir plus
          </Link>
        </div>
      </div>

      <h2 className="mt-8 font-display text-lg font-semibold text-ink">Historique des transactions</h2>
      <div className="mt-3 space-y-5">
        {groups.length === 0 && <p className="text-sm text-slate-400">Aucune transaction.</p>}
        {groups.map((group) => (
          <div key={group.header}>
            <div className="text-xs text-slate-400">{group.header}</div>
            <div className="mt-2 divide-y divide-slate-100">
              {group.entries.map((entry, i) => (
                <div key={i} className="flex items-center gap-3 py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-ink">👤</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-ink">{entry.subLabel}</div>
                    <div className="truncate text-xs text-slate-400">{entry.label}</div>
                  </div>
                  <span className="shrink-0 text-sm font-medium text-ink">{entry.amount.toFixed(2)} €</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
