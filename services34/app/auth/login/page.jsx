'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import GoogleSignInButton from '../../../components/GoogleSignInButton';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/demande';
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await api.login({ email, password });
      login(token, user);
      router.push(next);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <span className="label-eyebrow text-brand">Connexion</span>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Se connecter</h1>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-xs font-medium text-slate-500">Email</span>
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-500">Mot de passe</span>
          <input
            type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </label>

        {error && <p className="rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}

        <button disabled={loading} className="w-full rounded-md bg-brand py-3 font-medium text-white hover:bg-brand-dark disabled:opacity-60">
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
        Pas encore de compte ? <a href="/auth/register" className="font-medium text-brand hover:underline">S'inscrire</a>
      </p>
    </div>
  );
}
