const express = require('express');
const { z } = require('zod');
const prisma = require('../../config/prisma');
const { PERMISSIONS, ROLE_TEMPLATES } = require('../../admin/permissions');
const { recordAudit } = require('../../admin/audit');
const {
  cents, httpError, isMissingTable, can, route, pagination, dateRange, toCsv, EXPORT_LIMIT, fullName,
} = require('./helpers');

const router = express.Router();

function stripeMode() {
  const key = process.env.STRIPE_SECRET_KEY || '';
  if (key.startsWith('sk_live')) return 'live';
  if (key.startsWith('sk_test')) return 'test';
  return 'non configuré';
}

router.get('/me', route(async (req, res) => {
  res.json({
    admin: req.admin.user,
    role: { key: req.admin.roleKey, label: req.admin.roleLabel, legacyOwner: req.admin.legacyOwner },
    permissions: [...req.admin.permissions],
    environment: { stripeMode: stripeMode(), adminTablesReady: req.admin.accessTablesReady, serverTime: new Date().toISOString() },
  });
}));

// Jobber itself plus every corporate white-label site — the platform
// selector in the app's header filters missions/transactions on this.
router.get('/platforms', route(async (req, res) => {
  const agencies = await prisma.user.findMany({
    where: { agencyDomain: { not: null } },
    select: { id: true, companyName: true, agencyDomain: true },
    orderBy: { companyName: 'asc' },
  });
  res.json({
    platforms: [
      { id: 'jobber', label: 'Jobber (marketplace)', domain: 'jobberplus.fr' },
      ...agencies.map((a) => ({ id: a.id, label: a.companyName || a.agencyDomain, domain: a.agencyDomain })),
    ],
  });
}));

