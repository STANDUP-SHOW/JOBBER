'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import GoogleSignInButton from '../../../components/GoogleSignInButton';

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const referralCode = searchParams.get('ref');
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await api.register({ ...form, referralCode: referralCode || undefined });
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
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Rejoindre Jobber</h1>
      <p className="mt-1 text-sm text-slate-500">Un seul compte pour publier vos besoins et proposer vos services.</p>
      {referralCode && (
        <p className="mt-3 rounded-md bg-moss-light px-3 py-2 text-sm text-moss-dark">
          🎁 Vous avez été invité — 3 € offerts sur votre première mission !
        </p>
      )}

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Prénom" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} required />
          <Field label="Nom" value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} required />
        </div>
        <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
        <Field label="Téléphone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
        <Field label="Mot de passe" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} required />

        {error && <p className="rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}

        <button disabled={loading} className="w-full rounded-md bg-moss py-3 font-medium text-paper hover:bg-moss-dark disabled:opacity-60">
          {loading ? 'Création…' : 'Créer mon compte'}
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
