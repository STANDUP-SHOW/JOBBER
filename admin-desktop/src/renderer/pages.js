/* One function per screen. Each receives the view element and route params. */
(function () {
  const { esc, date, dateTime, money, int, status, label, link, personLink } = JAF;
  const P = (JAF.pages = {});

  const listState = (key) => (JAF.state.lists[key] = JAF.state.lists[key] || {});
  const scopeQuery = () => (JAF.state.scope.platform ? { platform: JAF.state.scope.platform } : {});
  const head = (title, sub, actions = '') => `<div class="page-head"><div><h1>${esc(title)}</h1>${sub ? `<div class="sub">${sub}</div>` : ''}</div><div class="actions">${actions}</div></div>`;

  async function guarded(view, fn) {
    view.innerHTML = JAF.loading();
    try { await fn(); } catch (err) {
      view.innerHTML = JAF.errorState(err, 'retry-page');
      view.querySelector('#retry-page')?.addEventListener('click', () => JAF.router());
    }
  }

  async function addNote(objectType, objectId) {
    const res = await JAF.modal({
      title: 'Note interne',
      intro: '<span class="muted">Visible uniquement par l\'équipe, jamais transmise au client.</span>',
      fields: [{ name: 'body', label: 'Note', type: 'textarea', required: true }],
      submitLabel: 'Enregistrer',
      submit: (v) => JAF.api('POST', '/notes', { body: { objectType, objectId, body: v.body } }),
    });
    if (res) { JAF.toast('Note enregistrée'); JAF.router(); }
  }

  const notesBlock = (notes) => (notes == null
    ? '<div class="state">Notes indisponibles avant la migration de la base.</div>'
    : notes.length ? notes.map((n) => `<div class="note"><div class="small muted">${dateTime(n.createdAt)}</div>${esc(n.body)}</div>`).join('') : '<div class="state">Aucune note.</div>');

  const auditBlock = (audit) => (audit === undefined
    ? '<div class="state">Journal réservé aux rôles disposant de audit.read.</div>'
    : audit == null ? '<div class="state">Journal indisponible avant la migration de la base.</div>'
      : JAF.simpleTable(audit, [
        { label: 'Date', render: (e) => dateTime(e.createdAt) },
        { label: 'Acteur', render: (e) => esc(e.actorLabel || '—') },
        { label: 'Action', render: (e) => `<span class="mono">${esc(e.action)}</span>` },
        { label: 'Motif', render: (e) => esc(e.reason || '—') },
        { label: 'Résultat', render: (e) => esc(e.result) },
      ], { empty: 'Aucune action administrateur.' }));

  // ---------------------------------------------------------------- Dashboard
  P.dashboard = (view) => guarded(view, async () => {
    const d = await JAF.get('/dashboard');
    const f = d.finance;
    const kpi = (lbl, value, def) => `<div class="card kpi"><div class="label">${esc(lbl)}</div><div class="value">${value}</div>${def ? `<div class="def">${esc(def)}</div>` : ''}</div>`;
    const bars = (obj, order) => {
      const entries = order.map((k) => [k, obj[k] || 0]);
      const max = Math.max(1, ...entries.map(([, v]) => v));
      return `<div class="bars">${entries.map(([k, v]) => `<div class="bar"><span>${esc(label(k))}</span><div class="track"><div class="fill" style="width:${(v / max) * 100}%"></div></div><span class="num">${int(v)}</span></div>`).join('')}</div>`;
    };
    view.innerHTML = `
      ${head('Cockpit', `Calculé le ${dateTime(d.computedAt)} à partir de la base de production · Stripe : <strong>${esc(d.stripeMode)}</strong>`, '<button class="btn" id="dash-refresh">Actualiser</button>')}
      <div class="grid grid-4">
        ${kpi('Revenu JobberPlus (libéré)', money(f.jobberRevenueReleasedCents), f.definitions.jobberRevenue)}
        ${kpi('Volume brut (libéré)', money(f.grossVolumeReleasedCents), f.definitions.grossVolume)}
        ${kpi('En séquestre', money(f.heldInEscrowCents), 'Paiements autorisés, pas encore libérés')}
        ${kpi('Marge corporate (libérée)', money(f.corporateMarginReleasedCents), f.definitions.corporateMargin)}
        ${kpi('Utilisateurs', int(d.users.total), `${d.users.new30d} inscrits sur 30 jours`)}
        ${kpi('Jobbers actifs', int(d.users.activeJobbers), d.users.definitions.activeJobbers)}
        ${kpi('Demandeurs', int(d.users.missionPosters), d.users.definitions.missionPosters)}
        ${kpi('Entreprises / corporate', `${int(d.users.companies)} / ${int(d.users.corporates)}`, `Comptes suspendus : ${d.users.suspended == null ? 'indisponible' : d.users.suspended}`)}
      </div>
      <div class="grid grid-3 section">
        <div class="card"><h2>File des actions</h2>
          ${d.queue.map((q) => `<div class="queue-item"><span class="n">${int(q.count)}</span><span>${esc(q.label)}</span>${q.severity === 'high' && q.count ? '<span class="badge red">prioritaire</span>' : ''}<span class="spacer" style="flex:1"></span>${q.count ? `<a href="#/${esc(q.target)}">Voir</a>` : ''}</div>`).join('')}
        </div>
        <div class="card"><h2>Missions réelles par état</h2>${bars(d.missions.byStatus, ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])}
          <p class="muted small">${esc(d.missions.definition)} (${int(d.missions.demoExcluded)} démo).</p></div>
        <div class="card"><h2>Commandes par état</h2>${bars(d.orders.byStatus, ['SCHEDULED', 'IN_PROGRESS', 'AWAITING_VALIDATION', 'COMPLETED', 'DISPUTED', 'CANCELLED'])}
          <p class="muted small">Montants : ${esc(f.definitions.taxes)}.</p></div>
      </div>
      <div class="card section"><h2>Indicateurs non branchés</h2>
        <div class="grid grid-3">${d.unavailable.map((u) => `<div class="kpi na"><div class="label">${esc(u.label)}</div><div class="value">Indisponible</div><div class="def">${esc(u.reason)}</div></div>`).join('')}</div>
      </div>`;
    view.querySelector('#dash-refresh').onclick = () => JAF.router();
  });

  // ---------------------------------------------------------------- Users
  const SEGMENTS = [
    ['', 'Tous'], ['demandeurs', 'Demandeurs'], ['jobbers_particuliers', 'Jobbers particuliers'], ['jobbers_pro', 'Jobbers professionnels'],
    ['entreprises', 'Entreprises'], ['corporate', 'Corporate'], ['admins', 'Administrateurs'],
  ];

  P.users = (view, { segment = '' } = {}) => {
    const seg = SEGMENTS.find(([k]) => k === segment) || SEGMENTS[0];
    JAF.crumbs([['Utilisateurs', '#/users'], [seg[1]]]);
    view.innerHTML = `${head(`Utilisateurs · ${seg[1]}`, 'Une identité unique peut cumuler plusieurs rôles (demandeur et jobber).')}
      <div class="tabs">${SEGMENTS.map(([k, l]) => `<button class="${k === segment ? 'on' : ''}" data-seg="${k}">${esc(l)}</button>`).join('')}</div><div id="t"></div>`;
    view.querySelectorAll('[data-seg]').forEach((b) => b.onclick = () => { location.hash = b.dataset.seg ? `#/users-seg/${b.dataset.seg}` : '#/users'; });
    JAF.table(view.querySelector('#t'), {
      path: '/users',
      state: listState(`users:${segment}`),
      extraQuery: () => ({ segment }),
      exportName: `utilisateurs${segment ? `-${segment}` : ''}`,
      filters: [
        { name: 'q', label: 'Recherche', placeholder: 'Nom, email, téléphone, ID…' },
        { name: 'verification', label: 'Vérification', type: 'select', options: [['', 'Toutes'], ['UNVERIFIED', 'Non vérifié'], ['PENDING', 'En attente'], ['APPROVED', 'Validé'], ['REJECTED', 'Refusé']] },
        { name: 'from', label: 'Inscrit depuis', type: 'date' },
        { name: 'to', label: 'Jusqu\'au', type: 'date' },
        { name: 'suspended', label: 'Suspendus seulement', type: 'checkbox' },
      ],
      columns: [
        { label: 'Identité', sort: 'lastName', render: (u) => `<strong>${esc(u.name)}</strong><div class="muted small">${esc(u.email)}</div>` },
        { label: 'Rôles', render: (u) => `<div class="badges">${u.roles.map((r) => `<span class="badge blue">${esc(r)}</span>`).join('') || '<span class="muted">aucune activité</span>'}</div>` },
        { label: 'Adresse', render: (u) => esc(u.address || '—') },
        { label: 'Inscription', sort: 'createdAt', render: (u) => date(u.createdAt) },
        { label: 'Vérification', render: (u) => (u.verification ? status(u.verification) : '<span class="muted">—</span>') },
        { label: 'Missions', num: true, render: (u) => int(u.missions) },
        { label: 'Offres', num: true, render: (u) => int(u.offers) },
        { label: 'Note', num: true, render: (u) => (u.rating == null ? '—' : `${u.rating.toFixed(1)} (${u.ratingCount})`) },
        { label: 'Statut', render: (u) => (u.suspended == null ? '<span class="muted small">inconnu</span>' : u.suspended ? '<span class="badge red">Suspendu</span>' : '<span class="badge green">Actif</span>') },
      ],
      onRow: (u) => { location.hash = `#/users/${u.id}`; },
    });
  };

  P.user = (view, { id }) => guarded(view, async () => {
    const d = await JAF.get(`/users/${id}`);
    const u = d.user;
    JAF.crumbs([['Utilisateurs', '#/users'], [u.name]]);
    const pp = u.providerProfile;
    const suspended = u.suspension;
    const tabs = [
      ['synthese', 'Synthèse'], ['missions', 'Missions', d.missions.length], ['offres', 'Devis / offres', d.offers.length],
      ['commandes', 'Commandes', d.bookingsAsClient.length + d.bookingsAsProvider.length], ['avis', 'Avis', d.reviewsReceived.length + d.reviewsWritten.length],
      ['documents', 'Documents', d.documents.length], ['sav', 'SAV', d.contactMessages.length], ['notes', 'Notes', d.notes?.length ?? 0], ['activite', 'Activité admin'],
    ];
    const st = JAF.state.lists[`user:${id}`] = JAF.state.lists[`user:${id}`] || { tab: 'synthese' };
    const bookingCols = [
      { label: 'Mission', render: (b) => link(`#/missions/${b.mission.id}`, b.mission.title) },
      { label: 'Client', render: (b) => personLink({ ...b.client, name: `${b.client.firstName} ${b.client.lastName}` }) },
      { label: 'Jobber', render: (b) => personLink({ ...b.provider, name: `${b.provider.firstName} ${b.provider.lastName}` }) },
      { label: 'Date', render: (b) => date(b.scheduledDate) },
      { label: 'Montant', num: true, render: (b) => money(b.totalAmountCents) },
      { label: 'Commande', render: (b) => status(b.status) },
      { label: 'Paiement', render: (b) => (b.payment ? `${status(b.payment.status)} ${JAF.can('payments.read') ? link(`#/transactions/${b.payment.id}`, 'ouvrir') : ''}` : '—') },
    ];
    const tabBody = {
      synthese: () => `<div class="grid grid-2">
        <div class="card"><h2>Coordonnées</h2><dl class="props">
          <dt>Email</dt><dd>${esc(u.email)} ${u.isEmailVerified ? '<span class="badge green">vérifié</span>' : '<span class="badge">non vérifié</span>'}</dd>
          <dt>Téléphone</dt><dd>${esc(u.phone || '—')}</dd>
          <dt>Adresse</dt><dd>${esc(u.address || '—')}</dd>
          <dt>Type de compte</dt><dd>${esc(u.accountKind === 'COMPANY' ? `Entreprise (${u.companyType})` : 'Particulier')}${u.isProfessional ? ' · professionnel' : ''}</dd>
          ${u.companyName ? `<dt>Raison sociale</dt><dd>${esc(u.companyName)}</dd>` : ''}
          ${u.companySiret || u.professionalSiret ? `<dt>SIRET</dt><dd>${esc(u.companySiret || u.professionalSiret)}</dd>` : ''}
          ${u.agencyDomain ? `<dt>Site white-label</dt><dd>${esc(u.agencyDomain)}</dd>` : ''}
          <dt>Connexion Google</dt><dd>${u.googleLinked ? 'oui' : 'non'}</dd>
          <dt>Inscription</dt><dd>${dateTime(u.createdAt)}</dd>
          <dt>Dernière modification</dt><dd>${dateTime(u.updatedAt)}</dd>
          <dt>ID</dt><dd class="mono">${esc(u.id)}</dd>
        </dl></div>
        <div class="card"><h2>Activité et soldes</h2><dl class="props">
          <dt>Missions publiées</dt><dd>${int(d.missions.length)}</dd>
          <dt>Offres envoyées</dt><dd>${int(d.offers.length)}</dd>
          ${pp ? `<dt>Profil jobber</dt><dd>${status(pp.verificationStatus)} · ${pp.ratingCount ? `${pp.ratingAverage.toFixed(1)}/5 (${pp.ratingCount} avis)` : 'pas encore noté'} · ${int(pp.completedMissions)} mission(s) terminée(s)</dd>
          <dt>Compétences</dt><dd>${pp.categories.map((c) => `${esc(c.name)} (${esc(c.level.toLowerCase())}, ${money(c.hourlyRateCents)}/h)`).join(', ') || '—'}</dd>
          <dt>Wallet interne</dt><dd>${money(pp.walletBalanceCents)} <span class="muted small">(solde Jobber, pas un compte bancaire)</span></dd>
          <dt>Versements</dt><dd>${pp.payoutsEnabled ? `activés${pp.bankLast4 ? ` · •••• ${esc(pp.bankLast4)}` : ''}` : 'non activés'}</dd>` : ''}
          <dt>Crédit commercial</dt><dd>${money(u.creditBalanceCents)}</dd>
          <dt>Parrainage</dt><dd>${esc(u.referralCode || '—')} · gagné ${money(u.referralEarnedCents)}</dd>
          <dt>Abonnements</dt><dd>${u.subscriptions.map((s) => `${esc(s.plan)} ${status(s.status)} jusqu'au ${date(s.currentPeriodEnd)}`).join('<br>') || '—'}</dd>
          <dt>Consentements</dt><dd class="small">Email actu ${u.notifyEmailNews ? '✓' : '✗'} · Partenaires ${u.notifyEmailPartners ? '✓' : '✗'} · Push actu ${u.notifyPushNews ? '✓' : '✗'} · SMS offres ${u.notifySmsOffers ? '✓' : '✗'}</dd>
        </dl></div>
        ${d.corporate ? `<div class="card"><h2>Corporate</h2><dl class="props">
          <dt>Missions reçues</dt><dd>${int(d.corporate.missions)}</dd><dt>Employés</dt><dd>${int(d.corporate.employees)}</dd><dt>Factures</dt><dd>${int(d.corporate.invoices)}</dd>
          <dt>Volume libéré</dt><dd>${money(d.corporate.releasedGrossCents)}</dd><dt>Marge corporate</dt><dd>${money(d.corporate.releasedMarginCents)}</dd>
          <dt>Revenu JobberPlus</dt><dd>${money(d.corporate.releasedJobberRevenueCents)}</dd></dl></div>` : ''}
        ${d.restrictions?.length ? `<div class="card"><h2>Historique des suspensions</h2>${d.restrictions.map((r) => `<div class="small" style="margin-bottom:8px"><strong>${dateTime(r.createdAt)}</strong> : ${esc(r.reason)}${r.liftedAt ? `<br><span class="muted">Levée le ${dateTime(r.liftedAt)} : ${esc(r.liftReason || '')}</span>` : ' <span class="badge red">active</span>'}</div>`).join('')}</div>` : ''}
      </div>`,
      missions: () => JAF.simpleTable(d.missions, [
        { label: 'Titre', render: (m) => `${esc(m.title)}${m.isDemoNational ? ' <span class="badge">démo</span>' : ''}` },
        { label: 'Publiée', render: (m) => date(m.createdAt) }, { label: 'Date prévue', render: (m) => date(m.desiredDate) }, { label: 'État', render: (m) => status(m.status) },
      ], { onRowHref: (m) => `#/missions/${m.id}`, empty: 'Aucune mission publiée.' }),
      offres: () => JAF.simpleTable(d.offers, [
        { label: 'Mission', render: (o) => esc(o.mission.title) }, { label: 'Envoyée', render: (o) => date(o.createdAt) },
        { label: 'Taux', num: true, render: (o) => `${money(o.hourlyRateCents)}/h` }, { label: 'État', render: (o) => status(o.status) },
      ], { onRowHref: (o) => `#/missions/${o.mission.id}`, empty: 'Aucune offre envoyée.' }),
      commandes: () => `<h3>En tant que client</h3>${JAF.simpleTable(d.bookingsAsClient, bookingCols, { empty: 'Aucune commande passée.' })}
        <h3 class="section">En tant que jobber</h3>${JAF.simpleTable(d.bookingsAsProvider, bookingCols, { empty: 'Aucune commande réalisée.' })}`,
      avis: () => `<h3>Reçus</h3>${JAF.simpleTable(d.reviewsReceived, [
        { label: 'Date', render: (r) => date(r.createdAt) }, { label: 'Note', render: (r) => `${r.rating}/5` }, { label: 'Commentaire', render: (r) => esc(r.comment || '—') },
        { label: 'Auteur', render: (r) => personLink({ id: r.author.id, name: `${r.author.firstName} ${r.author.lastName}` }) },
      ], { empty: 'Aucun avis reçu.' })}<h3 class="section">Écrits</h3>${JAF.simpleTable(d.reviewsWritten, [
        { label: 'Date', render: (r) => date(r.createdAt) }, { label: 'Note', render: (r) => `${r.rating}/5` }, { label: 'Commentaire', render: (r) => esc(r.comment || '—') },
        { label: 'Cible', render: (r) => personLink({ id: r.target.id, name: `${r.target.firstName} ${r.target.lastName}` }) },
      ], { empty: 'Aucun avis écrit.' })}`,
      documents: () => JAF.simpleTable(d.documents, [
        { label: 'Type', render: (x) => esc(label(x.type)) }, { label: 'Reçu', render: (x) => dateTime(x.createdAt) },
        { label: 'Statut', render: (x) => status(x.status) }, { label: 'Décision', render: (x) => dateTime(x.reviewedAt) },
      ], { empty: 'Aucun document transmis.' }) + '<p class="muted small">Ouverture et décision depuis Utilisateurs &gt; Vérifications (motif tracé).</p>',
      sav: () => JAF.simpleTable(d.contactMessages, [
        { label: 'Objet', render: (m) => esc(m.subject || '(sans objet)') }, { label: 'Reçu', render: (m) => dateTime(m.createdAt) }, { label: 'Statut', render: (m) => status(m.status) },
      ], { onRowHref: (m) => `#/support/${m.id}`, empty: 'Aucun message SAV.' }),
      notes: () => notesBlock(d.notes),
      activite: () => auditBlock(d.audit),
    };

    const canEdit = JAF.can('users.update');
    const canSuspend = JAF.can('users.suspend') && u.role !== 'ADMIN';
    view.innerHTML = `
      ${head(u.name, `<div class="badges">${u.roles.map((r) => `<span class="badge blue">${esc(r)}</span>`).join('')}${suspended ? `<span class="badge red">Suspendu depuis le ${date(suspended.createdAt)}</span>` : suspended === null ? '<span class="badge green">Actif</span>' : ''}</div>`)}
      ${suspended ? `<div class="banner" style="margin:0 0 12px;padding:10px 14px;border-radius:8px;background:var(--red-light);color:var(--red)">Compte suspendu : ${esc(suspended.reason)}</div>` : ''}
      <div class="split">
        <div>
          <div class="tabs">${tabs.map(([k, l, n]) => `<button data-tab="${k}" class="${st.tab === k ? 'on' : ''}">${esc(l)}${n != null ? `<span class="count">${n}</span>` : ''}</button>`).join('')}</div>
          <div id="tab-body"></div>
        </div>
        <div class="card side-actions"><h2>Actions</h2>
          ${canEdit ? '<button class="btn" data-act="edit">Modifier les coordonnées</button>' : ''}
          <button class="btn" data-act="mail">Écrire un email</button>
          ${JAF.can('notes.write') ? '<button class="btn" data-act="note">Ajouter une note interne</button>' : ''}
          ${canSuspend ? (suspended ? '<button class="btn" data-act="reactivate">Réactiver le compte</button>' : '<button class="btn btn-danger" data-act="suspend">Suspendre le compte</button>') : ''}
          ${u.role === 'ADMIN' ? '<p class="disabled-reason">Compte administrateur : droits gérés dans Administration.</p>' : ''}
          <p class="muted small">Remboursements depuis une transaction (Finance), jamais depuis la fiche.</p>
        </div>
      </div>`;
    const renderTab = () => {
      view.querySelectorAll('[data-tab]').forEach((b) => b.classList.toggle('on', b.dataset.tab === st.tab));
      view.querySelector('#tab-body').innerHTML = tabBody[st.tab]();
    };
    view.querySelectorAll('[data-tab]').forEach((b) => b.onclick = () => { st.tab = b.dataset.tab; renderTab(); });
    renderTab();

    const act = (name, fn) => view.querySelector(`[data-act="${name}"]`)?.addEventListener('click', fn);
    act('mail', () => window.jaf.open(`mailto:${u.email}`));
    act('note', () => addNote('USER', u.id));
    act('edit', async () => {
      const fields = [
        { name: 'firstName', label: 'Prénom', value: u.firstName, required: true },
        { name: 'lastName', label: 'Nom', value: u.lastName, required: true },
        { name: 'phone', label: 'Téléphone', value: u.phone },
        { name: 'address', label: 'Adresse', value: u.address, help: 'Changer l\'adresse efface la géolocalisation enregistrée.' },
        ...(u.accountKind === 'COMPANY' ? [{ name: 'companyName', label: 'Raison sociale', value: u.companyName, required: true }] : []),
        JAF.reasonField(),
      ];
      const res = await JAF.modal({
        title: 'Modifier les coordonnées',
        intro: '<span class="muted small">L\'email ne se modifie pas ici : il exige une nouvelle vérification par l\'utilisateur.</span>',
        fields, submitLabel: 'Enregistrer',
        submit: (v) => {
          const changes = {};
          ['firstName', 'lastName', 'phone', 'address', 'companyName'].forEach((k) => {
            if (v[k] === undefined) return;
            const next = v[k].trim() === '' && (k === 'phone' || k === 'address') ? null : v[k].trim();
            if (next !== (u[k] ?? null)) changes[k] = next;
          });
          if (!Object.keys(changes).length) throw new Error('Aucune modification');
          return JAF.api('PATCH', `/users/${u.id}`, { body: { expectedUpdatedAt: u.updatedAt, reason: v.reason, changes } });
        },
      });
      if (res) { JAF.toast('Fiche mise à jour'); JAF.router(); }
    });
    act('suspend', async () => {
      const res = await JAF.modal({
        title: `Suspendre ${u.name}`, danger: true, submitLabel: 'Suspendre',
        impact: 'Effet immédiat : connexion refusée et sessions en cours bloquées (sous 30 secondes). Les missions et commandes en cours restent visibles et devront être traitées.',
        fields: [JAF.reasonField()],
        submit: (v) => JAF.api('POST', `/users/${u.id}/suspend`, { body: { reason: v.reason } }),
      });
      if (res) {
        const n = res.toFollowUp.bookings.length + res.toFollowUp.missions.length;
        JAF.toast(n ? `Compte suspendu. ${n} mission(s)/commande(s) en cours à traiter.` : 'Compte suspendu.');
        JAF.router();
      }
    });
    act('reactivate', async () => {
      const res = await JAF.modal({
        title: `Réactiver ${u.name}`, submitLabel: 'Réactiver', fields: [JAF.reasonField()],
        submit: (v) => JAF.api('POST', `/users/${u.id}/reactivate`, { body: { reason: v.reason } }),
      });
      if (res) { JAF.toast('Compte réactivé'); JAF.router(); }
    });
  });

  // ---------------------------------------------------------------- Verifications
  P.verifications = (view) => {
    JAF.crumbs([['Utilisateurs', '#/users'], ['Vérifications']]);
    view.innerHTML = `${head('Vérifications', 'Documents transmis par les jobbers. L\'ouverture d\'un document est motivée et tracée.')}<div id="t"></div>`;
    const st = listState('verifications');
    st.filters = st.filters || { status: 'PENDING' };
    const table = JAF.table(view.querySelector('#t'), {
      path: '/verifications', state: st,
      filters: [
        { name: 'status', label: 'Statut', type: 'select', options: [['', 'Tous'], ['PENDING', 'En attente'], ['APPROVED', 'Validé'], ['REJECTED', 'Refusé']] },
        { name: 'type', label: 'Type', type: 'select', options: [['', 'Tous'], ['ID_CARD', 'Pièce d\'identité'], ['PROOF_OF_ADDRESS', 'Justificatif de domicile'], ['BANK_ACCOUNT', 'RIB'], ['DIPLOMA', 'Diplôme']] },
      ],
      columns: [
        { label: 'Utilisateur', render: (x) => `${personLink(x.user)}${x.user.isProfessional ? ' <span class="badge">pro</span>' : ''}<div class="muted small">${esc(x.user.email)}</div>` },
        { label: 'Document', render: (x) => esc(label(x.type)) },
        { label: 'Reçu', sort: 'createdAt', render: (x) => dateTime(x.createdAt) },
        { label: 'Statut', render: (x) => status(x.status) },
        { label: 'Décision', render: (x) => dateTime(x.reviewedAt) },
        { label: '', render: (x) => `<div class="badges"><button class="btn" data-open="${x.id}">Ouvrir</button>${x.status === 'PENDING' && JAF.can('verifications.decide') ? `<button class="btn" data-decide="${x.id}" data-v="APPROVED">Valider</button><button class="btn btn-danger" data-decide="${x.id}" data-v="REJECTED">Refuser</button>` : ''}</div>` },
      ],
      afterRender: (body) => {
        body.querySelectorAll('[data-open]').forEach((b) => b.onclick = async () => {
          const res = await JAF.modal({
            title: 'Ouvrir le document', fields: [JAF.reasonField('Motif de consultation')], submitLabel: 'Ouvrir',
            submit: (v) => JAF.api('POST', `/verifications/${b.dataset.open}/open`, { body: { reason: v.reason } }),
          });
          if (res?.fileUrl) {
            try { await window.jaf.open(res.fileUrl); } catch { JAF.toast('Lien de document non ouvrable (HTTPS requis)', 'error'); }
          }
        });
        body.querySelectorAll('[data-decide]').forEach((b) => b.onclick = async () => {
          const approve = b.dataset.v === 'APPROVED';
          const res = await JAF.modal({
            title: approve ? 'Valider le document' : 'Refuser le document', danger: !approve, submitLabel: approve ? 'Valider' : 'Refuser',
            impact: approve ? 'Si c\'est le dernier document d\'identité en attente, le badge « vérifié » du jobber passe à Validé.' : 'Le badge de vérification du jobber passe à Refusé.',
            fields: [JAF.reasonField()],
            submit: (v) => JAF.api('POST', `/verifications/${b.dataset.decide}/decision`, { body: { decision: b.dataset.v, reason: v.reason } }),
          });
          if (res) { JAF.toast('Décision enregistrée'); table.reload(); }
        });
      },
    });
  };

  // ---------------------------------------------------------------- Missions
  P.missions = (view) => guarded(view, async () => {
    JAF.crumbs([['Missions', '#/missions'], ['Toutes les missions']]);
    if (!JAF.state.categories) JAF.state.categories = (await JAF.get('/categories')).items;
    view.innerHTML = `${head('Missions', 'Les missions de démonstration nationale sont masquées par défaut.')}<div id="t"></div>`;
    JAF.table(view.querySelector('#t'), {
      path: '/missions', state: listState('missions'), extraQuery: scopeQuery, exportName: 'missions',
      filters: [
        { name: 'q', label: 'Recherche', placeholder: 'Titre, code, adresse, email client, ID…' },
        { name: 'status', label: 'État', type: 'select', options: [['', 'Tous'], ['OPEN', 'Publiée'], ['ASSIGNED', 'Attribuée'], ['IN_PROGRESS', 'En cours'], ['COMPLETED', 'Terminée'], ['CANCELLED', 'Annulée']] },
        { name: 'categoryId', label: 'Métier', type: 'select', options: [['', 'Tous'], ...JAF.state.categories.map((c) => [c.id, c.name])] },
        { name: 'paymentStatus', label: 'Paiement', type: 'select', options: [['', 'Tous'], ['REQUIRES_PAYMENT', 'À payer'], ['HELD_IN_ESCROW', 'En séquestre'], ['RELEASED', 'Libéré'], ['REFUNDED', 'Remboursé'], ['FAILED', 'Échoué']] },
        { name: 'demo', label: 'Démo', type: 'select', options: [['', 'Masquées'], ['include', 'Incluses'], ['only', 'Seulement']] },
        { name: 'from', label: 'Créée depuis', type: 'date' },
        { name: 'to', label: 'Jusqu\'au', type: 'date' },
        { name: 'withoutOffers', label: 'Sans offre', type: 'checkbox' },
        { name: 'withoutJobber', label: 'Sans jobber', type: 'checkbox' },
      ],
      columns: [
        { label: 'Mission', sort: 'title', render: (m) => `<strong>${esc(m.title)}</strong>${m.isDemo ? ' <span class="badge">démo</span>' : ''}<div class="muted small">${esc(m.code || m.id)}</div>` },
        { label: 'Client', render: (m) => personLink(m.client) },
        { label: 'Jobber', render: (m) => personLink(m.jobber) },
        { label: 'Métier', render: (m) => esc(m.category || '—') },
        { label: 'Plateforme', render: (m) => esc(m.platform) },
        { label: 'Date prévue', sort: 'desiredDate', render: (m) => date(m.desiredDate) },
        { label: 'Offres', num: true, render: (m) => int(m.offers) },
        { label: 'Montant accepté', num: true, render: (m) => (m.acceptedAmountCents == null ? '—' : money(m.acceptedAmountCents)) },
        { label: 'État', render: (m) => status(m.status) },
        { label: 'Paiement', render: (m) => status(m.paymentStatus) },
        { label: 'Créée', sort: 'createdAt', render: (m) => date(m.createdAt) },
      ],
      onRow: (m) => { location.hash = `#/missions/${m.id}`; },
    });
  });

  P.mission = (view, { id }) => guarded(view, async () => {
    const d = await JAF.get(`/missions/${id}`);
    const m = d.mission;
    JAF.crumbs([['Missions', '#/missions'], [m.title]]);
    const b = m.booking;
    const p = b?.payment;
    const st = JAF.state.lists[`mission:${id}`] = JAF.state.lists[`mission:${id}`] || { tab: 'infos' };
    const tabs = [['infos', 'Informations'], ['devis', 'Devis / offres', m.offers.length], ['commande', 'Commande et paiement'], ['conversations', 'Conversations', m.conversations.length], ['chronologie', 'Chronologie'], ['notes', 'Notes', d.notes?.length ?? 0]];
    const tabBody = {
      infos: () => `<div class="grid grid-2"><div class="card"><h2>Demande</h2><dl class="props">
          <dt>Client</dt><dd>${personLink(m.client)}</dd>
          <dt>Plateforme</dt><dd>${esc(m.platform.label)}${m.platform.domain ? ` <span class="muted">(${esc(m.platform.domain)})</span>` : ''}</dd>
          <dt>Métier</dt><dd>${esc(m.category?.name || '—')}${m.service ? ` · ${esc(m.service.name)}` : ''}</dd>
          <dt>Adresse</dt><dd>${esc(m.address)}${m.dropoffAddress ? `<br>→ ${esc(m.dropoffAddress)}` : ''}</dd>
          <dt>Date souhaitée</dt><dd>${dateTime(m.desiredDate)}${m.datesFlexible ? ' (flexible)' : ''}${m.isUrgent ? ' <span class="badge red">urgent</span>' : ''}</dd>
          <dt>Durée estimée</dt><dd>${esc(m.estimatedHours)} h</dd>
          <dt>Visibilité</dt><dd>${esc(m.visibility === 'PUBLIC' ? 'Publique' : 'Privée (agence)')}</dd>
          ${m.isGetMission ? `<dt>GET Mission</dt><dd>prix fixe ${money(m.getMissionPriceCents)}</dd>` : ''}
          <dt>Accès</dt><dd>${m.accessInstructions ? '<span class="muted">consignes masquées (réservées au jobber retenu)</span>' : '—'}</dd>
          <dt>Code</dt><dd class="mono">${esc(m.corporateCode || m.id)}</dd>
          ${m.isDemoNational ? '<dt>Démo</dt><dd><span class="badge">mission de démonstration nationale</span></dd>' : ''}
        </dl></div>
        <div class="card"><h2>Description</h2><div style="white-space:pre-wrap">${esc(m.description)}</div></div></div>`,
      devis: () => JAF.simpleTable(m.offers, [
        { label: 'Émetteur', render: (o) => `${personLink(o.provider)}${o.isAgencyQuote ? ' <span class="badge">devis agence</span>' : ''}` },
        { label: 'Envoyé', render: (o) => dateTime(o.createdAt) },
        { label: 'Taux', num: true, render: (o) => `${money(o.hourlyRateCents)}/h` },
        { label: 'Heures', num: true, render: (o) => esc(o.hours) },
        { label: 'Total', num: true, render: (o) => money(o.totalCents) },
        { label: 'État', render: (o) => status(o.status) },
        { label: 'Message', render: (o) => esc(o.message || o.refusalReason || '—') },
      ], { empty: 'Aucune offre reçue.' }) + '<p class="muted small">Total = taux × heures + frais optionnels. La base ne stocke pas de HT/TVA ni de versions de devis.</p>',
      commande: () => (b ? `<div class="grid grid-2"><div class="card"><h2>Commande</h2><dl class="props">
          <dt>Statut</dt><dd>${status(b.status)}</dd><dt>Jobber</dt><dd>${personLink(b.provider)}</dd><dt>Client</dt><dd>${personLink(b.client)}</dd>
          <dt>Prévue le</dt><dd>${dateTime(b.scheduledDate)}</dd><dt>Base</dt><dd>${esc(b.hours)} h × ${money(b.hourlyRateCents)}</dd><dt>Total prestation</dt><dd>${money(b.totalAmountCents)}</dd>
          ${b.review ? `<dt>Avis</dt><dd>${b.review.rating}/5 · ${esc(b.review.comment || '')}</dd>` : ''}
        </dl></div>
        <div class="card"><h2>Paiement</h2>${p ? `<dl class="props">
          <dt>Statut</dt><dd>${status(p.status)}</dd>
          <dt>Débité au client</dt><dd>${money(p.amountCents)}</dd>
          <dt>Frais JobberPlus</dt><dd>${money(p.platformFeeCents)}${p.feeWaived ? ' <span class="badge">frais offerts (abonnement)</span>' : ''}</dd>
          <dt>Dû au jobber</dt><dd>${money(p.providerPayoutCents)}</dd>
          <dt>Marge corporate</dt><dd>${money(p.agencyCommissionCents)}</dd>
          <dt>Référence Stripe</dt><dd class="mono">${esc(p.stripePaymentIntentId || '—')}</dd>
          <dt>Payé / libéré</dt><dd>${dateTime(p.paidAt)} / ${dateTime(p.releasedAt)}</dd>
        </dl>${JAF.can('payments.read') ? `<p>${link(`#/transactions/${p.id}`, 'Ouvrir la transaction')}</p>` : ''}` : '<div class="state">Aucun paiement.</div>'}</div></div>` : '<div class="state">Aucune commande : aucune offre acceptée.</div>'),
      conversations: () => JAF.simpleTable(m.conversations, [
        { label: 'Avec', render: (c) => personLink(c.provider) }, { label: 'Ouverte', render: (c) => dateTime(c.createdAt) }, { label: 'Messages', num: true, render: (c) => int(c.messages) },
        { label: '', render: (c) => (JAF.can('conversations.read_private') ? `<button class="btn" data-conv="${c.id}">Lire (motif requis)</button>` : '<span class="muted small">accès SAV requis</span>') },
      ], { empty: 'Aucune conversation.' }),
      chronologie: () => `<div class="card"><ul class="timeline">${d.timeline.map((t) => `<li><div class="small muted">${dateTime(t.at)}</div>${esc(t.label)}</li>`).join('')}</ul></div>`,
      notes: () => notesBlock(d.notes),
    };
    const cancel = d.actions.cancel;
    view.innerHTML = `
      ${head(m.title, `${status(m.status)} ${b ? status(b.status) : ''} ${p ? status(p.status) : ''}`)}
      <div class="split"><div>
        <div class="tabs">${tabs.map(([k, l, n]) => `<button data-tab="${k}">${esc(l)}${n != null ? `<span class="count">${n}</span>` : ''}</button>`).join('')}</div>
        <div id="tab-body"></div></div>
        <div class="card side-actions"><h2>Actions</h2>
          <button class="btn" data-act="mail-client">Contacter le client</button>
          ${b ? '<button class="btn" data-act="mail-jobber">Contacter le jobber</button>' : ''}
          ${JAF.can('notes.write') ? '<button class="btn" data-act="note">Ajouter une note interne</button>' : ''}
          ${JAF.can('missions.cancel') ? `<button class="btn btn-danger" data-act="cancel" ${cancel.allowed ? '' : 'disabled'}>Annuler la mission</button>${cancel.allowed ? '' : `<p class="disabled-reason">${esc(cancel.reason)}</p>`}` : ''}
        </div></div>`;
    const renderTab = () => {
      view.querySelectorAll('[data-tab]').forEach((x) => x.classList.toggle('on', x.dataset.tab === st.tab));
      const body = view.querySelector('#tab-body');
      body.innerHTML = tabBody[st.tab]();
      body.querySelectorAll('[data-conv]').forEach((btn) => btn.onclick = () => openConversation(btn.dataset.conv, m.client.id));
    };
    view.querySelectorAll('[data-tab]').forEach((x) => x.onclick = () => { st.tab = x.dataset.tab; renderTab(); });
    renderTab();
    const act = (name, fn) => view.querySelector(`[data-act="${name}"]`)?.addEventListener('click', fn);
    act('mail-client', () => window.jaf.open(`mailto:${m.client.email}`));
    act('mail-jobber', () => window.jaf.open(`mailto:${b.provider.email}`));
    act('note', () => addNote('MISSION', m.id));
    act('cancel', async () => {
      const res = await JAF.modal({
        title: 'Annuler la mission', danger: true, submitLabel: 'Annuler la mission',
        impact: `Aucune commande ni paiement n'existe. La mission passe à « Annulée » et disparaît de la marketplace. ${m.offers.length} offre(s) reçue(s) restent visibles dans l'historique. Le client n'est pas notifié automatiquement.`,
        fields: [JAF.reasonField()],
        submit: (v) => JAF.api('POST', `/missions/${m.id}/cancel`, { body: { reason: v.reason } }),
      });
      if (res) { JAF.toast('Mission annulée'); JAF.router(); }
    });
  });

  async function openConversation(id, clientId) {
    const res = await JAF.modal({
      title: 'Lire une conversation privée',
      impact: 'Accès exceptionnel : votre motif, votre identité et l\'heure sont enregistrés dans le journal d\'audit.',
      fields: [JAF.reasonField('Motif d\'accès')], submitLabel: 'Lire',
      submit: (v) => JAF.api('POST', `/conversations/${id}/open`, { body: { reason: v.reason } }),
    });
    if (!res) return;
    const c = res.conversation;
    await JAF.modal({
      title: `Conversation · ${c.mission.title}`,
      intro: `<div class="muted small">${esc(c.client.name)} ↔ ${esc(c.provider.name)}</div>${c.messages.map((msg) => `<div class="message ${msg.senderId === clientId ? 'from-client' : ''}"><div class="small muted">${msg.senderId === c.client.id ? esc(c.client.name) : esc(c.provider.name)} · ${dateTime(msg.createdAt)}</div>${esc(msg.content)}</div>`).join('') || '<div class="state">Aucun message.</div>'}`,
      submitLabel: 'Fermer',
    });
  }

  // ---------------------------------------------------------------- Quotes / orders
  P.quotes = (view) => {
    JAF.crumbs([['Missions', '#/missions'], ['Devis']]);
    view.innerHTML = `${head('Devis et offres', 'Offres des jobbers et devis des agences corporate.')}<div id="t"></div>`;
    JAF.table(view.querySelector('#t'), {
      path: '/quotes', state: listState('quotes'), extraQuery: scopeQuery,
      filters: [
        { name: 'q', label: 'Recherche', placeholder: 'Mission, email jobber, ID…' },
        { name: 'status', label: 'État', type: 'select', options: [['', 'Tous'], ['PENDING', 'En attente'], ['SELECTED', 'Sélectionnée'], ['ACCEPTED', 'Acceptée'], ['REJECTED', 'Refusée'], ['WITHDRAWN', 'Retirée']] },
        { name: 'kind', label: 'Type', type: 'select', options: [['', 'Tous'], ['jobber', 'Offre jobber'], ['agency', 'Devis agence']] },
        { name: 'from', label: 'Depuis', type: 'date' }, { name: 'to', label: 'Jusqu\'au', type: 'date' },
      ],
      columns: [
        { label: 'Mission', render: (o) => link(`#/missions/${o.mission.id}`, o.mission.title) },
        { label: 'Émetteur', render: (o) => personLink(o.issuer) },
        { label: 'Destinataire', render: (o) => personLink(o.recipient) },
        { label: 'Type', render: (o) => esc(o.kind) },
        { label: 'Plateforme', render: (o) => esc(o.platform) },
        { label: 'Taux', num: true, render: (o) => `${money(o.hourlyRateCents)}/h` },
        { label: 'Heures', num: true, render: (o) => esc(o.hours) },
        { label: 'Total', num: true, render: (o) => money(o.totalCents) },
        { label: 'État', render: (o) => status(o.status) },
        { label: 'Envoyé', sort: 'createdAt', render: (o) => dateTime(o.createdAt) },
      ],
      onRow: (o) => { location.hash = `#/missions/${o.mission.id}`; },
    });
  };

  P.orders = (view) => {
    JAF.crumbs([['Missions', '#/missions'], ['Commandes']]);
    view.innerHTML = `${head('Commandes', 'Une commande naît de l\'acceptation d\'une offre.')}<div id="t"></div>`;
    JAF.table(view.querySelector('#t'), {
      path: '/orders', state: listState('orders'), extraQuery: scopeQuery,
      filters: [
        { name: 'q', label: 'Recherche', placeholder: 'Mission, ID…' },
        { name: 'status', label: 'Exécution', type: 'select', options: [['', 'Tous'], ['SCHEDULED', 'Planifiée'], ['IN_PROGRESS', 'En cours'], ['AWAITING_VALIDATION', 'À valider'], ['COMPLETED', 'Terminée'], ['DISPUTED', 'Litige'], ['CANCELLED', 'Annulée']] },
        { name: 'paymentStatus', label: 'Paiement', type: 'select', options: [['', 'Tous'], ['REQUIRES_PAYMENT', 'À payer'], ['HELD_IN_ESCROW', 'En séquestre'], ['RELEASED', 'Libéré'], ['REFUNDED', 'Remboursé'], ['FAILED', 'Échoué']] },
        { name: 'from', label: 'Depuis', type: 'date' }, { name: 'to', label: 'Jusqu\'au', type: 'date' },
      ],
      columns: [
        { label: 'Mission', render: (b) => link(`#/missions/${b.mission.id}`, b.mission.title) },
        { label: 'Acheteur', render: (b) => personLink(b.buyer) },
        { label: 'Jobber', render: (b) => personLink(b.seller) },
        { label: 'Plateforme', render: (b) => esc(b.platform) },
        { label: 'Prévue', sort: 'scheduledDate', render: (b) => date(b.scheduledDate) },
        { label: 'Total prestation', num: true, render: (b) => money(b.totalCents) },
        { label: 'Exécution', render: (b) => status(b.status) },
        { label: 'Paiement', render: (b) => (b.payment ? status(b.payment.status) : '—') },
        { label: 'Créée', sort: 'createdAt', render: (b) => date(b.createdAt) },
      ],
      onRow: (b) => { location.hash = `#/missions/${b.mission.id}`; },
    });
  };

  // ---------------------------------------------------------------- Companies
  P.companies = (view, { type }) => {
    const corporate = type === 'CORPORATE';
    JAF.crumbs([['Entreprises', '#/companies'], [corporate ? 'Corporate' : 'Entreprises clientes']]);
    view.innerHTML = `${head(corporate ? 'Corporate et agences' : 'Entreprises clientes', corporate ? 'Partenaires qui gèrent leurs clients, devis et jobbers (ex. Services34).' : 'Comptes entreprise qui recrutent des jobbers pour leurs besoins.')}<div id="t"></div>`;
    JAF.table(view.querySelector('#t'), {
      path: '/companies', state: listState(`companies:${type}`), extraQuery: () => ({ type }),
      filters: [{ name: 'q', label: 'Recherche', placeholder: 'Raison sociale, SIRET, email, domaine…' }],
      columns: [
        { label: 'Société', sort: 'companyName', render: (c) => `<strong>${esc(c.name || '—')}</strong><div class="muted small">${esc(c.email)}</div>` },
        { label: 'SIRET', render: (c) => `<span class="mono">${esc(c.siret || '—')}</span>` },
        { label: 'Responsable', render: (c) => esc(c.contact || '—') },
        ...(corporate ? [
          { label: 'Site', render: (c) => esc(c.domain || '—') },
          { label: 'Missions reçues', num: true, render: (c) => int(c.agencyMissions) },
          { label: 'Employés', num: true, render: (c) => int(c.employees) },
          { label: 'Volume libéré', num: true, render: (c) => money(c.releasedVolumeCents) },
          { label: 'Marge corporate', num: true, render: (c) => money(c.releasedMarginCents) },
          { label: 'Revenu JobberPlus', num: true, render: (c) => money(c.releasedJobberRevenueCents) },
        ] : [
          { label: 'Missions publiées', num: true, render: (c) => int(c.missionsPosted) },
          { label: 'Dépenses libérées', num: true, render: (c) => money(c.releasedSpendCents) },
        ]),
        { label: 'Inscription', sort: 'createdAt', render: (c) => date(c.createdAt) },
      ],
      onRow: (c) => { location.hash = `#/users/${c.id}`; },
    });
  };

  // ---------------------------------------------------------------- Finance
  P.transactions = (view) => {
    JAF.crumbs([['Finance', '#/transactions'], ['Transactions']]);
    view.innerHTML = `${head('Transactions', 'Statuts issus de Stripe. Aucune modification manuelle de statut n\'est possible.')}<div id="totals" class="grid grid-4" style="margin-bottom:14px"></div><div id="t"></div>`;
    JAF.table(view.querySelector('#t'), {
      path: '/transactions', state: listState('transactions'), extraQuery: scopeQuery, exportName: 'transactions',
      filters: [
        { name: 'q', label: 'Recherche', placeholder: 'ID, référence Stripe, mission…' },
        { name: 'status', label: 'État', type: 'select', options: [['', 'Tous'], ['REQUIRES_PAYMENT', 'À payer'], ['HELD_IN_ESCROW', 'En séquestre'], ['RELEASED', 'Libéré'], ['REFUNDED', 'Remboursé'], ['FAILED', 'Échoué']] },
        { name: 'from', label: 'Depuis', type: 'date' }, { name: 'to', label: 'Jusqu\'au', type: 'date' },
      ],
      onData: (data) => {
        const t = data.totals;
        view.querySelector('#totals').innerHTML = [
          ['Débité aux clients', t.amountCents], ['Frais JobberPlus', t.platformFeeCents], ['Dû aux jobbers', t.providerPayoutCents], ['Marge corporate', t.agencyCommissionCents],
        ].map(([l, v]) => `<div class="card kpi"><div class="label">${esc(l)} (filtre courant)</div><div class="value">${money(v)}</div></div>`).join('');
      },
      columns: [
        { label: 'Transaction', render: (p) => `<span class="mono">${esc(p.id)}</span><div class="muted small mono">${esc(p.stripePaymentIntentId || 'sans référence Stripe')}</div>` },
        { label: 'Mission', render: (p) => link(`#/missions/${p.mission.id}`, p.mission.title) },
        { label: 'Payeur', render: (p) => personLink(p.payer) },
        { label: 'Bénéficiaire', render: (p) => personLink(p.beneficiary) },
        { label: 'Plateforme', render: (p) => esc(p.platform) },
        { label: 'Brut', sort: 'amount', num: true, render: (p) => money(p.amountCents) },
        { label: 'Frais JobberPlus', num: true, render: (p) => money(p.platformFeeCents) },
        { label: 'Dû jobber', num: true, render: (p) => money(p.providerPayoutCents) },
        { label: 'État', render: (p) => status(p.status) },
        { label: 'Créée', sort: 'createdAt', render: (p) => date(p.createdAt) },
      ],
      onRow: (p) => { location.hash = `#/transactions/${p.id}`; },
    });
  };

  P.transaction = (view, { id }) => guarded(view, async () => {
    const d = await JAF.get(`/transactions/${id}`);
    const t = d.transaction;
    JAF.crumbs([['Finance', '#/transactions'], ['Transactions', '#/transactions'], [t.id]]);
    view.innerHTML = `${head(`Transaction ${t.id.slice(-8)}`, status(t.status))}
      <div class="split"><div class="grid grid-2">
        <div class="card"><h2>Ventilation</h2><dl class="props">
          <dt>Débité au client</dt><dd>${money(t.amountCents)}</dd>
          <dt>dont frais client</dt><dd>${money(t.managerFeeCents)}</dd>
          <dt>Frais jobber</dt><dd>${money(t.providerFeeCents)}</dd>
          <dt>Revenu JobberPlus</dt><dd>${money(t.platformFeeCents)}${t.feeWaived ? ' <span class="badge">frais offerts</span>' : ''}</dd>
          <dt>Dû au jobber</dt><dd>${money(t.providerPayoutCents)}</dd>
          <dt>Marge corporate</dt><dd>${money(t.agencyCommissionCents)}</dd>
          <dt>Devise</dt><dd>EUR · HT/TVA non distingués en base</dd>
        </dl></div>
        <div class="card"><h2>Références</h2><dl class="props">
          <dt>Mission</dt><dd>${link(`#/missions/${t.mission.id}`, t.mission.title)}</dd>
          <dt>Commande</dt><dd>${status(t.order.status)} · ${money(t.order.totalCents)}</dd>
          <dt>Plateforme</dt><dd>${esc(t.platform)}</dd>
          <dt>Payeur</dt><dd>${personLink(t.payer)}</dd><dt>Bénéficiaire</dt><dd>${personLink(t.beneficiary)}</dd>
          <dt>Stripe</dt><dd class="mono">${esc(t.stripePaymentIntentId || '—')}</dd>
          <dt>Créée</dt><dd>${dateTime(t.createdAt)}</dd><dt>Payée</dt><dd>${dateTime(t.paidAt)}</dd><dt>Libérée</dt><dd>${dateTime(t.releasedAt)}</dd>
        </dl></div>
        <div class="card" style="grid-column:1/-1"><h2>Notes</h2>${notesBlock(d.notes)}</div>
      </div>
      <div class="card side-actions"><h2>Actions</h2>
        <button class="btn" disabled>Initier un remboursement</button><p class="disabled-reason">${esc(d.actions.refund.reason)}</p>
        ${JAF.can('notes.write') ? '<button class="btn" data-act="note">Ajouter une note interne</button>' : ''}
      </div></div>`;
    view.querySelector('[data-act="note"]')?.addEventListener('click', () => addNote('PAYMENT', t.id));
  });

  P.payouts = (view) => {
    JAF.crumbs([['Finance', '#/transactions'], ['Versements']]);
    view.innerHTML = `${head('Versements', '')}<div id="note" class="card" style="margin-bottom:14px"></div><div id="t"></div>`;
    JAF.table(view.querySelector('#t'), {
      path: '/payouts', state: listState('payouts'), empty: 'Aucune demande de versement.',
      filters: [
        { name: 'status', label: 'État', type: 'select', options: [['', 'Tous'], ['PENDING', 'En attente'], ['COMPLETED', 'Terminé'], ['FAILED', 'Échoué']] },
        { name: 'from', label: 'Depuis', type: 'date' }, { name: 'to', label: 'Jusqu\'au', type: 'date' },
      ],
      onData: (data) => { view.querySelector('#note').innerHTML = `<strong>Soldes wallet cumulés : ${money(data.walletsTotalCents)}</strong><div class="muted small">${esc(data.note)}</div>`; },
      columns: [
        { label: 'Bénéficiaire', render: (p) => personLink(p.beneficiary) },
        { label: 'Montant', num: true, render: (p) => money(p.amountCents) },
        { label: 'Destination', render: (p) => esc(p.destination || '—') },
        { label: 'État', render: (p) => status(p.status) },
        { label: 'Demandé', render: (p) => dateTime(p.createdAt) },
        { label: 'Terminé', render: (p) => dateTime(p.completedAt) },
        { label: 'Référence', render: (p) => `<span class="mono">${esc(p.stripeTransferId || '—')}</span>${p.failureReason ? `<div class="small" style="color:var(--red)">${esc(p.failureReason)}</div>` : ''}` },
      ],
    });
  };

  // ---------------------------------------------------------------- SAV
  P.support = (view) => {
    JAF.crumbs([['SAV', '#/support'], ['Boîte SAV']]);
    view.innerHTML = `${head('Boîte SAV', 'Messages du formulaire « Nous contacter » de Jobber et des sites corporate.')}<div id="t"></div>`;
    const st = listState('support');
    JAF.table(view.querySelector('#t'), {
      path: '/support/messages', state: st, extraQuery: scopeQuery, empty: 'Boîte vide.',
      filters: [
        { name: 'q', label: 'Recherche', placeholder: 'Nom, email, objet, contenu…' },
        { name: 'status', label: 'Statut', type: 'select', options: [['', 'Tous'], ['NEW', 'Nouveau'], ['READ', 'Lu'], ['REPLIED', 'Répondu']] },
        { name: 'from', label: 'Depuis', type: 'date' }, { name: 'to', label: 'Jusqu\'au', type: 'date' },
      ],
      columns: [
        { label: 'Objet', render: (m) => `<strong>${esc(m.subject || '(sans objet)')}</strong><div class="muted small">${esc(m.excerpt)}</div>` },
        { label: 'Demandeur', render: (m) => `${m.sender ? personLink(m.sender) : esc(m.name)}<div class="muted small">${esc(m.email)}</div>` },
        { label: 'Plateforme', render: (m) => esc(m.platform) },
        { label: 'Reçu', render: (m) => dateTime(m.createdAt) },
        { label: 'Statut', render: (m) => status(m.status) },
      ],
      onRow: (m) => { location.hash = `#/support/${m.id}`; },
    });
  };

  P.supportMessage = (view, { id }) => guarded(view, async () => {
    const d = await JAF.get(`/support/messages/${id}`);
    const m = d.message;
    JAF.crumbs([['SAV', '#/support'], ['Boîte SAV', '#/support'], [m.subject || '(sans objet)']]);
    view.innerHTML = `${head(m.subject || '(sans objet)', `${status(m.status)} · ${esc(m.platform)} · reçu le ${dateTime(m.createdAt)}`)}
      <div class="split"><div>
        <div class="card"><div class="small muted">${esc(m.name)} &lt;${esc(m.email)}&gt;${m.sender ? ` · compte ${personLink(m.sender)}` : ' · visiteur non connecté'}</div>
          <div class="message from-client" style="margin-top:10px">${esc(m.message)}</div></div>
        <div class="card section"><h2>Notes internes</h2>${notesBlock(d.notes)}</div>
        <div class="section"><h3>Actions admin</h3>${auditBlock(d.audit)}</div>
      </div>
      <div class="card side-actions"><h2>Traitement</h2>
        <button class="btn btn-primary" data-act="reply">Répondre par email</button>
        ${JAF.can('support.update') ? `<label>Statut<select data-act="status">${['NEW', 'READ', 'REPLIED'].map((s) => `<option value="${s}" ${s === m.status ? 'selected' : ''}>${esc(label(s))}</option>`).join('')}</select></label>` : ''}
        ${JAF.can('notes.write') ? '<button class="btn" data-act="note">Ajouter une note interne</button>' : ''}
        <p class="muted small">La réponse part depuis votre messagerie ; passez ensuite le statut à « Répondu ». Tickets, modèles et délais : lot 2.</p>
      </div></div>`;
    view.querySelector('[data-act="reply"]').onclick = () => window.jaf.open(`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject || 'Votre message'}`)}`);
    view.querySelector('[data-act="note"]')?.addEventListener('click', () => addNote('CONTACT_MESSAGE', m.id));
    view.querySelector('[data-act="status"]')?.addEventListener('change', async (e) => {
      try { await JAF.api('PATCH', `/support/messages/${m.id}`, { body: { status: e.target.value } }); JAF.toast('Statut mis à jour'); JAF.router(); } catch (err) { JAF.toast(JAF.errorText(err), 'error'); }
    });
  });

  P.disputes = (view) => {
    JAF.crumbs([['SAV', '#/support'], ['Litiges']]);
    view.innerHTML = `${head('Litiges', 'Commandes passées en état « Litige ».')}<div id="t"></div>`;
    JAF.table(view.querySelector('#t'), {
      path: '/support/disputes', state: listState('disputes'), empty: 'Aucun litige ouvert.',
      onData: (data) => { if (data.note && !view.querySelector('#dnote')) view.querySelector('.page-head').insertAdjacentHTML('afterend', `<p id="dnote" class="muted small">${esc(data.note)}</p>`); },
      columns: [
        { label: 'Mission', render: (b) => link(`#/missions/${b.mission.id}`, b.mission.title) },
        { label: 'Client', render: (b) => personLink(b.client) },
        { label: 'Jobber', render: (b) => personLink(b.provider) },
        { label: 'Montant contesté', num: true, render: (b) => money(b.contestedCents) },
        { label: 'Paiement', render: (b) => (b.payment ? `${status(b.payment.status)} ${money(b.payment.amountCents)}` : '—') },
        { label: 'Depuis', render: (b) => dateTime(b.since) },
      ],
      onRow: (b) => { location.hash = `#/missions/${b.mission.id}`; },
    });
  };

  P.reviews = (view) => {
    JAF.crumbs([['SAV', '#/support'], ['Avis']]);
    view.innerHTML = `${head('Avis', 'Avis certifiés : un avis n\'existe que sur une commande payée.')}<div id="t"></div>`;
    JAF.table(view.querySelector('#t'), {
      path: '/support/reviews', state: listState('reviews'), empty: 'Aucun avis.',
      filters: [
        { name: 'maxRating', label: 'Note maximale', type: 'select', options: [['', 'Toutes'], ['2', '2 et moins'], ['3', '3 et moins'], ['4', '4 et moins']] },
        { name: 'from', label: 'Depuis', type: 'date' }, { name: 'to', label: 'Jusqu\'au', type: 'date' },
      ],
      columns: [
        { label: 'Note', render: (r) => `<strong>${r.rating}/5</strong>` },
        { label: 'Commentaire', render: (r) => esc(r.comment || '—') },
        { label: 'Auteur', render: (r) => personLink(r.author) },
        { label: 'Jobber noté', render: (r) => personLink(r.target) },
        { label: 'Mission', render: (r) => link(`#/missions/${r.mission.id}`, r.mission.title) },
        { label: 'Date', render: (r) => date(r.createdAt) },
      ],
    });
  };

  // ---------------------------------------------------------------- Administration
  P.admins = (view) => guarded(view, async () => {
    JAF.crumbs([['Administration', '#/admins'], ['Administrateurs']]);
    const [{ items, mfa }, roles] = await Promise.all([JAF.get('/admins'), JAF.get('/roles')]);
    view.innerHTML = `${head('Administrateurs', `Double authentification : ${esc(mfa)}`)}
      ${JAF.simpleTable(items, [
        { label: 'Administrateur', render: (a) => `<strong>${esc(`${a.firstName} ${a.lastName}`)}</strong><div class="muted small">${esc(a.email)}</div>` },
        { label: 'Rôle', render: (a) => `<span class="badge blue">${esc(a.roleLabel)}</span>${a.legacyOwner ? ' <span class="muted small">(par défaut)</span>' : ''}` },
        { label: 'Statut', render: (a) => (a.active ? '<span class="badge green">Actif</span>' : '<span class="badge red">Désactivé</span>') },
        { label: 'Dernière action admin', render: (a) => dateTime(a.lastAdminAction) },
        { label: '', render: (a) => (JAF.can('admins.manage') && a.id !== JAF.state.me.admin.id ? `<button class="btn" data-edit="${a.id}">Modifier les droits</button>` : '') },
      ])}
      <p class="muted small">Un compte devient administrateur via le rôle ADMIN en base ; sans rôle attribué ici, il est propriétaire (comportement historique du /admin web). Il doit toujours rester un propriétaire actif.</p>`;
    view.querySelectorAll('[data-edit]').forEach((b) => b.onclick = async () => {
      const a = items.find((x) => x.id === b.dataset.edit);
      const res = await JAF.modal({
        title: `Droits de ${a.firstName} ${a.lastName}`,
        fields: [
          { name: 'roleKey', label: 'Rôle', type: 'select', value: a.roleKey, options: roles.roles.map((r) => [r.key, r.label]) },
          { name: 'active', label: 'Accès', type: 'select', value: String(a.active), options: [['true', 'Actif'], ['false', 'Désactivé']] },
          JAF.reasonField(),
        ],
        submitLabel: 'Enregistrer',
        submit: (v) => JAF.api('PUT', `/admins/${a.id}/access`, { body: { roleKey: v.roleKey, active: v.active === 'true', reason: v.reason } }),
      });
      if (res) { JAF.toast('Droits mis à jour'); JAF.router(); }
    });
  });

  P.roles = (view) => guarded(view, async () => {
    JAF.crumbs([['Administration', '#/admins'], ['Rôles et permissions']]);
    const r = await JAF.get('/roles');
    view.innerHTML = `${head('Rôles et permissions', 'Modèles de droits. Chaque permission est revérifiée par le serveur.')}
      <div class="table-wrap"><table class="matrix"><thead><tr><th>Permission</th>${r.roles.map((x) => `<th>${esc(x.label)}</th>`).join('')}</tr></thead>
      <tbody>${Object.entries(r.permissions).map(([k, l]) => `<tr><td>${esc(l)}<div class="muted small mono">${esc(k)}</div></td>${r.roles.map((x) => `<td>${x.permissions.includes(k) ? '✓' : ''}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  });

  P.audit = (view) => {
    JAF.crumbs([['Administration', '#/admins'], ['Journal d\'audit']]);
    view.innerHTML = `${head('Journal d\'audit', 'Lecture seule. Chaque action admin est enregistrée avec son motif et un identifiant de corrélation.')}<div id="t"></div>`;
    JAF.table(view.querySelector('#t'), {
      path: '/audit', state: listState('audit'), exportName: 'journal-audit', empty: 'Aucune action enregistrée.',
      filters: [
        { name: 'action', label: 'Action', placeholder: 'ex. user.suspended' },
        { name: 'objectType', label: 'Objet', type: 'select', options: [['', 'Tous'], ['USER', 'Utilisateur'], ['MISSION', 'Mission'], ['DOCUMENT', 'Document'], ['CONVERSATION', 'Conversation'], ['CONTACT_MESSAGE', 'Message SAV'], ['PAYMENT', 'Transaction'], ['AUDIT', 'Journal']] },
        { name: 'from', label: 'Depuis', type: 'date' }, { name: 'to', label: 'Jusqu\'au', type: 'date' },
      ],
      columns: [
        { label: 'Date', render: (e) => dateTime(e.createdAt) },
        { label: 'Acteur', render: (e) => `${esc(e.actorLabel || '—')} <span class="badge">${esc(e.actorType === 'HUMAN' ? 'humain' : e.actorType)}</span>` },
        { label: 'Action', render: (e) => `<span class="mono">${esc(e.action)}</span>` },
        { label: 'Objet', render: (e) => `${esc(e.objectType)} ${e.objectType === 'USER' && e.objectId ? link(`#/users/${e.objectId}`, e.objectId.slice(-8)) : e.objectType === 'MISSION' && e.objectId ? link(`#/missions/${e.objectId}`, e.objectId.slice(-8)) : `<span class="mono">${esc((e.objectId || '').slice(-8))}</span>`}` },
        { label: 'Motif', render: (e) => esc(e.reason || '—') },
        { label: 'Détail', render: (e) => (e.diff ? `<span class="mono small">${esc(JSON.stringify(e.diff)).slice(0, 160)}</span>` : '—') },
        { label: 'Corrélation', render: (e) => `<span class="mono small">${esc(e.correlationId.slice(0, 8))}</span>` },
      ],
    });
  };

  P.settings = (view) => guarded(view, async () => {
    JAF.crumbs([['Administration', '#/admins'], ['Paramètres']]);
    const cfg = await window.jaf.config();
    const me = JAF.state.me;
    view.innerHTML = `${head('Paramètres et environnement', '')}
      <div class="grid grid-2">
        <div class="card"><h2>Connexion</h2><dl class="props">
          <dt>Serveur API</dt><dd class="mono">${esc(cfg.apiUrl)}</dd>
          <dt>Compte</dt><dd>${esc(me.admin.email)}</dd>
          <dt>Rôle</dt><dd>${esc(me.role.label)}</dd>
          <dt>Version de l'application</dt><dd>${esc(cfg.version)}</dd>
          <dt>Heure serveur</dt><dd>${dateTime(me.environment.serverTime)}</dd>
        </dl><p class="muted small">Pour changer de serveur : Déconnexion, puis « Serveur » sur l'écran de connexion.</p></div>
        <div class="card"><h2>État du back-office</h2><dl class="props">
          <dt>Tables admin</dt><dd>${me.environment.adminTablesReady ? '<span class="badge green">en place</span>' : '<span class="badge red">migration requise</span>'}</dd>
          <dt>Stripe</dt><dd>${esc(me.environment.stripeMode)}${me.environment.stripeMode === 'test' ? ' <span class="badge ochre">aucun paiement réel</span>' : ''}</dd>
          <dt>Versements jobbers</dt><dd>simulés (Stripe Connect non activé)</dd>
        </dl>
        ${me.environment.adminTablesReady ? '' : '<p class="small">Sur Railway, ouvrir le service backend et lancer une fois : <span class="mono">npx prisma db push</span>. Cela crée 4 tables (AdminAccess, AuditEvent, AdminNote, AccountRestriction) sans toucher aux tables existantes. Jusque-là, suspensions, notes, journal et droits sont indisponibles ; la consultation fonctionne.</p>'}
        </div>
      </div>`;
  });

  // Pôles not built yet: honest placeholder with the planned scope.
  P.planned = (view, { pole }) => {
    JAF.crumbs([[pole.label]]);
    view.innerHTML = `${head(pole.label, `<span class="badge ochre">Lot ${pole.lot}</span> Non branché`)}
      <div class="card placeholder"><p>Ce pôle est prévu au cahier des charges et sera construit au lot ${pole.lot}. Aucune donnée n'est affichée tant qu'aucune source réelle n'est connectée.</p>
      <h3>Rubriques prévues</h3><ul>${pole.subs.map(([l]) => `<li>${esc(l)}</li>`).join('')}</ul></div>`;
  };
})();
