'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../../lib/api';
import { useAuth } from '../../../../lib/auth-context';

export default function AdminContactMessageDetailPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const [message, setMessage] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) return;
    api.adminContactMessage(id, token).then(({ contactMessage }) => {
      setMessage(contactMessage);
      if (contactMessage.status === 'NEW') {
        api.adminMarkContactMessage(id, 'READ', token).then(() => setMessage((m) => ({ ...m, status: 'READ' })));
      }
    }).catch((e) => setError(e.message));
  }, [token, id]);

  async function markReplied() {
    setBusy(true);
    try {
      await api.adminMarkContactMessage(id, 'REPLIED', token);
      setMessage((m) => ({ ...m, status: 'REPLIED' }));
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  if (error) return <p className="text-clay">{error}</p>;
  if (!message) return <p className="text-slate-400">Chargement…</p>;

  return (
    <div className="max-w-xl">
      <Link href="/admin/contact-messages" className="text-sm text-slate-400 hover:text-moss">← Messages</Link>

      <div className="mt-3 rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-display text-lg font-semibold text-ink">{message.subject || 'Sans sujet'}</div>
            <div className="mt-0.5 text-sm text-slate-500">{message.name} · {message.email}</div>
          </div>
          <span className="shrink-0 text-xs text-slate-400">{new Date(message.createdAt).toLocaleString('fr-FR')}</span>
        </div>
        <p className="mt-4 whitespace-pre-wrap text-sm text-ink">{message.message}</p>

        <div className="mt-5 flex flex-wrap gap-2">
          <a
            href={`mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.subject || 'votre message'}`)}`}
            className="rounded-md bg-moss px-4 py-2 text-sm font-medium text-paper hover:bg-moss-dark"
          >
            Répondre par email
          </a>
          {message.status !== 'REPLIED' && (
            <button disabled={busy} onClick={markReplied} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-ink hover:border-moss disabled:opacity-60">
              Marquer comme traité
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
