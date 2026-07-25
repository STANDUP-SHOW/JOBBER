'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { agencyApi } from '../../../lib/agencyApi';
import { useAgencyAuth } from '../../../lib/agency-auth-context';
import LogoMark from '../../../components/Logo';

export default function AgencyLoginPage() {
  const router = useRouter();
  const { login } = useAgencyAuth();
  const [loginId, setLoginId] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { token, agency } = await agencyApi.login({ loginId, pin });
      login(token, agency);
      router.replace('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center">
          <LogoMark color="#123E7A" className="h-14 w-14" />
          <span className="mt-2 font-brand text-xl font-extrabold uppercase tracking-tight text-ink">
            Services <span className="text-brand">34</span>
          </span>
          <span className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Administration</span>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="text-xs font-medium text-slate-500">Identifiant</span>
            <input
              type="text"
              required
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2.5"
              autoComplete="username"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-500">Code PIN</span>
            <input
              type="password"
              required
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2.5"
              autoComplete="current-password"
            />
          </label>

          {error && <p className="rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-brand py-3 font-medium text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {busy ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
