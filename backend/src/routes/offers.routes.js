const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { requireAuth } = require('../middleware/auth');
const { finalizeBooking, round2 } = require('../services/bookingService');
const { notifyBookingAccepted } = require('../services/emailService');

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

const slotSchema = z.object({ date: z.string(), startTime: z.string() });

const createOfferSchema = z.object({
  missionId: z.string(),
  hourlyRate: z.number().positive(),
  extraFees: z.array(extraFeeSchema).optional().default([]),
  // Alternative date/time slots the jobber proposes instead of the client's
  // originally requested date — only meaningful (and only accepted below)
  // when the mission itself is datesFlexible.
  proposedSlots: z.array(slotSchema).max(2).optional(),
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
    if (data.proposedSlots?.length && !mission.datesFlexible) {
      return res.status(400).json({ error: 'Les dates ne sont pas flexibles' });
    }
    if (mission.requiredBadges?.includes('PRO')) {
      const candidate = await prisma.user.findUnique({ where: { id: req.user.id }, select: { isProfessional: true } });
      if (!candidate?.isProfessional) {
        return res.status(403).json({ error: 'Cette mission est réservée aux jobbers professionnels (badge PRO)' });
      }
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
        proposedSlots: data.proposedSlots?.length ? data.proposedSlots : undefined,
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
            lat: true, lng: true, corporateAgencyId: true,
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
            lat: true, lng: true, corporateAgencyId: true,
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

const chosenSlotSchema = z.object({ date: z.string(), startTime: z.string(), scheduledDate: z.string() });

// Mission owner accepts an offer -> creates Booking, marks mission ASSIGNED, rejects other offers
router.post('/:id/accept', requireAuth, async (req, res, next) => {
  try {
    const offer = await prisma.offer.findUnique({ where: { id: req.params.id }, include: { mission: true } });
    if (!offer) return res.status(404).json({ error: 'Offre introuvable' });
    if (offer.mission.clientId !== req.user.id) return res.status(403).json({ error: 'Non autorisé' });
    if (offer.status !== 'PENDING') return res.status(400).json({ error: 'Cette offre n\'est plus disponible' });

    // When the jobber proposed alternative slots (mission was datesFlexible
    // and they declined the client's original date), the client must pick
    // one here — it becomes the mission's actual date/time going forward.
    let mission = offer.mission;
    if (offer.proposedSlots?.length) {
      const parsed = chosenSlotSchema.safeParse(req.body.chosenSlot);
      if (!parsed.success) return res.status(400).json({ error: 'Veuillez choisir un créneau proposé par le jobber' });
      const chosenSlot = parsed.data;
      const isValidSlot = offer.proposedSlots.some((s) => s.date === chosenSlot.date && s.startTime === chosenSlot.startTime);
      if (!isValidSlot) return res.status(400).json({ error: 'Créneau invalide' });

      [mission] = await prisma.$transaction([
        prisma.mission.update({ where: { id: offer.missionId }, data: { desiredDate: new Date(chosenSlot.scheduledDate) } }),
        prisma.offer.update({ where: { id: offer.id }, data: { chosenSlot } }),
      ]);
    }

    const extraFeesTotal = (offer.extraFees || []).reduce((sum, f) => sum + f.amount, 0);

    // A "Mission Agence" offer — the corporate agency itself, quoting its
    // own real client directly — never carries Jobber's platform fee, and
    // may have revised the requested hours upward (offer.hours). Every
    // other offer (a jobber applying on the open marketplace) keeps the
    // standard manager/provider fee logic below, using the mission's own
    // estimatedHours as always.
    const isAgenceOffer = !!mission.corporateAgencyId && offer.providerId === mission.corporateAgencyId;
    const hours = isAgenceOffer ? (offer.hours ?? mission.estimatedHours) : mission.estimatedHours;
    const totalAmount = round2(offer.hourlyRate * hours + extraFeesTotal);

    if (isAgenceOffer) {
      const [booking] = await prisma.$transaction([
        prisma.booking.create({
          data: {
            missionId: offer.missionId,
            offerId: offer.id,
            clientId: req.user.id,
            providerId: offer.providerId,
            scheduledDate: mission.desiredDate,
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
      notifyBookingAccepted(booking.id);
      return res.status(201).json({ booking, feeWaived: true, quotaExceeded: false, plan: null, providerFeeWaived: false });
    }

    const result = await finalizeBooking({
      offer,
      mission,
      clientId: req.user.id,
      clientAccountKind: req.user.accountKind,
      totalAmount,
    });
    notifyBookingAccepted(result.booking.id);

    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
