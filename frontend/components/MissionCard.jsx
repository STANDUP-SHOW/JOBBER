import Link from 'next/link';
import MissionBadges from './MissionBadges';

const STATUS_LABEL = {
  OPEN: { text: 'Ouverte', cls: 'bg-moss-light text-moss-dark' },
  ASSIGNED: { text: 'Attribuée', cls: 'bg-ochre-light text-ochre-dark' },
  IN_PROGRESS: { text: 'En cours', cls: 'bg-ochre-light text-ochre-dark' },
  COMPLETED: { text: 'Terminée', cls: 'bg-slate-200 text-slate-600' },
  CANCELLED: { text: 'Annulée', cls: 'bg-slate-200 text-slate-600' },
};

function isRecent(dateStr) {
  return Date.now() - new Date(dateStr).getTime() < 48 * 60 * 60 * 1000;
}

function timeAgo(dateStr) {
  const hours = Math.floor((Date.now() - new Date(dateStr).getTime()) / (60 * 60 * 1000));
  if (hours < 1) return "à l'instant";
  if (hours < 24) return `il y a ${hours} heure${hours > 1 ? 's' : ''}`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} jour${days > 1 ? 's' : ''}`;
}

export default function MissionCard({ mission }) {
  const status = STATUS_LABEL[mission.status] || STATUS_LABEL.OPEN;
  const isCompany = mission.client?.accountKind === 'COMPANY';
  const posterName = isCompany ? mission.client.companyName : mission.client?.firstName;

  return (
    <Link
      href={`/missions/${mission.id}`}
      className="block overflow-hidden rounded-lg border border-slate-200 bg-white transition hover:border-moss hover:shadow-md"
    >
      <div className="flex items-start gap-3 p-4">
        {mission.photos?.[0] ? (
          <img src={mission.photos[0]} alt="" className="h-12 w-12 shrink-0 rounded-md object-cover" />
        ) : (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-moss-light text-2xl">
            {mission.category?.icon}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate font-display text-base font-semibold text-ink">{mission.title}</h3>
            <span className="shrink-0 whitespace-nowrap text-sm font-semibold text-ink">{mission.estimatedHours} h</span>
          </div>
          <div className="mt-0.5 truncate text-sm text-slate-400">{mission.address}</div>
          <MissionBadges mission={mission} className="mt-1.5" />
        </div>
      </div>

      <div className="border-t border-slate-100 px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
          <span>{new Date(mission.desiredDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          <span className={`rounded-full px-2.5 py-0.5 font-medium ${status.cls}`}>{status.text}</span>
        </div>
        <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-400">
          <span>{timeAgo(mission.createdAt)}</span>
          {isRecent(mission.createdAt) && (
            <span className="rounded-full bg-moss-light px-2 py-0.5 font-medium text-moss">Nouveau</span>
          )}
          <span className="ml-auto">
            {mission._count?.offers ?? 0} candidature{(mission._count?.offers ?? 0) > 1 ? 's' : ''}
          </span>
        </div>
        {posterName && (
          <div className="mt-1 flex items-center gap-1.5 truncate text-xs text-slate-400">
            Publié par {posterName}
            {isCompany && (
              <span className="rounded-full bg-moss px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                {mission.client.companyType === 'CORPORATE' ? 'Corporate' : 'Entreprise'}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
