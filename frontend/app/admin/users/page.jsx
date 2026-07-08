'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';

export default function AdminUsersPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) api.adminUsers(token).then(({ users }) => setUsers(users)).catch((e) => setError(e.message));
  }, [token]);

  if (error) return <p className="text-clay">{error}</p>;

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Nom</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Rôle</th>
            <th className="px-4 py-3">Statut vérification</th>
            <th className="px-4 py-3">Inscrit le</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-slate-100 last:border-0">
              <td className="px-4 py-3 font-medium text-ink">{u.firstName} {u.lastName}</td>
              <td className="px-4 py-3 text-slate-500">{u.email}</td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium">{u.role}</span>
              </td>
              <td className="px-4 py-3 text-slate-500">{u.providerProfile?.verificationStatus || '—'}</td>
              <td className="px-4 py-3 text-slate-400">{new Date(u.createdAt).toLocaleDateString('fr-FR')}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {users.length === 0 && <p className="p-4 text-sm text-slate-400">Aucun utilisateur.</p>}
    </div>
  );
}
