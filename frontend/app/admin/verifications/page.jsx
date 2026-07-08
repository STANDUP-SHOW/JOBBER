'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';

export default function AdminVerificationsPage() {
  const { token } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  async function refresh() {
    const { documents } = await api.verificationQueue(token);
    setDocuments(documents);
  }

  useEffect(() => { if (token) refresh().catch((e) => setError(e.message)); }, [token]);

  async function decide(id, approve) {
    setBusyId(id); setError('');
    try {
      await api.verificationDecision(id, approve, token);
      await refresh();
    } catch (err) { setError(err.message); } finally { setBusyId(null); }
  }

  return (
    <div>
      <p className="text-sm text-slate-500">Documents d'identité, d'adresse ou bancaires soumis par les prestataires, en attente de validation.</p>
      {error && <p className="mt-3 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}

      <div className="mt-5 space-y-3">
        {documents.length === 0 && <p className="text-slate-400">File d'attente vide — rien à valider pour le moment.</p>}
        {documents.map((doc) => (
          <div key={doc.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4">
            <div>
              <div className="font-medium text-ink">{doc.user.firstName} {doc.user.lastName} <span className="text-slate-400 font-normal">— {doc.user.email}</span></div>
              <div className="text-sm text-slate-500">{TYPE_LABEL[doc.type] || doc.type}</div>
              <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-moss hover:underline">Voir le document ↗</a>
            </div>
            <div className="flex gap-2">
              <button
                disabled={busyId === doc.id}
                onClick={() => decide(doc.id, true)}
                className="rounded-md bg-moss px-4 py-2 text-sm font-medium text-white hover:bg-moss-dark disabled:opacity-60"
              >
                Approuver
              </button>
              <button
                disabled={busyId === doc.id}
                onClick={() => decide(doc.id, false)}
                className="rounded-md border border-clay px-4 py-2 text-sm font-medium text-clay hover:bg-clay/10 disabled:opacity-60"
              >
                Rejeter
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const TYPE_LABEL = {
  ID_CARD: "Pièce d'identité",
  PROOF_OF_ADDRESS: "Justificatif de domicile",
  BANK_ACCOUNT: "Compte bancaire",
};
