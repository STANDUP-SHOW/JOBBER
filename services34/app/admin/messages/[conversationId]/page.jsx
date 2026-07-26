'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAgencyAuth } from '../../../../lib/agency-auth-context';
import { api } from '../../../../lib/api';

export default function AdminConversationPage() {
  const { conversationId } = useParams();
  const { token, agency } = useAgencyAuth();
  const [data, setData] = useState(null);
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  async function refresh() {
    try {
      const result = await api.conversation(conversationId, token);
      setData(result);
    } catch (err) { setError(err.message); }
  }

  useEffect(() => { if (token && conversationId) refresh(); }, [token, conversationId]);

  async function send(e) {
    e.preventDefault();
    if (!content.trim()) return;
    setSending(true);
    try {
      await api.sendMessage(conversationId, content.trim(), token);
      setContent('');
      await refresh();
    } catch (err) { setError(err.message); } finally { setSending(false); }
  }

  if (error && !data) return <p className="rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>;
  if (!data) return <p className="text-sm text-slate-400">Chargement…</p>;

  const { conversation, messages } = data;

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/admin/employes-actifs" className="text-sm text-slate-400 hover:text-ink">← Retour</Link>
      <h1 className="mt-2 font-display text-xl font-semibold text-ink">
        Conversation — {conversation.provider?.firstName} {conversation.provider?.lastName?.[0]}.
      </h1>
      <p className="text-sm text-slate-500">{conversation.mission?.title}</p>

      <div className="mt-4 space-y-3 rounded-lg border border-slate-200 bg-white p-4">
        {messages.length === 0 && <p className="text-sm text-slate-400">Aucun message pour l'instant.</p>}
        {messages.map((m) => {
          const fromAgency = m.senderId === agency?.id;
          return (
            <div key={m.id} className={`flex ${fromAgency ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${fromAgency ? 'bg-brand text-white' : 'bg-slate-100 text-ink'}`}>
                <div>{m.content}</div>
                <div className={`mt-1 text-[10px] ${fromAgency ? 'text-white/70' : 'text-slate-400'}`}>
                  {new Date(m.createdAt).toLocaleString('fr-FR')}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {error && <p className="mt-3 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}

      <form onSubmit={send} className="mt-4 flex gap-2">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Votre message…"
          className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm"
        />
        <button type="submit" disabled={sending} className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60">
          Envoyer
        </button>
      </form>
    </div>
  );
}
