'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import { api, API_URL } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';

export default function ConversationPage() {
  const { conversationId } = useParams();
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();

  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [authLoading, user]);

  useEffect(() => {
    if (!token) return;
    api.conversation(conversationId, token)
      .then(({ conversation, messages }) => { setConversation(conversation); setMessages(messages); })
      .catch((e) => setError(e.message));
  }, [conversationId, token]);

  useEffect(() => {
    if (!token) return;
    const socket = io(API_URL, { auth: { token } });
    socketRef.current = socket;
    socket.emit('conversation:join', conversationId);
    socket.on('message:new', (msg) => {
      if (msg.conversationId === conversationId) setMessages((prev) => [...prev, msg]);
    });
    return () => socket.disconnect();
  }, [conversationId, token]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  function send(e) {
    e.preventDefault();
    if (!text.trim()) return;
    socketRef.current?.emit('message:send', { conversationId, content: text }, (res) => {
      if (res?.error) setError(res.error);
    });
    setText('');
  }

  if (!user) return null;

  return (
    <div className="mx-auto flex h-[70vh] max-w-2xl flex-col rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-3">
        <div className="font-display text-lg font-medium text-ink">{conversation?.mission?.title || 'Conversation'}</div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-5">
        {messages.map((m) => {
          const mine = m.senderId === user.id;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${mine ? 'bg-moss text-white' : 'bg-slate-100 text-ink'}`}>
                {m.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {error && <p className="px-5 text-xs text-clay">{error}</p>}

      <form onSubmit={send} className="flex gap-2 border-t border-slate-200 p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Écrire un message…"
          className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-moss"
        />
        <button className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-moss-dark">Envoyer</button>
      </form>
    </div>
  );
}
