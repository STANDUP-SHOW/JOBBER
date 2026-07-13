'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';

const PERIODS = [
  { value: 'day', label: 'Jour' },
  { value: 'month', label: 'Mois' },
  { value: 'year', label: 'Année' },
];

function bucketKey(date, period) {
  const d = new Date(date);
  if (period === 'day') return d.toISOString().slice(0, 10);
  if (period === 'month') return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  return `${d.getFullYear()}`;
}

function bucketLabel(key, period) {
  if (period === 'day') return new Date(key).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  if (period === 'month') {
    const [y, m] = key.split('-');
    return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('fr-FR', { month: 'short' });
  }
  return key;
}

function dateHeader(date) {
  const label = new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function ArrowsIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m17 3 4 4-4 4" /><path d="M3 7h18" /><path d="m7 21-4-4 4-4" /><path d="M21 17H3" />
    </svg>
  );
}

function ChevronIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export default function WalletPage() {
  const { user, token, login, loading: authLoading } = useAuth();
  const router = useRouter();

  const [showBankForm, setShowBankForm] = useState(false);
  const [bankForm, setBankForm] = useState({
    firstName: '', lastName: '', phone: '',
    dobDay: '', dobMonth: '', dobYear: '',
    addressLine1: '', addressCity: '', addressPostalCode: '',
    iban: '', accountHolderName: '',
  });
  const [connectBusy, setConnectBusy] = useState(false);
  const [connectError, setConnectError] = useState('');
  const [payoutBusy, setPayoutBusy] = useState(false);
  const [payoutError, setPayoutError] = useState('');
  const [autoBusy, setAutoBusy] = useState(false);
  const [history, setHistory] = useState([]);
  const [period, setPeriod] = useState('day');
  const [txTab, setTxTab] = useState('done');

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [authLoading, user]);

  useEffect(() => {
    if (!token) return;
    api.walletHistory(token).then(({ entries }) => setHistory(entries)).catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!user) return;
    setBankForm((f) => ({ ...f, firstName: user.firstName || '', lastName: user.lastName || '', phone: user.phone || '' }));
  }, [user]);

  async function onBankSubmit(e) {
    e.preventDefault();
    setConnectBusy(true);
    setConnectError('');
    try {
      const result = await api.connectSetup(bankForm, token);
      const { user: refreshed } = await api.me(token);
      login(token, refreshed);
      setShowBankForm(false);
      if (!result.payoutsEnabled && result.requirementsCurrentlyDue?.length) {
        setPayoutError(`Informations manquantes côté Stripe : ${result.requirementsCurrentlyDue.join(', ')}`);
      }
    } catch (err) {
      setConnectError(err.message);
    } finally {
      setConnectBusy(false);
    }
  }

  async function onPayout() {
    setPayoutBusy(true);
    setPayoutError('');
    try {
      await api.connectPayout(token);
      const [{ user: refreshed }, { entries }] = await Promise.all([api.me(token), api.walletHistory(token)]);
      login(token, refreshed);
      setHistory(entries);
    } catch (err) {
      setPayoutError(err.message);
    } finally {
      setPayoutBusy(false);
    }
  }

  async function onToggleAutoPayout() {
    setAutoBusy(true);
    try {
      await api.updateProviderProfile({ autoPayout: !user.providerProfile?.autoPayout }, token);
      const { user: refreshed } = await api.me(token);
      login(token, refreshed);
    } catch (err) {
      setPayoutError(err.message);
    } finally {
      setAutoBusy(false);
    }
  }

  const pendingTotal = useMemo(
    () => history.filter((e) => e.type === 'payout' && e.status === 'PENDING').reduce((sum, e) => sum + Math.abs(e.amount), 0),
    [history]
  );

  const chartBuckets = useMemo(() => {
    const income = history.filter((e) => e.amount > 0);
    const map = new Map();
    for (const e of income) {
      const key = bucketKey(e.date, period);
      map.set(key, (map.get(key) || 0) + e.amount);
    }
    const entries = Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-7);
    const max = Math.max(1, ...entries.map(([, v]) => v));
    return entries.map(([key, value]) => ({ key, label: bucketLabel(key, period), value, pct: Math.round((value / max) * 100) }));
  }, [history, period]);

  const pendingCount = history.filter((e) => e.type === 'payout' && e.status === 'PENDING').length;
  const visibleEntries = history.filter((e) =>
    txTab === 'pending' ? e.type === 'payout' && e.status === 'PENDING' : !(e.type === 'payout' && e.status === 'PENDING')
  );
  const groups = [];
  for (const entry of visibleEntries) {
    const header = dateHeader(entry.date);
    let group = groups.find((g) => g.header === header);
    if (!group) { group = { header, entries: [] }; groups.push(group); }
    group.entries.push(entry);
  }

  if (!user) return null;

  const payoutsEnabled = user.providerProfile?.payoutsEnabled;
  const bankLast4 = user.providerProfile?.bankLast4;
  const walletBalance = user.providerProfile?.walletBalance ?? 0;
  const autoPayout = user.providerProfile?.autoPayout ?? false;
  const canPayout = bankLast4 && payoutsEnabled && walletBalance > 0 && !payoutBusy;

  return (
    <div className="mx-auto max-w-xl">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => router.back()} aria-label="Retour" className="text-ink">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <h1 className="font-display text-xl font-semibold text-ink">Porte-monnaie</h1>
      </div>

      <div className="mt-4 rounded-2xl bg-paper p-5">
        <div className="font-display text-4xl font-bold text-ink">{walletBalance.toFixed(2).replace(/\.00$/, '')} €</div>
        <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
          {pendingTotal > 0 ? `${pendingTotal.toFixed(2)} € à venir` : 'Aucun montant à venir'}
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-300 text-[10px] text-white" title="Solde disponible pour virement, hors montants en attente de traitement">?</span>
        </div>
        <button
          type="button"
          disabled={!canPayout}
          onClick={onPayout}
          className="mt-4 flex items-center gap-2 rounded-full bg-moss px-5 py-3 text-sm font-semibold text-white disabled:bg-moss/40"
        >
          <ArrowsIcon className="h-4 w-4" />
          {payoutBusy ? 'Virement en cours…' : 'Virement'}
        </button>
      </div>

      {bankLast4 ? (
        <div className="mt-3 flex items-center gap-3 rounded-lg bg-paper px-4 py-3.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white">
            <ArrowsIcon className="h-4 w-4 text-ink" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-sm text-ink">Compte bancaire</div>
            <div className="text-xs text-slate-400">•••• {bankLast4}</div>
          </div>
          <button type="button" onClick={() => setShowBankForm(true)} className="shrink-0 text-sm font-medium text-moss">
            Modifier
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowBankForm(true)}
          className="mt-3 w-full rounded-lg bg-paper px-4 py-3.5 text-left text-sm font-medium text-moss"
        >
          Ajouter mon compte bancaire
        </button>
      )}

      {bankLast4 && (
        <div className="mt-3 flex items-center gap-3 rounded-lg bg-paper px-4 py-3.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-ink">↻</span>
          <div className="min-w-0 flex-1 text-sm text-ink">Virement automatique</div>
          <button
            type="button"
            disabled={autoBusy || !payoutsEnabled}
            onClick={onToggleAutoPayout}
            aria-pressed={autoPayout}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${autoPayout ? 'bg-moss' : 'bg-slate-300'}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${autoPayout ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>
      )}
      {payoutError && <p className="mt-2 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{payoutError}</p>}

      {showBankForm && (
        <form onSubmit={onBankSubmit} className="mt-4 space-y-3 rounded-lg border border-slate-200 bg-white p-4">
          <div className="grid grid-cols-2 gap-3">
            <input required placeholder="Prénom" value={bankForm.firstName} onChange={(e) => setBankForm({ ...bankForm, firstName: e.target.value })} className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-moss" />
            <input required placeholder="Nom" value={bankForm.lastName} onChange={(e) => setBankForm({ ...bankForm, lastName: e.target.value })} className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-moss" />
          </div>
          <input required type="tel" placeholder="Téléphone" value={bankForm.phone} onChange={(e) => setBankForm({ ...bankForm, phone: e.target.value })} className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-moss" />
          <div>
            <span className="text-xs font-medium text-slate-500">Date de naissance</span>
            <div className="mt-1 grid grid-cols-3 gap-2">
              <input required type="number" min="1" max="31" placeholder="JJ" value={bankForm.dobDay} onChange={(e) => setBankForm({ ...bankForm, dobDay: e.target.value })} className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-moss" />
              <input required type="number" min="1" max="12" placeholder="MM" value={bankForm.dobMonth} onChange={(e) => setBankForm({ ...bankForm, dobMonth: e.target.value })} className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-moss" />
              <input required type="number" min="1900" max="2010" placeholder="AAAA" value={bankForm.dobYear} onChange={(e) => setBankForm({ ...bankForm, dobYear: e.target.value })} className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-moss" />
            </div>
          </div>
          <input required placeholder="Adresse" value={bankForm.addressLine1} onChange={(e) => setBankForm({ ...bankForm, addressLine1: e.target.value })} className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-moss" />
          <div className="grid grid-cols-2 gap-3">
            <input required placeholder="Ville" value={bankForm.addressCity} onChange={(e) => setBankForm({ ...bankForm, addressCity: e.target.value })} className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-moss" />
            <input required placeholder="Code postal" value={bankForm.addressPostalCode} onChange={(e) => setBankForm({ ...bankForm, addressPostalCode: e.target.value })} className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-moss" />
          </div>
          <input required placeholder="Titulaire du compte" value={bankForm.accountHolderName} onChange={(e) => setBankForm({ ...bankForm, accountHolderName: e.target.value })} className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-moss" />
          <input required placeholder="IBAN" value={bankForm.iban} onChange={(e) => setBankForm({ ...bankForm, iban: e.target.value.toUpperCase() })} className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-moss" />

          {connectError && <p className="rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{connectError}</p>}

          <div className="flex gap-2">
            <button type="button" onClick={() => setShowBankForm(false)} className="flex-1 rounded-md border border-slate-200 py-2.5 text-sm font-medium text-ink hover:border-moss">
              Annuler
            </button>
            <button type="submit" disabled={connectBusy} className="flex-1 rounded-md bg-moss py-2.5 text-sm font-medium text-paper hover:bg-moss-dark disabled:opacity-60">
              {connectBusy ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      )}

      <h2 className="mt-8 font-display text-lg font-semibold text-ink">Mes paiements</h2>
      <div className="mt-3 rounded-2xl bg-paper p-4">
        {chartBuckets.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-slate-400">Aucun paiement pour l'instant</div>
        ) : (
          <div className="flex h-32 items-end gap-3 border-b border-dashed border-slate-300 px-1 pb-0">
            {chartBuckets.map((b) => (
              <div key={b.key} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-2.5 rounded-full bg-gradient-to-t from-moss to-purple-500"
                  style={{ height: `${Math.max(6, b.pct)}%` }}
                  title={`${b.value.toFixed(2)} €`}
                />
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="mt-3 flex gap-2 rounded-full bg-paper p-1">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => setPeriod(p.value)}
            className={`flex-1 rounded-full py-2 text-sm font-medium ${period === p.value ? 'bg-white text-ink shadow-sm' : 'text-slate-500'}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <h2 className="mt-8 font-display text-lg font-semibold text-ink">Transactions</h2>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => setTxTab('done')}
          className={`rounded-full px-4 py-2 text-sm font-medium ${txTab === 'done' ? 'border border-moss text-moss' : 'bg-paper text-slate-500'}`}
        >
          Terminées
        </button>
        <button
          type="button"
          onClick={() => setTxTab('pending')}
          className={`rounded-full px-4 py-2 text-sm font-medium ${txTab === 'pending' ? 'border border-moss text-moss' : 'bg-paper text-slate-500'}`}
        >
          En attente ({pendingCount})
        </button>
      </div>

      <div className="mt-4 space-y-5">
        {groups.length === 0 && <p className="text-sm text-slate-400">Aucune transaction.</p>}
        {groups.map((group) => (
          <div key={group.header}>
            <div className="text-xs text-slate-400">{group.header}</div>
            <div className="mt-2 divide-y divide-slate-100">
              {group.entries.map((entry, i) => (
                <div key={i} className="flex items-center gap-3 py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-ink">
                    {entry.type === 'payout' ? <ArrowsIcon className="h-4 w-4" /> : '👤'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-ink">{entry.label}</div>
                    {entry.subLabel && <div className="truncate text-xs text-slate-400">{entry.subLabel}</div>}
                  </div>
                  <span className={`shrink-0 text-sm font-medium ${entry.amount >= 0 ? 'text-moss' : 'text-ink'}`}>
                    {entry.amount >= 0 ? '+' : ''}{entry.amount.toFixed(2)} €
                  </span>
                  <ChevronIcon className="h-4 w-4 shrink-0 text-slate-300" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
