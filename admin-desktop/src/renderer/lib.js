/* Shared helpers for the renderer: formatting, API calls, UI primitives.
   Everything user-supplied goes through esc() before reaching innerHTML. */
(function () {
  const JAF = (window.JAF = {});

  JAF.esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const esc = JAF.esc;

  const dateFmt = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', day: '2-digit', month: '2-digit', year: 'numeric' });
  const dateTimeFmt = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const moneyFmt = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
  const intFmt = new Intl.NumberFormat('fr-FR');

  JAF.date = (v) => (v ? dateFmt.format(new Date(v)) : '—');
  JAF.dateTime = (v) => (v ? dateTimeFmt.format(new Date(v)) : '—');
  // "Non disponible" is never shown as zero.
  JAF.money = (cents) => (cents == null ? '<span class="muted">indisponible</span>' : esc(moneyFmt.format(cents / 100)));
  JAF.int = (n) => (n == null ? '<span class="muted">indisponible</span>' : esc(intFmt.format(n)));

  const LABELS = {
    OPEN: ['Publiée', 'blue'], ASSIGNED: ['Attribuée', 'blue'], IN_PROGRESS: ['En cours', 'ochre'], COMPLETED: ['Terminée', 'green'], CANCELLED: ['Annulée', ''],
    SCHEDULED: ['Planifiée', 'blue'], AWAITING_VALIDATION: ['À valider', 'ochre'], DISPUTED: ['Litige', 'red'],
    REQUIRES_PAYMENT: ['À payer', 'ochre'], HELD_IN_ESCROW: ['En séquestre', 'blue'], RELEASED: ['Libéré', 'green'], REFUNDED: ['Remboursé', ''], FAILED: ['Échoué', 'red'],
    PENDING: ['En attente', 'ochre'], SELECTED: ['Sélectionnée', 'blue'], ACCEPTED: ['Acceptée', 'green'], REJECTED: ['Refusée', 'red'], WITHDRAWN: ['Retirée', ''],
    UNVERIFIED: ['Non vérifié', ''], APPROVED: ['Validé', 'green'],
    NEW: ['Nouveau', 'ochre'], READ: ['Lu', 'blue'], REPLIED: ['Répondu', 'green'],
    ACTIVE: ['Actif', 'green'], PAST_DUE: ['Impayé', 'red'], CANCELED: ['Résilié', ''],
    ID_CARD: ['Pièce d\'identité', ''], PROOF_OF_ADDRESS: ['Justificatif de domicile', ''], BANK_ACCOUNT: ['RIB', ''], DIPLOMA: ['Diplôme', ''],
  };
  JAF.LABELS = LABELS;
  JAF.status = (s) => (s ? `<span class="badge ${LABELS[s]?.[1] || ''}">${esc(LABELS[s]?.[0] || s)}</span>` : '<span class="muted">—</span>');
  JAF.label = (s) => LABELS[s]?.[0] || s;

  // --- API ---
  JAF.api = async (method, path, opts) => {
    const res = await window.jaf.request(method, `/api/admin/v1${path}`, opts);
    if (res.status === 401) { JAF.onUnauthorized?.(); }
    if (!res.ok) {
      const err = new Error(res.data?.error || `Erreur HTTP ${res.status}`);
      err.status = res.status; err.code = res.data?.code; err.correlationId = res.data?.correlationId;
      throw err;
    }
    return res.data;
  };
  JAF.get = (path, query) => JAF.api('GET', path, { query });

  JAF.can = (perm) => JAF.state.me?.permissions.includes(perm);

  // --- Toasts ---
  JAF.toast = (msg, kind = '') => {
    const el = document.createElement('div');
    el.className = `toast ${kind}`;
    el.textContent = msg;
    document.getElementById('toasts').appendChild(el);
    setTimeout(() => el.remove(), kind === 'error' ? 7000 : 3500);
  };
  JAF.errorText = (err) => `${err.message}${err.correlationId ? ` (réf. ${err.correlationId.slice(0, 8)})` : ''}`;

  // --- Modal form ---
  // fields: [{ name, label, type: 'text'|'textarea'|'select'|'date', required, value, options: [[v,l]], help }]
  // Resolves with the values, or null if cancelled. `submit(values)` may
  // throw to keep the modal open and show the error.
  JAF.modal = ({ title, intro, impact, fields = [], submitLabel = 'Confirmer', danger = false, submit }) => new Promise((resolve) => {
    const root = document.getElementById('modal-root');
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = `
      <form class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}">
        <h2>${esc(title)}</h2>
        ${intro ? `<div>${intro}</div>` : ''}
        ${impact ? `<div class="impact">${impact}</div>` : ''}
        ${fields.map((f) => `
          <label>${esc(f.label)}${f.required ? ' *' : ''}
            ${f.type === 'textarea'
              ? `<textarea name="${esc(f.name)}" ${f.required ? 'required' : ''}>${esc(f.value || '')}</textarea>`
              : f.type === 'select'
                ? `<select name="${esc(f.name)}">${f.options.map(([v, l]) => `<option value="${esc(v)}" ${String(v) === String(f.value) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`
                : `<input name="${esc(f.name)}" type="${f.type || 'text'}" value="${esc(f.value || '')}" ${f.required ? 'required' : ''}>`}
            ${f.help ? `<span class="muted small">${esc(f.help)}</span>` : ''}
          </label>`).join('')}
        <p class="form-error" role="alert"></p>
        <div class="modal-actions">
          <button type="button" class="btn" data-cancel>Annuler</button>
          <button type="submit" class="btn ${danger ? 'btn-danger solid' : 'btn-primary'}">${esc(submitLabel)}</button>
        </div>
      </form>`;
    root.appendChild(backdrop);
    const form = backdrop.querySelector('form');
    const errorEl = form.querySelector('.form-error');
    const close = (value) => { backdrop.remove(); document.removeEventListener('keydown', onKey); resolve(value); };
    const onKey = (e) => { if (e.key === 'Escape') close(null); };
    document.addEventListener('keydown', onKey);
    form.querySelector('[data-cancel]').onclick = () => close(null);
    (form.querySelector('input, textarea, select') || form.querySelector('[type=submit]')).focus();
    form.onsubmit = async (e) => {
      e.preventDefault();
      const values = Object.fromEntries(new FormData(form).entries());
      const btn = form.querySelector('[type=submit]');
      btn.disabled = true; errorEl.textContent = '';
      try {
        const result = submit ? await submit(values) : values;
        close(result ?? values);
      } catch (err) {
        errorEl.textContent = JAF.errorText(err);
        btn.disabled = false;
      }
    };
  });

  JAF.reasonField = (label = 'Motif', help = 'Obligatoire, enregistré dans le journal d\'audit') => ({ name: 'reason', label, type: 'textarea', required: true, help });

  // --- States ---
  JAF.loading = () => '<div class="state">Chargement…</div>';
  JAF.errorState = (err, retryId) => `<div class="state error">${esc(JAF.errorText(err))}${err.code === 'MIGRATION_REQUIRED' ? '<div class="muted small">Cette fonction attend la mise à jour de la base (voir Administration &gt; Paramètres).</div>' : ''}${retryId ? `<div><button class="btn" id="${retryId}">Réessayer</button></div>` : ''}</div>`;

  // --- Server-paginated table ---
  // cfg: { path, columns: [{ label, render(row), sort?, num? }], filters: [{ name, label, type, options }],
  //        state (persisted object), onRow(row), exportName, extraQuery() }
  JAF.table = (container, cfg) => {
    const st = cfg.state;
    st.page = st.page || 1;
    st.pageSize = st.pageSize || 25;
    st.filters = st.filters || {};
    let timer = null;

    container.innerHTML = `
      <div class="toolbar">
        ${(cfg.filters || []).map((f) => {
          const v = st.filters[f.name] ?? '';
          if (f.type === 'select') return `<label>${esc(f.label)}<select data-f="${f.name}">${f.options.map(([ov, ol]) => `<option value="${esc(ov)}" ${String(ov) === String(v) ? 'selected' : ''}>${esc(ol)}</option>`).join('')}</select></label>`;
          if (f.type === 'checkbox') return `<label class="inline"><input type="checkbox" data-f="${f.name}" ${v === 'true' ? 'checked' : ''}> ${esc(f.label)}</label>`;
          return `<label>${esc(f.label)}<input data-f="${f.name}" type="${f.type || 'search'}" value="${esc(v)}" ${f.placeholder ? `placeholder="${esc(f.placeholder)}"` : ''}></label>`;
        }).join('')}
        <span class="spacer"></span>
        ${cfg.exportName && JAF.can('exports.run') ? '<button class="btn" data-export>Exporter CSV</button>' : ''}
        <button class="btn" data-refresh>Actualiser</button>
      </div>
      <div class="table-wrap"><div data-body>${JAF.loading()}</div></div>`;

    const body = container.querySelector('[data-body]');

    const query = () => ({ ...st.filters, ...(cfg.extraQuery ? cfg.extraQuery() : {}), page: st.page, pageSize: st.pageSize, sort: st.sort });

    async function load() {
      body.innerHTML = JAF.loading();
      let data;
      try { data = await JAF.get(cfg.path, query()); } catch (err) {
        body.innerHTML = JAF.errorState(err, 'retry-table');
        body.querySelector('#retry-table')?.addEventListener('click', load);
        return;
      }
      cfg.onData?.(data);
      if (!data.items.length) {
        const filtered = Object.values(st.filters).some((v) => v);
        body.innerHTML = `<div class="state">${filtered ? 'Aucun résultat pour ces filtres.' : esc(cfg.empty || 'Aucune donnée.')}</div>`;
        return;
      }
      const pages = Math.max(1, Math.ceil(data.total / data.pageSize));
      const [sk, sd] = String(data.sort || st.sort || '').split(':');
      body.innerHTML = `
        <table>
          <thead><tr>${cfg.columns.map((c, i) => `<th class="${c.num ? 'num' : ''}">${c.sort ? `<button data-sort="${c.sort}">${esc(c.label)}${sk === c.sort ? (sd === 'asc' ? ' ▲' : ' ▼') : ''}</button>` : esc(c.label)}</th>`).join('')}</tr></thead>
          <tbody>${data.items.map((row, i) => `<tr class="${cfg.onRow ? 'clickable' : ''}" data-i="${i}">${cfg.columns.map((c) => `<td class="${c.num ? 'num' : ''}">${c.render(row)}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>
        <div class="pager">
          <span>${JAF.int(data.total)} résultat${data.total > 1 ? 's' : ''}</span>
          <span class="spacer"></span>
          <label class="inline">Lignes <select data-size>${[25, 50, 100].map((n) => `<option ${n === data.pageSize ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
          <button class="btn" data-prev ${data.page <= 1 ? 'disabled' : ''}>Précédent</button>
          <span>Page ${data.page} / ${pages}</span>
          <button class="btn" data-next ${data.page >= pages ? 'disabled' : ''}>Suivant</button>
        </div>`;
      body.querySelectorAll('tbody tr').forEach((tr) => tr.addEventListener('click', (e) => {
        if (e.target.closest('a, button')) return;
        cfg.onRow?.(data.items[Number(tr.dataset.i)]);
      }));
      body.querySelectorAll('[data-sort]').forEach((b) => b.addEventListener('click', () => {
        const key = b.dataset.sort;
        st.sort = `${key}:${sk === key && sd === 'desc' ? 'asc' : 'desc'}`;
        st.page = 1; load();
      }));
      body.querySelector('[data-size]').addEventListener('change', (e) => { st.pageSize = Number(e.target.value); st.page = 1; load(); });
      body.querySelector('[data-prev]').addEventListener('click', () => { st.page--; load(); });
      body.querySelector('[data-next]').addEventListener('click', () => { st.page++; load(); });
      cfg.afterRender?.(body, data);
    }

    container.querySelectorAll('[data-f]').forEach((input) => {
      const handler = () => {
        st.filters[input.dataset.f] = input.type === 'checkbox' ? (input.checked ? 'true' : '') : input.value;
        st.page = 1;
        clearTimeout(timer);
        timer = setTimeout(load, input.type === 'search' ? 350 : 0);
      };
      input.addEventListener(input.type === 'search' ? 'input' : 'change', handler);
    });
    container.querySelector('[data-refresh]').addEventListener('click', load);
    container.querySelector('[data-export]')?.addEventListener('click', async () => {
      const q = query();
      const res = await window.jaf.exportCsv(`/api/admin/v1${cfg.path}`, q, `${cfg.exportName}-${new Date().toISOString().slice(0, 10)}.csv`);
      if (!res.ok) JAF.toast(res.data?.error || 'Export impossible', 'error');
      else if (!res.canceled) JAF.toast(`Export enregistré : ${res.filePath}`);
    });
    load();
    return { reload: load };
  };

  // Simple client-side table for already-loaded arrays (360 tabs).
  JAF.simpleTable = (rows, columns, { empty = 'Aucune donnée.', onRowHref } = {}) => {
    if (!rows || !rows.length) return `<div class="state">${esc(empty)}</div>`;
    return `<div class="table-wrap"><table><thead><tr>${columns.map((c) => `<th class="${c.num ? 'num' : ''}">${esc(c.label)}</th>`).join('')}</tr></thead>
      <tbody>${rows.map((r) => `<tr ${onRowHref ? `class="clickable" data-href="${esc(onRowHref(r))}"` : ''}>${columns.map((c) => `<td class="${c.num ? 'num' : ''}">${c.render(r)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  };

  // Rows rendered by simpleTable with onRowHref navigate on click.
  document.addEventListener('click', (e) => {
    const tr = e.target.closest('tr[data-href]');
    if (tr && !e.target.closest('a, button')) location.hash = tr.dataset.href;
  });

  JAF.link = (href, text) => `<a href="${esc(href)}">${esc(text)}</a>`;
  JAF.personLink = (p) => (p ? JAF.link(`#/users/${p.id}`, p.name || p.email) : '<span class="muted">—</span>');
})();
