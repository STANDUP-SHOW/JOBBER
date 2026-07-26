'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAgencyAuth } from '../../../lib/agency-auth-context';
import { agencyApi } from '../../../lib/agencyApi';
import MissionInfoBadges from '../../../components/admin/MissionInfoBadges';

export default function OffresJobberPage() {
  const { token } = useAgencyAuth();
  const [offers, setOffers] = useState(null);
  const [reasons, setReasons] = useState([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [refusing, setRefusing] = useState(null); // offer id currently showing the reason picker
  const [reasonDraft, setReasonDraft] = useState('');

  async function refresh() {
    try {
      const { offers, refusalReasons } = await agencyApi.offers(token);
      setOffers(offers);
      setReasons(refusalReasons);
    } catch (err) { setError(err.message); }
  }

  useEffect(() => { if (token) refresh(); }, [token]);

  async function accept(id) {
    setBusyId(id);
    try {
      await agencyApi.acceptOffer(id, token);
      await refresh();
    } catch (err) { setError(err.message); } finally { setBusyId(null); }
  }

  async function confirmRefuse(id) {
    if (!reasonDraft) { setError('Choisissez un motif de refus.'); return; }
    setBusyId(id);
    try {
      await agencyApi.refuseOffer(id, reasonDraft, token);
      setRefusing(null);
      setReasonDraft('');
      await refresh();
    } catch (err) { setError(err.message); } finally { setBusyId(null); }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Offres Jobber</h1>
      <p className="mt-1 text-sm text-slate-500">
        Chaque offre reçue se présente comme un devis, imprimable et téléchargeable — la mise en forme définitive sera
        paramétrée plus tard.
      </p>

      {error && <p className="mt-4 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}

      <div className="mt-6 space-y-3">
        {offers === null && <p className="text-sm text-slate-400">Chargement…</p>}
        {offers?.length === 0 && <p className="text-sm text-slate-400">Aucune offre en attente.</p>}
        {offers?.map((o) => {
          const extraFeesTotal = (o.extraFees || []).reduce((sum, f) => sum + f.amount, 0);
          const total = o.hourlyRate * o.mission.estimatedHours + extraFeesTotal;
          return (
            <div key={o.id} className="rounded-lg border border-slate-200 bg-white p-5 print:break-inside-avoid">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-display text-base font-semibold text-ink">
                    Devis — <Link href={`/admin/missions/${o.mission.id}`} className="hover:underline">{o.mission.title}</Link>{' '}
                    {o.mission.corporateCode && <span className="font-mono text-xs text-slate-400">({o.mission.corporateCode})</span>}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {o.provider.firstName} {o.provider.lastName?.[0]}.
                    {o.provider.providerProfile?.ratingCount > 0 && ` · ${o.provider.providerProfile.ratingAverage.toFixed(1)}★ (${o.provider.providerProfile.ratingCount})`}
                  </div>
                  <MissionInfoBadges mission={o.mission} />
                </div>
                <button type="button" onClick={() => window.print()} className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-ink hover:border-slate-300">
                  Imprimer / télécharger
                </button>
              </div>

              <div className="mt-3 rounded-md bg-paper p-3 text-sm">
                <div className="flex justify-between"><span>Tarif horaire</span><span>{o.hourlyRate} €/h × {o.mission.estimatedHours} h</span></div>
                {o.extraFees?.map((f) => (
                  <div key={f.key} className="flex justify-between text-slate-500"><span>{f.label}</span><span>+{f.amount} €</span></div>
                ))}
                <div className="mt-1 flex justify-between border-t border-slate-200 pt-1 font-semibold text-ink"><span>Total</span><span>{total.toFixed(2)} €</span></div>
              </div>

              {refusing === o.id ? (
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                  <select value={reasonDraft} onChange={(e) => setReasonDraft(e.target.value)} className="rounded-md border border-slate-200 px-2 py-2 text-sm">
                    <option value="">Motif de refus…</option>
                    {reasons.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <button type="button" disabled={busyId === o.id} onClick={() => confirmRefuse(o.id)} className="rounded-md bg-clay px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
                    Confirmer le refus
                  </button>
                  <button type="button" onClick={() => { setRefusing(null); setReasonDraft(''); }} className="text-sm text-slate-400 hover:text-ink">
                    Annuler
                  </button>
                </div>
              ) : (
                <div className="mt-4 flex gap-3 border-t border-slate-100 pt-4">
                  <button type="button" disabled={busyId === o.id} onClick={() => accept(o.id)} className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60">
                    Valider la mission
                  </button>
                  <button type="button" onClick={() => setRefusing(o.id)} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-ink hover:border-slate-300">
                    Refuser l'offre
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
