'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import AddressAutocomplete from '../../../components/AddressAutocomplete';

export default function PersonalInfoPage() {
  const { user, token, login, logout, loading: authLoading } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', address: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwBusy, setPwBusy] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSaved, setPwSaved] = useState(false);

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [authLoading, user]);

  useEffect(() => {
    if (!user) return;
    setForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || '',
    });
  }, [user]);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setSaved(false);
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

  async function onPasswordSubmit(e) {
    e.preventDefault();
    setPwError('');
    setPwSaved(false);
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('Les mots de passe ne correspondent pas.');
      return;
    }
    setPwBusy(true);
    try {
      await api.changePassword(
        { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword },
        token
      );
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPwSaved(true);
    } catch (err) {
      setPwError(err.message);
    } finally {
      setPwBusy(false);
    }
  }

  async function onDelete() {
    setDeleteBusy(true);
    setDeleteError('');
    try {
      await api.deleteAccount(token);
      logout();
      router.push('/');
    } catch (err) {
      setDeleteError(err.message);
      setDeleteBusy(false);
    }
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-xl">
      <Link href="/account" className="text-sm font-medium text-moss">← Mon compte</Link>
      <h1 className="mt-3 font-display text-2xl font-semibold text-ink">Informations personnelles</h1>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-medium text-slate-500">Prénom</span>
            <input
              type="text"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-moss"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-500">Nom de famille</span>
            <input
              type="text"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-moss"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-xs font-medium text-slate-500">Adresse e-mail</span>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-moss"
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

        <label className="block">
          <span className="text-xs font-medium text-slate-500">Adresse de facturation</span>
          <AddressAutocomplete
            value={form.address}
            onChange={(v) => setForm({ ...form, address: v })}
            placeholder="Rue, ville"
          />
        </label>

        {error && <p className="rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}
        {saved && <p className="rounded-md bg-moss-light px-3 py-2 text-sm text-moss-dark">Informations mises à jour.</p>}

        <button disabled={loading} className="w-full rounded-md bg-moss py-3 font-medium text-paper hover:bg-moss-dark disabled:opacity-60">
          {loading ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </form>

      <h2 className="mt-8 font-display text-lg font-medium text-ink">Mot de passe</h2>
      <form onSubmit={onPasswordSubmit} className="mt-3 space-y-3">
        {user.hasPassword && (
          <input
            type="password"
            placeholder="Mot de passe actuel"
            value={pwForm.currentPassword}
            onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-moss"
          />
        )}
        <input
          type="password"
          placeholder="Nouveau mot de passe"
          value={pwForm.newPassword}
          onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-moss"
        />
        <input
          type="password"
          placeholder="Confirmer le nouveau mot de passe"
          value={pwForm.confirmPassword}
          onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-moss"
        />
        {pwError && <p className="rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{pwError}</p>}
        {pwSaved && <p className="rounded-md bg-moss-light px-3 py-2 text-sm text-moss-dark">Mot de passe mis à jour.</p>}
        <button disabled={pwBusy} className="w-full rounded-md border border-slate-200 py-3 font-medium text-ink hover:border-moss disabled:opacity-60">
          {pwBusy ? 'Enregistrement…' : 'Changer le mot de passe'}
        </button>
      </form>

      <div className="mt-8 border-t border-slate-100 pt-6">
        {!confirmingDelete ? (
          <button type="button" onClick={() => setConfirmingDelete(true)} className="text-sm font-medium text-clay">
            Supprimer mon compte
          </button>
        ) : (
          <div className="rounded-md bg-clay/10 p-4">
            <p className="text-sm text-clay">
              Cette action est définitive : votre profil sera anonymisé et vous serez déconnecté. Confirmer ?
            </p>
            {deleteError && <p className="mt-2 text-sm text-clay">{deleteError}</p>}
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => setConfirmingDelete(false)} className="flex-1 rounded-md border border-slate-200 py-2 text-sm font-medium text-ink">
                Annuler
              </button>
              <button type="button" disabled={deleteBusy} onClick={onDelete} className="flex-1 rounded-md bg-clay py-2 text-sm font-medium text-white disabled:opacity-60">
                {deleteBusy ? 'Suppression…' : 'Confirmer la suppression'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
