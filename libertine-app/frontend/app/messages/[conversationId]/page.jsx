'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/AuthContext';
import { apiFetch, mediaUrl } from '../../../lib/api';
import { getSocket } from '../../../lib/socket';

export default function ConversationPage() {
  const { conversationId } = useParams();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [otherProfile, setOtherProfile] = useState(null);
  const [distanceKm, setDistanceKm] = useState(null);
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    apiFetch(`/api/messages/conversations/${conversationId}`).then((d) => {
      setMessages(d.messages);
      setOtherProfile(d.otherProfile);
      setDistanceKm(d.distanceKm);
    }).catch(() => {});

    const socket = getSocket();
    socket.emit('conversation:join', conversationId);
    const onNew = (msg) => {
      if (msg.conversationId === conversationId) setMessages((m) => [...m, msg]);
    };
    socket.on('message:new', onNew);
    return () => {
      socket.emit('conversation:leave', conversationId);
      socket.off('message:new', onNew);
    };
  }, [conversationId, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!user) return null;

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const content = text;
    setText('');
    const { message } = await apiFetch(`/api/messages/conversations/${conversationId}`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
    setMessages((m) => (m.find((x) => x.id === message.id) ? m : [...m, message]));
  };

  return (
    <div className="max-w-xl mx-auto flex flex-col h-[70vh]">
      {otherProfile && (
        <div className="flex items-center gap-3 pb-3 mb-1 border-b border-neutral-800">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-neutral-800 shrink-0">
            {otherProfile.photo && <img src={mediaUrl(otherProfile.photo)} alt="" className="w-full h-full object-cover" />}
          </div>
          <div>
            <p className="font-medium">{otherProfile.pseudo}</p>
            <p className="text-xs text-neutral-500">
              {otherProfile.city}
              {distanceKm != null && ` · à ~${distanceKm} km`}
            </p>
          </div>
        </div>
      )}
      <div className="flex-1 overflow-y-auto space-y-2 pb-4">
        {messages.map((m) => (
          <div key={m.id}
            className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
              m.senderProfileId === user.profile.id ? 'bg-brand-600 ml-auto' : 'bg-neutral-800'
            }`}>
            {m.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="flex gap-2 pt-2 border-t border-neutral-800">
        <input className="input" placeholder="Votre message..." value={text} onChange={(e) => setText(e.target.value)} />
        <button className="btn-primary">Envoyer</button>
      </form>
    </div>
  );
}
