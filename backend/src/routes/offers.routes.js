const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const createOfferSchema = z.object({
  missionId: z.string(),
  hourlyRate: z.number().positive(),
});

// Apply to a mission ("postuler") — any account can candidater, including
// the mission's own client (blocked below) if it happens to overlap.
router.post('/', requireAuth, async (req, res, next) => {
  try {
    if (req.user.accountKind === 'COMPANY') {
      return res.status(403).json({ error: 'Un compte entreprise ne peut pas postuler aux missions' });
    }
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
      },
    });

    // No conversation here on purpose — manager and jobber can only message
    // each other once a booking is actually paid (see the Stripe webhook's
    // payment_intent.amount_capturable_updated handler), never before.

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

// Standard fee: Jobber (the platform) keeps a flat 4€ per mission, split
// 2€ added to what the manager pays and 2€ held back from what the jobber
// receives. A manager subscription can waive the manager's 2€ share (up to
// their plan's monthly mission quota) — the jobber's 2€ share is unaffected
// either way, that's not what the subscription is for.
//
// Company accounts (ENTREPRISE/CORPORATE) use a different, simpler model:
// a flat 10€ fee on the company's side only — the jobber pays nothing.
// Their subscription tiers waive that 10€ the same way MANAGER_BOSS/HOLDER
// waive the individual 2€, just with their own per-plan quota.
const MANAGER_FEE = 2;
const PROVIDER_FEE = 2;
const ENTERPRISE_MANAGER_FEE = 10;
const PLAN_LIMITS = {
  MANAGER_BOSS: 10, MANAGER_HOLDER: Infinity,
  ENTERPRISE_20: 20, ENTERPRISE_50: 50, ENTERPRISE_UNLIMITED: Infinity,
};

// Mission owner accepts an offer -> creates Booking, marks mission ASSIGNED, rejects other offers
router.post('/:id/accept', requireAuth, async (req, res, next) => {
  try {
    const offer = await prisma.offer.findUnique({ where: { id: req.params.id }, include: { mission: true } });
    if (!offer) return res.status(404).json({ error: 'Offre introuvable' });
    if (offer.mission.clientId !== req.user.id) return res.status(403).json({ error: 'Non autorisé' });
    if (offer.status !== 'PENDING') return res.status(400).json({ error: 'Cette offre n\'est plus disponible' });

    const totalAmount = round2(offer.hourlyRate * offer.mission.estimatedHours);
    const isCompanyClient = req.user.accountKind === 'COMPANY';
    const providerFee = isCompanyClient ? 0 : PROVIDER_FEE;

    const subscription = await prisma.subscription.findUnique({ where: { userId: req.user.id } });
    let managerFee = isCompanyClient ? ENTERPRISE_MANAGER_FEE : MANAGER_FEE;
    let feeWaived = false;
    let quotaExceeded = false;
    const subscriptionActive = subscription?.status === 'ACTIVE' && subscription.currentPeriodEnd > new Date();
    if (subscriptionActive) {
      if (subscription.missionsUsedInPeriod < PLAN_LIMITS[subscription.plan]) {
        managerFee = 0;
        feeWaived = true;
      } else {
        quotaExceeded = true;
      }
    }

    const chargeAmount = round2(totalAmount + managerFee);
    const providerPayout = round2(totalAmount - providerFee);

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
          payment: {
            create: {
              amount: chargeAmount,
              platformFee: round2(managerFee + providerFee),
              managerFee,
              providerFee,
              feeWaived,
              providerPayout,
            },
          },
        },
      }),
      prisma.mission.update({ where: { id: offer.missionId }, data: { status: 'ASSIGNED' } }),
      prisma.offer.update({ where: { id: offer.id }, data: { status: 'ACCEPTED' } }),
      prisma.offer.updateMany({
        where: { missionId: offer.missionId, id: { not: offer.id }, status: 'PENDING' },
        data: { status: 'REJECTED' },
      }),
      ...(feeWaived
        ? [prisma.subscription.update({ where: { userId: req.user.id }, data: { missionsUsedInPeriod: { increment: 1 } } })]
        : []),
    ]);

    res.json({ booking, feeWaived, quotaExceeded, plan: subscription?.plan || null });
  } catch (err) {
    next(err);
  }
});

function round2(n) { return Math.round(n * 100) / 100; }

module.exports = router;
