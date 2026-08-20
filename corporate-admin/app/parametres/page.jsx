'use client';

import { useState } from 'react';
import { useAgencyAuth } from '../../lib/agency-auth-context';
import { agencyApi } from '../../lib/agencyApi';
import ZoneSettingsSheet from '../../components/admin/ZoneSettingsSheet';

const CIVILITES = ['Monsieur', 'Madame', 'Autre'];

export default function ParametresPage() {
  const { token, agency, login } = useAgencyAuth();
  const [loginId, setLoginId] = useState(agency?.adminLoginId || '');
  const [pin, setPin] = useState('');
  const [zoneOpen, setZoneOpen] = useState(false);
  const [company, setCompany] = useState({
    companyName: agency?.companyName || '',
    companySiret: agency?.companySiret || '',
    siegeSocialAddress: agency?.siegeSocialAddress || '',
    siegeSocialCity: agency?.siegeSocialCity || '',
    siegeSocialDepartement: agency?.siegeSocialDepartement || '',
    representantCivilite: agency?.representantCivilite || '',
    representantNom: agency?.representantNom || '',
    representantPrenom: agency?.representantPrenom || '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function saveCompany(e) {
    e.preventDefault();
    setBusy(true); setError(''); setMessage('');
    try {
      const { agency: updated } = await agencyApi.updateCredentials(company, token);
      login(token, updated);
      setMessage('Informations entreprise mises à jour.');
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

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

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-2xl font-semibold text-ink">Paramètres du compte</h1>

      {message && <p className="mt-4 rounded-md bg-brand-light px-3 py-2 text-sm text-brand-dark">{message}</p>}
      {error && <p className="mt-4 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="font-display text-base font-semibold text-ink">Information entreprise</h2>
        {agency?.jobberLicenseNumber && (
          <p className="mt-1 text-xs text-slate-400">
            Autorisation licence Jobber : <span className="font-mono font-semibold text-ink">{agency.jobberLicenseNumber}</span>
          </p>
        )}
        <form onSubmit={saveCompany} className="mt-4 space-y-4">
          <label className="block">
            <span className="text-xs font-medium text-slate-500">Raison sociale</span>
            <input value={company.companyName} onChange={(e) => setCompany({ ...company, companyName: e.target.value })} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2.5" />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-500">Numéro SIRET</span>
            <input value={company.companySiret} onChange={(e) => setCompany({ ...company, companySiret: e.target.value })} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2.5" />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-500">Adresse du siège social</span>
            <input value={company.siegeSocialAddress} onChange={(e) => setCompany({ ...company, siegeSocialAddress: e.target.value })} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2.5" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-medium text-slate-500">Ville</span>
              <input value={company.siegeSocialCity} onChange={(e) => setCompany({ ...company, siegeSocialCity: e.target.value })} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2.5" />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-500">Département</span>
              <input value={company.siegeSocialDepartement} onChange={(e) => setCompany({ ...company, siegeSocialDepartement: e.target.value })} className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2.5" />
            </label>
          </div>

          <div>
            <span className="text-xs font-medium text-slate-500">Représentée par</span>
            <div className="mt-1 grid grid-cols-3 gap-3">
              <select value={company.representantCivilite} onChange={(e) => setCompany({ ...company, representantCivilite: e.target.value })} className="rounded-md border border-slate-200 px-3 py-2.5">
                <option value="">Civilité</option>
                {CIVILITES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <input placeholder="Nom" value={company.representantNom} onChange={(e) => setCompany({ ...company, representantNom: e.target.value })} className="rounded-md border border-slate-200 px-3 py-2.5" />
              <input placeholder="Prénom" value={company.representantPrenom} onChange={(e) => setCompany({ ...company, representantPrenom: e.target.value })} className="rounded-md border border-slate-200 px-3 py-2.5" />
            </div>
          </div>

          <button type="submit" disabled={busy} className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60">
            Enregistrer
          </button>
        </form>
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="font-display text-base font-semibold text-ink">Ma zone d'intervention</h2>
        <p className="mt-1 text-sm text-slate-500">Adresse de l'entreprise et rayon d'intervention, extensible jusqu'à 150 km.</p>
        <button
          type="button"
          onClick={() => setZoneOpen(true)}
          className="mt-4 flex w-full items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 text-left hover:border-brand"
        >
          <span className="text-lg">📍</span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-ink">{agency?.address || "Définir l'adresse de l'entreprise"}</div>
            <div className="text-xs text-slate-400">Rayon : {agency?.serviceRadiusKm ?? 50} km</div>
          </div>
          <span className="shrink-0 text-xs font-medium text-brand">Modifier</span>
        </button>

        {zoneOpen && (
          <ZoneSettingsSheet
            agency={agency}
            token={token}
            onClose={() => setZoneOpen(false)}
            onSaved={(updated) => {
              login(token, updated);
              setZoneOpen(false);
              setMessage("Zone d'intervention mise à jour.");
            }}
          />
        )}
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
