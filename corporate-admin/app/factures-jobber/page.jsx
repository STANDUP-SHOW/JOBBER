'use client';

import { useEffect, useState } from 'react';
import { useAgencyAuth } from '../../lib/agency-auth-context';
import { agencyApi } from '../../lib/agencyApi';

export default function FacturesJobberPage() {
  const { token } = useAgencyAuth();
  const [invoices, setInvoices] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function refresh() {
    try {
      const { invoices } = await agencyApi.invoices('jobber', token);
      setInvoices(invoices);
    } catch (err) { setError(err.message); }
  }

  useEffect(() => { if (token) refresh(); }, [token]);

  async function generateMonthly() {
    setBusy(true);
    try {
      await agencyApi.generateMonthlyInvoice('jobber', token);
      await refresh();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink">Mes factures Jobber</h1>
        <button type="button" disabled={busy} onClick={generateMonthly} className="rounded-md border border-brand px-3 py-1.5 text-sm font-medium text-brand hover:bg-brand-light disabled:opacity-60">
          Générer la facture du mois
        </button>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        Une facture par mission (référence-JOBBER) et une facture récapitulative par mois. Mise en forme à paramétrer plus tard.
      </p>

      {error && <p className="mt-4 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}
      {invoices === null && <p className="mt-4 text-sm text-slate-400">Chargement…</p>}
      {invoices?.length === 0 && <p className="mt-4 text-sm text-slate-400">Aucune facture pour l'instant.</p>}

      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3">Référence</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Montant</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {invoices?.map((i) => (
              <tr key={i.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 font-mono">{i.reference}</td>
                <td className="px-4 py-3 text-slate-500">{i.kind === 'JOBBER_MONTHLY' ? 'Mensuelle' : 'Par mission'}</td>
                <td className="px-4 py-3 font-medium text-ink">{i.amount.toFixed(2)} €</td>
                <td className="px-4 py-3 text-slate-500">{new Date(i.createdAt).toLocaleDateString('fr-FR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
