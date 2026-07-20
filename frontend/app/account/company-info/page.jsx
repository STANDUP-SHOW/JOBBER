'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import { isValidSiret } from '../../../lib/siret';
import AddressAutocomplete from '../../../components/AddressAutocomplete';

export default function CompanyInfoPage() {
  const { user, token, login, loading: authLoading } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({ companyName: '', companySiret: '', address: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
    else if (!authLoading && user?.accountKind !== 'COMPANY') router.push('/account');
  }, [authLoading, user]);

  useEffect(() => {
    if (!user) return;
    setForm({
      companyName: user.companyName || '',
      companySiret: user.companySiret || '',
      address: user.address || '',
      phone: user.phone || '',
    });
  }, [user]);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setSaved(false);
    if (!form.companyName.trim()) {
      setError('La raison sociale est requise.');
      return;
    }
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
      const { user: updated } = await api.updateMe(form, token);
      login(token, updated);
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-xl">
      <Link href="/account" className="text-sm font-medium text-moss">← Mon compte</Link>
      <h1 className="mt-3 font-display text-2xl font-semibold text-ink">Informations Entreprise</h1>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-xs font-medium text-slate-500">Raison sociale</span>
          <input
            type="text"
            value={form.companyName}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-moss"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-slate-500">Numéro SIRET</span>
          <input
            type="text"
            inputMode="numeric"
            maxLength={14}
            placeholder="14 chiffres"
            value={form.companySiret}
            onChange={(e) => setForm({ ...form, companySiret: e.target.value.replace(/\D/g, '') })}
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-moss"
          />
          {form.companySiret && !isValidSiret(form.companySiret) && (
            <span className="mt-1 block text-sm text-clay">Numéro invalide.</span>
          )}
        </label>

        <label className="block">
          <span className="text-xs font-medium text-slate-500">Adresse de l'entreprise</span>
          <AddressAutocomplete
            value={form.address}
            onChange={(v) => setForm({ ...form, address: v })}
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-slate-500">Numéro de téléphone</span>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-moss"
          />
        </label>

        {error && <p className="rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}
        {saved && <p className="rounded-md bg-moss-light px-3 py-2 text-sm text-moss-dark">Informations mises à jour.</p>}

        <button disabled={loading} className="w-full rounded-md bg-moss py-3 font-medium text-paper hover:bg-moss-dark disabled:opacity-60">
          {loading ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </form>
    </div>
  );
}
