'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';

const STATUS_LABELS = { NEW: 'Nouveau', READ: 'Lu', REPLIED: 'Traité' };
const STATUS_STYLES = { NEW: 'bg-clay/10 text-clay', READ: 'bg-slate-100 text-slate-600', REPLIED: 'bg-moss-light text-moss-dark' };

export default function AdminContactMessagesPage() {
  const { token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) api.adminContactMessages(token).then(({ contactMessages }) => setMessages(contactMessages)).catch((e) => setError(e.message));
  }, [token]);

  if (error) return <p className="text-clay">{error}</p>;

  return (
    <div className="max-w-2xl">
      {messages.length === 0 && <p className="text-slate-400">Aucun message reçu.</p>}
      <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
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
