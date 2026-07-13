'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '../../../lib/api';
import StarRating from '../../../components/StarRating';

const LEVEL_LABEL = { PROFESSIONNEL: 'Professionnel', EXPERT: 'Expert', PASSIONNE: 'Passionné' };

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

      {profile.bio && <p className="mt-5 text-slate-600">{profile.bio}</p>}

      {profile.categories?.length > 0 && (
        <div className="mt-5">
          <h2 className="font-display text-lg font-medium text-ink">Compétences</h2>
          <div className="mt-3 space-y-3">
            {profile.categories.map((pc) => {
              const services = (profile.services || []).filter((ps) => ps.service.categoryId === pc.categoryId);
              return (
                <div key={pc.id} className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-ink">{pc.category.icon} {pc.category.name}</span>
                    <span className="rounded-full bg-moss-light px-2.5 py-1 text-xs font-medium text-moss-dark">
                      {LEVEL_LABEL[pc.level] || pc.level}
                    </span>
                  </div>
                  {services.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {services.map((ps) => (
                        <span key={ps.id} className="rounded-full border border-slate-200 px-2.5 py-0.5 text-xs text-slate-500">
                          {ps.service.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-4 text-sm text-slate-500">Tarif de base : {profile.defaultHourlyRate} €/h · Zone : {profile.radiusKm} km</div>

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
