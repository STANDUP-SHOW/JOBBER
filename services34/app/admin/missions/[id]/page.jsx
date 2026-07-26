'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { useAgencyAuth } from '../../../../lib/agency-auth-context';
import { agencyApi } from '../../../../lib/agencyApi';
import { GOOGLE_MAPS_LIBRARIES } from '../../../../lib/googleMapsLibraries';
import MissionInfoBadges from '../../../../components/admin/MissionInfoBadges';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export default function MissionDetailPage() {
  const { id } = useParams();
  const { token } = useAgencyAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token || !id) return;
    agencyApi.missionDetail(id, token).then(setData).catch((e) => setError(e.message));
  }, [token, id]);

  const { isLoaded } = useJsApiLoader({
    id: 'services34-google-maps',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY || '',
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  if (error) return <p className="rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>;
  if (!data) return <p className="text-sm text-slate-400">Chargement…</p>;

  const { mission: m, distanceKm } = data;
  const requester = m.client?.accountKind === 'COMPANY' ? m.client.companyName : `${m.client?.firstName || ''} ${m.client?.lastName || ''}`.trim();
  const provider = m.booking?.provider;

  return (
    <div className="max-w-3xl">
      <Link href="/admin" className="text-sm text-slate-400 hover:text-ink">← Retour</Link>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-2xl">{m.category?.icon}</span>
        <h1 className="font-display text-2xl font-semibold text-ink">{m.title}</h1>
        {m.corporateCode && (
          <span className="rounded-full bg-brand-light px-2 py-0.5 text-xs font-mono font-semibold text-brand-dark">{m.corporateCode}</span>
        )}
      </div>
      <div className="mt-1 text-sm text-slate-500">
        {m.category?.name}{m.service ? ` · ${m.service.name}` : ''} · {new Date(m.desiredDate).toLocaleString('fr-FR')} · {m.estimatedHours} h
      </div>

      <MissionInfoBadges mission={m} showAddress={false} />

      {m.description && (
        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-slate-400">Description</h2>
          <p className="mt-2 text-sm text-ink">{m.description}</p>
        </section>
      )}

      <section className="mt-4 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-slate-400">Demandeur</h2>
        <div className="mt-2 space-y-1 text-sm text-ink">
          {requester && <div>{requester}</div>}
          {m.client?.phone && <div className="text-slate-500">📞 {m.client.phone}</div>}
          {m.client?.email && <div className="text-slate-500">✉️ {m.client.email}</div>}
        </div>
      </section>

      <section className="mt-4 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-slate-400">Adresse d'intervention</h2>
        <p className="mt-2 text-sm text-ink">{m.address}</p>
        {distanceKm != null && (
          <p className="mt-1 text-xs text-slate-500">{distanceKm} km de votre agence</p>
        )}

        <div className="mt-3 overflow-hidden rounded-lg border border-slate-200" style={{ height: '260px' }}>
          {GOOGLE_MAPS_API_KEY && isLoaded && m.lat != null && m.lng != null ? (
            <GoogleMap
              center={{ lat: m.lat, lng: m.lng }}
              zoom={13}
              mapContainerStyle={{ height: '100%', width: '100%' }}
              options={{ disableDefaultUI: true, zoomControl: true, clickableIcons: false }}
            >
              <Marker position={{ lat: m.lat, lng: m.lng }} />
            </GoogleMap>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              Adresse non localisée sur la carte
            </div>
          )}
        </div>
      </section>

      {m.scheduleEntries?.length > 0 && (
        <section className="mt-4 rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-slate-400">Planning des dates</h2>
          <div className="mt-2 space-y-1 text-sm text-ink">
            {m.scheduleEntries.map((d) => (
              <div key={d.id}>{new Date(d.date).toLocaleDateString('fr-FR')} · {d.startTime}–{d.endTime} · {d.hours} h</div>
            ))}
          </div>
        </section>
      )}

      {provider && (
        <section className="mt-4 rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-slate-400">Prestataire assigné</h2>
          <div className="mt-2 text-sm text-ink">
            {provider.firstName} {provider.lastName}
            {provider.phone && <span className="text-slate-500"> · 📞 {provider.phone}</span>}
          </div>
        </section>
      )}

      {m.offers?.length > 0 && (
        <section className="mt-4 rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-slate-400">Offres reçues</h2>
          <div className="mt-2 space-y-1 text-sm text-ink">
            {m.offers.map((o) => (
              <div key={o.id}>
                {o.provider?.firstName} {o.provider?.lastName} · {o.hourlyRate} €/h · {o.status}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
