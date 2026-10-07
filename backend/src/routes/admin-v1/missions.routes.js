const express = require('express');
const { z } = require('zod');
const prisma = require('../../config/prisma');
const { recordAudit } = require('../../admin/audit');
const {
  cents, httpError, isMissingTable, can, route, pagination, sorting, dateRange, toCsv, EXPORT_LIMIT, fullName,
} = require('./helpers');

const router = express.Router();
const PERSON = { select: { id: true, firstName: true, lastName: true, email: true } };
const person = (u) => (u ? { id: u.id, name: fullName(u), email: u.email } : null);

// 'jobber' = missions posted on the marketplace itself, otherwise a
// corporate agency id from /platforms.
function platformWhere(platform) {
  if (!platform) return {};
  if (platform === 'jobber') return { corporateAgencyId: null };
  return { corporateAgencyId: String(platform) };
}

// What a jobber's offer adds up to: hourly rate × hours (agency offers may
// carry their own hours) + optional extra fees.
function offerTotal(offer, missionHours) {
  const hours = offer.hours ?? missionHours ?? 1;
  const extras = Array.isArray(offer.extraFees) ? offer.extraFees.reduce((s, f) => s + (Number(f.amount) || 0), 0) : 0;
  return offer.hourlyRate * hours + extras;
}

// --- M01 Missions ---

const MISSION_SORTS = {
  createdAt: (d) => ({ createdAt: d }),
  desiredDate: (d) => ({ desiredDate: d }),
  title: (d) => ({ title: d }),
};

router.get('/missions', can('missions.read'), route(async (req, res) => {
  const q = String(req.query.q || '').trim();
  const text = { contains: q, mode: 'insensitive' };
  const and = [platformWhere(req.query.platform), dateRange(req.query)];
  if (req.query.demo !== 'include') and.push({ isDemoNational: req.query.demo === 'only' });
  if (req.query.status) and.push({ status: String(req.query.status) });
  if (req.query.categoryId) and.push({ categoryId: String(req.query.categoryId) });
  if (req.query.withoutOffers === 'true') and.push({ offers: { none: {} } });
  if (req.query.withoutJobber === 'true') and.push({ booking: null });
  if (req.query.paymentStatus) and.push({ booking: { payment: { status: String(req.query.paymentStatus) } } });
  if (q) and.push({ OR: [{ id: q }, { corporateCode: text }, { title: text }, { address: text }, { client: { email: text } }] });
  const where = { AND: and };
  const { orderBy, sort } = sorting(req.query, MISSION_SORTS, 'createdAt');
  const select = {
    id: true, title: true, status: true, address: true, desiredDate: true, createdAt: true, visibility: true, corporateCode: true,
    isDemoNational: true, estimatedHours: true, isGetMission: true, getMissionPrice: true,
    client: PERSON, category: { select: { id: true, name: true } }, service: { select: { name: true } },
    corporateAgency: { select: { id: true, companyName: true } },
    booking: { select: { id: true, status: true, totalAmount: true, provider: PERSON, payment: { select: { status: true } } } },
    _count: { select: { offers: true } },
  };
  const mapRow = (m) => ({
    id: m.id, code: m.corporateCode, title: m.title, status: m.status, address: m.address, desiredDate: m.desiredDate, createdAt: m.createdAt,
    visibility: m.visibility, isDemo: m.isDemoNational, category: m.category?.name, service: m.service?.name,
    client: person(m.client), jobber: person(m.booking?.provider),
    platform: m.corporateAgency ? m.corporateAgency.companyName : 'Jobber',
    offers: m._count.offers, orderStatus: m.booking?.status || null, paymentStatus: m.booking?.payment?.status || null,
    acceptedAmountCents: m.booking ? cents(m.booking.totalAmount) : null,
  });

  if (req.query.format === 'csv') {
    if (!req.admin.permissions.has('exports.run')) throw httpError(403, 'Permission manquante : exports.run');
    const rows = (await prisma.mission.findMany({ where, select, orderBy, take: EXPORT_LIMIT })).map(mapRow);
    await recordAudit(req, { action: 'export.missions', permission: 'exports.run', objectType: 'MISSION', diff: { rows: rows.length, filters: req.query } });
    res.type('text/csv').send(toCsv([
      { label: 'ID', value: (r) => r.id }, { label: 'Code', value: (r) => r.code }, { label: 'Titre', value: (r) => r.title },
      { label: 'Client', value: (r) => r.client?.name }, { label: 'Jobber', value: (r) => r.jobber?.name },
      { label: 'Catégorie', value: (r) => r.category }, { label: 'Adresse', value: (r) => r.address },
      { label: 'Plateforme', value: (r) => r.platform }, { label: 'Date prévue (UTC)', value: (r) => r.desiredDate },
      { label: 'Montant accepté (€)', value: (r) => (r.acceptedAmountCents == null ? '' : (r.acceptedAmountCents / 100).toFixed(2)) },
      { label: 'État', value: (r) => r.status }, { label: 'Commande', value: (r) => r.orderStatus }, { label: 'Paiement', value: (r) => r.paymentStatus },
      { label: 'Démo', value: (r) => (r.isDemo ? 'oui' : 'non') },
    ], rows));
    return;
  }

  const { page, pageSize, skip, take } = pagination(req.query);
  const [total, missions] = await Promise.all([
    prisma.mission.count({ where }),
    prisma.mission.findMany({ where, select, orderBy, skip, take }),
  ]);
  res.json({ items: missions.map(mapRow), total, page, pageSize, sort });
}));

