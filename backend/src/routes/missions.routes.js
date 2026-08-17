const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { geocodeAddress, jitterCoordinate, haversineDistanceKm } = require('../services/geocodingService');
const { generateCorporateCode, resolveAgencyFromOrigin, brandKeyForDomain } = require('../utils/agency');
const { REQUIRABLE_BADGES } = require('../utils/badges');
const { finalizeBooking, round2 } = require('../services/bookingService');
const { sendMissionPublishedEmail, notifyBookingAccepted } = require('../services/emailService');
const { notifyMissionPublished, notifyOfferAccepted } = require('../services/notificationService');

const router = express.Router();

// While a mission is still OPEN (open to candidature), expose an approximate
// pin instead of the client's exact geocoded address.
function withPublicPosition(mission) {
  if (mission.status !== 'OPEN') return mission;
  let result = mission;
  if (mission.lat != null && mission.lng != null) {
    const { lat, lng } = jitterCoordinate(mission.id, mission.lat, mission.lng);
    result = { ...result, lat, lng };
  }
  if (mission.dropoffLat != null && mission.dropoffLng != null) {
    const { lat, lng } = jitterCoordinate(`${mission.id}-dropoff`, mission.dropoffLat, mission.dropoffLng);
    result = { ...result, dropoffLat: lat, dropoffLng: lng };
  }
  return result;
}

// A corporate-agency mission (e.g. from services34.fr) is published under
// the agency's own name on the public Jobber marketplace — the real
// requester who submitted the demande is only ever visible inside the
// agency's own back-office, never to jobbers browsing publicly. The real
// requester still sees their own true identity when looking at their own
// mission (isOwner).
function maskCorporateClient(mission, isOwner) {
  if (!mission.corporateAgencyId || isOwner) return mission;
  return {
    ...mission,
    client: {
      id: mission.client?.id,
      firstName: mission.corporateAgency?.companyName || 'Entreprise partenaire',
      avatarUrl: null,
      accountKind: 'COMPANY',
      companyType: 'CORPORATE',
      companyName: mission.corporateAgency?.companyName || null,
      createdAt: null,
    },
  };
}

const VEHICLE_TYPES = [
  'VOITURE_TOURISME', 'MINIBUS', 'CAMION_BENNE', 'REMORQUE', 'GRANDE_REMORQUE',
  'PETIT_UTILITAIRE_4M3', 'FOURGONNETTE_9M3', 'CAMION_15M3', 'GRAND_CAMION_20M3', 'POIDS_LOURD',
  'CAMION_PLATEAU', 'REMORQUE_BATEAU',
];

const RECURRENCE_UNITS = ['JOUR', 'SEMAINE', 'MOIS', 'AN'];
const MISSION_TYPES = ['TASK', 'LESSON'];

