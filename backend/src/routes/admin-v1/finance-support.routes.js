const express = require('express');
const { z } = require('zod');
const prisma = require('../../config/prisma');
const { recordAudit } = require('../../admin/audit');
const {
  cents, httpError, isMissingTable, can, route, pagination, sorting, dateRange, toCsv, EXPORT_LIMIT, fullName,
} = require('./helpers');
const { paymentView, person, PERSON, platformWhere } = require('./missions.routes');

const router = express.Router();

async function optional(promise) {
  try { return await promise; } catch (err) { if (isMissingTable(err)) return null; throw err; }
}

// --- F01 Transactions (read-only in lot 1: statuses come from Stripe) ---

router.get('/transactions', can('payments.read'), route(async (req, res) => {
  const q = String(req.query.q || '').trim();
  const and = [dateRange(req.query)];
  if (req.query.status) and.push({ status: String(req.query.status) });
  if (req.query.platform) and.push({ booking: { mission: platformWhere(req.query.platform) } });
  if (q) and.push({ OR: [{ id: q }, { bookingId: q }, { stripePaymentIntentId: q }, { booking: { missionId: q } }] });
  const where = { AND: and };
  const { orderBy, sort } = sorting(req.query, { createdAt: (d) => ({ createdAt: d }), amount: (d) => ({ amount: d }) }, 'createdAt');
  const include = { booking: { select: { id: true, client: PERSON, provider: PERSON, mission: { select: { id: true, title: true, corporateAgency: { select: { companyName: true } } } } } } };
  const mapRow = (p) => ({
    ...paymentView(p),
    order: p.booking.id, mission: p.booking.mission, platform: p.booking.mission.corporateAgency?.companyName || 'Jobber',
    payer: person(p.booking.client), beneficiary: person(p.booking.provider),
  });

  if (req.query.format === 'csv') {
    if (!req.admin.permissions.has('exports.run')) throw httpError(403, 'Permission manquante : exports.run');
    const rows = (await prisma.payment.findMany({ where, include, orderBy, take: EXPORT_LIMIT })).map(mapRow);
    await recordAudit(req, { action: 'export.transactions', permission: 'exports.run', objectType: 'PAYMENT', diff: { rows: rows.length, filters: req.query } });
    const eur = (c) => (c == null ? '' : (c / 100).toFixed(2));
    res.type('text/csv').send(toCsv([
      { label: 'ID', value: (r) => r.id }, { label: 'Référence Stripe', value: (r) => r.stripePaymentIntentId },
      { label: 'Commande', value: (r) => r.order }, { label: 'Mission', value: (r) => r.mission.title },
      { label: 'Plateforme', value: (r) => r.platform }, { label: 'Payeur', value: (r) => r.payer?.name },
      { label: 'Bénéficiaire', value: (r) => r.beneficiary?.name },
      { label: 'Brut débité (€)', value: (r) => eur(r.amountCents) }, { label: 'Frais JobberPlus (€)', value: (r) => eur(r.platformFeeCents) },
      { label: 'Dû au jobber (€)', value: (r) => eur(r.providerPayoutCents) }, { label: 'Marge corporate (€)', value: (r) => eur(r.agencyCommissionCents) },
      { label: 'Devise', value: () => 'EUR' }, { label: 'État', value: (r) => r.status },
      { label: 'Créé (UTC)', value: (r) => r.createdAt }, { label: 'Libéré (UTC)', value: (r) => r.releasedAt },
    ], rows));
    return;
  }

  const { page, pageSize, skip, take } = pagination(req.query);
  const [total, payments, totals] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.findMany({ where, include, orderBy, skip, take }),
    prisma.payment.aggregate({ where, _sum: { amount: true, platformFee: true, providerPayout: true, agencyCommission: true } }),
  ]);
  res.json({
    items: payments.map(mapRow), total, page, pageSize, sort, currency: 'EUR',
    totals: {
      amountCents: cents(totals._sum.amount || 0), platformFeeCents: cents(totals._sum.platformFee || 0),
      providerPayoutCents: cents(totals._sum.providerPayout || 0), agencyCommissionCents: cents(totals._sum.agencyCommission || 0),
    },
  });
}));

