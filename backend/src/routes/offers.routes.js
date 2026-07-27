const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Optional paid options a jobber can add on top of their hourly rate when
// applying to a mission — e.g. travel costs, vehicle/fuel/consumables,
// waste-disposal fees. Fixed catalog so amounts stay auditable; jobbers
// pick which apply and fill in their own amount for each.
const EXTRA_FEE_TYPES = {
  displacement: 'Frais de route - Déplacement',
  vehicle: 'Frais de mise à disposition du véhicule requis',
  fuel: 'Frais de carburant',
  consumables: 'Frais de consommables utilisés (produits, cartons)',
  equipment: 'Frais de matériel (location...)',
  wasteDisposal: 'Frais de déchetterie',
};

const extraFeeSchema = z.object({
  key: z.enum(Object.keys(EXTRA_FEE_TYPES)),
  amount: z.number().positive(),
});

const createOfferSchema = z.object({
  missionId: z.string(),
  hourlyRate: z.number().positive(),
  extraFees: z.array(extraFeeSchema).optional().default([]),
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

    // Labels are resolved server-side from the fixed catalog rather than trusted
    // from the client, so a tampered payload can't inject arbitrary text.
    const extraFees = data.extraFees.map((f) => ({ key: f.key, label: EXTRA_FEE_TYPES[f.key], amount: f.amount }));

    const offer = await prisma.offer.create({
      data: {
        missionId: data.missionId,
        providerId: req.user.id,
        hourlyRate: data.hourlyRate,
        extraFees: extraFees.length > 0 ? extraFees : undefined,
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

// "Offres reçues" — every candidature received across all of my own posted
// missions, consolidated in one list instead of having to open each mission
// individually to compare offers.
router.get('/received', requireAuth, async (req, res, next) => {
  try {
    const offers = await prisma.offer.findMany({
      where: { mission: { clientId: req.user.id }, status: 'PENDING' },
      include: {
        mission: {
          select: {
            id: true, title: true, address: true, status: true, desiredDate: true, estimatedHours: true,
            category: { select: { name: true, icon: true } },
          },
        },
        provider: {
          select: {
            id: true, firstName: true, lastName: true, avatarUrl: true,
            providerProfile: { select: { ratingAverage: true, ratingCount: true, completedMissions: true, verificationStatus: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ offers });
  } catch (err) { next(err); }
});

// Standard fee: Jobber (the platform) keeps a flat 5€ per mission, split
// 2,50€ added to what the manager pays and 2,50€ held back from what the
// jobber receives. A MANAGER-family subscription can waive the manager's
// share (up to their plan's monthly mission quota); a JOBBER-family
// subscription independently waives the jobber's share up to *its* quota —
// an individual account can hold one of each at once (see Subscription's
// @@unique([userId, family])).
//
// Company accounts (ENTREPRISE/CORPORATE) use a different, simpler model:
// a flat 10€ fee on the company's side only — the jobber pays nothing.
// Their subscription tiers waive that 10€ the same way MANAGER_BOSS/HOLDER
// waive the individual fee, just with their own per-plan quota.
const MANAGER_FEE = 2.5;
const PROVIDER_FEE = 2.5;
const ENTERPRISE_MANAGER_FEE = 10;
const PLAN_LIMITS = {
  MANAGER_BOSS: 10, MANAGER_HOLDER: Infinity,
  ENTERPRISE_20: 20, ENTERPRISE_50: 50, ENTERPRISE_UNLIMITED: Infinity,
  JOBBER_SILVER: 10, JOBBER_GOLD: 20, JOBBER_PLATINUM: Infinity,
};

// Mission owner accepts an offer -> creates Booking, marks mission ASSIGNED, rejects other offers
router.post('/:id/accept', requireAuth, async (req, res, next) => {
  try {
    const offer = await prisma.offer.findUnique({ where: { id: req.params.id }, include: { mission: true } });
    if (!offer) return res.status(404).json({ error: 'Offre introuvable' });
    if (offer.mission.clientId !== req.user.id) return res.status(403).json({ error: 'Non autorisé' });
    if (offer.status !== 'PENDING') return res.status(400).json({ error: 'Cette offre n\'est plus disponible' });

    const extraFeesTotal = (offer.extraFees || []).reduce((sum, f) => sum + f.amount, 0);

    // A "Mission Agence" offer — the corporate agency itself, quoting its
    // own real client directly — never carries Jobber's platform fee, and
    // may have revised the requested hours upward (offer.hours). Every
    // other offer (a jobber applying on the open marketplace) keeps the
    // standard manager/provider fee logic below, using the mission's own
    // estimatedHours as always.
    const isAgenceOffer = !!offer.mission.corporateAgencyId && offer.providerId === offer.mission.corporateAgencyId;
    const hours = isAgenceOffer ? (offer.hours ?? offer.mission.estimatedHours) : offer.mission.estimatedHours;
    const totalAmount = round2(offer.hourlyRate * hours + extraFeesTotal);

    if (isAgenceOffer) {
      const [booking] = await prisma.$transaction([
        prisma.booking.create({
          data: {
            missionId: offer.missionId,
            offerId: offer.id,
            clientId: req.user.id,
            providerId: offer.providerId,
            scheduledDate: offer.mission.desiredDate,
            hours,
            hourlyRate: offer.hourlyRate,
            totalAmount,
            status: 'SCHEDULED',
            payment: {
              create: {
                amount: totalAmount, platformFee: 0, managerFee: 0, providerFee: 0,
                feeWaived: true, providerPayout: totalAmount, status: 'HELD_IN_ESCROW',
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
      ]);
      return res.status(201).json({ booking, feeWaived: true, quotaExceeded: false, plan: null, providerFeeWaived: false });
    }

    const isCompanyClient = req.user.accountKind === 'COMPANY';

    const [managerSub, providerSub] = await Promise.all([
      prisma.subscription.findFirst({ where: { userId: req.user.id, family: 'MANAGER' } }),
      isCompanyClient ? null : prisma.subscription.findFirst({ where: { userId: offer.providerId, family: 'JOBBER' } }),
    ]);

    let managerFee = isCompanyClient ? ENTERPRISE_MANAGER_FEE : MANAGER_FEE;
    let feeWaived = false;
    let quotaExceeded = false;
    const managerSubActive = managerSub?.status === 'ACTIVE' && managerSub.currentPeriodEnd > new Date();
    if (managerSubActive) {
      if (managerSub.missionsUsedInPeriod < PLAN_LIMITS[managerSub.plan]) {
        managerFee = 0;
        feeWaived = true;
      } else {
        quotaExceeded = true;
      }
    }

    let providerFee = isCompanyClient ? 0 : PROVIDER_FEE;
    let providerFeeWaived = false;
    const providerSubActive = providerSub?.status === 'ACTIVE' && providerSub.currentPeriodEnd > new Date();
    if (providerSubActive && providerSub.missionsUsedInPeriod < PLAN_LIMITS[providerSub.plan]) {
      providerFee = 0;
      providerFeeWaived = true;
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
        ? [prisma.subscription.update({ where: { id: managerSub.id }, data: { missionsUsedInPeriod: { increment: 1 } } })]
        : []),
      ...(providerFeeWaived
        ? [prisma.subscription.update({ where: { id: providerSub.id }, data: { missionsUsedInPeriod: { increment: 1 } } })]
        : []),
    ]);

    res.json({ booking, feeWaived, quotaExceeded, plan: managerSub?.plan || null, providerFeeWaived });
  } catch (err) {
    next(err);
  }
});

function round2(n) { return Math.round(n * 100) / 100; }

module.exports = router;