const createMissionSchema = z.object({
  type: z.enum(MISSION_TYPES).optional().default('TASK'),
  categoryId: z.string(),
  // The form sends "" for "no service selected" — treat that as unset,
  // otherwise Prisma tries to connect a Service with id "" and 500s.
  serviceId: z.string().optional().transform((v) => (v ? v : undefined)),
  title: z.string().min(3),
  description: z.string().min(10),
  address: z.string().min(3),
  lat: z.number().optional(),
  lng: z.number().optional(),
  // Arrival point for transport-type missions (déménagement, convoi,
  // transport) — `address` above is then the departure point.
  dropoffAddress: z.string().optional().transform((v) => (v ? v : undefined)),
  photos: z.array(z.string().url()).max(5).optional(),
  desiredDate: z.string(), // ISO date
  estimatedHours: z.number().positive().default(1),
  isUrgent: z.boolean().optional().default(false),
  datesFlexible: z.boolean().optional().default(false),
  // Asked client-side only when the required equipment includes Échelle
  // or Escabeau — flags a job that involves working at height.
  workAtHeight: z.boolean().optional(),
  isRecurring: z.boolean().optional().default(false),
  recurrenceCount: z.number().int().min(1).max(10).optional(),
  recurrenceUnit: z.enum(RECURRENCE_UNITS).optional(),
  // Explicit schedule for a recurring mission — one entry per occurrence
  // ("+ Ajouter une date"): date, heure de début, heure de fin, nombre
  // d'heures. Only kept when isRecurring is true.
  dates: z.array(z.object({
    date: z.string(), startTime: z.string(), hours: z.number().positive(), endTime: z.string(),
  })).optional().default([]),
  requiredEquipmentIds: z.array(z.string()).optional().default([]),
  requiredVehicleTypes: z.array(z.enum(VEHICLE_TYPES)).optional().default([]),
  otherEquipmentNote: z.string().max(200).optional().transform((v) => (v ? v : undefined)),
  otherVehicleNote: z.string().max(200).optional().transform((v) => (v ? v : undefined)),
  // Answers to the selected service's detailFields — loosely validated here,
  // shape is defined per-service. Arrays cover multiselect fields (e.g. a
  // service's "prestations" checkbox list).
  details: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])).optional(),
  // Company-only options — stripped server-side below for individual
  // accounts regardless of what the client sends.
  missionEndDate: z.string().optional(), // ISO date
  equipmentProvidedByCompany: z.boolean().optional(),
  ppeProvidedByCompany: z.boolean().optional(),
  requiredPpe: z.array(z.string()).optional().default([]),
  requiresMachine: z.boolean().optional(),
  requiredMachines: z.array(z.string()).optional().default([]),
  // "GET Mission" — the company fixes the mission's total price up front;
  // stripped server-side below for individual accounts.
  isGetMission: z.boolean().optional().default(false),
  getMissionPrice: z.number().positive().optional(),
  // Badges required from a candidate jobber — only PRO is actually
  // enforced (see POST /offers), the rest are informational.
  requiredBadges: z.array(z.string()).optional().default([]),
  // Self-declared, informational only — never validated against anything.
  difficulty: z.enum(['FACILE', 'MOYEN', 'DIFFICILE']).optional(),
});

// Categories where a mission moves something/someone from A to B — the form
// collects both a departure and an arrival address for these (see
// TRANSPORT_CATEGORY_SLUGS in missions/new/page.jsx); enforced here too so a
// mission can never end up with only one address regardless of caller.
const TRANSPORT_CATEGORY_SLUGS = ['demenagement', 'convoi', 'transport'];

// Create a mission — any authenticated account can post a job request
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { requiredEquipmentIds, dates, ...data } = createMissionSchema.parse(req.body);
    data.requiredBadges = data.requiredBadges.filter((b) => REQUIRABLE_BADGES.includes(b));
    if (!data.isRecurring) { data.recurrenceCount = undefined; data.recurrenceUnit = undefined; }
    const scheduleEntries = data.isRecurring ? dates : [];

    const category = await prisma.category.findUnique({ where: { id: data.categoryId }, select: { slug: true } });
    if (!category) return res.status(400).json({ error: 'Catégorie introuvable' });
    if (TRANSPORT_CATEGORY_SLUGS.includes(category.slug) && !data.dropoffAddress?.trim()) {
      return res.status(400).json({ error: "L'adresse d'arrivée est requise pour ce type de mission" });
    }
    // Multi-day range, "who provides the gear", PPE and machine questions
    // are reserved to company accounts — ignore them from anyone else.
    if (req.user.accountKind !== 'COMPANY') {
      data.missionEndDate = undefined;
      data.equipmentProvidedByCompany = undefined;
      data.ppeProvidedByCompany = undefined;
      data.requiredPpe = [];
      data.requiresMachine = undefined;
      data.requiredMachines = [];
      data.isGetMission = false;
      data.getMissionPrice = undefined;
    }
    if (!data.isGetMission) {
      data.getMissionPrice = undefined;
    } else if (!data.getMissionPrice) {
      return res.status(400).json({ error: 'Le tarif de la GET Mission est requis' });
    }
    // A corporate agency's own white-label site (e.g. services34.fr) is
    // identified by the request's Origin — never trusted from the request
    // body, so one white-label site can never spoof another's missions.
    // Ordinary jobber.city requests match no agencyDomain and pass through
    // untouched.
    let corporateAgencyId;
    let corporateCode;
    const agency = await resolveAgencyFromOrigin(req);
    if (agency) {
      corporateAgencyId = agency.id;
      corporateCode = generateCorporateCode(category.slug);
    }

    const [geocoded, dropoffGeocoded] = await Promise.all([
      geocodeAddress(data.address),
      data.dropoffAddress ? geocodeAddress(data.dropoffAddress) : null,
    ]);
    const mission = await prisma.mission.create({
      data: {
        ...data,
        lat: geocoded?.lat ?? data.lat,
        lng: geocoded?.lng ?? data.lng,
        dropoffLat: dropoffGeocoded?.lat,
        dropoffLng: dropoffGeocoded?.lng,
        desiredDate: new Date(data.desiredDate),
        missionEndDate: data.missionEndDate ? new Date(data.missionEndDate) : undefined,
        clientId: req.user.id,
        corporateAgencyId,
        corporateCode,
        visibility: corporateAgencyId ? 'PRIVATE' : 'PUBLIC',
        requiredEquipment: requiredEquipmentIds.length
          ? { create: requiredEquipmentIds.map((equipmentId) => ({ equipmentId })) }
          : undefined,
        scheduleEntries: scheduleEntries.length
          ? { create: scheduleEntries.map((d) => ({ date: new Date(d.date), startTime: d.startTime, hours: d.hours, endTime: d.endTime })) }
          : undefined,
      },
      include: { requiredEquipment: { include: { equipment: true } }, scheduleEntries: true },
    });
    sendMissionPublishedEmail(req.user.email, {
      missionTitle: mission.title,
      missionId: mission.id,
      brandKey: brandKeyForDomain(agency?.agencyDomain),
    });
    notifyMissionPublished(mission.id);
    res.status(201).json({ mission });
  } catch (err) {
    if (err.name === 'ZodError') { err.status = 400; err.expose = true; err.message = err.errors[0].message; }
    next(err);
  }
});

