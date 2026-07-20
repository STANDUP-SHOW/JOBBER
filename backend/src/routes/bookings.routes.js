const express = require('express');
const prisma = require('../config/prisma');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { OR: [{ clientId: req.user.id }, { providerId: req.user.id }] },
      include: {
        mission: { include: { category: true } },
        payment: true,
        review: true,
        provider: { select: { firstName: true, lastName: true } },
      },
      orderBy: { scheduledDate: 'desc' },
    });
    res.json({ bookings });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/start', requireAuth, async (req, res, next) => {
  try {
    const booking = await guardBooking(req);
    const updated = await prisma.booking.update({ where: { id: booking.id }, data: { status: 'IN_PROGRESS' } });
    await prisma.mission.update({ where: { id: booking.missionId }, data: { status: 'IN_PROGRESS' } });
    res.json({ booking: updated });
  } catch (err) { next(err); }
});

// Client marks the job done -> triggers escrow release (see payments.routes for the actual transfer)
router.patch('/:id/complete', requireAuth, async (req, res, next) => {
  try {
    const booking = await guardBooking(req, { clientOnly: true });
    const [updated] = await prisma.$transaction([
      prisma.booking.update({ where: { id: booking.id }, data: { status: 'COMPLETED' } }),
      prisma.mission.update({ where: { id: booking.missionId }, data: { status: 'COMPLETED' } }),
    ]);
    res.json({ booking: updated, next: 'Appelez POST /api/payments/:bookingId/release pour verser le prestataire' });
  } catch (err) { next(err); }
});

async function guardBooking(req, { clientOnly } = {}) {
  const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
  if (!booking) { const e = new Error('Réservation introuvable'); e.status = 404; e.expose = true; throw e; }
  const isParty = booking.clientId === req.user.id || booking.providerId === req.user.id;
  if (!isParty) { const e = new Error('Non autorisé'); e.status = 403; e.expose = true; throw e; }
  if (clientOnly && booking.clientId !== req.user.id) { const e = new Error('Seul le client peut valider la mission'); e.status = 403; e.expose = true; throw e; }
  return booking;
}

module.exports = router;
