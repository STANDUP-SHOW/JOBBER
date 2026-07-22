'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import { isValidSiret } from '../../../lib/siret';
import AddressAutocomplete from '../../../components/AddressAutocomplete';

export default function RegisterEntreprisePage() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({
    companyType: 'ENTREPRISE', companyName: '', companySiret: '', address: '',
    firstName: '', lastName: '', email: '', phone: '', password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (!isValidSiret(form.companySiret)) {
      setError('Numéro SIRET invalide (14 chiffres).');
      return;
    }
    if (!form.address.trim()) {
      setError("L'adresse de l'entreprise est requise.");
      return;
    }
    setLoading(true);
    try {
      const { token, user } = await api.register({ ...form, accountKind: 'COMPANY' });
      login(token, user);
      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <span className="label-eyebrow text-moss">Créer un compte</span>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Ouvrir un compte entreprise</h1>
      <p className="mt-1 text-sm text-slate-500">Recrutez à la tâche, légalement, sur devis et facture.</p>
      <p className="mt-4 text-sm text-slate-500">
        Vous êtes un particulier ? <a href="/auth/register" className="font-medium text-moss hover:underline">Créer un compte jobber</a>
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="rounded-lg border border-slate-200 p-4">
          <span className="text-xs font-medium text-slate-500">Votre entreprise est…</span>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, companyType: 'ENTREPRISE' }))}
              className={`rounded-lg border-2 p-3 text-left transition ${
                form.companyType === 'ENTREPRISE' ? 'border-moss bg-moss-light' : 'border-slate-200 hover:border-moss'
              }`}
            >
              <div className="text-sm font-semibold text-ink">Entreprise</div>
              <div className="mt-0.5 text-xs text-slate-500">Vous recrutez pour vos propres besoins (emballage, manutention, nettoyage de chantier…)</div>
            </button>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, companyType: 'CORPORATE' }))}
              className={`rounded-lg border-2 p-3 text-left transition ${
                form.companyType === 'CORPORATE' ? 'border-moss bg-moss-light' : 'border-slate-200 hover:border-moss'
              }`}
            >
              <div className="text-sm font-semibold text-ink">Corporate</div>
              <div className="mt-0.5 text-xs text-slate-500">Vous sous-traitez une prestation de services à la personne à Jobber</div>
            </button>
          </div>
          <div className="mt-3 space-y-3">
            <Field label="Raison sociale" value={form.companyName} onChange={(v) => setForm({ ...form, companyName: v })} required />
            <label className="block">
              <span className="text-xs font-medium text-slate-500">Numéro SIRET</span>
              <input
                type="text"
                required
                inputMode="numeric"
                maxLength={14}
                placeholder="14 chiffres"
                value={form.companySiret}
                onChange={(e) => setForm({ ...form, companySiret: e.target.value.replace(/\D/g, '') })}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-moss"
              />
              {form.companySiret && !isValidSiret(form.companySiret) && (
                <span className="mt-1 block text-xs text-clay">Numéro invalide.</span>
              )}
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-500">Adresse de l'entreprise</span>
              <AddressAutocomplete value={form.address} onChange={(v) => setForm({ ...form, address: v })} required />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Prénom" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} required />
          <Field label="Nom" value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} required />
        </div>
        <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
        <Field label="Téléphone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} required />
        <Field label="Mot de passe" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} required />

        {error && <p className="rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}

        <button disabled={loading} className="w-full rounded-md bg-moss py-3 font-medium text-paper hover:bg-moss-dark disabled:opacity-60">
          {loading ? 'Création…' : 'Créer mon compte entreprise'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Déjà inscrit ? <a href="/auth/login" className="font-medium text-moss hover:underline">Se connecter</a>
      </p>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', required }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-moss"
      />
    </label>
  );
}
