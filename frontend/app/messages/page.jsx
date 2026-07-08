'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';

export default function MessagesListPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [authLoading, user]);

  useEffect(() => {
    if (token) api.conversations(token).then(({ conversations }) => setConversations(conversations)).catch(() => {});
  }, [token]);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <span className="label-eyebrow text-moss">Messagerie</span>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Conversations</h1>

      <div className="mt-6 space-y-2">
        {conversations.length === 0 && <p className="text-slate-400">Aucune conversation pour le moment.</p>}
        {conversations.map((c) => {
          const other = c.clientId === user.id ? c.provider : c.client;
          const lastMessage = c.messages?.[0];
          return (
            <Link key={c.id} href={`/messages/${c.id}`} className="block rounded-lg border border-slate-200 bg-white p-4 hover:border-moss">
              <div className="flex items-center justify-between">
                <span className="font-medium text-ink">{other?.firstName}</span>
                <span className="text-xs text-slate-400">{c.mission?.title}</span>
              </div>
              {lastMessage && <p className="mt-1 truncate text-sm text-slate-500">{lastMessage.content}</p>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
