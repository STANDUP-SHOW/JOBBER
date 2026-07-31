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

// Jobber marks the work done — puts the ball in the client's court to
// validate (see /:id/complete below) rather than closing the booking
// outright, so a jobber can't unilaterally trigger payment release.
router.patch('/:id/mark-done', requireAuth, async (req, res, next) => {
  try {
    const booking = await guardBooking(req, { providerOnly: true });
    if (booking.status !== 'IN_PROGRESS') {
      return res.status(400).json({ error: 'Cette mission doit être en cours pour être marquée terminée' });
    }
    const updated = await prisma.booking.update({ where: { id: booking.id }, data: { status: 'AWAITING_VALIDATION' } });
    res.json({ booking: updated });
  } catch (err) { next(err); }
});

// Client validates the jobber's declared completion -> triggers escrow release (see payments.routes for the actual transfer)
router.patch('/:id/complete', requireAuth, async (req, res, next) => {
  try {
    const booking = await guardBooking(req, { clientOnly: true });
    if (booking.status !== 'AWAITING_VALIDATION') {
      return res.status(400).json({ error: 'Le jobber doit d\'abord marquer la mission comme terminée' });
    }
    const [updated] = await prisma.$transaction([
      prisma.booking.update({ where: { id: booking.id }, data: { status: 'COMPLETED' } }),
      prisma.mission.update({ where: { id: booking.missionId }, data: { status: 'COMPLETED' } }),
    ]);
    res.json({ booking: updated, next: 'Appelez POST /api/payments/:bookingId/release pour verser le prestataire' });
  } catch (err) { next(err); }
});

async function guardBooking(req, { clientOnly, providerOnly } = {}) {
  const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
  if (!booking) { const e = new Error('Réservation introuvable'); e.status = 404; e.expose = true; throw e; }
  const isParty = booking.clientId === req.user.id || booking.providerId === req.user.id;
  if (!isParty) { const e = new Error('Non autorisé'); e.status = 403; e.expose = true; throw e; }
  if (clientOnly && booking.clientId !== req.user.id) { const e = new Error('Seul le client peut valider la mission'); e.status = 403; e.expose = true; throw e; }
  if (providerOnly && booking.providerId !== req.user.id) { const e = new Error('Seul le jobber peut marquer la mission comme terminée'); e.status = 403; e.expose = true; throw e; }
  return booking;
}

module.exports = router;
