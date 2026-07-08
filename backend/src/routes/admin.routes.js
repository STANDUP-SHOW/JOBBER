const express = require('express');
const prisma = require('../config/prisma');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireRole('ADMIN'));

router.get('/stats', async (req, res, next) => {
  try {
    const [
      totalUsers, totalClients, totalProviders,
      missionsByStatus, bookingsByStatus,
      revenueAgg, pendingVerifications,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'CLIENT' } }),
      prisma.user.count({ where: { role: 'PROVIDER' } }),
      prisma.mission.groupBy({ by: ['status'], _count: true }),
      prisma.booking.groupBy({ by: ['status'], _count: true }),
      prisma.payment.aggregate({ where: { status: 'RELEASED' }, _sum: { platformFee: true, amount: true } }),
      prisma.verificationDocument.count({ where: { status: 'PENDING' } }),
    ]);

    res.json({
      totalUsers,
      totalClients,
      totalProviders,
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

module.exports = router;