// Every value here is computed from the production tables at request time.
// Anything not wired to a real source is listed under `unavailable` rather
// than shown as zero.
router.get('/dashboard', can('dashboard.read'), route(async (req, res) => {
  const since30 = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const stale72h = new Date(Date.now() - 72 * 3600 * 1000);
  const stale24h = new Date(Date.now() - 24 * 3600 * 1000);
  const realMission = { isDemoNational: false };

  const [
    usersTotal, usersNew30, companies, corporates, activeJobbers, posters,
    missionsByStatus, demoMissions, bookingsByStatus, paymentsByStatus,
    pendingVerifications, newContactMessages, disputed, awaitingValidationStale,
    unpaidStale, failedPayments, agencyCommission,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: since30 } } }),
    prisma.user.count({ where: { accountKind: 'COMPANY', companyType: 'ENTREPRISE' } }),
    prisma.user.count({ where: { accountKind: 'COMPANY', companyType: 'CORPORATE' } }),
    prisma.user.count({ where: { providerProfile: { categories: { some: {} } } } }),
    prisma.mission.findMany({ where: realMission, distinct: ['clientId'], select: { clientId: true } }).then((r) => r.length),
    prisma.mission.groupBy({ by: ['status'], where: realMission, _count: true }),
    prisma.mission.count({ where: { isDemoNational: true } }),
    prisma.booking.groupBy({ by: ['status'], _count: true }),
    prisma.payment.groupBy({ by: ['status'], _count: true, _sum: { amount: true, platformFee: true, providerPayout: true } }),
    prisma.verificationDocument.count({ where: { status: 'PENDING' } }),
    prisma.contactMessage.count({ where: { status: 'NEW' } }),
    prisma.booking.count({ where: { status: 'DISPUTED' } }),
    prisma.booking.count({ where: { status: 'AWAITING_VALIDATION', updatedAt: { lt: stale72h } } }),
    prisma.payment.count({ where: { status: 'REQUIRES_PAYMENT', createdAt: { lt: stale24h } } }),
    prisma.payment.count({ where: { status: 'FAILED' } }),
    prisma.payment.aggregate({ where: { status: 'RELEASED' }, _sum: { agencyCommission: true } }),
  ]);

  let suspended = null;
  try { suspended = await prisma.accountRestriction.count({ where: { liftedAt: null } }); } catch (err) { if (!isMissingTable(err)) throw err; }

  const pay = Object.fromEntries(paymentsByStatus.map((p) => [p.status, p]));
  const sum = (status, field) => cents(pay[status]?._sum[field] || 0);

  res.json({
    computedAt: new Date().toISOString(),
    currency: 'EUR',
    stripeMode: stripeMode(),
    users: {
      total: usersTotal, new30d: usersNew30, companies, corporates, activeJobbers, missionPosters: posters, suspended,
      definitions: {
        activeJobbers: 'Comptes ayant choisi au moins une catégorie de compétences',
        missionPosters: 'Comptes ayant publié au moins une mission réelle (hors démo)',
      },
    },
    missions: {
      byStatus: Object.fromEntries(missionsByStatus.map((m) => [m.status, m._count])),
      demoExcluded: demoMissions,
      definition: 'Missions réelles ; les missions de démonstration nationale sont exclues et comptées à part',
    },
    orders: { byStatus: Object.fromEntries(bookingsByStatus.map((b) => [b.status, b._count])) },
    finance: {
      grossVolumeReleasedCents: sum('RELEASED', 'amount'),
      jobberRevenueReleasedCents: sum('RELEASED', 'platformFee'),
      providerPayoutsReleasedCents: sum('RELEASED', 'providerPayout'),
      corporateMarginReleasedCents: cents(agencyCommission._sum.agencyCommission || 0),
      heldInEscrowCents: sum('HELD_IN_ESCROW', 'amount'),
      refundedCents: sum('REFUNDED', 'amount'),
      paymentsByStatus: Object.fromEntries(paymentsByStatus.map((p) => [p.status, p._count])),
      definitions: {
        grossVolume: 'Montant total débité aux clients sur les paiements libérés (frais inclus)',
        jobberRevenue: 'Frais de service JobberPlus (platformFee) sur les paiements libérés',
        providerPayouts: 'Montant dû aux jobbers sur les paiements libérés',
        corporateMargin: 'Marge des agences corporate sur les paiements libérés',
        taxes: 'La base ne distingue pas HT/TVA : montants tels qu\'enregistrés',
      },
    },
    queue: [
      { key: 'verifications', label: 'Documents à vérifier', count: pendingVerifications, severity: 'normal', target: 'verifications' },
      { key: 'contact', label: 'Messages SAV non lus', count: newContactMessages, severity: 'normal', target: 'support' },
      { key: 'disputes', label: 'Commandes en litige', count: disputed, severity: 'high', target: 'disputes' },
      { key: 'awaiting', label: 'Fin de mission non validée depuis plus de 72 h', count: awaitingValidationStale, severity: 'normal', target: 'orders' },
      { key: 'unpaid', label: 'Paiements en attente depuis plus de 24 h', count: unpaidStale, severity: 'normal', target: 'transactions' },
      { key: 'failed', label: 'Paiements échoués', count: failedPayments, severity: 'high', target: 'transactions' },
    ],
    unavailable: [
      { label: 'Délai de première réponse SAV', reason: 'Pas d\'horodatage de réponse en base (lot 2 : tickets)' },
      { label: 'Taux de conversion visiteurs', reason: 'Aucune source analytics branchée (lot 2)' },
      { label: 'Santé technique (erreurs, latence)', reason: 'Aucune supervision branchée (pôle Administration, lot 2)' },
      { label: 'Revenus d\'abonnements', reason: 'Non rapprochés avec Stripe (lot 2 : facturation)' },
      { label: 'Frais du prestataire de paiement', reason: 'Non synchronisés depuis Stripe (lot 2 : rapprochement)' },
    ],
  });
}));