// List / search missions (e.g. browsing the "joblist"). When called by a
// logged-in account with a configured jobber profile, results are narrowed
// to their registered categories and their intervention radius
// (Yoojo-style joblist) — every account has both a manager and jobber side,
// so this personalization applies regardless of any "role" label.
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { categoryId, status, clientId, type } = req.query;
    // PRIVATE missions (corporate demandes pending review, agency-only,
    // employee-targeted) never show on the public marketplace — except to
    // the client who owns them, browsing their own "mes missions".
    const isOwnMissionsLookup = clientId && req.user && clientId === req.user.id;
    let missions = await prisma.mission.findMany({
      where: {
        categoryId: categoryId || undefined,
        status: status || undefined,
        clientId: clientId || undefined,
        type: MISSION_TYPES.includes(type) ? type : undefined,
        visibility: isOwnMissionsLookup ? undefined : 'PUBLIC',
      },
      include: {
        category: true, service: true, client: { select: { id: true, firstName: true, avatarUrl: true, accountKind: true, companyType: true, companyName: true } },
        corporateAgency: { select: { companyName: true } },
        _count: { select: { offers: true } }, requiredEquipment: { include: { equipment: true } },
        // Only fetched for a client browsing their own "mes missions" — lets
        // the front-end show a "proposition reçue" quote card without a
        // second request per mission.
        offers: isOwnMissionsLookup ? { where: { status: 'PENDING' }, select: { id: true, status: true, hourlyRate: true, hours: true, extraFees: true } } : undefined,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (req.user) {
      const profile = await prisma.providerProfile.findUnique({
        where: { userId: req.user.id },
        include: { categories: true, user: { select: { lat: true, lng: true } } },
      });

      if (profile) {
        if (profile.categories.length > 0) {
          const allowedCategoryIds = new Set(profile.categories.map((c) => c.categoryId));
          missions = missions.filter((m) => allowedCategoryIds.has(m.categoryId));
        }
        if (profile.user.lat != null && profile.user.lng != null) {
          missions = missions
            .filter(
              (m) =>
                m.lat == null ||
                m.lng == null ||
                haversineDistanceKm(profile.user.lat, profile.user.lng, m.lat, m.lng) <= profile.radiusKm
            )
            .map((m) => ({
              ...m,
              distanceKm: m.lat != null && m.lng != null
                ? Math.round(haversineDistanceKm(profile.user.lat, profile.user.lng, m.lat, m.lng) * 10) / 10
                : null,
            }));
        }
      }
    }

    res.json({ missions: missions.map((m) => withPublicPosition(maskCorporateClient(m, req.user && req.user.id === m.clientId))) });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const mission = await prisma.mission.findUnique({
      where: { id: req.params.id },
      include: {
        category: true,
        service: true,
        client: { select: { id: true, firstName: true, avatarUrl: true, accountKind: true, companyType: true, companyName: true, createdAt: true } },
        corporateAgency: { select: { companyName: true } },
        offers: { include: { provider: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, isProfessional: true, providerProfile: true } } } },
        booking: true,
        requiredEquipment: { include: { equipment: true } },
      },
    });
    if (!mission) return res.status(404).json({ error: 'Mission introuvable' });
    const isOwner = req.user && req.user.id === mission.clientId;

    // Distance from the viewing jobber's own address to the mission's real
    // (un-jittered) coordinates — shown regardless of whether the client is
    // a corporate agency, so a jobber can judge travel and route fees
    // before ever applying, not just once assigned.
    let distanceKm = null;
    if (req.user && mission.lat != null && mission.lng != null) {
      const viewer = await prisma.user.findUnique({ where: { id: req.user.id }, select: { lat: true, lng: true } });
      if (viewer?.lat != null && viewer?.lng != null) {
        distanceKm = Math.round(haversineDistanceKm(viewer.lat, viewer.lng, mission.lat, mission.lng) * 10) / 10;
      }
    }

    res.json({ mission: { ...withPublicPosition(maskCorporateClient(mission, isOwner)), distanceKm } });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/cancel', requireAuth, async (req, res, next) => {
  try {
    const mission = await prisma.mission.findUnique({ where: { id: req.params.id } });
    if (!mission) return res.status(404).json({ error: 'Mission introuvable' });
    if (mission.clientId !== req.user.id) return res.status(403).json({ error: 'Non autorisé' });

    const updated = await prisma.mission.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
    });
    res.json({ mission: updated });
  } catch (err) {
    next(err);
  }
});

