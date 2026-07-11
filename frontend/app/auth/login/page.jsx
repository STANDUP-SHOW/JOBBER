'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import GoogleSignInButton from '../../../components/GoogleSignInButton';

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-slate-400">Chargement…</p>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get('error') === 'google') {
      setError('La connexion avec Google a échoué. Réessayez ou utilisez votre email.');
    }
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await api.login(form);
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
      <span className="label-eyebrow text-moss">Connexion</span>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Bon retour</h1>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-xs font-medium text-slate-500">Email</span>
          <input
            type="email" required value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-moss"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-500">Mot de passe</span>
          <input
            type="password" required value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-moss"
          />
        </label>

        <div className="text-right">
          <a href="/auth/forgot-password" className="text-xs font-medium text-moss hover:underline">Mot de passe oublié ?</a>
        </div>

        {error && <p className="rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}

        <button disabled={loading} className="w-full rounded-md bg-moss py-3 font-medium text-paper hover:bg-moss-dark disabled:opacity-60">
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>

      <div className="mt-6 flex items-center gap-3 text-xs text-slate-400">
        <div className="h-px flex-1 bg-slate-200" />
        ou
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="mt-4 flex justify-center">
        <GoogleSignInButton />
      </div>

      <p className="mt-6 text-center text-sm text-slate-500">
        Pas encore de compte ? <a href="/auth/register" className="font-medium text-moss hover:underline">S'inscrire</a>
      </p>
    </div>
  );
}
