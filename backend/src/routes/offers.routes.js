const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const createOfferSchema = z.object({
  missionId: z.string(),
  hourlyRate: z.number().positive(),
  message: z.string().optional(),
});

// Apply to a mission ("postuler") — any account can candidater, including
// the mission's own client (blocked below) if it happens to overlap.
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const data = createOfferSchema.parse(req.body);
    const mission = await prisma.mission.findUnique({ where: { id: data.missionId } });
    if (!mission || mission.status !== 'OPEN') {
      return res.status(400).json({ error: 'Cette mission n\'accepte plus de candidatures' });
    }
    if (mission.clientId === req.user.id) {
      return res.status(400).json({ error: 'Vous ne pouvez pas postuler à votre propre mission' });
    }

    const offer = await prisma.offer.create({
      data: {
        missionId: data.missionId,
        providerId: req.user.id,
        hourlyRate: data.hourlyRate,
        message: data.message,
      },
    });

    // Open (or reuse) a conversation tied to this mission/provider pair
    await prisma.conversation.upsert({
      where: { missionId_providerId: { missionId: data.missionId, providerId: req.user.id } },
      update: {},
      create: { missionId: data.missionId, clientId: mission.clientId, providerId: req.user.id },
    });

    res.status(201).json({ offer });
  } catch (err) {
    if (err.code === 'P2002') { err.status = 409; err.expose = true; err.message = 'Vous avez déjà postulé à cette mission'; }
    if (err.name === 'ZodError') { err.status = 400; err.expose = true; err.message = err.errors[0].message; }
    next(err);
  }
});

// List my own candidatures ("Mes offres" — missions I've applied to, with my rate)
router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const offers = await prisma.offer.findMany({
      where: { providerId: req.user.id },
      include: {
        mission: {
          select: {
            id: true, title: true, address: true, status: true, desiredDate: true, estimatedHours: true,
            category: { select: { name: true, icon: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ offers });
  } catch (err) { next(err); }
});

// Mission owner accepts an offer -> creates Booking, marks mission ASSIGNED, rejects other offers
router.post('/:id/accept', requireAuth, async (req, res, next) => {
  try {
    const offer = await prisma.offer.findUnique({ where: { id: req.params.id }, include: { mission: true } });
    if (!offer) return res.status(404).json({ error: 'Offre introuvable' });
    if (offer.mission.clientId !== req.user.id) return res.status(403).json({ error: 'Non autorisé' });
    if (offer.status !== 'PENDING') return res.status(400).json({ error: 'Cette offre n\'est plus disponible' });

    const totalAmount = round2(offer.hourlyRate * offer.mission.estimatedHours);

    const [booking] = await prisma.$transaction([
      prisma.booking.create({
        data: {
          missionId: offer.missionId,
          offerId: offer.id,
          clientId: req.user.id,
          providerId: offer.providerId,
          scheduledDate: offer.mission.desiredDate,
          hours: offer.mission.estimatedHours,
          hourlyRate: offer.hourlyRate,
          totalAmount,
          payment: { create: { amount: totalAmount, platformFee: round2(totalAmount * 0.2), providerPayout: round2(totalAmount * 0.8) } },
        },
      }),
      prisma.mission.update({ where: { id: offer.missionId }, data: { status: 'ASSIGNED' } }),
      prisma.offer.update({ where: { id: offer.id }, data: { status: 'ACCEPTED' } }),
      prisma.offer.updateMany({
        where: { missionId: offer.missionId, id: { not: offer.id }, status: 'PENDING' },
        data: { status: 'REJECTED' },
      }),
    ]);

    res.json({ booking });
  } catch (err) {
    next(err);
  }
});

function round2(n) { return Math.round(n * 100) / 100; }

module.exports = router;
