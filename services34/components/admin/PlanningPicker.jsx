'use client';

import { useState } from 'react';

// "Mise au planning" — lets the admin attribute an in-progress mission to
// one of the agency's plannings (per-category default, or a named one like
// "Planning Emily").
export default function PlanningPicker({ mission, plannings, onAssign, busy }) {
  const [selected, setSelected] = useState(mission.planningId || '');

  if (mission.planningId && mission.planning) {
    return <span className="rounded-full bg-brand-light px-3 py-1 text-xs font-semibold text-brand-dark">{mission.planning.name}</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <select value={selected} onChange={(e) => setSelected(e.target.value)} className="rounded-md border border-slate-200 px-2 py-1.5 text-sm">
        <option value="">Planning…</option>
        {plannings.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <button
        type="button"
        disabled={!selected || busy}
        onClick={() => onAssign(mission.id, selected)}
        className="rounded-md border border-brand px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand-light disabled:opacity-60"
      >
        Mettre au planning
      </button>
    </div>
  );
}
