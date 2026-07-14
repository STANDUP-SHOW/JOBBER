'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '../../../lib/api';
import StarRating from '../../../components/StarRating';
import VehicleIcon, { VEHICLES } from '../../../components/VehicleIcon';

const LEVEL_LABEL = { PROFESSIONNEL: 'Professionnel', EXPERT: 'Expert', PASSIONNE: 'Passionné' };
const LEVEL_STYLE = {
  PROFESSIONNEL: 'bg-purple-100 text-purple-700',
  EXPERT: 'bg-green-100 text-green-700',
  PASSIONNE: 'bg-ochre-light text-ochre-dark',
};

export default function ProviderProfilePage() {
  const { id } = useParams();
  const [provider, setProvider] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.provider(id).then(({ provider }) => setProvider(provider)).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <p className="text-clay">{error}</p>;
  if (!provider) return <p className="text-slate-400">Chargement…</p>;

  const profile = provider.providerProfile;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-moss-light font-display text-2xl text-moss-dark">
          {provider.firstName?.[0]}{provider.lastName?.[0]}
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">{provider.firstName} {provider.lastName?.[0]}.</h1>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <StarRating value={profile.ratingAverage} size={14} />
            <span>{profile.ratingAverage.toFixed(1)} ({profile.ratingCount} avis) · {profile.completedMissions} missions réalisées</span>
          </div>
        </div>
        {profile.verificationStatus === 'APPROVED' && (
          <span className="ml-auto rounded-full bg-moss-light px-3 py-1 text-xs font-medium text-moss-dark">✓ Vérifié</span>
        )}
      </div>

      {profile.categories?.length > 0 && (
        <div className="mt-5">
          <h2 className="font-display text-lg font-medium text-ink">Compétences</h2>
          <div className="mt-3 space-y-3">
            {profile.categories.map((pc) => {
              const services = (profile.services || []).filter((ps) => ps.service.categoryId === pc.categoryId);
              const equipment = (profile.equipment || []).filter((pe) => pe.equipment.categoryId === pc.categoryId);
              return (
                <div key={pc.id} className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-ink">{pc.category.icon} {pc.category.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">{pc.hourlyRate} €/h</span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${LEVEL_STYLE[pc.level] || 'bg-moss-light text-moss-dark'}`}>
                        {LEVEL_LABEL[pc.level] || pc.level}
                      </span>
                    </div>
                  </div>
                  {pc.bio && <p className="mt-2 text-sm text-slate-600">{pc.bio}</p>}
                  {services.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {services.map((ps) => (
                        <span key={ps.id} className="rounded-full border border-slate-200 px-2.5 py-0.5 text-xs text-slate-500">
                          {ps.service.name}
                        </span>
                      ))}
                    </div>
                  )}
                  {equipment.length > 0 && (
                    <div className="mt-2">
                      <span className="text-xs font-medium text-slate-400">Matériel possédé</span>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {equipment.map((pe) => (
                          <span key={pe.id} className="rounded-full bg-moss-light px-2.5 py-0.5 text-xs text-moss-dark">
                            {pe.equipment.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {profile.vehicles?.length > 0 && (
        <div className="mt-5">
          <h2 className="font-display text-lg font-medium text-ink">Mes véhicules</h2>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {profile.vehicles.map((pv) => {
              const v = VEHICLES.find((x) => x.type === pv.type);
              if (!v) return null;
              return (
                <div key={pv.id} className="flex flex-col items-center rounded-lg border border-slate-200 bg-white p-2 text-center">
                  <VehicleIcon type={v.type} className="h-8 w-12 text-moss-dark" />
                  <span className="mt-1 text-xs font-medium text-ink">{v.label}</span>
                  {v.capacity && <span className="text-[10px] text-slate-400">{v.capacity}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-4 text-sm text-slate-500">Zone d'intervention : {profile.radiusKm} km</div>

      <section className="mt-10">
        <h2 className="font-display text-lg font-medium text-ink">Avis clients</h2>
        <div className="mt-3 space-y-3">
          {provider.reviewsReceived?.length === 0 && <p className="text-sm text-slate-400">Pas encore d'avis.</p>}
          {provider.reviewsReceived?.map((r) => (
            <div key={r.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-ink">{r.author.firstName}</span>
                <StarRating value={r.rating} size={14} />
              </div>
              {r.comment && <p className="mt-1 text-sm text-slate-600">{r.comment}</p>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
