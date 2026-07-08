import Link from 'next/link';

const STATUS_LABEL = {
  OPEN: { text: 'Ouverte', cls: 'bg-moss-light text-moss-dark' },
  ASSIGNED: { text: 'Attribuée', cls: 'bg-ochre-light text-ochre-dark' },
  IN_PROGRESS: { text: 'En cours', cls: 'bg-ochre-light text-ochre-dark' },
  COMPLETED: { text: 'Terminée', cls: 'bg-slate-200 text-slate-600' },
  CANCELLED: { text: 'Annulée', cls: 'bg-slate-200 text-slate-600' },
};

export default function MissionCard({ mission }) {
  const status = STATUS_LABEL[mission.status] || STATUS_LABEL.OPEN;

  return (
    <Link
      href={`/missions/${mission.id}`}
      className="block rounded-lg border border-slate-200 bg-white p-5 transition hover:border-moss hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="label-eyebrow text-moss">{mission.category?.name}</span>
          <h3 className="mt-1 font-display text-lg font-medium text-ink">{mission.title}</h3>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${status.cls}`}>{status.text}</span>
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-slate-600">{mission.description}</p>
      <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
        <span>{mission.address}</span>
        <span>·</span>
        <span>{new Date(mission.desiredDate).toLocaleDateString('fr-FR')}</span>
        <span>·</span>
        <span>{mission._count?.offers ?? 0} candidature{(mission._count?.offers ?? 0) > 1 ? 's' : ''}</span>
      </div>
    </Link>
  );
}
