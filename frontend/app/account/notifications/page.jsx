'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';

const GROUPS = [
  {
    title: 'Notification',
    items: [{ key: 'notifyPushNews', label: 'Nouveautés, cadeaux, bons plans' }],
  },
  {
    title: 'E-mail',
    items: [
      { key: 'notifyEmailNews', label: 'Nouveautés, cadeaux, bons plans' },
      { key: 'notifyEmailPartners', label: 'Bons plans des partenaires' },
    ],
  },
  {
    title: 'SMS',
    items: [
      { key: 'notifySmsOffers', label: "J'ai reçu des propositions pour mon service" },
      { key: 'notifySmsCancellation', label: "Assistance en cas d'annulation du prestataire" },
    ],
  },
];

export default function NotificationsPage() {
  const { user, token, login, loading: authLoading } = useAuth();
  const router = useRouter();
  const [prefs, setPrefs] = useState({});
  const [busyKey, setBusyKey] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [authLoading, user]);

  useEffect(() => {
    if (!user) return;
    setPrefs({
      notifyPushNews: user.notifyPushNews,
      notifyEmailNews: user.notifyEmailNews,
      notifyEmailPartners: user.notifyEmailPartners,
      notifySmsOffers: user.notifySmsOffers,
      notifySmsCancellation: user.notifySmsCancellation,
    });
  }, [user]);

  async function toggle(key) {
    const next = !prefs[key];
    setPrefs((p) => ({ ...p, [key]: next }));
    setBusyKey(key);
    try {
      const { user: updated } = await api.updateMe({ [key]: next }, token);
      login(token, updated);
    } catch {
      setPrefs((p) => ({ ...p, [key]: !next }));
    } finally {
      setBusyKey(null);
    }
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-xl">
      <Link href="/account" className="text-sm font-medium text-moss">← Mon compte</Link>
      <h1 className="mt-3 font-display text-2xl font-semibold text-ink">Notifications</h1>

      {GROUPS.map((group) => (
        <div key={group.title} className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-ink">{group.title}</h2>
          <div className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white">
            {group.items.map((item) => (
              <div key={item.key} className="flex items-center gap-3 px-4 py-3.5">
                <span className="min-w-0 flex-1 text-sm text-ink">{item.label}</span>
                <button
                  type="button"
                  disabled={busyKey === item.key}
                  onClick={() => toggle(item.key)}
                  aria-pressed={!!prefs[item.key]}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${prefs[item.key] ? 'bg-moss' : 'bg-slate-300'}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${prefs[item.key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
