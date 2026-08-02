const express = require('express');
const prisma = require('../config/prisma');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireRole('ADMIN'));

router.get('/stats', async (req, res, next) => {
  try {
    const [
      totalUsers, totalActiveJobbers, totalMissionPosters,
      missionsByStatus, bookingsByStatus,
      revenueAgg, pendingVerifications,
    ] = await Promise.all([
      prisma.user.count(),
      // Every account can candidater, but "active jobber" = has picked at least one category
      prisma.user.count({ where: { providerProfile: { categories: { some: {} } } } }),
      prisma.mission.findMany({ distinct: ['clientId'], select: { clientId: true } }).then((r) => r.length),
      prisma.mission.groupBy({ by: ['status'], _count: true }),
      prisma.booking.groupBy({ by: ['status'], _count: true }),
      prisma.payment.aggregate({ where: { status: 'RELEASED' }, _sum: { platformFee: true, amount: true } }),
      prisma.verificationDocument.count({ where: { status: 'PENDING' } }),
    ]);

    res.json({
      totalUsers,
      totalActiveJobbers,
      totalMissionPosters,
      missionsByStatus: Object.fromEntries(missionsByStatus.map((m) => [m.status, m._count])),
      bookingsByStatus: Object.fromEntries(bookingsByStatus.map((b) => [b.status, b._count])),
      platformRevenue: revenueAgg._sum.platformFee || 0,
      grossVolume: revenueAgg._sum.amount || 0,
      pendingVerifications,
    });
  } catch (err) { next(err); }
});

router.get('/users', async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, firstName: true, lastName: true, email: true, role: true, createdAt: true,
        providerProfile: { select: { verificationStatus: true, ratingAverage: true, completedMissions: true, walletBalance: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ users });
  } catch (err) { next(err); }
});

// --- Nous contacter — Jobber platform's own inbox (agencyId null) ---

router.get('/contact-messages', async (req, res, next) => {
  try {
    const contactMessages = await prisma.contactMessage.findMany({
      where: { agencyId: null },
      include: { sender: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ contactMessages });
  } catch (err) { next(err); }
});

router.get('/contact-messages/:id', async (req, res, next) => {
  try {
    const contactMessage = await prisma.contactMessage.findFirst({
      where: { id: req.params.id, agencyId: null },
      include: { sender: { select: { id: true, firstName: true, lastName: true } } },
    });
    if (!contactMessage) return res.status(404).json({ error: 'Message introuvable' });
    res.json({ contactMessage });
  } catch (err) { next(err); }
});

router.patch('/contact-messages/:id', async (req, res, next) => {
  try {
    const status = ['NEW', 'READ', 'REPLIED'].includes(req.body.status) ? req.body.status : undefined;
    if (!status) return res.status(400).json({ error: 'Statut invalide' });
    const { count } = await prisma.contactMessage.updateMany({ where: { id: req.params.id, agencyId: null }, data: { status } });
    if (!count) return res.status(404).json({ error: 'Message introuvable' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// --- Membres — directory with search, kind filter, and per-member activity stats ---

const MEMBER_PAGE_SIZE = 20;

// "Manager"/"Jobber"/"Les deux" are derived from actual activity (has posted
// missions vs. has sent offers) rather than a stored field, since every
// individual account can do both — there's no separate "role" a person picks.
function memberKindWhere(kind) {
  if (kind === 'ENTREPRISE') return { accountKind: 'COMPANY', companyType: 'ENTREPRISE' };
  if (kind === 'CORPORATE') return { accountKind: 'COMPANY', companyType: 'CORPORATE' };
  if (kind === 'MANAGER') return { accountKind: 'INDIVIDUAL', missions: { some: {} }, offers: { none: {} } };
  if (kind === 'JOBBER') return { accountKind: 'INDIVIDUAL', offers: { some: {} }, missions: { none: {} } };
  if (kind === 'BOTH') return { accountKind: 'INDIVIDUAL', missions: { some: {} }, offers: { some: {} } };
  return {};
}

// Stats that need a Booking/Review/Payment join — kept separate from the
// list query's cheap `_count` (missions published / offers sent) so it's
// only computed for the page of members actually being displayed.
async function memberActivityStats(userId) {
  const [missionsCancelled, bookingsAsProvider, positiveReviews, missionsPaid, revenueAgg] = await Promise.all([
    prisma.mission.count({ where: { clientId: userId, status: 'CANCELLED' } }),
    prisma.booking.groupBy({ by: ['status'], where: { providerId: userId }, _count: true }),
    prisma.review.count({ where: { targetId: userId, rating: { gte: 4 } } }),
    prisma.payment.count({ where: { status: 'RELEASED', booking: { providerId: userId } } }),
    prisma.payment.aggregate({ where: { status: 'RELEASED', booking: { providerId: userId } }, _sum: { providerPayout: true } }),
  ]);
  const missionsCompleted = bookingsAsProvider.find((b) => b.status === 'COMPLETED')?._count || 0;
  const bookingsCancelled = bookingsAsProvider.find((b) => b.status === 'CANCELLED')?._count || 0;
  return {
    missionsCompleted,
    missionsCancelled: missionsCancelled + bookingsCancelled,
    positiveReviews,
    missionsPaid,
    revenue: revenueAgg._sum.providerPayout || 0,
  };
}

const MEMBER_SELECT = {
  id: true, firstName: true, lastName: true, email: true, phone: true, avatarUrl: true, address: true,
  accountKind: true, companyType: true, companyName: true, companySiret: true, professionalSiret: true,
  isProfessional: true, createdAt: true,
  providerProfile: { select: { verificationStatus: true, ratingAverage: true, ratingCount: true } },
};

router.get('/members', async (req, res, next) => {
  try {
    const { search, kind } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const where = {
      ...memberKindWhere(kind),
      ...(search ? {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { companyName: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    };

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: { ...MEMBER_SELECT, _count: { select: { missions: true, offers: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * MEMBER_PAGE_SIZE,
        take: MEMBER_PAGE_SIZE,
      }),
    ]);

    const members = await Promise.all(users.map(async ({ _count, ...u }) => ({
      ...u,
      missionsPublished: _count.missions,
      offersSent: _count.offers,
      ...(await memberActivityStats(u.id)),
    })));

    res.json({ members, total, page, pageSize: MEMBER_PAGE_SIZE });
  } catch (err) { next(err); }
});

router.get('/members/:id', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        ...MEMBER_SELECT,
        role: true,
        providerProfile: {
          select: {
            verificationStatus: true, ratingAverage: true, ratingCount: true, completedMissions: true, walletBalance: true,
            categories: { select: { category: { select: { name: true, icon: true } }, level: true, hourlyRate: true } },
          },
        },
        missions: { select: { id: true, title: true, status: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 10 },
        offers: {
          select: { id: true, hourlyRate: true, status: true, createdAt: true, mission: { select: { title: true } } },
          orderBy: { createdAt: 'desc' }, take: 10,
        },
        reviewsReceived: {
          select: { rating: true, comment: true, createdAt: true, author: { select: { firstName: true } } },
          orderBy: { createdAt: 'desc' }, take: 10,
        },
      },
    });
    if (!user) return res.status(404).json({ error: 'Membre introuvable' });

    const [missionsPublished, offersSent, activity] = await Promise.all([
      prisma.mission.count({ where: { clientId: user.id } }),
      prisma.offer.count({ where: { providerId: user.id } }),
      memberActivityStats(user.id),
    ]);

    res.json({ member: { ...user, missionsPublished, offersSent, ...activity } });
  } catch (err) { next(err); }
});

module.exports = router;
