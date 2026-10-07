const express = require('express');
const { z } = require('zod');
const prisma = require('../../config/prisma');
const { recordAudit, diffOf } = require('../../admin/audit');
const { invalidateRestrictions } = require('../../admin/restrictions');
const {
  cents, httpError, isMissingTable, can, route, pagination, sorting, dateRange, toCsv, EXPORT_LIMIT, fullName,
} = require('./helpers');

const router = express.Router();

// Roles are attributes of one identity (a person can be both demandeur and
// jobber), derived from what the account actually does.
function rolesOf(u) {
  const roles = [];
  if (u.role === 'ADMIN') roles.push('Admin');
  if (u.accountKind === 'COMPANY') roles.push(u.companyType === 'CORPORATE' ? 'Corporate' : 'Entreprise');
  if (u._count?.missions > 0) roles.push('Demandeur');
  if (u.accountKind !== 'COMPANY' && (u._count?.offers > 0 || u.providerProfile?._count?.categories > 0)) {
    roles.push(u.isProfessional ? 'Jobber pro' : 'Jobber particulier');
  }
  return roles;
}

function segmentWhere(segment) {
  const jobber = { accountKind: 'INDIVIDUAL', OR: [{ offers: { some: {} } }, { providerProfile: { categories: { some: {} } } }] };
  switch (segment) {
    case 'demandeurs': return { missions: { some: {} } };
    case 'jobbers': return jobber;
    case 'jobbers_pro': return { ...jobber, isProfessional: true };
    case 'jobbers_particuliers': return { ...jobber, isProfessional: false };
    case 'entreprises': return { accountKind: 'COMPANY', companyType: 'ENTREPRISE' };
    case 'corporate': return { accountKind: 'COMPANY', companyType: 'CORPORATE' };
    case 'admins': return { role: 'ADMIN' };
    default: return {};
  }
}

async function activeRestrictions(userIds) {
  try {
    const rows = await prisma.accountRestriction.findMany({ where: { userId: { in: userIds }, liftedAt: null } });
    return { ready: true, byUser: Object.fromEntries(rows.map((r) => [r.userId, r])) };
  } catch (err) {
    if (!isMissingTable(err)) throw err;
    return { ready: false, byUser: {} };
  }
}

const LIST_SELECT = {
  id: true, email: true, firstName: true, lastName: true, phone: true, role: true, accountKind: true, companyType: true,
  companyName: true, isProfessional: true, address: true, isEmailVerified: true, createdAt: true, updatedAt: true, agencyDomain: true,
  providerProfile: { select: { verificationStatus: true, ratingAverage: true, ratingCount: true, completedMissions: true, _count: { select: { categories: true } } } },
  _count: { select: { missions: true, offers: true } },
};

const SORTS = {
  createdAt: (d) => ({ createdAt: d }),
  updatedAt: (d) => ({ updatedAt: d }),
  lastName: (d) => ({ lastName: d }),
  email: (d) => ({ email: d }),
};

