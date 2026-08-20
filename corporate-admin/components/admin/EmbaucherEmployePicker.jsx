'use client';

import { useState } from 'react';

// "Embaucher" from an in-progress agence mission — staffs one of the
// agency's own employees (filtered to the mission's category) onto a job
// the agency already committed to handle itself.
export default function EmbaucherEmployePicker({ mission, employees, onAssign, busy }) {
  const [selected, setSelected] = useState('');

  const eligible = employees.filter(({ jobber }) =>
    jobber.providerProfile?.categories?.some((c) => c.categoryId === mission.categoryId)
  );

  if (!eligible.length) {
    return <span className="text-xs text-slate-400">Aucun employé dans cette catégorie</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <select value={selected} onChange={(e) => setSelected(e.target.value)} className="rounded-md border border-slate-200 px-2 py-1.5 text-sm">
        <option value="">Employé…</option>
        {eligible.map(({ jobber }) => (
          <option key={jobber.id} value={jobber.id}>{jobber.firstName} {jobber.lastName?.[0]}.</option>
        ))}
      </select>
      <button
        type="button"
        disabled={!selected || busy}
        onClick={() => onAssign(mission.id, selected)}
        className="rounded-md border border-brand px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand-light disabled:opacity-60"
      >
        Embaucher
      </button>
    </div>
  );
}