// Grouped quick search across the objects the admin may read.
router.get('/search', can('search.read'), route(async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (q.length < 2) return res.json({ q, groups: [] });
  const text = { contains: q, mode: 'insensitive' };
  const has = (p) => req.admin.permissions.has(p);
  const take = 6;

  const [users, missions, payments, messages] = await Promise.all([
    has('users.read') ? prisma.user.findMany({
      where: { OR: [{ id: q }, { email: text }, { firstName: text }, { lastName: text }, { companyName: text }, { phone: text }] },
      select: { id: true, firstName: true, lastName: true, email: true, companyName: true }, take,
    }) : [],
    has('missions.read') ? prisma.mission.findMany({
      where: { OR: [{ id: q }, { title: text }, { corporateCode: text }] },
      select: { id: true, title: true, status: true, corporateCode: true }, take, orderBy: { createdAt: 'desc' },
    }) : [],
    has('payments.read') ? prisma.payment.findMany({
      where: { OR: [{ id: q }, { stripePaymentIntentId: q }, { bookingId: q }] },
      select: { id: true, amount: true, status: true }, take,
    }) : [],
    has('support.read') ? prisma.contactMessage.findMany({
      where: { OR: [{ id: q }, { email: text }, { name: text }, { subject: text }] },
      select: { id: true, name: true, subject: true, status: true }, take, orderBy: { createdAt: 'desc' },
    }) : [],
  ]);

  const groups = [
    { type: 'user', label: 'Utilisateurs', items: users.map((u) => ({ id: u.id, title: u.companyName || fullName(u), subtitle: u.email })) },
    { type: 'mission', label: 'Missions', items: missions.map((m) => ({ id: m.id, title: m.title, subtitle: [m.corporateCode, m.status].filter(Boolean).join(' · ') })) },
    { type: 'payment', label: 'Transactions', items: payments.map((p) => ({ id: p.id, title: `${(p.amount).toFixed(2)} €`, subtitle: p.status })) },
    { type: 'contact', label: 'Messages SAV', items: messages.map((m) => ({ id: m.id, title: m.subject || '(sans objet)', subtitle: `${m.name} · ${m.status}` })) },
  ].filter((g) => g.items.length);
  res.json({ q, groups });
}));

// --- Internal notes ---

const NOTE_OBJECTS = ['USER', 'MISSION', 'BOOKING', 'PAYMENT', 'CONTACT_MESSAGE'];

router.post('/notes', can('notes.write'), route(async (req, res) => {
  const data = z.object({
    objectType: z.enum(NOTE_OBJECTS),
    objectId: z.string().min(1),
    body: z.string().trim().min(1, 'La note est vide').max(5000),
  }).parse(req.body);
  const note = await prisma.$transaction(async (tx) => {
    const created = await tx.adminNote.create({ data: { ...data, authorId: req.admin.user.id } });
    await recordAudit(req, { action: 'note.created', permission: 'notes.write', objectType: data.objectType, objectId: data.objectId }, tx);
    return created;
  });
  res.status(201).json({ note });
}));

// --- Audit journal (read-only) ---

router.get('/audit', can('audit.read'), route(async (req, res) => {
  const where = {
    ...(req.query.actorId ? { actorId: String(req.query.actorId) } : {}),
    ...(req.query.objectType ? { objectType: String(req.query.objectType) } : {}),
    ...(req.query.objectId ? { objectId: String(req.query.objectId) } : {}),
    ...(req.query.action ? { action: { contains: String(req.query.action) } } : {}),
    ...dateRange(req.query),
  };
  if (req.query.format === 'csv') {
    if (!req.admin.permissions.has('exports.run')) throw httpError(403, 'Permission manquante : exports.run');
    const rows = await prisma.auditEvent.findMany({ where, orderBy: { createdAt: 'desc' }, take: EXPORT_LIMIT });
    await recordAudit(req, { action: 'export.audit', permission: 'exports.run', objectType: 'AUDIT', diff: { rows: rows.length } });
    res.type('text/csv').send(toCsv([
      { label: 'Date (UTC)', value: (r) => r.createdAt }, { label: 'Acteur', value: (r) => r.actorLabel },
      { label: 'Action', value: (r) => r.action }, { label: 'Objet', value: (r) => r.objectType },
      { label: 'ID objet', value: (r) => r.objectId }, { label: 'Motif', value: (r) => r.reason },
      { label: 'Résultat', value: (r) => r.result }, { label: 'Corrélation', value: (r) => r.correlationId },
    ], rows));
    return;
  }
  const { page, pageSize, skip, take } = pagination(req.query);
  const [total, events] = await Promise.all([
    prisma.auditEvent.count({ where }),
    prisma.auditEvent.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
  ]);
  res.json({ items: events, total, page, pageSize });
}));

