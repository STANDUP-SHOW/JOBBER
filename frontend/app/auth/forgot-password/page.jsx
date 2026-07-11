'use client';

import { useState } from 'react';
import { api } from '../../../lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <span className="label-eyebrow text-moss">Mot de passe oublié</span>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Réinitialiser votre mot de passe</h1>
      <p className="mt-1 text-sm text-slate-500">
        Indiquez votre email, nous vous enverrons un lien pour choisir un nouveau mot de passe.
      </p>

      {sent ? (
        <p className="mt-6 rounded-md bg-moss-light px-4 py-3 text-sm text-moss-dark">
          Si un compte existe avec cet email, un lien de réinitialisation vient d'être envoyé. Pensez à vérifier vos spams.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-xs font-medium text-slate-500">Email</span>
            <input
              type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-moss"
            />
          </label>

          {error && <p className="rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}

          <button disabled={loading} className="w-full rounded-md bg-moss py-3 font-medium text-paper hover:bg-moss-dark disabled:opacity-60">
            {loading ? 'Envoi…' : 'Envoyer le lien'}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-slate-500">
        <a href="/auth/login" className="font-medium text-moss hover:underline">Retour à la connexion</a>
      </p>
    </div>
  );
}