router.get('/users', can('users.read'), route(async (req, res) => {
  const q = String(req.query.q || '').trim();
  const text = { contains: q, mode: 'insensitive' };
  const and = [segmentWhere(req.query.segment), dateRange(req.query)];
  if (q) and.push({ OR: [{ id: q }, { email: text }, { firstName: text }, { lastName: text }, { companyName: text }, { phone: text }, { address: text }] });
  if (req.query.verification) and.push({ providerProfile: { verificationStatus: String(req.query.verification) } });
  if (req.query.suspended === 'true') {
    const { ready, byUser } = await activeRestrictions(undefined);
    if (!ready) throw httpError(503, 'Filtre « suspendus » indisponible avant la migration');
    and.push({ id: { in: Object.keys(byUser) } });
  }
  const where = { AND: and };
  const { orderBy, sort } = sorting(req.query, SORTS, 'createdAt');

  const mapRow = (u, restrictions) => ({
    id: u.id, name: u.companyName || fullName(u), email: u.email, phone: u.phone, roles: rolesOf(u),
    address: u.address, createdAt: u.createdAt, updatedAt: u.updatedAt, emailVerified: u.isEmailVerified,
    verification: u.providerProfile?.verificationStatus || null,
    missions: u._count.missions, offers: u._count.offers,
    rating: u.providerProfile?.ratingCount ? u.providerProfile.ratingAverage : null,
    ratingCount: u.providerProfile?.ratingCount || 0,
    suspended: restrictions.ready ? !!restrictions.byUser[u.id] : null,
  });

  if (req.query.format === 'csv') {
    if (!req.admin.permissions.has('exports.run')) throw httpError(403, 'Permission manquante : exports.run');
    const users = await prisma.user.findMany({ where, select: LIST_SELECT, orderBy, take: EXPORT_LIMIT });
    const restrictions = await activeRestrictions(users.map((u) => u.id));
    const rows = users.map((u) => mapRow(u, restrictions));
    await recordAudit(req, { action: 'export.users', permission: 'exports.run', objectType: 'USER', diff: { rows: rows.length, filters: req.query } });
    res.type('text/csv').send(toCsv([
      { label: 'ID', value: (r) => r.id }, { label: 'Nom', value: (r) => r.name }, { label: 'Email', value: (r) => r.email },
      { label: 'Téléphone', value: (r) => r.phone }, { label: 'Rôles', value: (r) => r.roles.join(', ') },
      { label: 'Adresse', value: (r) => r.address }, { label: 'Inscription (UTC)', value: (r) => r.createdAt },
      { label: 'Vérification', value: (r) => r.verification }, { label: 'Missions publiées', value: (r) => r.missions },
      { label: 'Offres envoyées', value: (r) => r.offers }, { label: 'Note', value: (r) => r.rating },
      { label: 'Suspendu', value: (r) => (r.suspended == null ? 'inconnu' : r.suspended ? 'oui' : 'non') },
    ], rows));
    return;
  }

  const { page, pageSize, skip, take } = pagination(req.query);
  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({ where, select: LIST_SELECT, orderBy, skip, take }),
  ]);
  const restrictions = await activeRestrictions(users.map((u) => u.id));
  res.json({ items: users.map((u) => mapRow(u, restrictions)), total, page, pageSize, sort });
}));

// Optional admin tables: answer null instead of failing the whole 360 view.
async function optional(promise) {
  try { return await promise; } catch (err) { if (isMissingTable(err)) return null; throw err; }
}

