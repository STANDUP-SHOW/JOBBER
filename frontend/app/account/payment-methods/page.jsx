'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import AddCardModal from '../../../components/AddCardModal';

const BRAND_LABEL = { visa: 'Visa', mastercard: 'Mastercard', amex: 'American Express' };

export default function PaymentMethodsPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [authLoading, user]);

  async function refresh() {
    if (!token) return;
    try {
      const { paymentMethods } = await api.paymentMethods(token);
      setMethods(paymentMethods);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, [token]);

  async function onDelete(id) {
    setBusyId(id);
    try {
      await api.deletePaymentMethod(id, token);
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function onSetDefault(id) {
    setBusyId(id);
    try {
      await api.setDefaultPaymentMethod(id, token);
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-xl">
      <Link href="/account" className="text-sm font-medium text-moss">← Mon compte</Link>
      <h1 className="mt-3 font-display text-2xl font-semibold text-ink">Moyens de paiement</h1>

      {error && <p className="mt-4 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}

      {!loading && methods.length === 0 && (
        <div className="mt-6 rounded-lg border border-dashed border-slate-200 bg-white px-4 py-8 text-center">
          <p className="text-sm font-medium text-ink">Aucun moyen de paiement</p>
          <p className="mt-1 text-sm text-slate-400">Vous n'avez pas de moyen de paiement enregistré.</p>
        </div>
      )}

      {methods.length > 0 && (
        <div className="mt-6 divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white">
          {methods.map((m) => (
            <div key={m.id} className="flex items-center gap-3 px-4 py-3.5">
              <span className="text-lg">💳</span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-ink">
                  {BRAND_LABEL[m.brand] || m.brand} •••• {m.last4}
                  {m.isDefault && <span className="ml-2 rounded-full bg-moss-light px-2 py-0.5 text-xs font-medium text-moss-dark">Par défaut</span>}
                </div>
                <div className="text-xs text-slate-400">Expire {String(m.expMonth).padStart(2, '0')}/{m.expYear}</div>
              </div>
              {!m.isDefault && (
                <button type="button" disabled={busyId === m.id} onClick={() => onSetDefault(m.id)} className="shrink-0 text-xs font-medium text-moss">
                  Par défaut
                </button>
              )}
              <button type="button" disabled={busyId === m.id} onClick={() => onDelete(m.id)} className="shrink-0 text-xs font-medium text-clay">
                Retirer
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowAdd(true)}
        className="mt-4 w-full rounded-md border border-slate-200 py-3 text-sm font-medium text-moss hover:border-moss"
      >
        + Ajouter une carte de paiement
      </button>

      {showAdd && (
        <AddCardModal
          token={token}
          onClose={() => setShowAdd(false)}
          onAdded={() => { setShowAdd(false); refresh(); }}
        />
      )}
    </div>
  );
}