router.get('/transactions/:id', can('payments.read'), route(async (req, res) => {
  const p = await prisma.payment.findUnique({
    where: { id: req.params.id },
    include: { booking: { include: { client: PERSON, provider: PERSON, mission: { select: { id: true, title: true, corporateAgency: { select: { companyName: true } } } } } } },
  });
  if (!p) throw httpError(404, 'Transaction introuvable');
  const notes = await optional(prisma.adminNote.findMany({ where: { objectType: 'PAYMENT', objectId: p.id }, orderBy: { createdAt: 'desc' } }));
  res.json({
    transaction: {
      ...paymentView(p), order: { id: p.booking.id, status: p.booking.status, totalCents: cents(p.booking.totalAmount) },
      mission: p.booking.mission, platform: p.booking.mission.corporateAgency?.companyName || 'Jobber',
      payer: person(p.booking.client), beneficiary: person(p.booking.provider),
    },
    notes,
    actions: { refund: { allowed: false, reason: 'Remboursements : lot 2 (Finance), avec clé d\'idempotence et confirmation Stripe' } },
  });
}));

// --- F02 Versements (wallet → banque) ---

router.get('/payouts', can('payments.read'), route(async (req, res) => {
  const where = { ...(req.query.status ? { status: String(req.query.status) } : {}), ...dateRange(req.query) };
  const { page, pageSize, skip, take } = pagination(req.query);
  const [total, payouts, wallets] = await Promise.all([
    prisma.payout.count({ where }),
    prisma.payout.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take, include: { provider: { select: { user: PERSON, bankLast4: true } } } }),
    prisma.providerProfile.aggregate({ _sum: { walletBalance: true } }),
  ]);
  res.json({
    items: payouts.map((p) => ({
      id: p.id, status: p.status, amountCents: cents(p.amount), createdAt: p.createdAt, completedAt: p.completedAt,
      beneficiary: person(p.provider.user), destination: p.provider.bankLast4 ? `•••• ${p.provider.bankLast4}` : null,
      stripeTransferId: p.stripeTransferId, failureReason: p.failureReason,
    })),
    total, page, pageSize,
    walletsTotalCents: cents(wallets._sum.walletBalance || 0),
    note: 'Soldes wallet internes à Jobber. Sans Stripe Connect actif, un versement « COMPLETED » n\'est pas un virement bancaire confirmé.',
  });
}));

// --- S01 Boîte SAV (formulaire « Nous contacter ») ---

router.get('/support/messages', can('support.read'), route(async (req, res) => {
  const q = String(req.query.q || '').trim();
  const text = { contains: q, mode: 'insensitive' };
  const and = [dateRange(req.query)];
  if (req.query.status) and.push({ status: String(req.query.status) });
  if (req.query.platform === 'jobber') and.push({ agencyId: null });
  else if (req.query.platform) and.push({ agencyId: String(req.query.platform) });
  if (q) and.push({ OR: [{ id: q }, { email: text }, { name: text }, { subject: text }, { message: text }] });
  const where = { AND: and };
  const { page, pageSize, skip, take } = pagination(req.query);
  const [total, rows] = await Promise.all([
    prisma.contactMessage.count({ where }),
    prisma.contactMessage.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take, include: { agency: { select: { companyName: true } }, sender: PERSON } }),
  ]);
  res.json({
    items: rows.map((m) => ({
      id: m.id, name: m.name, email: m.email, subject: m.subject, excerpt: m.message.slice(0, 140), status: m.status, createdAt: m.createdAt,
      platform: m.agency?.companyName || 'Jobber', sender: person(m.sender),
    })),
    total, page, pageSize,
  });
}));