router.get('/users/:id', can('users.read'), route(async (req, res) => {
  const id = req.params.id;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      ...LIST_SELECT,
      avatarUrl: true, companySiret: true, professionalSiret: true, creditBalance: true, referralCode: true, referralEarned: true,
      agencyDomain: true, serviceRadiusKm: true, googleId: true,
      notifyPushNews: true, notifyEmailNews: true, notifyEmailPartners: true, notifySmsOffers: true,
      notifySmsCancellation: true, notifyPushActivity: true, notifyEmailActivity: true,
      providerProfile: {
        select: {
          verificationStatus: true, ratingAverage: true, ratingCount: true, completedMissions: true, walletBalance: true,
          radiusKm: true, payoutsEnabled: true, bankLast4: true, autoApply: true,
          categories: { select: { level: true, hourlyRate: true, category: { select: { name: true } } } },
          _count: { select: { categories: true } },
        },
      },
      subscriptions: { select: { id: true, family: true, plan: true, status: true, currentPeriodEnd: true, missionsUsedInPeriod: true, stripeSubscriptionId: true } },
    },
  });
  if (!user) throw httpError(404, 'Utilisateur introuvable');

  const bookingSelect = {
    id: true, status: true, scheduledDate: true, totalAmount: true, createdAt: true,
    mission: { select: { id: true, title: true } },
    client: { select: { id: true, firstName: true, lastName: true, email: true } },
    provider: { select: { id: true, firstName: true, lastName: true, email: true } },
    payment: { select: { id: true, status: true, amount: true, platformFee: true, providerPayout: true } },
  };

  const [missions, offers, bookingsAsClient, bookingsAsProvider, reviewsReceived, reviewsWritten, documents, contactMessages,
    restrictions, notes, audit, agencyStats] = await Promise.all([
    prisma.mission.findMany({ where: { clientId: id }, select: { id: true, title: true, status: true, createdAt: true, desiredDate: true, isDemoNational: true }, orderBy: { createdAt: 'desc' }, take: 50 }),
    prisma.offer.findMany({ where: { providerId: id }, select: { id: true, status: true, hourlyRate: true, createdAt: true, mission: { select: { id: true, title: true } } }, orderBy: { createdAt: 'desc' }, take: 50 }),
    prisma.booking.findMany({ where: { clientId: id }, select: bookingSelect, orderBy: { createdAt: 'desc' }, take: 50 }),
    prisma.booking.findMany({ where: { providerId: id }, select: bookingSelect, orderBy: { createdAt: 'desc' }, take: 50 }),
    prisma.review.findMany({ where: { targetId: id }, select: { id: true, rating: true, comment: true, createdAt: true, author: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { createdAt: 'desc' }, take: 50 }),
    prisma.review.findMany({ where: { authorId: id }, select: { id: true, rating: true, comment: true, createdAt: true, target: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { createdAt: 'desc' }, take: 50 }),
    prisma.verificationDocument.findMany({ where: { userId: id }, select: { id: true, type: true, status: true, createdAt: true, reviewedAt: true }, orderBy: { createdAt: 'desc' } }),
    prisma.contactMessage.findMany({ where: { senderId: id }, select: { id: true, subject: true, status: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 50 }),
    optional(prisma.accountRestriction.findMany({ where: { userId: id }, orderBy: { createdAt: 'desc' } })),
    optional(prisma.adminNote.findMany({ where: { objectType: 'USER', objectId: id }, orderBy: { createdAt: 'desc' } })),
    req.admin.permissions.has('audit.read')
      ? optional(prisma.auditEvent.findMany({ where: { objectType: 'USER', objectId: id }, orderBy: { createdAt: 'desc' }, take: 50 }))
      : Promise.resolve(undefined),
    user.companyType === 'CORPORATE' ? Promise.all([
      prisma.mission.count({ where: { corporateAgencyId: id } }),
      prisma.agencyEmployee.count({ where: { agencyId: id } }),
      prisma.invoice.count({ where: { agencyId: id } }),
      prisma.payment.aggregate({ where: { status: 'RELEASED', booking: { mission: { corporateAgencyId: id } } }, _sum: { agencyCommission: true, amount: true, platformFee: true } }),
    ]) : Promise.resolve(null),
  ]);

  const mapBooking = (b) => ({
    ...b, totalAmountCents: cents(b.totalAmount), totalAmount: undefined,
    payment: b.payment && {
      id: b.payment.id, status: b.payment.status, amountCents: cents(b.payment.amount),
      platformFeeCents: cents(b.payment.platformFee), providerPayoutCents: cents(b.payment.providerPayout),
    },
  });
  const pp = user.providerProfile;

  res.json({
    user: {
      ...user,
      name: user.companyName || fullName(user),
      roles: rolesOf(user),
      googleLinked: !!user.googleId, googleId: undefined,
      creditBalanceCents: cents(user.creditBalance), creditBalance: undefined,
      referralEarnedCents: cents(user.referralEarned), referralEarned: undefined,
      providerProfile: pp && {
        ...pp, walletBalanceCents: cents(pp.walletBalance), walletBalance: undefined,
        categories: pp.categories.map((c) => ({ name: c.category.name, level: c.level, hourlyRateCents: cents(c.hourlyRate) })),
      },
      suspension: restrictions ? restrictions.find((r) => !r.liftedAt) || null : undefined,
    },
    missions, offers: offers.map((o) => ({ ...o, hourlyRateCents: cents(o.hourlyRate), hourlyRate: undefined })),
    bookingsAsClient: bookingsAsClient.map(mapBooking),
    bookingsAsProvider: bookingsAsProvider.map(mapBooking),
    reviewsReceived, reviewsWritten, documents, contactMessages,
    restrictions, notes, audit,
    corporate: agencyStats && {
      missions: agencyStats[0], employees: agencyStats[1], invoices: agencyStats[2],
      releasedGrossCents: cents(agencyStats[3]._sum.amount || 0),
      releasedMarginCents: cents(agencyStats[3]._sum.agencyCommission || 0),
      releasedJobberRevenueCents: cents(agencyStats[3]._sum.platformFee || 0),
    },
  });
}));

