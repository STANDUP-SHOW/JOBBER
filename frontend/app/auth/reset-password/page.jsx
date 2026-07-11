'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '../../../lib/api';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p className="text-slate-400">Chargement…</p>}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas'); return; }
    setLoading(true);
    try {
      await api.resetPassword(token, password);
      setDone(true);
      setTimeout(() => router.push('/auth/login'), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="mx-auto max-w-md">
        <p className="rounded-md bg-clay/10 px-4 py-3 text-sm text-clay">
          Lien invalide. Redemandez un email depuis la page{' '}
          <a href="/auth/forgot-password" className="font-medium underline">mot de passe oublié</a>.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <span className="label-eyebrow text-moss">Nouveau mot de passe</span>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Choisissez un nouveau mot de passe</h1>

      {done ? (
        <p className="mt-6 rounded-md bg-moss-light px-4 py-3 text-sm text-moss-dark">
          Mot de passe mis à jour. Redirection vers la connexion…
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-xs font-medium text-slate-500">Nouveau mot de passe</span>
            <input
              type="password" required minLength={8} value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-moss"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-500">Confirmer le mot de passe</span>
            <input
              type="password" required minLength={8} value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-moss"
            />
          </label>

          {error && <p className="rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}

          <button disabled={loading} className="w-full rounded-md bg-moss py-3 font-medium text-paper hover:bg-moss-dark disabled:opacity-60">
            {loading ? 'Enregistrement…' : 'Changer le mot de passe'}
          </button>
        </form>
      )}
    </div>
  );
}
