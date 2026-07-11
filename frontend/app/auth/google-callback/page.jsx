'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={<p className="text-slate-400">Connexion…</p>}>
      <GoogleCallback />
    </Suspense>
  );
}

function GoogleCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      router.replace('/auth/login?error=google');
      return;
    }

    api.me(token)
      .then(({ user }) => {
        login(token, user);
        router.replace('/dashboard');
      })
      .catch(() => {
        setError('La connexion Google a échoué. Réessayez.');
      });
  }, []);

  if (error) {
    return (
      <div className="mx-auto max-w-md">
        <p className="rounded-md bg-clay/10 px-4 py-3 text-sm text-clay">{error}</p>
        <p className="mt-4 text-center text-sm text-slate-500">
          <a href="/auth/login" className="font-medium text-moss hover:underline">Retour à la connexion</a>
        </p>
      </div>
    );
  }

  return <p className="text-slate-400">Connexion…</p>;
}
