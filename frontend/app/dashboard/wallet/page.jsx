'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';

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
  const [history, setHistory] = useState([]);

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

  if (!user) return null;

  const payoutsEnabled = user.providerProfile?.payoutsEnabled;
  const bankLast4 = user.providerProfile?.bankLast4;
  const walletBalance = user.providerProfile?.walletBalance ?? 0;

  return (
    <div className="mx-auto max-w-xl">
      <span className="label-eyebrow text-moss">Mon compte</span>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Portefeuille</h1>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
        <div className="mt-1">
          <div className="text-xs text-slate-400">Solde disponible</div>
          <div className="mt-0.5 font-display text-3xl font-semibold text-ink">{walletBalance.toFixed(2)} €</div>
        </div>

        {bankLast4 ? (
          <div className="mt-4 flex items-center justify-between rounded-md bg-slate-50 px-3 py-2.5">
            <div>
              <div className="text-sm text-ink">Compte bancaire</div>
              <div className="text-xs text-slate-400">IBAN •••• {bankLast4}</div>
            </div>
            <button type="button" onClick={() => setShowBankForm(true)} className="text-sm font-medium text-moss hover:text-moss-dark">
              Modifier
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowBankForm(true)}
            className="mt-4 w-full rounded-md border border-slate-200 py-2.5 text-sm font-medium text-ink hover:border-moss hover:text-moss"
          >
            Ajouter mon compte bancaire
          </button>
        )}

        {bankLast4 && (
          <button
            type="button"
            disabled={payoutBusy || walletBalance <= 0 || !payoutsEnabled}
            onClick={onPayout}
            className="mt-3 w-full rounded-md bg-moss py-2.5 text-sm font-medium text-paper hover:bg-moss-dark disabled:opacity-60"
          >
            {payoutBusy ? 'Virement en cours…' : `Virement (${walletBalance.toFixed(2)} €)`}
          </button>
        )}
        {payoutError && <p className="mt-2 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{payoutError}</p>}

        {showBankForm && (
          <form onSubmit={onBankSubmit} className="mt-4 space-y-3 border-t border-slate-100 pt-4">
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
      </div>

      {history.length > 0 && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="font-display text-lg font-medium text-ink">Transactions</h2>
          <div className="mt-3 space-y-3">
            {history.map((entry, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div>
                  <div className="text-ink">{entry.label}</div>
                  <div className="text-xs text-slate-400">
                    {entry.date ? new Date(entry.date).toLocaleDateString('fr-FR') : ''}
                    {entry.type === 'payout' && entry.status === 'PENDING' && ' · en attente'}
                    {entry.type === 'payout' && entry.status === 'FAILED' && ' · échoué'}
                  </div>
                </div>
                <span className={entry.amount >= 0 ? 'font-medium text-moss-dark' : 'font-medium text-ink'}>
                  {entry.amount >= 0 ? '+' : ''}{entry.amount.toFixed(2)} €
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
