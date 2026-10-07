/* Shell: login, 13-pole navigation, hash router, global search, scope. */
(function () {
  const { esc } = JAF;
  JAF.state = { me: null, lists: {}, scope: { platform: '' }, categories: null };

  // The 13 pôles of the spec. `lot` > 1 renders the "non branché" page;
  // `perm` hides an entry the admin's role can't use.
  const POLES = [
    { num: '01', label: 'Dashboard', lot: 1, subs: [['Cockpit et file des actions', '#/dashboard', 'dashboard.read']] },
    { num: '02', label: 'Utilisateurs', lot: 1, subs: [['Tous', '#/users', 'users.read'], ['Demandeurs', '#/users-seg/demandeurs', 'users.read'], ['Jobbers particuliers', '#/users-seg/jobbers_particuliers', 'users.read'], ['Jobbers professionnels', '#/users-seg/jobbers_pro', 'users.read'], ['Vérifications', '#/verifications', 'verifications.read']] },
    { num: '03', label: 'Missions', lot: 1, subs: [['Missions', '#/missions', 'missions.read'], ['Devis', '#/quotes', 'missions.read'], ['Commandes', '#/orders', 'missions.read']] },
    { num: '04', label: 'Entreprises', lot: 1, subs: [['Entreprises clientes', '#/companies', 'companies.read'], ['Corporate et agences', '#/corporate', 'companies.read']] },
    { num: '05', label: 'SAV', lot: 1, subs: [['Boîte SAV', '#/support', 'support.read'], ['Litiges', '#/disputes', 'support.read'], ['Avis', '#/reviews', 'support.read']] },
    { num: '06', label: 'Finance', lot: 1, subs: [['Transactions', '#/transactions', 'payments.read'], ['Versements', '#/payouts', 'payments.read'], ['Factures, remboursements, tarification', null]] },
    { num: '07', label: 'Communication', lot: 2, subs: [['Audiences'], ['Campagnes'], ['Emails transactionnels'], ['Scénarios'], ['SMS et push'], ['Modèles'], ['Délivrabilité']] },
    { num: '08', label: 'Marketing', lot: 2, subs: [['Acquisition'], ['Promotions'], ['Parrainage'], ['Affiliation'], ['Publicités'], ['Landing pages'], ['Conversion']] },
    { num: '09', label: 'Factory', lot: 3, subs: [['Plateformes'], ['Opportunités et implantation'], ['Carte de France'], ['Alertes marché'], ['Créateur'], ['Domaines'], ['Templates'], ['Déploiements']] },
    { num: '10', label: 'Contenu et SEO', lot: 2, subs: [['Pages'], ['Médias'], ['Métiers'], ['Communes'], ['Blog'], ['Matrice SEO'], ['Indexation']] },
    { num: '11', label: 'Analytics', lot: 2, subs: [['Business'], ['Utilisateurs'], ['Missions'], ['Géographie'], ['Rapports']] },
    { num: '12', label: 'IA et Automations', lot: 4, subs: [['Copilote'], ['Autopilot'], ['Workflows'], ['Exécutions'], ['Alertes IA'], ['Journal IA']] },
    { num: '13', label: 'Administration', lot: 1, subs: [['Administrateurs', '#/admins', 'admins.read'], ['Rôles et permissions', '#/roles', 'admins.read'], ['Journal d\'audit', '#/audit', 'audit.read'], ['Paramètres', '#/settings', null]] },
  ];

  const ROUTES = [
    [/^dashboard$/, (v) => JAF.pages.dashboard(v), 0],
    [/^users$/, (v) => JAF.pages.users(v, {}), 1],
    [/^users-seg\/(\w+)$/, (v, m) => JAF.pages.users(v, { segment: m[1] }), 1],
    [/^users\/([\w-]+)$/, (v, m) => JAF.pages.user(v, { id: m[1] }), 1],
    [/^verifications$/, (v) => JAF.pages.verifications(v), 1],
    [/^missions$/, (v) => JAF.pages.missions(v), 2],
    [/^missions\/([\w-]+)$/, (v, m) => JAF.pages.mission(v, { id: m[1] }), 2],
    [/^quotes$/, (v) => JAF.pages.quotes(v), 2],
    [/^orders$/, (v) => JAF.pages.orders(v), 2],
    [/^companies$/, (v) => JAF.pages.companies(v, { type: 'ENTREPRISE' }), 3],
    [/^corporate$/, (v) => JAF.pages.companies(v, { type: 'CORPORATE' }), 3],
    [/^support$/, (v) => JAF.pages.support(v), 4],
    [/^support\/([\w-]+)$/, (v, m) => JAF.pages.supportMessage(v, { id: m[1] }), 4],
    [/^disputes$/, (v) => JAF.pages.disputes(v), 4],
    [/^reviews$/, (v) => JAF.pages.reviews(v), 4],
    [/^transactions$/, (v) => JAF.pages.transactions(v), 5],
    [/^transactions\/([\w-]+)$/, (v, m) => JAF.pages.transaction(v, { id: m[1] }), 5],
    [/^payouts$/, (v) => JAF.pages.payouts(v), 5],
    [/^admins$/, (v) => JAF.pages.admins(v), 12],
    [/^roles$/, (v) => JAF.pages.roles(v), 12],
    [/^audit$/, (v) => JAF.pages.audit(v), 12],
    [/^settings$/, (v) => JAF.pages.settings(v), 12],
    [/^planned\/(\d+)$/, (v, m) => JAF.pages.planned(v, { pole: POLES[Number(m[1])] }), null],
  ];

  let activePole = 0;

  function renderNav() {
    const nav = document.getElementById('nav');
    const current = location.hash || '#/dashboard';
    nav.innerHTML = POLES.map((p, i) => {
      const subs = p.subs.filter(([, href, perm]) => !perm || JAF.can(perm));
      return `<div class="nav-pole ${i === activePole ? 'active' : ''}">
        <button data-pole="${i}"><span class="nav-num">${p.num}</span>${esc(p.label)}${p.lot > 1 ? `<span class="nav-lot">lot ${p.lot}</span>` : ''}</button>
        <div class="nav-sub">${p.lot > 1
          ? subs.map(([l]) => `<a class="off" href="#/planned/${i}">${esc(l)}</a>`).join('')
          : subs.map(([l, href]) => (href ? `<a href="${href}" class="${href === current ? 'current' : ''}">${esc(l)}</a>` : `<a class="off" href="#/planned/${i}">${esc(l)}<span>lot 2</span></a>`)).join('')}</div>
      </div>`;
    }).join('');
    nav.querySelectorAll('[data-pole]').forEach((b) => b.onclick = () => {
      const i = Number(b.dataset.pole);
      const p = POLES[i];
      const first = p.subs.find(([, href, perm]) => href && (!perm || JAF.can(perm)));
      location.hash = p.lot > 1 || !first ? `#/planned/${i}` : first[1];
      activePole = i;
    });
  }

  JAF.crumbs = (items) => {
    document.getElementById('crumbs').innerHTML = items.map(([l, href]) => (href ? `<a href="${esc(href)}">${esc(l)}</a>` : `<span>${esc(l)}</span>`)).join(' / ');
  };

  JAF.router = () => {
    const path = (location.hash || '#/dashboard').replace(/^#\/?/, '');
    const view = document.getElementById('view');
    document.getElementById('crumbs').innerHTML = '';
    for (const [re, fn, pole] of ROUTES) {
      const m = path.match(re);
      if (m) {
        activePole = pole ?? Number(m[1]);
        renderNav();
        fn(view, m);
        view.scrollTop = 0;
        view.focus({ preventScroll: true });
        return;
      }
    }
    location.hash = '#/dashboard';
  };

  // --- Global search ---
  function initSearch() {
    const input = document.getElementById('global-search');
    const box = document.getElementById('search-results');
    const TARGET = { user: (id) => `#/users/${id}`, mission: (id) => `#/missions/${id}`, payment: (id) => `#/transactions/${id}`, contact: (id) => `#/support/${id}` };
    let timer = null;
    let seq = 0;
    input.addEventListener('input', () => {
      clearTimeout(timer);
      const q = input.value.trim();
      if (q.length < 2) { box.hidden = true; return; }
      timer = setTimeout(async () => {
        const mine = ++seq;
        try {
          const { groups } = await JAF.get('/search', { q });
          if (mine !== seq) return;
          box.innerHTML = groups.length
            ? groups.map((g) => `<div class="search-group">${esc(g.label)}</div>${g.items.map((it) => `<a class="search-item" href="${TARGET[g.type](it.id)}">${esc(it.title)}<small>${esc(it.subtitle || '')}</small></a>`).join('')}`).join('')
            : '<div class="state">Aucun résultat accessible.</div>';
          box.hidden = false;
        } catch (err) { box.innerHTML = JAF.errorState(err); box.hidden = false; }
      }, 300);
    });
    box.addEventListener('click', (e) => { if (e.target.closest('a')) { box.hidden = true; input.value = ''; } });
    document.addEventListener('click', (e) => { if (!e.target.closest('.search')) box.hidden = true; });
    input.addEventListener('keydown', (e) => { if (e.key === 'Escape') { box.hidden = true; input.blur(); } });
    document.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); input.focus(); } });
  }

  async function initScope() {
    const select = document.getElementById('scope-platform');
    try {
      const { platforms } = await JAF.get('/platforms');
      select.innerHTML = `<option value="">Toutes</option>${platforms.map((p) => `<option value="${esc(p.id)}">${esc(p.label)}</option>`).join('')}`;
    } catch { /* selector stays on "Toutes" */ }
    select.value = JAF.state.scope.platform;
    select.onchange = () => { JAF.state.scope.platform = select.value; JAF.state.lists = {}; JAF.router(); };
  }

  // --- Session ---
  function showLogin(message) {
    document.getElementById('app').hidden = true;
    document.getElementById('login').hidden = false;
    document.getElementById('login-error').textContent = message || '';
    document.getElementById('login-password').value = '';
    document.getElementById('login-email').focus();
  }

  function startApp(me) {
    JAF.state.me = me;
    JAF.state.lists = {};
    document.getElementById('login').hidden = true;
    document.getElementById('app').hidden = false;
    document.getElementById('me-name').textContent = `${me.admin.firstName} ${me.admin.lastName}`;
    document.getElementById('me-role').textContent = me.role.label;
    const env = me.environment;
    document.getElementById('env-label').textContent = `Stripe ${env.stripeMode}`;
    const banners = [];
    if (!env.adminTablesReady) banners.push('Base à mettre à jour : suspensions, notes, journal d\'audit et droits sont indisponibles tant que la migration n\'est pas faite (Administration > Paramètres).');
    if (env.stripeMode === 'test') banners.push('Stripe est en mode test : aucun paiement réel n\'est encaissé.');
    document.getElementById('banner').innerHTML = banners.map((b) => `<div class="banner">${esc(b)}</div>`).join('');
    initScope();
    if (!location.hash) location.hash = JAF.can('dashboard.read') ? '#/dashboard' : '#/settings';
    JAF.router();
  }

  JAF.onUnauthorized = () => showLogin('Session expirée, reconnectez-vous.');

  async function init() {
    const cfg = await window.jaf.config();
    document.getElementById('login-api').value = cfg.apiUrl;
    document.getElementById('login-version').textContent = `Version ${cfg.version} · ${cfg.apiUrl}`;

    document.getElementById('login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('login-submit');
      btn.disabled = true;
      document.getElementById('login-error').textContent = '';
      const res = await window.jaf.login(document.getElementById('login-email').value.trim(), document.getElementById('login-password').value);
      btn.disabled = false;
      if (!res.ok) { showLogin(res.data?.error || 'Connexion impossible'); return; }
      startApp(res.data);
    });
    document.getElementById('login-api-save').addEventListener('click', async () => {
      try {
        const next = await window.jaf.setApiUrl(document.getElementById('login-api').value.trim());
        document.getElementById('login-version').textContent = `Version ${cfg.version} · ${next.apiUrl}`;
        document.getElementById('login-error').textContent = '';
        JAF.toast('Serveur enregistré');
      } catch (err) { document.getElementById('login-error').textContent = err.message.replace(/^Error invoking remote method '[^']+': (Error: )?/, ''); }
    });
    document.getElementById('logout').addEventListener('click', async () => { await window.jaf.logout(); JAF.state.me = null; location.hash = ''; showLogin(); });

    initSearch();
    window.addEventListener('hashchange', () => { if (JAF.state.me) JAF.router(); });

    const session = await window.jaf.session();
    if (session.ok) startApp(session.data);
    else showLogin(session.status && session.status !== 401 ? session.data?.error : '');
  }

  init();
})();
