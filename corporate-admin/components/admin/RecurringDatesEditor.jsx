'use client';

// "+ Ajouter une date" — one row per occurrence of a recurring/long-term
// mission: date, heure de début, heure de fin, nombre d'heures.
export default function RecurringDatesEditor({ dates, onChange }) {
  function updateDate(i, field, value) {
    onChange(dates.map((d, idx) => (idx === i ? { ...d, [field]: value } : d)));
  }

  function addDate() {
    onChange([...dates, { date: '', startTime: '09:00', hours: 2, endTime: '11:00' }]);
  }

  function removeDate(i) {
    onChange(dates.filter((_, idx) => idx !== i));
  }

  return (
    <div>
      <span className="text-xs font-medium text-slate-500">Dates de la mission (contrat longue durée)</span>
      <div className="mt-2 space-y-2">
        {dates.map((d, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <input type="date" required value={d.date} onChange={(e) => updateDate(i, 'date', e.target.value)} className="rounded-md border border-slate-200 px-2 py-1.5 text-sm" />
            <input type="time" required value={d.startTime} onChange={(e) => updateDate(i, 'startTime', e.target.value)} className="w-28 rounded-md border border-slate-200 px-2 py-1.5 text-sm" />
            <input type="number" min={0.5} step={0.5} required value={d.hours} onChange={(e) => updateDate(i, 'hours', e.target.value)} placeholder="Heures" className="w-24 rounded-md border border-slate-200 px-2 py-1.5 text-sm" />
            <input type="time" required value={d.endTime} onChange={(e) => updateDate(i, 'endTime', e.target.value)} className="w-28 rounded-md border border-slate-200 px-2 py-1.5 text-sm" />
            {dates.length > 1 && (
              <button type="button" onClick={() => removeDate(i)} className="text-sm text-slate-400 hover:text-clay">✕</button>
            )}
          </div>
        ))}
      </div>
      <button type="button" onClick={addDate} className="mt-2 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-ink hover:border-slate-300">
        + Ajouter une date
      </button>
    </div>
  );
}