router.get('/categories', can('missions.read'), route(async (req, res) => {
  res.json({ items: await prisma.category.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }) });
}));

async function optional(promise) {
  try { return await promise; } catch (err) { if (isMissingTable(err)) return null; throw err; }
}

// --- M02 Fiche mission ---

router.get('/missions/:id', can('missions.read'), route(async (req, res) => {
  const m = await prisma.mission.findUnique({
    where: { id: req.params.id },
    include: {
      client: PERSON, category: { select: { name: true } }, service: { select: { name: true } },
      corporateAgency: { select: { id: true, companyName: true, agencyDomain: true } },
      offers: { include: { provider: PERSON }, orderBy: { createdAt: 'asc' } },
      booking: { include: { provider: PERSON, client: PERSON, payment: true, review: { select: { id: true, rating: true, comment: true, createdAt: true } } } },
      conversations: { select: { id: true, createdAt: true, provider: PERSON, _count: { select: { messages: true } } } },
      scheduleEntries: { orderBy: { date: 'asc' } },
    },
  });
  if (!m) throw httpError(404, 'Mission introuvable');

  const [notes, audit] = await Promise.all([
    optional(prisma.adminNote.findMany({ where: { objectType: 'MISSION', objectId: m.id }, orderBy: { createdAt: 'desc' } })),
    req.admin.permissions.has('audit.read')
      ? optional(prisma.auditEvent.findMany({ where: { objectType: 'MISSION', objectId: m.id }, orderBy: { createdAt: 'desc' } }))
      : Promise.resolve(undefined),
  ]);

  const b = m.booking;
  const p = b?.payment;
  const timeline = [
    { at: m.createdAt, label: 'Mission publiée', by: person(m.client)?.name },
    ...m.offers.map((o) => ({ at: o.createdAt, label: `Offre de ${fullName(o.provider)} (${o.status})`, by: fullName(o.provider) })),
    ...(b ? [{ at: b.createdAt, label: `Commande créée avec ${fullName(b.provider)}` }] : []),
    ...(p?.paidAt ? [{ at: p.paidAt, label: 'Paiement autorisé (séquestre)' }] : []),
    ...(p?.releasedAt ? [{ at: p.releasedAt, label: 'Paiement libéré au jobber' }] : []),
    ...(b?.review ? [{ at: b.review.createdAt, label: `Avis ${b.review.rating}/5 déposé` }] : []),
    ...(audit || []).map((e) => ({ at: e.createdAt, label: `Admin : ${e.action}${e.reason ? ` (${e.reason})` : ''}`, by: e.actorLabel })),
  ].sort((x, y) => new Date(x.at) - new Date(y.at));

  const cancelBlocker = m.status !== 'OPEN'
    ? `Seule une mission publiée sans commande peut être annulée ici (état actuel : ${m.status})`
    : (b ? 'Une commande existe : l\'annulation a des conséquences financières (lot 2, Finance)' : null);

  res.json({
    mission: {
      ...m,
      // Access notes are only for the selected jobber: never sent here.
      accessInstructions: m.accessInstructions ? '[masqué]' : null,
      client: person(m.client),
      platform: m.corporateAgency ? { id: m.corporateAgency.id, label: m.corporateAgency.companyName, domain: m.corporateAgency.agencyDomain } : { id: 'jobber', label: 'Jobber' },
      corporateAgency: undefined,
      getMissionPriceCents: cents(m.getMissionPrice), getMissionPrice: undefined,
      offers: m.offers.map((o) => ({
        id: o.id, status: o.status, provider: person(o.provider), createdAt: o.createdAt, message: o.message,
        hourlyRateCents: cents(o.hourlyRate), hours: o.hours ?? m.estimatedHours, extraFees: o.extraFees,
        totalCents: cents(offerTotal(o, m.estimatedHours)), isAgencyQuote: !!o.sourceOfferId, refusalReason: o.refusalReason,
      })),
      booking: b && {
        id: b.id, status: b.status, scheduledDate: b.scheduledDate, hours: b.hours, createdAt: b.createdAt,
        hourlyRateCents: cents(b.hourlyRate), totalAmountCents: cents(b.totalAmount),
        client: person(b.client), provider: person(b.provider), review: b.review,
        payment: p && paymentView(p),
      },
      conversations: m.conversations.map((c) => ({ id: c.id, createdAt: c.createdAt, provider: person(c.provider), messages: c._count.messages })),
    },
    timeline,
    notes,
    audit,
    actions: { cancel: { allowed: !cancelBlocker, reason: cancelBlocker } },
  });
}));

