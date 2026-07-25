'use client';

import VehicleIcon, { VEHICLES } from '../VehicleIcon';

// Same "service précis + détails + matériel + véhicule" fields as the
// public /demande form — shared here so agency-created missions (Nouvelle
// mission agence, Embaucher pour une mission) carry the same information a
// visitor-submitted demande does, instead of an empty shell.
export default function MissionExtraFields({ category, form, setForm }) {
  const selectedService = category?.services?.find((s) => s.id === form.serviceId);
  const detailFields = selectedService?.detailFields || [];

  function setDetail(key, value) {
    setForm((f) => ({ ...f, details: { ...f.details, [key]: value } }));
  }

  function toggleRequiredEquipment(equipmentId) {
    setForm((f) => ({
      ...f,
      requiredEquipmentIds: f.requiredEquipmentIds.includes(equipmentId)
        ? f.requiredEquipmentIds.filter((id) => id !== equipmentId)
        : [...f.requiredEquipmentIds, equipmentId],
    }));
  }

  function toggleRequiredVehicle(type) {
    setForm((f) => ({
      ...f,
      requiredVehicleTypes: f.requiredVehicleTypes.includes(type)
        ? f.requiredVehicleTypes.filter((t) => t !== type)
        : [...f.requiredVehicleTypes, type],
    }));
  }

  return (
    <>
      {category?.services?.length > 0 && (
        <label className="block">
          <span className="text-xs font-medium text-slate-500">Prestation précise (optionnel)</span>
          <select
            value={form.serviceId}
            onChange={(e) => setForm((f) => ({ ...f, serviceId: e.target.value, details: {} }))}
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
          >
            <option value="">Non précisé</option>
            {category.services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
      )}

      {detailFields.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <span className="text-sm font-semibold text-ink">Précisions sur « {selectedService.name} »</span>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {detailFields.map((field) => (
              <DetailField
                key={field.key}
                field={field}
                value={form.details?.[field.key]}
                onChange={(v) => setDetail(field.key, v)}
                otherValue={form.details?.[`${field.key}Precision`]}
                onOtherChange={(v) => setDetail(`${field.key}Precision`, v)}
              />
            ))}
          </div>
        </div>
      )}

      {category?.equipment?.length > 0 && (
        <div>
          <span className="text-sm font-semibold text-ink">L'agent doit-il apporter du matériel ?</span>
          <p className="mt-1 text-sm text-slate-500">Cochez le matériel que l'agent doit avoir avec lui.</p>
          <div className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2.5 sm:grid-cols-2">
            {category.equipment.map((eq) => (
              <label key={eq.id} className="flex items-center gap-2.5 text-base text-ink">
                <input
                  type="checkbox"
                  checked={form.requiredEquipmentIds.includes(eq.id)}
                  onChange={() => toggleRequiredEquipment(eq.id)}
                  className="h-4 w-4 shrink-0 rounded border-slate-300 accent-brand"
                />
                {eq.name}
              </label>
            ))}
            <label className="flex items-center gap-2.5 text-base text-ink">
              <input
                type="checkbox"
                checked={form.otherEquipmentChecked}
                onChange={(e) => setForm((f) => ({ ...f, otherEquipmentChecked: e.target.checked }))}
                className="h-4 w-4 shrink-0 rounded border-slate-300 accent-brand"
              />
              Autre
            </label>
          </div>
          {form.otherEquipmentChecked && (
            <div className="mt-2">
              <input
                type="text"
                maxLength={200}
                value={form.otherEquipmentNote}
                onChange={(e) => setForm((f) => ({ ...f, otherEquipmentNote: e.target.value }))}
                placeholder="Précisez le matériel nécessaire…"
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </div>
          )}
        </div>
      )}

      <div>
        <span className="text-sm font-semibold text-ink">L'agent doit-il être équipé d'un véhicule spécial ?</span>
        <p className="mt-1 text-sm text-slate-500">Cochez le ou les véhicules requis pour cette intervention.</p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {VEHICLES.map((v) => {
            const active = form.requiredVehicleTypes.includes(v.type);
            return (
              <button
                key={v.type}
                type="button"
                onClick={() => toggleRequiredVehicle(v.type)}
                className={`flex flex-col items-center rounded-lg border-2 p-3 text-center ${active ? 'border-brand bg-brand-light' : 'border-slate-200 bg-white'}`}
              >
                <VehicleIcon type={v.type} className={`h-9 w-14 ${active ? '' : 'opacity-60'}`} />
                <span className={`mt-1.5 text-sm font-semibold ${active ? 'text-brand' : 'text-ink'}`}>{v.label}</span>
                {v.capacity && <span className="text-xs text-slate-400">{v.capacity}</span>}
              </button>
            );
          })}
        </div>
        <label className="mt-3 flex items-center gap-2.5 text-base text-ink">
          <input
            type="checkbox"
            checked={form.otherVehicleChecked}
            onChange={(e) => setForm((f) => ({ ...f, otherVehicleChecked: e.target.checked }))}
            className="h-4 w-4 shrink-0 rounded border-slate-300 accent-brand"
          />
          Autre véhicule
        </label>
        {form.otherVehicleChecked && (
          <div className="mt-2">
            <input
              type="text"
              maxLength={200}
              value={form.otherVehicleNote}
              onChange={(e) => setForm((f) => ({ ...f, otherVehicleNote: e.target.value }))}
              placeholder="Précisez le véhicule nécessaire…"
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </div>
        )}
      </div>
    </>
  );
}

function DetailField({ field, value, onChange, otherValue, onOtherChange }) {
  if (field.type === 'boolean') {
    return (
      <label className="flex items-center gap-2.5 text-sm text-ink">
        <input
          type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 shrink-0 rounded border-slate-300 accent-brand"
        />
        {field.label}
      </label>
    );
  }

  if (field.type === 'multiselect') {
    const selected = Array.isArray(value) ? value : [];
    function toggle(opt) {
      onChange(selected.includes(opt) ? selected.filter((o) => o !== opt) : [...selected, opt]);
    }
    const groups = field.groups || [{ title: null, options: field.options || [] }];
    return (
      <div className="sm:col-span-2">
        <span className="text-xs font-medium text-slate-500">{field.label}</span>
        <div className="mt-2 space-y-4">
          {groups.map((group) => (
            <div key={group.title || 'default'}>
              {group.title && <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-brand">{group.title}</div>}
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {group.options.map((opt) => (
                  <label key={opt} className="flex items-center gap-2 text-sm text-ink">
                    <input
                      type="checkbox" checked={selected.includes(opt)} onChange={() => toggle(opt)}
                      className="h-4 w-4 shrink-0 rounded border-slate-300 accent-brand"
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (field.type === 'select') {
    return (
      <div>
        <label className="block">
          <span className="text-xs font-medium text-slate-500">{field.label}</span>
          <select
            value={value ?? ''} onChange={(e) => onChange(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
          >
            <option value="">Choisir…</option>
            {field.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </label>
        {field.other && value === 'Autre' && (
          <label className="mt-2 block">
            <span className="text-xs font-medium text-slate-500">Précisez</span>
            <input
              type="text" value={otherValue ?? ''} onChange={(e) => onOtherChange(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </label>
        )}
      </div>
    );
  }

  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-500">{field.label}{field.unit ? ` (${field.unit})` : ''}</span>
      <input
        type={field.type === 'number' ? 'number' : 'text'} step={field.type === 'number' ? 'any' : undefined}
        value={value ?? ''} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
      />
    </label>
  );
}