// Contact details only. Email changes need a re-verification flow and stay
// out of this endpoint; `expectedUpdatedAt` rejects a stale edit instead of
// silently overwriting someone else's change.
router.patch('/users/:id', can('users.update'), route(async (req, res) => {
  const data = z.object({
    expectedUpdatedAt: z.string().min(1),
    reason: z.string().trim().min(3, 'Motif obligatoire'),
    changes: z.object({
      firstName: z.string().trim().min(1).optional(),
      lastName: z.string().trim().min(1).optional(),
      phone: z.string().trim().nullable().optional(),
      address: z.string().trim().nullable().optional(),
      companyName: z.string().trim().min(1).optional(),
    }).strict(),
  }).parse(req.body);
  if (!Object.keys(data.changes).length) throw httpError(400, 'Aucune modification');

  const before = await prisma.user.findUnique({ where: { id: req.params.id }, select: { firstName: true, lastName: true, phone: true, address: true, companyName: true, updatedAt: true, accountKind: true } });
  if (!before) throw httpError(404, 'Utilisateur introuvable');
  if (data.changes.companyName && before.accountKind !== 'COMPANY') throw httpError(400, 'Raison sociale réservée aux comptes entreprise');

  const updated = await prisma.$transaction(async (tx) => {
    const { count } = await tx.user.updateMany({
      where: { id: req.params.id, updatedAt: new Date(data.expectedUpdatedAt) },
      data: { ...data.changes, ...(data.changes.address !== undefined ? { lat: null, lng: null } : {}) },
    });
    if (!count) throw httpError(409, 'La fiche a été modifiée entre-temps. Rechargez-la avant d\'enregistrer.', { code: 'VERSION_CONFLICT' });
    const after = await tx.user.findUnique({ where: { id: req.params.id }, select: { firstName: true, lastName: true, phone: true, address: true, companyName: true, updatedAt: true } });
    const { updatedAt: _b, accountKind: _k, ...b } = before;
    const { updatedAt: _a, ...a } = after;
    await recordAudit(req, { action: 'user.updated', permission: 'users.update', objectType: 'USER', objectId: req.params.id, reason: data.reason, diff: diffOf(b, a) }, tx);
    return after;
  });
  res.json({ user: updated });
}));