// --- Administrators and role templates ---

router.get('/roles', can('admins.read'), route(async (req, res) => {
  res.json({
    permissions: PERMISSIONS,
    roles: Object.entries(ROLE_TEMPLATES).map(([key, r]) => ({ key, label: r.label, permissions: r.permissions })),
  });
}));

async function adminRows() {
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true, email: true, firstName: true, lastName: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  const ids = admins.map((a) => a.id);
  const [access, lastEvents] = await Promise.all([
    prisma.adminAccess.findMany({ where: { userId: { in: ids } } }),
    prisma.auditEvent.groupBy({ by: ['actorId'], where: { actorId: { in: ids } }, _max: { createdAt: true } }),
  ]);
  const byUser = Object.fromEntries(access.map((a) => [a.userId, a]));
  const last = Object.fromEntries(lastEvents.map((e) => [e.actorId, e._max.createdAt]));
  return admins.map((a) => {
    const acc = byUser[a.id];
    const roleKey = acc?.roleKey && ROLE_TEMPLATES[acc.roleKey] ? acc.roleKey : 'owner';
    return {
      ...a,
      roleKey,
      roleLabel: ROLE_TEMPLATES[roleKey].label,
      active: acc ? acc.active : true,
      legacyOwner: !acc,
      lastAdminAction: last[a.id] || null,
    };
  });
}

router.get('/admins', can('admins.read'), route(async (req, res) => {
  res.json({ items: await adminRows(), mfa: 'indisponible (non géré par le backend actuel)' });
}));

router.put('/admins/:userId/access', can('admins.manage'), route(async (req, res) => {
  const data = z.object({
    roleKey: z.enum(Object.keys(ROLE_TEMPLATES)),
    active: z.boolean(),
    reason: z.string().trim().min(3, 'Motif obligatoire'),
  }).parse(req.body);
  const { userId } = req.params;
  if (userId === req.admin.user.id) throw httpError(409, 'Vous ne pouvez pas modifier vos propres droits');

  const rows = await adminRows();
  const target = rows.find((r) => r.id === userId);
  if (!target) throw httpError(404, 'Administrateur introuvable');
  const ownersAfter = rows.filter((r) => (r.id === userId ? data.roleKey === 'owner' && data.active : r.roleKey === 'owner' && r.active));
  if (!ownersAfter.length) throw httpError(409, 'Impossible : il doit rester au moins un propriétaire actif');

  await prisma.$transaction(async (tx) => {
    await tx.adminAccess.upsert({
      where: { userId },
      create: { userId, roleKey: data.roleKey, active: data.active, createdById: req.admin.user.id },
      update: { roleKey: data.roleKey, active: data.active },
    });
    await recordAudit(req, {
      action: 'admin.access.updated', permission: 'admins.manage', objectType: 'USER', objectId: userId, reason: data.reason,
      diff: { roleKey: { before: target.roleKey, after: data.roleKey }, active: { before: target.active, after: data.active } },
    }, tx);
  });
  res.json({ items: await adminRows() });
}));

module.exports = router;