function paymentView(p) {
  return {
    id: p.id, status: p.status, stripePaymentIntentId: p.stripePaymentIntentId,
    amountCents: cents(p.amount), platformFeeCents: cents(p.platformFee), managerFeeCents: cents(p.managerFee),
    providerFeeCents: cents(p.providerFee), providerPayoutCents: cents(p.providerPayout), agencyCommissionCents: cents(p.agencyCommission),
    feeWaived: p.feeWaived, paidAt: p.paidAt, releasedAt: p.releasedAt, createdAt: p.createdAt,
  };
}

router.post('/missions/:id/cancel', can('missions.cancel'), route(async (req, res) => {
  const { reason } = z.object({ reason: z.string().trim().min(3, 'Motif obligatoire') }).parse(req.body);
  const mission = await prisma.$transaction(async (tx) => {
    // Status + "no booking" in the same guarded update: a jobber booked in
    // the meantime makes this a 409, never a cancelled paid mission.
    const { count } = await tx.mission.updateMany({ where: { id: req.params.id, status: 'OPEN', booking: null }, data: { status: 'CANCELLED' } });
    if (!count) throw httpError(409, 'Annulation impossible : la mission n\'est plus publiée sans commande');
    await recordAudit(req, { action: 'mission.cancelled', permission: 'missions.cancel', objectType: 'MISSION', objectId: req.params.id, reason, diff: { status: { before: 'OPEN', after: 'CANCELLED' } } }, tx);
    return tx.mission.findUnique({ where: { id: req.params.id }, select: { id: true, status: true } });
  });
  res.json({ mission });
}));

