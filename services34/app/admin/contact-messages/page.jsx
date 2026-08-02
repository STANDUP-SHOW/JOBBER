'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAgencyAuth } from '../../../lib/agency-auth-context';
import { agencyApi } from '../../../lib/agencyApi';

const STATUS_LABELS = { NEW: 'Nouveau', READ: 'Lu', REPLIED: 'Traité' };
const STATUS_STYLES = { NEW: 'bg-red-50 text-red-600', READ: 'bg-slate-100 text-slate-600', REPLIED: 'bg-brand/10 text-brand' };

export default function AdminContactMessagesPage() {
  const { token } = useAgencyAuth();
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) agencyApi.contactMessages(token).then(({ contactMessages }) => setMessages(contactMessages)).catch((e) => setError(e.message));
  }, [token]);

  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-ink">Messages reçus</h1>
      <p className="mt-1 text-sm text-slate-500">Formulaire de contact soumis depuis services34.fr.</p>

      {messages.length === 0 && <p className="mt-6 text-slate-400">Aucun message reçu.</p>}
      <ul className="mt-6 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
        {messages.map((m) => (
          <li key={m.id}>
            <Link href={`/admin/contact-messages/${m.id}`} className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-slate-50">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-ink">{m.name}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[m.status]}`}>{STATUS_LABELS[m.status]}</span>
                </div>
                <div className="truncate text-sm text-slate-500">{m.subject || m.message}</div>
              </div>
              <span className="shrink-0 text-xs text-slate-400">{new Date(m.createdAt).toLocaleDateString('fr-FR')}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
