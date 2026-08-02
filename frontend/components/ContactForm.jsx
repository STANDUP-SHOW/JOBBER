'use client';

import { useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth-context';

export default function ContactForm() {
  const { user, token } = useAuth();
  const [form, setForm] = useState({
    name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '',
    email: user?.email || '',
    subject: '',
    message: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.submitContactMessage(form, token);
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-lg border border-moss/30 bg-moss-light p-6 text-center">
        <p className="font-display text-lg font-semibold text-ink">Message envoyé</p>
        <p className="mt-2 text-sm text-moss-dark">Merci, nous vous répondrons dès que possible par email.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="text-xs font-medium text-slate-500">Nom</span>
        <input
          required value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-moss"
        />
      </label>
      <label className="block">
        <span className="text-xs font-medium text-slate-500">Email</span>
        <input
          required type="email" value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-moss"
        />
      </label>
      <label className="block">
        <span className="text-xs font-medium text-slate-500">Sujet (optionnel)</span>
        <input
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-moss"
        />
      </label>
      <label className="block">
        <span className="text-xs font-medium text-slate-500">Message</span>
        <textarea
          required rows={5} minLength={10} value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-moss"
        />
      </label>

      {error && <p className="rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}

      <button disabled={loading} className="w-full rounded-md bg-moss py-3 font-medium text-paper hover:bg-moss-dark disabled:opacity-60">
        {loading ? 'Envoi…' : 'Envoyer le message'}
      </button>
    </form>
  );
}
