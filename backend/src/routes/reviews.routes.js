const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const reviewSchema = z.object({
  bookingId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

// Reviews are only allowed after payment release, so ratings stay
// trustworthy — certified only once the mission was actually done and paid.
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const data = reviewSchema.parse(req.body);
    const booking = await prisma.booking.findUnique({ where: { id: data.bookingId }, include: { payment: true } });
    if (!booking) return res.status(404).json({ error: 'Réservation introuvable' });
    if (booking.status !== 'COMPLETED' || booking.payment?.status !== 'RELEASED') {
      return res.status(400).json({ error: 'La mission doit être terminée et payée avant de laisser un avis' });
    }

    const isClient = booking.clientId === req.user.id;
    const isProvider = booking.providerId === req.user.id;
    if (!isClient && !isProvider) return res.status(403).json({ error: 'Non autorisé' });

    const targetId = isClient ? booking.providerId : booking.clientId;

    const review = await prisma.review.create({
      data: { bookingId: booking.id, authorId: req.user.id, targetId, rating: data.rating, comment: data.comment },
    });

    if (isClient) {
      const agg = await prisma.review.aggregate({
        where: { target: { providerProfile: { isNot: null } }, targetId },
        _avg: { rating: true },
        _count: true,
      });
      await prisma.providerProfile.update({
        where: { userId: targetId },
        data: { ratingAverage: agg._avg.rating || data.rating, ratingCount: agg._count },
      });
    }

    res.status(201).json({ review });
  } catch (err) {
    if (err.code === 'P2002') { err.status = 409; err.expose = true; err.message = 'Un avis existe déjà pour cette réservation'; }
    if (err.name === 'ZodError') { err.status = 400; err.expose = true; err.message = err.errors[0].message; }
    next(err);
  }
});

router.get('/user/:userId', async (req, res, next) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { targetId: req.params.userId },
      include: { author: { select: { id: true, firstName: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ reviews });
  } catch (err) { next(err); }
});

module.exports = router;