router.get('/support/messages/:id', can('support.read'), route(async (req, res) => {
  const m = await prisma.contactMessage.findUnique({ where: { id: req.params.id }, include: { agency: { select: { companyName: true } }, sender: PERSON } });
  if (!m) throw httpError(404, 'Message introuvable');
  const [notes, audit] = await Promise.all([
    optional(prisma.adminNote.findMany({ where: { objectType: 'CONTACT_MESSAGE', objectId: m.id }, orderBy: { createdAt: 'desc' } })),
    req.admin.permissions.has('audit.read') ? optional(prisma.auditEvent.findMany({ where: { objectType: 'CONTACT_MESSAGE', objectId: m.id }, orderBy: { createdAt: 'desc' } })) : Promise.resolve(undefined),
  ]);
  res.json({ message: { ...m, platform: m.agency?.companyName || 'Jobber', sender: person(m.sender), agency: undefined }, notes, audit });
}));

router.patch('/support/messages/:id', can('support.update'), route(async (req, res) => {
  const { status, reason } = z.object({ status: z.enum(['NEW', 'READ', 'REPLIED']), reason: z.string().trim().optional() }).parse(req.body);
  const updated = await prisma.$transaction(async (tx) => {
    const before = await tx.contactMessage.findUnique({ where: { id: req.params.id }, select: { status: true } });
    if (!before) throw httpError(404, 'Message introuvable');
    const m = await tx.contactMessage.update({ where: { id: req.params.id }, data: { status } });
    await recordAudit(req, { action: 'contact.status', permission: 'support.update', objectType: 'CONTACT_MESSAGE', objectId: m.id, reason, diff: { status: { before: before.status, after: status } } }, tx);
    return m;
  });
  res.json({ message: updated });
}));

// --- S03 Litiges (commandes DISPUTED) ---

router.get('/support/disputes', can('support.read'), route(async (req, res) => {
  const where = { status: 'DISPUTED', ...dateRange(req.query, 'updatedAt') };
  const { page, pageSize, skip, take } = pagination(req.query);
  const [total, rows] = await Promise.all([
    prisma.booking.count({ where }),
    prisma.booking.findMany({ where, orderBy: { updatedAt: 'asc' }, skip, take, include: { client: PERSON, provider: PERSON, payment: true, mission: { select: { id: true, title: true } } } }),
  ]);
  res.json({
    items: rows.map((b) => ({
      id: b.id, mission: b.mission, client: person(b.client), provider: person(b.provider), since: b.updatedAt,
      contestedCents: cents(b.totalAmount), payment: b.payment && paymentView(b.payment),
    })),
    total, page, pageSize,
    note: 'Un litige est aujourd\'hui un état de commande. Dossiers, preuves et décisions motivées : lot 2.',
  });
}));

// --- S06 Avis ---

router.get('/support/reviews', can('support.read'), route(async (req, res) => {
  const where = {
    ...(req.query.maxRating ? { rating: { lte: Number(req.query.maxRating) || 5 } } : {}),
    ...dateRange(req.query),
  };
  const { page, pageSize, skip, take } = pagination(req.query);
  const [total, rows] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take, include: { author: PERSON, target: PERSON, booking: { select: { id: true, mission: { select: { id: true, title: true } } } } } }),
  ]);
  res.json({
    items: rows.map((r) => ({ id: r.id, rating: r.rating, comment: r.comment, createdAt: r.createdAt, author: person(r.author), target: person(r.target), mission: r.booking.mission })),
    total, page, pageSize,
  });
}));

// --- S05 Conversations privées : motif obligatoire, accès tracé ---

router.post('/conversations/:id/open', can('conversations.read_private'), route(async (req, res) => {
  const { reason } = z.object({ reason: z.string().trim().min(5, 'Motif d\'accès obligatoire (5 caractères minimum)') }).parse(req.body);
  const c = await prisma.conversation.findUnique({
    where: { id: req.params.id },
    include: {
      client: PERSON, provider: PERSON, mission: { select: { id: true, title: true } },
      messages: { orderBy: { createdAt: 'asc' }, select: { id: true, senderId: true, content: true, createdAt: true, readAt: true } },
    },
  });
  if (!c) throw httpError(404, 'Conversation introuvable');
  await recordAudit(req, { action: 'conversation.viewed', permission: 'conversations.read_private', objectType: 'CONVERSATION', objectId: c.id, reason });
  res.json({ conversation: { ...c, client: person(c.client), provider: person(c.provider) } });
}));

module.exports = router;
