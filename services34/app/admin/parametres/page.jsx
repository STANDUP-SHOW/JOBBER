'use client';

import { useState } from 'react';
import { useAgencyAuth } from '../../../lib/agency-auth-context';
import { agencyApi } from '../../../lib/agencyApi';

export default function ParametresPage() {
  const { token, agency, login } = useAgencyAuth();
  const [loginId, setLoginId] = useState(agency?.adminLoginId || '');
  const [pin, setPin] = useState('');
  const [radius, setRadius] = useState(agency?.serviceRadiusKm || 50);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function saveCredentials(e) {
    e.preventDefault();
    setBusy(true); setError(''); setMessage('');
    try {
      const payload = {};
      if (loginId && loginId !== agency.adminLoginId) payload.loginId = loginId;
      if (pin) payload.pin = pin;
      const { agency: updated } = await agencyApi.updateCredentials(payload, token);
      login(token, updated);
      setPin('');
      setMessage('Identifiants mis à jour.');
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  async function saveRadius(e) {
    e.preventDefault();
    setBusy(true); setError(''); setMessage('');
    try {
      const { agency: updated } = await agencyApi.updateCredentials({ serviceRadiusKm: Number(radius) }, token);
      login(token, updated);
      setMessage('Zone d\'intervention mise à jour.');
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-2xl font-semibold text-ink">Paramètres du compte</h1>

      {message && <p className="mt-4 rounded-md bg-brand-light px-3 py-2 text-sm text-brand-dark">{message}</p>}
      {error && <p className="mt-4 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="font-display text-base font-semibold text-ink">Ma zone d'intervention</h2>
        <p className="mt-1 text-sm text-slate-500">Rayon autour de votre secteur, extensible jusqu'à 150 km.</p>
        <form onSubmit={saveRadius} className="mt-4 flex items-center gap-3">
          <input
            type="number" min={1} max={150} value={radius}
            onChange={(e) => setRadius(e.target.value)}
            className="w-24 rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
          <span className="text-sm text-slate-500">km</span>
          <button type="submit" disabled={busy} className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60">
            Enregistrer
          </button>
        </form>
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="font-display text-base font-semibold text-ink">Identifiants de connexion</h2>
        <form onSubmit={saveCredentials} className="mt-4 space-y-4">
          <label className="block">
            <span className="text-xs font-medium text-slate-500">Identifiant</span>
            <input
              type="text" value={loginId} onChange={(e) => setLoginId(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2.5"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-500">Nouveau code PIN (laisser vide pour ne pas changer)</span>
            <input
              type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2.5"
            />
          </label>
          <button type="submit" disabled={busy} className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60">
            Mettre à jour
          </button>
        </form>
      </section>
    </div>
  );
}