// A jobber "GETs" a GET Mission — the company fixed the total price up
// front (mission.getMissionPrice), non-negotiable, no candidature. First
// jobber to hit this endpoint wins the mission; whoever comes after gets a
// 409. Creates an Offer (ACCEPTED, to satisfy Booking's required offerId)
// and a Booking the same way an accepted offer normally would.
router.post('/:id/get', requireAuth, async (req, res, next) => {
  try {
    if (req.user.accountKind === 'COMPANY') {
      return res.status(403).json({ error: 'Un compte entreprise ne peut pas prendre une mission' });
    }
    const mission = await prisma.mission.findUnique({ where: { id: req.params.id } });
    if (!mission) return res.status(404).json({ error: 'Mission introuvable' });
    if (!mission.isGetMission || mission.getMissionPrice == null) {
      return res.status(400).json({ error: "Cette mission n'est pas une GET Mission" });
    }
    if (mission.clientId === req.user.id) {
      return res.status(400).json({ error: 'Vous ne pouvez pas prendre votre propre mission' });
    }

    // Atomically claim it: only the request that flips status OPEN -> ASSIGNED
    // succeeds — first jobber in wins, everyone after gets a 409.
    const claim = await prisma.mission.updateMany({
      where: { id: mission.id, status: 'OPEN' },
      data: { status: 'ASSIGNED' },
    });
    if (claim.count === 0) {
      return res.status(409).json({ error: 'Cette mission a déjà été prise par un autre jobber' });
    }

    try {
      const totalAmount = mission.getMissionPrice;
      const hourlyRate = round2(totalAmount / mission.estimatedHours);

      const offer = await prisma.offer.create({
        data: { missionId: mission.id, providerId: req.user.id, hourlyRate, status: 'ACCEPTED' },
      });

      const result = await finalizeBooking({
        offer,
        mission,
        clientId: mission.clientId,
        clientAccountKind: 'COMPANY', // GET Missions are only ever published by company accounts
        totalAmount,
      });
      notifyBookingAccepted(result.booking.id);
      notifyOfferAccepted(result.booking.id);

      res.status(201).json(result);
    } catch (err) {
      // Release the claim so the mission doesn't get stuck ASSIGNED with no
      // booking if something failed after we'd already flipped its status.
      await prisma.mission.update({ where: { id: mission.id }, data: { status: 'OPEN' } }).catch(() => {});
      throw err;
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