router.post('/users/:id/suspend', can('users.suspend'), route(async (req, res) => {
  const { reason } = z.object({ reason: z.string().trim().min(3, 'Motif obligatoire') }).parse(req.body);
  const target = await prisma.user.findUnique({ where: { id: req.params.id }, select: { id: true, role: true } });
  if (!target) throw httpError(404, 'Utilisateur introuvable');
  if (target.role === 'ADMIN') throw httpError(409, 'Un administrateur se désactive depuis Administration > Administrateurs');

  const [restriction, openBookings, openMissions] = await prisma.$transaction(async (tx) => {
    const existing = await tx.accountRestriction.findFirst({ where: { userId: target.id, liftedAt: null } });
    if (existing) throw httpError(409, 'Ce compte est déjà suspendu');
    const created = await tx.accountRestriction.create({ data: { userId: target.id, reason, createdById: req.admin.user.id } });
    await recordAudit(req, { action: 'user.suspended', permission: 'users.suspend', objectType: 'USER', objectId: target.id, reason }, tx);
    return Promise.all([
      created,
      tx.booking.findMany({ where: { OR: [{ clientId: target.id }, { providerId: target.id }], status: { in: ['SCHEDULED', 'IN_PROGRESS', 'AWAITING_VALIDATION', 'DISPUTED'] } }, select: { id: true, status: true, mission: { select: { id: true, title: true } } } }),
      tx.mission.findMany({ where: { clientId: target.id, status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS'] } }, select: { id: true, title: true, status: true } }),
    ]);
  });
  invalidateRestrictions();
  // Suspension blocks the account; ongoing work stays visible here for follow-up.
  res.json({ restriction, toFollowUp: { bookings: openBookings, missions: openMissions } });
}));

router.post('/users/:id/reactivate', can('users.suspend'), route(async (req, res) => {
  const { reason } = z.object({ reason: z.string().trim().min(3, 'Motif obligatoire') }).parse(req.body);
  const restriction = await prisma.$transaction(async (tx) => {
    const active = await tx.accountRestriction.findFirst({ where: { userId: req.params.id, liftedAt: null } });
    if (!active) throw httpError(409, 'Ce compte n\'est pas suspendu');
    const lifted = await tx.accountRestriction.update({ where: { id: active.id }, data: { liftedAt: new Date(), liftedById: req.admin.user.id, liftReason: reason } });
    await recordAudit(req, { action: 'user.reactivated', permission: 'users.suspend', objectType: 'USER', objectId: req.params.id, reason }, tx);
    return lifted;
  });
  invalidateRestrictions();
  res.json({ restriction });
}));

// --- U03 Vérifications ---

const IDENTITY_DOC_TYPES = ['ID_CARD', 'PROOF_OF_ADDRESS', 'BANK_ACCOUNT'];

router.get('/verifications', can('verifications.read'), route(async (req, res) => {
  const where = {
    ...(req.query.status ? { status: String(req.query.status) } : {}),
    ...(req.query.type ? { type: String(req.query.type) } : {}),
    ...dateRange(req.query),
  };
  const { page, pageSize, skip, take } = pagination(req.query);
  const { orderBy, sort } = sorting(req.query, { createdAt: (d) => ({ createdAt: d }) }, 'createdAt');
  const [total, docs] = await Promise.all([
    prisma.verificationDocument.count({ where }),
    prisma.verificationDocument.findMany({
      where, orderBy, skip, take,
      select: { id: true, type: true, status: true, createdAt: true, reviewedAt: true, user: { select: { id: true, firstName: true, lastName: true, email: true, isProfessional: true } } },
    }),
  ]);
  res.json({ items: docs.map((d) => ({ ...d, user: { ...d.user, name: fullName(d.user) } })), total, page, pageSize, sort });
}));

// Documents are only reachable through this call, which needs a reason and
// leaves a trace — the list never carries the file URL.
router.post('/verifications/:id/open', can('verifications.read'), route(async (req, res) => {
  const { reason } = z.object({ reason: z.string().trim().min(3, 'Motif obligatoire') }).parse(req.body);
  const doc = await prisma.verificationDocument.findUnique({ where: { id: req.params.id }, select: { id: true, userId: true, fileUrl: true } });
  if (!doc) throw httpError(404, 'Document introuvable');
  await recordAudit(req, { action: 'document.viewed', permission: 'verifications.read', objectType: 'DOCUMENT', objectId: doc.id, reason });
  res.json({ fileUrl: doc.fileUrl });
}));

router.post('/verifications/:id/decision', can('verifications.decide'), route(async (req, res) => {
  const data = z.object({
    decision: z.enum(['APPROVED', 'REJECTED']),
    reason: z.string().trim().min(3, 'Motif obligatoire'),
  }).parse(req.body);

  const doc = await prisma.$transaction(async (tx) => {
    // Only a PENDING document can be decided: two admins clicking at once
    // can't both apply a decision.
    const { count } = await tx.verificationDocument.updateMany({
      where: { id: req.params.id, status: 'PENDING' },
      data: { status: data.decision, reviewedAt: new Date() },
    });
    if (!count) throw httpError(409, 'Ce document a déjà été traité ou n\'existe pas');
    const updated = await tx.verificationDocument.findUnique({ where: { id: req.params.id }, select: { id: true, userId: true, type: true, status: true, reviewedAt: true } });
    // Same badge rule as the web admin (verification.routes.js).
    if (IDENTITY_DOC_TYPES.includes(updated.type)) {
      if (data.decision === 'APPROVED') {
        const remaining = await tx.verificationDocument.count({ where: { userId: updated.userId, type: { in: IDENTITY_DOC_TYPES }, status: 'PENDING' } });
        if (!remaining) await tx.providerProfile.updateMany({ where: { userId: updated.userId }, data: { verificationStatus: 'APPROVED' } });
      } else {
        await tx.providerProfile.updateMany({ where: { userId: updated.userId }, data: { verificationStatus: 'REJECTED' } });
      }
    }
    await recordAudit(req, {
      action: 'document.decided', permission: 'verifications.decide', objectType: 'DOCUMENT', objectId: updated.id, reason: data.reason,
      diff: { status: { before: 'PENDING', after: data.decision }, userId: updated.userId, type: updated.type },
    }, tx);
    return updated;
  });
  res.json({ document: doc });
}));

// --- E01/E02 Entreprises et corporate ---

router.get('/companies', can('companies.read'), route(async (req, res) => {
  const type = req.query.type === 'CORPORATE' ? 'CORPORATE' : 'ENTREPRISE';
  const q = String(req.query.q || '').trim();
  const text = { contains: q, mode: 'insensitive' };
  const where = {
    accountKind: 'COMPANY', companyType: type,
    ...(q ? { OR: [{ companyName: text }, { email: text }, { companySiret: { contains: q } }, { agencyDomain: text }] } : {}),
  };
  const { page, pageSize, skip, take } = pagination(req.query);
  const { orderBy, sort } = sorting(req.query, { createdAt: (d) => ({ createdAt: d }), companyName: (d) => ({ companyName: d }) }, 'createdAt');
  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where, orderBy, skip, take,
      select: {
        id: true, companyName: true, companySiret: true, email: true, phone: true, address: true, agencyDomain: true, createdAt: true,
        firstName: true, lastName: true,
        _count: { select: { missions: true, agencyMissions: true, agencyEmployees: true } },
      },
    }),
  ]);
  const ids = rows.map((r) => r.id);
  const [spend, margins] = await Promise.all([
    prisma.payment.findMany({ where: { status: 'RELEASED', booking: { clientId: { in: ids } } }, select: { amount: true, booking: { select: { clientId: true } } } })
      .then((ps) => ps.reduce((acc, p) => { acc[p.booking.clientId] = (acc[p.booking.clientId] || 0) + p.amount; return acc; }, {})),
    type === 'CORPORATE' ? Promise.all(ids.map((id) => prisma.payment.aggregate({ where: { status: 'RELEASED', booking: { mission: { corporateAgencyId: id } } }, _sum: { agencyCommission: true, amount: true, platformFee: true } }).then((a) => [id, a._sum]))).then(Object.fromEntries) : {},
  ]);
  res.json({
    type,
    items: rows.map((r) => ({
      id: r.id, name: r.companyName, siret: r.companySiret, email: r.email, phone: r.phone, address: r.address, domain: r.agencyDomain,
      contact: fullName(r), createdAt: r.createdAt,
      missionsPosted: r._count.missions, agencyMissions: r._count.agencyMissions, employees: r._count.agencyEmployees,
      releasedSpendCents: cents(spend[r.id] || 0),
      ...(type === 'CORPORATE' ? {
        releasedVolumeCents: cents(margins[r.id]?.amount || 0),
        releasedMarginCents: cents(margins[r.id]?.agencyCommission || 0),
        releasedJobberRevenueCents: cents(margins[r.id]?.platformFee || 0),
      } : {}),
    })),
    total, page, pageSize, sort,
  });
}));

module.exports = router;