// --- M03 Devis (offres jobbers et devis agence) ---

router.get('/quotes', can('missions.read'), route(async (req, res) => {
  const q = String(req.query.q || '').trim();
  const and = [dateRange(req.query)];
  if (req.query.status) and.push({ status: String(req.query.status) });
  if (req.query.kind === 'agency') and.push({ sourceOfferId: { not: null } });
  if (req.query.kind === 'jobber') and.push({ sourceOfferId: null });
  if (req.query.platform) and.push({ mission: platformWhere(req.query.platform) });
  if (q) and.push({ OR: [{ id: q }, { missionId: q }, { mission: { title: { contains: q, mode: 'insensitive' } } }, { provider: { email: { contains: q, mode: 'insensitive' } } }] });
  const where = { AND: and };
  const { page, pageSize, skip, take } = pagination(req.query);
  const { orderBy, sort } = sorting(req.query, { createdAt: (d) => ({ createdAt: d }) }, 'createdAt');
  const [total, offers] = await Promise.all([
    prisma.offer.count({ where }),
    prisma.offer.findMany({
      where, orderBy, skip, take,
      include: { provider: PERSON, mission: { select: { id: true, title: true, estimatedHours: true, client: PERSON, corporateAgency: { select: { companyName: true } } } } },
    }),
  ]);
  res.json({
    items: offers.map((o) => ({
      id: o.id, status: o.status, createdAt: o.createdAt, issuer: person(o.provider), recipient: person(o.mission.client),
      mission: { id: o.mission.id, title: o.mission.title }, platform: o.mission.corporateAgency?.companyName || 'Jobber',
      kind: o.sourceOfferId ? 'Devis agence' : 'Offre jobber',
      hourlyRateCents: cents(o.hourlyRate), hours: o.hours ?? o.mission.estimatedHours, totalCents: cents(offerTotal(o, o.mission.estimatedHours)),
    })),
    total, page, pageSize, sort,
    note: 'Montant = taux horaire × heures + frais optionnels. La base ne stocke ni HT/TVA ni versions de devis.',
  });
}));

// --- M04 Commandes (réservations) ---

router.get('/orders', can('missions.read'), route(async (req, res) => {
  const q = String(req.query.q || '').trim();
  const and = [dateRange(req.query)];
  if (req.query.status) and.push({ status: String(req.query.status) });
  if (req.query.paymentStatus) and.push({ payment: { status: String(req.query.paymentStatus) } });
  if (req.query.platform) and.push({ mission: platformWhere(req.query.platform) });
  if (q) and.push({ OR: [{ id: q }, { missionId: q }, { mission: { title: { contains: q, mode: 'insensitive' } } }] });
  const where = { AND: and };
  const { page, pageSize, skip, take } = pagination(req.query);
  const { orderBy, sort } = sorting(req.query, { createdAt: (d) => ({ createdAt: d }), scheduledDate: (d) => ({ scheduledDate: d }) }, 'createdAt');
  const [total, bookings] = await Promise.all([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where, orderBy, skip, take,
      include: { client: PERSON, provider: PERSON, payment: { select: { id: true, status: true, amount: true } }, mission: { select: { id: true, title: true, corporateAgency: { select: { companyName: true } } } } },
    }),
  ]);
  res.json({
    items: bookings.map((b) => ({
      id: b.id, status: b.status, createdAt: b.createdAt, scheduledDate: b.scheduledDate, mission: { id: b.mission.id, title: b.mission.title },
      platform: b.mission.corporateAgency?.companyName || 'Jobber', buyer: person(b.client), seller: person(b.provider),
      totalCents: cents(b.totalAmount), payment: b.payment && { id: b.payment.id, status: b.payment.status, amountCents: cents(b.payment.amount) },
    })),
    total, page, pageSize, sort,
  });
}));

module.exports = { router, paymentView, person, PERSON, platformWhere };
