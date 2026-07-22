'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import { uploadImage } from '../../../lib/cloudinary';

const STATUS_LABEL = {
  PENDING: { text: 'En cours de vérification', cls: 'bg-ochre-light text-ochre-dark' },
  APPROVED: { text: 'Validé', cls: 'bg-moss-light text-moss-dark' },
  REJECTED: { text: 'Refusé', cls: 'bg-clay/10 text-clay' },
};

export default function DiplomasPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const inputRef = useRef(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [authLoading, user]);

  async function refresh() {
    if (!token) return;
    setLoading(true);
    try { const { documents } = await api.myVerificationDocs(token, 'DIPLOMA'); setDocuments(documents); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { refresh().catch((e) => setError(e.message)); }, [token]);

  async function onFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true); setError('');
    try {
      const fileUrl = await uploadImage(file);
      await api.uploadVerificationDoc({ type: 'DIPLOMA', fileUrl }, token);
      await refresh();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); e.target.value = ''; }
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-xl">
      <Link href="/account" className="text-sm text-slate-400 hover:text-moss">← Mon compte</Link>
      <span className="mt-4 block label-eyebrow text-moss">Espace Formation</span>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Mes diplômes et titres professionnels</h1>
      <p className="mt-1 text-sm text-slate-500">Ajoutez une photo ou un scan de vos diplômes — ils seront vérifiés par notre équipe.</p>

      {error && <p className="mt-4 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}

      <div className="mt-6">
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
        <button
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="rounded-md bg-moss px-4 py-2 text-sm font-medium text-paper hover:bg-moss-dark disabled:opacity-60"
        >
          {busy ? 'Envoi…' : '+ Ajouter un diplôme'}
        </button>
      </div>

      {loading && <p className="mt-6 text-slate-400">Chargement…</p>}

      {!loading && documents.length === 0 && (
        <div className="mt-6 rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center">
          <p className="text-slate-500">Aucun diplôme ajouté pour le moment.</p>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {documents.map((doc) => {
          const status = STATUS_LABEL[doc.status] || STATUS_LABEL.PENDING;
          return (
            <div key={doc.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <img src={doc.fileUrl} alt="Diplôme" className="h-32 w-full object-cover" />
              <div className="p-2">
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${status.cls}`}>{status.text}</span>
                <div className="mt-1 text-xs text-slate-400">{new Date(doc.createdAt).toLocaleDateString('fr-FR')}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
