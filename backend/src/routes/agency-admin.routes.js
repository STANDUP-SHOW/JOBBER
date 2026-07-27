// Back-office for a corporate white-label agency (e.g. Services 34) — a
// single User row (accountKind=COMPANY, companyType=CORPORATE) with its own
// identifiant+PIN login, separate from the normal email/password flow.
// Mounted at /api/agency-admin. Every route below `router.use(requireAgencyAuth)`
// only ever touches missions/offers/employees/invoices belonging to
// req.agency.id, never another agency's data — important once more than
// one corporate site exists.
const express = require('express');
const { z } = require('zod');
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const { signToken, verifyToken } = require('../utils/jwt');
const { REFUSAL_REASONS_JOBBER, generateCorporateCode } = require('../utils/agency');
const { geocodeAddress, haversineDistanceKm } = require('../services/geocodingService');
const { getOneWayDistanceKm, AGENCY_DEPARTURE_ADDRESS } = require('../services/distanceService');
const { sendAgenceProposalEmail } = require('../services/emailService');

const router = express.Router();

const MAX_PIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

// Same list as missions.routes.js (not exported there, so duplicated here).
const VEHICLE_TYPES = [
  'VOITURE_TOURISME', 'MINIBUS', 'CAMION_BENNE', 'REMORQUE', 'GRANDE_REMORQUE',
  'PETIT_UTILITAIRE_4M3', 'FOURGONNETTE_9M3', 'CAMION_15M3', 'GRAND_CAMION_20M3', 'POIDS_LOURD',
  'CAMION_PLATEAU', 'REMORQUE_BATEAU',
];

const missionDetailsSchema = z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])).optional();

// Spread into every mission list's `include` so the admin's mission cards
// can show what was actually checked (matériel/véhicule requis) — every
// GET list endpoint below returns this alongside its own fields.
const MISSION_BADGES_INCLUDE = { requiredEquipment: { include: { equipment: true } } };

// "Information entreprise" block in Paramètres, plus the core admin fields —
// shared shape returned by /login, /me and /credentials.
function agencyPublicFields(agency) {
  return {
    id: agency.id,
    companyName: agency.companyName,
    adminLoginId: agency.adminLoginId,
    serviceRadiusKm: agency.serviceRadiusKm,
    address: agency.address,
    lat: agency.lat,
    lng: agency.lng,
    companySiret: agency.companySiret,
    siegeSocialAddress: agency.siegeSocialAddress,
    siegeSocialCity: agency.siegeSocialCity,
    siegeSocialDepartement: agency.siegeSocialDepartement,
    representantCivilite: agency.representantCivilite,
    representantNom: agency.representantNom,
    representantPrenom: agency.representantPrenom,
    jobberLicenseNumber: agency.jobberLicenseNumber,
  };
}

// Separate from requireAuth: verifies the JWT is valid AND belongs to a
// corporate agency account, then loads the fresh user row onto req.agency.
async function requireAgencyAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Authentification requise' });
    const payload = verifyToken(token);
    const agency = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!agency || agency.companyType !== 'CORPORATE') return res.status(403).json({ error: 'Accès réservé aux agences corporate' });
    req.agency = agency;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }
}

router.post('/login', async (req, res, next) => {
  try {
    const { loginId, pin } = z.object({ loginId: z.string().min(1), pin: z.string().min(1) }).parse(req.body);
    const agency = await prisma.user.findFirst({ where: { adminLoginId: loginId, companyType: 'CORPORATE' } });
    if (!agency || !agency.adminPinHash) {
      const e = new Error('Identifiants invalides'); e.status = 401; e.expose = true; throw e;
    }

    if (agency.adminPinLockedUntil && agency.adminPinLockedUntil > new Date()) {
      const minutesLeft = Math.ceil((agency.adminPinLockedUntil - new Date()) / 60000);
      const e = new Error(`Compte verrouillé suite à trop de tentatives — réessayez dans ${minutesLeft} min`);
      e.status = 423; e.expose = true; throw e;
    }

    const valid = await bcrypt.compare(pin, agency.adminPinHash);
    if (!valid) {
      const attempts = agency.adminPinFailedAttempts + 1;
      const lockedOut = attempts >= MAX_PIN_ATTEMPTS;
      await prisma.user.update({
        where: { id: agency.id },
        data: {
          adminPinFailedAttempts: lockedOut ? 0 : attempts,
          adminPinLockedUntil: lockedOut ? new Date(Date.now() + LOCKOUT_MINUTES * 60000) : null,
        },
      });
      const e = new Error(lockedOut
        ? `Trop de tentatives — compte verrouillé ${LOCKOUT_MINUTES} minutes`
        : `Identifiants invalides (${MAX_PIN_ATTEMPTS - attempts} essai(s) restant(s))`);
      e.status = 401; e.expose = true; throw e;
    }

    await prisma.user.update({ where: { id: agency.id }, data: { adminPinFailedAttempts: 0, adminPinLockedUntil: null } });
    const token = signToken(agency);
    res.json({ token, agency: agencyPublicFields(agency) });
  } catch (err) {
    if (err.name === 'ZodError') { err.status = 400; err.expose = true; err.message = err.errors[0].message; }
    next(err);
  }
});

router.use(requireAgencyAuth);

router.get('/me', (req, res) => {
  res.json({ agency: agencyPublicFields(req.agency) });
});

const CIVILITES = ['Monsieur', 'Madame', 'Autre'];

const credentialsSchema = z.object({
  loginId: z.string().min(1).optional(),
  pin: z.string().min(4).max(12).optional(),
  serviceRadiusKm: z.number().min(1).max(150).optional(),
  address: z.string().min(1).optional(),
  companyName: z.string().min(1).optional(),
  companySiret: z.string().min(1).optional(),
  siegeSocialAddress: z.string().min(1).optional(),
  siegeSocialCity: z.string().min(1).optional(),
  siegeSocialDepartement: z.string().min(1).optional(),
  representantCivilite: z.enum(CIVILITES).optional(),
  representantNom: z.string().min(1).optional(),
  representantPrenom: z.string().min(1).optional(),
});

router.patch('/credentials', async (req, res, next) => {
  try {
    const data = credentialsSchema.parse(req.body);
    const update = {};
    if (data.loginId) update.adminLoginId = data.loginId;
    if (data.pin) update.adminPinHash = await bcrypt.hash(data.pin, 10);
    if (data.serviceRadiusKm) update.serviceRadiusKm = data.serviceRadiusKm;
    if (data.address) {
      update.address = data.address;
      const geocoded = await geocodeAddress(data.address);
      update.lat = geocoded?.lat;
      update.lng = geocoded?.lng;
    }
    if (data.companyName) update.companyName = data.companyName;
    if (data.companySiret) update.companySiret = data.companySiret;
    if (data.siegeSocialAddress) update.siegeSocialAddress = data.siegeSocialAddress;
    if (data.siegeSocialCity) update.siegeSocialCity = data.siegeSocialCity;
    if (data.siegeSocialDepartement) update.siegeSocialDepartement = data.siegeSocialDepartement;
    if (data.representantCivilite) update.representantCivilite = data.representantCivilite;
    if (data.representantNom) update.representantNom = data.representantNom;
    if (data.representantPrenom) update.representantPrenom = data.representantPrenom;
    const agency = await prisma.user.update({ where: { id: req.agency.id }, data: update });
    res.json({ agency: agencyPublicFields(agency) });
  } catch (err) {
    if (err.name === 'ZodError') { err.status = 400; err.expose = true; err.message = err.errors[0].message; }
    if (err.code === 'P2002') { err.status = 409; err.expose = true; err.message = 'Cet identifiant ou ce SIRET est déjà utilisé'; }
    next(err);
  }
});

// --- Section 1 : Demandes d'interventions reçues ---
// Missions submitted via the agency's own site, still private and not yet
// decided (neither published to Jobber nor handled directly by the agency).
router.get('/missions/received', async (req, res, next) => {
  try {
    const missions = await prisma.mission.findMany({
      // clientId excludes the agency's own directly-created missions (see
      // "Nouvelle mission agence" below) — this list is only for requests a
      // real visitor submitted via the agency's site.
      where: { corporateAgencyId: req.agency.id, clientId: { not: req.agency.id }, visibility: 'PRIVATE', status: 'OPEN', offers: { none: {} } },
      include: { category: true, service: true, client: { select: { firstName: true, lastName: true, phone: true, email: true } }, ...MISSION_BADGES_INCLUDE },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ missions });
  } catch (err) { next(err); }
});

const createAgencyMissionSchema = z.object({
  categoryId: z.string(),
  serviceId: z.string().optional().transform((v) => (v ? v : undefined)),
  title: z.string().min(3),
  description: z.string().min(10),
  address: z.string().min(3),
  estimatedHours: z.number().positive().default(1),
  desiredDate: z.string(),
  isUrgent: z.boolean().optional().default(false),
  datesFlexible: z.boolean().optional().default(false),
  workAtHeight: z.boolean().optional(),
  isRecurring: z.boolean().optional().default(false),
  dates: z.array(z.object({
    date: z.string(), startTime: z.string(), hours: z.number().positive(), endTime: z.string(),
  })).optional().default([]),
  requiredEquipmentIds: z.array(z.string()).optional().default([]),
  requiredVehicleTypes: z.array(z.enum(VEHICLE_TYPES)).optional().default([]),
  otherEquipmentNote: z.string().max(200).optional().transform((v) => (v ? v : undefined)),
  otherVehicleNote: z.string().max(200).optional().transform((v) => (v ? v : undefined)),
  details: missionDetailsSchema,
});

// "Créer une mission agence" — the agency originates the mission itself
// (e.g. a long-term contract), rather than a visitor submitting a demande.
// Kept private until the agency clicks "Publier sur Jobber" or "Traité en
// agence", exactly like a client-submitted demande. Carries the same
// fields as a normal demande (service précis, adresse géocodée, options,
// matériel/véhicule requis) so it isn't a stripped-down mission.
router.post('/missions', async (req, res, next) => {
  try {
    const { requiredEquipmentIds, dates, ...data } = createAgencyMissionSchema.parse(req.body);
    const category = await prisma.category.findUnique({ where: { id: data.categoryId }, select: { id: true, slug: true } });
    if (!category) return res.status(400).json({ error: 'Catégorie introuvable' });

    const scheduleEntries = data.isRecurring ? dates : [];
    const totalHours = scheduleEntries.length
      ? scheduleEntries.reduce((sum, d) => sum + d.hours, 0)
      : data.estimatedHours;
    const desiredDate = scheduleEntries.length ? new Date(scheduleEntries[0].date) : new Date(data.desiredDate);
    const geocoded = await geocodeAddress(data.address);

    const mission = await prisma.mission.create({
      data: {
        categoryId: category.id,
        serviceId: data.serviceId,
        title: data.title,
        description: data.description,
        address: data.address,
        lat: geocoded?.lat,
        lng: geocoded?.lng,
        desiredDate,
        estimatedHours: totalHours,
        isUrgent: data.isUrgent,
        datesFlexible: data.datesFlexible,
        workAtHeight: data.workAtHeight,
        isRecurring: data.isRecurring,
        requiredVehicleTypes: data.requiredVehicleTypes,
        otherEquipmentNote: data.otherEquipmentNote,
        otherVehicleNote: data.otherVehicleNote,
        details: data.details,
        clientId: req.agency.id,
        corporateAgencyId: req.agency.id,
        corporateCode: generateCorporateCode(category.slug),
        visibility: 'PRIVATE',
        requiredEquipment: requiredEquipmentIds.length
          ? { create: requiredEquipmentIds.map((equipmentId) => ({ equipmentId })) }
          : undefined,
        scheduleEntries: scheduleEntries.length
          ? { create: scheduleEntries.map((d) => ({ date: new Date(d.date), startTime: d.startTime, hours: d.hours, endTime: d.endTime })) }
          : undefined,
      },
      include: { scheduleEntries: true, requiredEquipment: { include: { equipment: true } } },
    });
    res.status(201).json({ mission });
  } catch (err) {
    if (err.name === 'ZodError') { err.status = 400; err.expose = true; err.message = err.errors[0].message; }
    next(err);
  }
});

// --- Nouvelle mission agence : missions the agency created directly ---
router.get('/missions/nouvelle-agence', async (req, res, next) => {
  try {
    const missions = await prisma.mission.findMany({
      where: { corporateAgencyId: req.agency.id, clientId: req.agency.id },
      include: {
        category: true, service: true, scheduleEntries: true, planning: true,
        offers: { include: { provider: { select: { firstName: true, lastName: true } } } },
        ...MISSION_BADGES_INCLUDE,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ missions });
  } catch (err) { next(err); }
});

router.post('/missions/:id/publish-to-jobber', async (req, res, next) => {
  try {
    const mission = await prisma.mission.findUnique({ where: { id: req.params.id } });
    if (!mission || mission.corporateAgencyId !== req.agency.id) return res.status(404).json({ error: 'Demande introuvable' });
    const updated = await prisma.mission.update({ where: { id: mission.id }, data: { visibility: 'PUBLIC' } });
    res.json({ mission: updated });
  } catch (err) { next(err); }
});

// Same catalog as offers.routes.js's EXTRA_FEE_TYPES (not exported there,
// so duplicated here) — labels are resolved server-side so a tampered
// payload can't inject arbitrary text.
const EXTRA_FEE_TYPES = {
  displacement: 'Frais de route - Déplacement',
  vehicle: 'Frais de mise à disposition du véhicule requis',
  fuel: 'Frais de carburant',
  consumables: 'Frais de consommables utilisés (produits, cartons)',
  equipment: 'Frais de matériel (location...)',
  wasteDisposal: 'Frais de déchetterie',
};

const agenceOfferSchema = z.object({
  hourlyRate: z.number().positive(),
  extraFees: z.array(z.object({ key: z.enum(Object.keys(EXTRA_FEE_TYPES)), amount: z.number().positive() })).optional().default([]),
  // The agency may revise the client's originally requested hours upward
  // when pricing the quote (e.g. the job realistically needs more time),
  // but never reduce them — enforced below against mission.estimatedHours.
  hours: z.number().positive().optional(),
});

// "Frais de route" — 1€ per one-way km from the fixed agency departure
// address (not round-trip: that priced out too expensive) — plus a
// distance-based "frais de carburant" on the round trip. Both computed via
// Google Distance Matrix so the agency doesn't have to type them in by hand.
const DISPLACEMENT_RATE_PER_KM = 1;
const FUEL_RATE_PER_100KM = 15; // ~7L/100km

router.get('/missions/:id/travel-fees', async (req, res, next) => {
  try {
    const mission = await prisma.mission.findUnique({ where: { id: req.params.id } });
    if (!mission || mission.corporateAgencyId !== req.agency.id) return res.status(404).json({ error: 'Demande introuvable' });

    const oneWayKm = await getOneWayDistanceKm(mission.address);
    const roundTripKm = oneWayKm != null ? oneWayKm * 2 : null;
    const displacementFee = oneWayKm != null ? round2(oneWayKm * DISPLACEMENT_RATE_PER_KM) : null;
    const fuelFee = roundTripKm != null ? round2((roundTripKm / 100) * FUEL_RATE_PER_100KM) : null;

    res.json({
      originLabel: 'Départ agence',
      originAddress: AGENCY_DEPARTURE_ADDRESS,
      distanceKm: oneWayKm != null ? round2(oneWayKm) : null,
      roundTripKm: roundTripKm != null ? round2(roundTripKm) : null,
      displacementFee,
      fuelFee,
    });
  } catch (err) { next(err); }
});

// "Mission Agence" — the agency itself takes the mission, without ever
// publishing it to Jobber, and bills the real client directly (no platform
// fee, unlike the Jobber path). Unlike a normal jobber application, this
// still leaves the offer PENDING rather than confirming immediately: the
// real client must review and accept the quote themselves (see
// offers.routes.js's /:id/accept, which creates the fee-free booking once
// they do) — so the mission only reaches "Missions Agence en cours" after
// that acceptance, not the moment this offer is sent.
router.post('/missions/:id/agence', async (req, res, next) => {
  try {
    const { hourlyRate, extraFees: extraFeesInput, hours } = agenceOfferSchema.parse(req.body);
    const mission = await prisma.mission.findUnique({
      where: { id: req.params.id },
      include: { client: { select: { email: true, firstName: true } } },
    });
    if (!mission || mission.corporateAgencyId !== req.agency.id) return res.status(404).json({ error: 'Demande introuvable' });
    if (hours != null && hours < mission.estimatedHours) {
      return res.status(400).json({ error: 'Les heures ne peuvent être qu\'augmentées par rapport à la demande du client, jamais réduites' });
    }

    const extraFees = extraFeesInput.map((f) => ({ key: f.key, label: EXTRA_FEE_TYPES[f.key], amount: f.amount }));
    const extraFeesTotal = extraFees.reduce((sum, f) => sum + f.amount, 0);
    const finalHours = hours ?? mission.estimatedHours;
    const totalAmount = round2(hourlyRate * finalHours + extraFeesTotal);

    const offer = await prisma.offer.create({
      data: {
        missionId: mission.id,
        providerId: req.agency.id,
        hourlyRate,
        hours: hours ?? undefined,
        extraFees: extraFees.length ? extraFees : undefined,
      },
    });

    const compteUrl = `${process.env.SERVICES34_URL || 'https://services34.fr'}/compte/missions/${mission.id}`;
    sendAgenceProposalEmail(mission.client.email, {
      clientFirstName: mission.client.firstName,
      missionTitle: mission.title,
      total: totalAmount,
      date: mission.desiredDate,
      url: compteUrl,
    }).catch(() => {});

    res.status(201).json({ offer });
  } catch (err) {
    if (err.code === 'P2002') { err.status = 409; err.expose = true; err.message = 'Une offre agence existe déjà pour cette demande'; }
    if (err.name === 'ZodError') { err.status = 400; err.expose = true; err.message = err.errors[0].message; }
    next(err);
  }
});

// --- Section 2 : Demandes d'intervention Jobber ---
// Missions the agency published to the public Jobber marketplace, still
// awaiting a decision (no accepted offer yet).
router.get('/missions/published', async (req, res, next) => {
  try {
    const missions = await prisma.mission.findMany({
      where: { corporateAgencyId: req.agency.id, visibility: 'PUBLIC', status: 'OPEN' },
      include: {
        category: true, service: true,
        offers: { where: { status: 'PENDING' }, include: { provider: { select: { firstName: true, lastName: true } } } },
        ...MISSION_BADGES_INCLUDE,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ missions });
  } catch (err) { next(err); }
});

// --- Section 3 : Offres Jobber ---
// Every pending offer from an actual jobber (never the agency's own
// self-offers) on one of the agency's published missions.
router.get('/offers', async (req, res, next) => {
  try {
    const offers = await prisma.offer.findMany({
      where: {
        status: 'PENDING',
        providerId: { not: req.agency.id },
        mission: { corporateAgencyId: req.agency.id, visibility: 'PUBLIC' },
      },
      include: {
        mission: {
          select: {
            id: true, title: true, corporateCode: true, estimatedHours: true, desiredDate: true,
            address: true, isUrgent: true, datesFlexible: true, workAtHeight: true, isRecurring: true,
            requiredVehicleTypes: true, otherVehicleNote: true, otherEquipmentNote: true,
            requiredEquipment: { include: { equipment: true } },
          },
        },
        provider: {
          select: {
            id: true, firstName: true, lastName: true,
            providerProfile: { select: { ratingAverage: true, ratingCount: true, completedMissions: true, verificationStatus: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ offers, refusalReasons: REFUSAL_REASONS_JOBBER });
  } catch (err) { next(err); }
});

const refuseSchema = z.object({ reason: z.string().min(1) });

router.post('/offers/:id/refuse', async (req, res, next) => {
  try {
    const { reason } = refuseSchema.parse(req.body);
    const offer = await prisma.offer.findUnique({ where: { id: req.params.id }, include: { mission: true } });
    if (!offer || offer.mission.corporateAgencyId !== req.agency.id) return res.status(404).json({ error: 'Offre introuvable' });
    const updated = await prisma.offer.update({ where: { id: offer.id }, data: { status: 'REJECTED', refusalReason: reason } });
    res.json({ offer: updated });
  } catch (err) {
    if (err.name === 'ZodError') { err.status = 400; err.expose = true; err.message = err.errors[0].message; }
    next(err);
  }
});

// Flat 10€ platform fee on the agency's side, no fee on the jobber's side —
// same convention as an ENTERPRISE/CORPORATE client accepting an offer
// directly on jobber.city (see offers.routes.js). The agency, not the
// original requester, is billed here: white-label means the client's
// payment relationship is with the agency, never with Jobber directly.
const AGENCY_PLATFORM_FEE = 10;

function round2(n) { return Math.round(n * 100) / 100; }

// "Valider la mission" — accepts a jobber's offer on one of the agency's
// published missions. Mirrors offers.routes.js's /accept but bills the
// agency (booking.clientId = agency.id) instead of the original requester.
router.post('/offers/:id/accept', async (req, res, next) => {
  try {
    const offer = await prisma.offer.findUnique({ where: { id: req.params.id }, include: { mission: true } });
    if (!offer) return res.status(404).json({ error: 'Offre introuvable' });
    if (offer.mission.corporateAgencyId !== req.agency.id) return res.status(403).json({ error: 'Non autorisé' });
    if (offer.status !== 'PENDING') return res.status(400).json({ error: "Cette offre n'est plus disponible" });

    const extraFeesTotal = (offer.extraFees || []).reduce((sum, f) => sum + f.amount, 0);
    const totalAmount = round2(offer.hourlyRate * offer.mission.estimatedHours + extraFeesTotal);
    const chargeAmount = round2(totalAmount + AGENCY_PLATFORM_FEE);

    const [booking] = await prisma.$transaction([
      prisma.booking.create({
        data: {
          missionId: offer.missionId,
          offerId: offer.id,
          clientId: req.agency.id,
          providerId: offer.providerId,
          scheduledDate: offer.mission.desiredDate,
          hours: offer.mission.estimatedHours,
          hourlyRate: offer.hourlyRate,
          totalAmount,
          payment: {
            create: {
              amount: chargeAmount,
              platformFee: AGENCY_PLATFORM_FEE,
              managerFee: AGENCY_PLATFORM_FEE,
              providerFee: 0,
              feeWaived: false,
              providerPayout: totalAmount,
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

    res.json({ booking });
  } catch (err) { next(err); }
});

// --- Sections 4-5 : Missions Jobber en cours / terminées ---
// "En cours" covers ASSIGNED (not started) and IN_PROGRESS so the front-end
// can show the "démarre dans J/H/M/S" countdown for the former.
router.get('/missions/jobber/en-cours', async (req, res, next) => {
  try {
    const missions = await prisma.mission.findMany({
      where: {
        corporateAgencyId: req.agency.id, visibility: 'PUBLIC',
        status: { in: ['ASSIGNED', 'IN_PROGRESS'] },
        booking: { providerId: { not: req.agency.id } },
      },
      include: { category: true, planning: true, booking: { include: { provider: { select: { firstName: true, lastName: true } } } }, ...MISSION_BADGES_INCLUDE },
      orderBy: { desiredDate: 'asc' },
    });
    res.json({ missions });
  } catch (err) { next(err); }
});

router.get('/missions/jobber/terminees', async (req, res, next) => {
  try {
    const missions = await prisma.mission.findMany({
      where: {
        corporateAgencyId: req.agency.id, visibility: 'PUBLIC', status: 'COMPLETED',
        booking: { providerId: { not: req.agency.id } },
      },
      include: { category: true, booking: { include: { provider: { select: { firstName: true, lastName: true } } } }, ...MISSION_BADGES_INCLUDE },
      orderBy: { updatedAt: 'desc' },
    });
    res.json({ missions });
  } catch (err) { next(err); }
});

// --- Sections 7-8 : Missions Agence en cours / terminées ---
// "Agence" means never touched the public Jobber marketplace (visibility
// PRIVATE) — whether the agency does the work itself or delegates it to
// one of its own employees via "Embaucher" (booking.providerId !== agency
// in that case). Previously this required booking.providerId === agency,
// so embaucher-ing an employee off an in-progress mission made it vanish
// from every list (it doesn't satisfy "Jobber" either, since that requires
// visibility PUBLIC). Filtering on visibility instead keeps it here, with
// booking.provider telling the front-end whether an employee was hired.
router.get('/missions/agence/en-cours', async (req, res, next) => {
  try {
    const missions = await prisma.mission.findMany({
      where: { corporateAgencyId: req.agency.id, visibility: 'PRIVATE', status: { in: ['ASSIGNED', 'IN_PROGRESS'] } },
      include: {
        category: true, planning: true,
        booking: { include: { provider: { select: { firstName: true, lastName: true } } } },
        client: { select: { firstName: true, lastName: true, phone: true } },
        ...MISSION_BADGES_INCLUDE,
      },
      orderBy: { desiredDate: 'asc' },
    });
    res.json({ missions });
  } catch (err) { next(err); }
});

// Missions where the agency has sent a "Mission Agence" quote but the real
// client hasn't accepted it yet — these no longer show in "Demandes
// reçues" (which excludes missions with any offer) but don't reach
// "Missions Agence en cours" either (mission.status only becomes ASSIGNED
// once the client accepts), so without this list they'd be invisible to
// the agency while awaiting a response.
router.get('/missions/agence/propositions-en-attente', async (req, res, next) => {
  try {
    const missions = await prisma.mission.findMany({
      where: {
        corporateAgencyId: req.agency.id,
        status: 'OPEN',
        offers: { some: { providerId: req.agency.id, status: 'PENDING' } },
      },
      include: {
        category: true,
        client: { select: { firstName: true, lastName: true, phone: true } },
        offers: { where: { providerId: req.agency.id }, orderBy: { createdAt: 'desc' }, take: 1 },
        ...MISSION_BADGES_INCLUDE,
      },
      orderBy: { desiredDate: 'asc' },
    });
    res.json({ missions });
  } catch (err) { next(err); }
});

const embaucherEmployeSchema = z.object({ jobberId: z.string() });

// "Embaucher" from an in-progress agence mission — staffs one of the
// agency's own employees onto a mission it already committed to handle
// itself, by moving the booking's provider from the agency to the
// employee. No offer/accept cycle: the employment relationship is already
// established via AgencyEmployee, so this is an internal dispatch
// decision, not a marketplace application. The mission stays in "Missions
// Agence en cours" (that list is defined by visibility, not by who the
// provider is) — booking.provider now tells the front-end an employee was
// hired instead of the agency itself.
router.post('/missions/:id/embaucher-employe', async (req, res, next) => {
  try {
    const { jobberId } = embaucherEmployeSchema.parse(req.body);
    const mission = await prisma.mission.findUnique({ where: { id: req.params.id }, include: { booking: true } });
    if (!mission || mission.corporateAgencyId !== req.agency.id) return res.status(404).json({ error: 'Mission introuvable' });
    if (!mission.booking || mission.booking.providerId !== req.agency.id) {
      return res.status(400).json({ error: "Cette mission n'est pas actuellement traitée par l'agence" });
    }
    const isEmployee = await prisma.agencyEmployee.findUnique({ where: { agencyId_jobberId: { agencyId: req.agency.id, jobberId } } });
    if (!isEmployee) return res.status(403).json({ error: "Ce jobber ne fait pas partie de vos employés" });

    const booking = await prisma.booking.update({ where: { id: mission.booking.id }, data: { providerId: jobberId } });
    res.json({ booking });
  } catch (err) {
    if (err.name === 'ZodError') { err.status = 400; err.expose = true; err.message = err.errors[0].message; }
    next(err);
  }
});

router.get('/missions/agence/terminees', async (req, res, next) => {
  try {
    const missions = await prisma.mission.findMany({
      where: { corporateAgencyId: req.agency.id, visibility: 'PRIVATE', status: 'COMPLETED' },
      include: {
        category: true,
        booking: { include: { provider: { select: { firstName: true, lastName: true } } } },
        client: { select: { firstName: true, lastName: true, phone: true } },
        ...MISSION_BADGES_INCLUDE,
      },
      orderBy: { updatedAt: 'desc' },
    });
    res.json({ missions });
  } catch (err) { next(err); }
});

// Full detail for one mission — used by the admin's mission detail page,
// reachable by clicking any mission card in any of the lists above
// (received, published, en cours, terminées...). Includes the requester's
// contact info and the distance from the agency's own address (set in
// "Ma zone d'intervention"), when both are geocoded.
router.get('/missions/:id', async (req, res, next) => {
  try {
    const mission = await prisma.mission.findUnique({
      where: { id: req.params.id },
      include: {
        category: true, service: true,
        client: { select: { firstName: true, lastName: true, phone: true, email: true, companyName: true, accountKind: true } },
        booking: { include: { provider: { select: { firstName: true, lastName: true, phone: true } } } },
        offers: { include: { provider: { select: { firstName: true, lastName: true } } } },
        planning: true,
        scheduleEntries: true,
        ...MISSION_BADGES_INCLUDE,
      },
    });
    if (!mission || mission.corporateAgencyId !== req.agency.id) return res.status(404).json({ error: 'Mission introuvable' });

    let distanceKm = null;
    if (mission.lat != null && mission.lng != null && req.agency.lat != null && req.agency.lng != null) {
      distanceKm = Math.round(haversineDistanceKm(req.agency.lat, req.agency.lng, mission.lat, mission.lng) * 10) / 10;
    }

    res.json({ mission, distanceKm });
  } catch (err) { next(err); }
});

// --- Sections 6 & 8bis : Mes factures Jobber / Agence ---
// Presentation (PDF layout, branding) is out of scope for now — this only
// tracks and lists the invoice records themselves.
router.get('/invoices', async (req, res, next) => {
  try {
    const kinds = req.query.type === 'agence' ? ['AGENCY_MISSION', 'AGENCY_MONTHLY'] : ['JOBBER_MISSION', 'JOBBER_MONTHLY'];
    const invoices = await prisma.invoice.findMany({
      where: { agencyId: req.agency.id, kind: { in: kinds } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ invoices });
  } catch (err) { next(err); }
});

router.post('/invoices/generate-mission/:missionId', async (req, res, next) => {
  try {
    const mission = await prisma.mission.findUnique({
      where: { id: req.params.missionId },
      include: { booking: { include: { payment: true } } },
    });
    if (!mission || mission.corporateAgencyId !== req.agency.id) return res.status(404).json({ error: 'Mission introuvable' });
    if (!mission.booking?.payment) return res.status(400).json({ error: 'Aucun paiement associé à cette mission' });

    const isAgencyFulfilled = mission.booking.providerId === req.agency.id;
    const kind = isAgencyFulfilled ? 'AGENCY_MISSION' : 'JOBBER_MISSION';
    const reference = `${mission.corporateCode || mission.id}-${isAgencyFulfilled ? 'SERVICES34' : 'JOBBER'}`;

    const invoice = await prisma.invoice.upsert({
      where: { reference },
      update: {},
      create: { agencyId: req.agency.id, kind, reference, missionId: mission.id, amount: mission.booking.payment.amount },
    });
    res.status(201).json({ invoice });
  } catch (err) { next(err); }
});

const monthlyInvoiceSchema = z.object({ type: z.enum(['jobber', 'agence']) });

router.post('/invoices/generate-monthly', async (req, res, next) => {
  try {
    const { type } = monthlyInvoiceSchema.parse(req.body);
    const now = new Date();
    const periodYear = now.getFullYear();
    const periodMonth = now.getMonth() + 1;
    const kind = type === 'agence' ? 'AGENCY_MONTHLY' : 'JOBBER_MONTHLY';
    const reference = `${periodYear}-${String(periodMonth).padStart(2, '0')}-${type === 'agence' ? 'SERVICES34' : 'jobber'}`;

    const missionKind = type === 'agence' ? 'AGENCY_MISSION' : 'JOBBER_MISSION';
    const monthMissionInvoices = await prisma.invoice.findMany({
      where: {
        agencyId: req.agency.id, kind: missionKind,
        createdAt: { gte: new Date(periodYear, periodMonth - 1, 1), lt: new Date(periodYear, periodMonth, 1) },
      },
    });
    const amount = round2(monthMissionInvoices.reduce((sum, i) => sum + i.amount, 0));

    const invoice = await prisma.invoice.upsert({
      where: { reference },
      update: { amount },
      create: { agencyId: req.agency.id, kind, reference, periodYear, periodMonth, amount },
    });
    res.status(201).json({ invoice });
  } catch (err) {
    if (err.name === 'ZodError') { err.status = 400; err.expose = true; err.message = err.errors[0].message; }
    next(err);
  }
});

// --- Section 9 : Mes employés ---
// "ON" = currently hired — has a live offer or an in-progress booking on
// one of the agency's own missions. Computed separately from the employee
// list itself (a jobber's activeMissions can span any of their categories,
// not just the one they were added under) and merged in below so the
// front-end can split "Mes employés OFF" (full roster) from "Mes employés
// ON" (currently working) without a second round-trip.
router.get('/employees', async (req, res, next) => {
  try {
    const employees = await prisma.agencyEmployee.findMany({
      where: { agencyId: req.agency.id },
      include: {
        jobber: {
          select: {
            id: true, firstName: true, lastName: true, avatarUrl: true, phone: true, email: true,
            providerProfile: {
              include: { categories: { include: { category: true } }, equipment: true, vehicles: true },
            },
          },
        },
      },
      orderBy: { addedAt: 'desc' },
    });

    const jobberIds = employees.map((e) => e.jobber.id);
    const activeMissions = jobberIds.length
      ? await prisma.mission.findMany({
          where: {
            corporateAgencyId: req.agency.id,
            status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS'] },
            offers: { some: { providerId: { in: jobberIds }, status: { in: ['PENDING', 'ACCEPTED'] } } },
          },
          include: {
            category: true,
            offers: { where: { providerId: { in: jobberIds }, status: { in: ['PENDING', 'ACCEPTED'] } } },
          },
        })
      : [];

    const missionsByJobberId = new Map();
    for (const mission of activeMissions) {
      for (const offer of mission.offers) {
        const list = missionsByJobberId.get(offer.providerId) || [];
        list.push({ id: mission.id, title: mission.title, category: mission.category, status: mission.status, offerStatus: offer.status });
        missionsByJobberId.set(offer.providerId, list);
      }
    }

    const enriched = employees.map((e) => ({ ...e, activeMissions: missionsByJobberId.get(e.jobber.id) || [] }));
    res.json({ employees: enriched });
  } catch (err) { next(err); }
});

const addEmployeeSchema = z.object({ jobberId: z.string() });

router.post('/employees', async (req, res, next) => {
  try {
    const { jobberId } = addEmployeeSchema.parse(req.body);
    const jobber = await prisma.user.findUnique({ where: { id: jobberId } });
    if (!jobber) return res.status(404).json({ error: 'Jobber introuvable' });
    const employee = await prisma.agencyEmployee.create({ data: { agencyId: req.agency.id, jobberId } });
    res.status(201).json({ employee });
  } catch (err) {
    if (err.code === 'P2002') { err.status = 409; err.expose = true; err.message = 'Ce jobber fait déjà partie de vos employés'; }
    if (err.name === 'ZodError') { err.status = 400; err.expose = true; err.message = err.errors[0].message; }
    next(err);
  }
});

const embaucheSchema = z.object({
  categoryId: z.string(),
  serviceId: z.string().optional().transform((v) => (v ? v : undefined)),
  title: z.string().min(3),
  description: z.string().min(10),
  address: z.string().min(3),
  workAtHeight: z.boolean().optional(),
  requiredEquipmentIds: z.array(z.string()).optional().default([]),
  requiredVehicleTypes: z.array(z.enum(VEHICLE_TYPES)).optional().default([]),
  otherEquipmentNote: z.string().max(200).optional().transform((v) => (v ? v : undefined)),
  otherVehicleNote: z.string().max(200).optional().transform((v) => (v ? v : undefined)),
  details: missionDetailsSchema,
  dates: z.array(z.object({
    date: z.string(), startTime: z.string(), hours: z.number().positive(), endTime: z.string(),
  })).min(1),
});

// "Embaucher pour une mission" — creates a private, planning-based mission
// addressed to one specific employee jobber (no public listing, no
// competing offers). The jobber accepts/refuses via the normal jobber.city
// offer flow, targeted just at them. Same field set as a normal demande
// (service précis, adresse géocodée, matériel/véhicule requis) so the
// jobber sees a fully-described mission, not an empty shell.
router.post('/employees/:jobberId/embauche', async (req, res, next) => {
  try {
    const { requiredEquipmentIds, dates, ...data } = embaucheSchema.parse(req.body);
    const jobber = await prisma.user.findUnique({ where: { id: req.params.jobberId } });
    if (!jobber) return res.status(404).json({ error: 'Jobber introuvable' });
    const isEmployee = await prisma.agencyEmployee.findUnique({ where: { agencyId_jobberId: { agencyId: req.agency.id, jobberId: jobber.id } } });
    if (!isEmployee) return res.status(403).json({ error: "Ce jobber ne fait pas partie de vos employés" });
    const category = await prisma.category.findUnique({ where: { id: data.categoryId }, select: { id: true, slug: true } });
    if (!category) return res.status(400).json({ error: 'Catégorie introuvable' });

    const firstDate = dates[0];
    const totalHours = dates.reduce((sum, d) => sum + d.hours, 0);
    const geocoded = await geocodeAddress(data.address);

    // "Embaucher" always puts the mission on a planning named after the
    // employee (e.g. "Planning Emily") so the agency can see everything
    // assigned to them at a glance — created on first hire, reused after.
    const planningName = `Planning ${jobber.firstName}`;
    const planning = await prisma.planning.upsert({
      where: { agencyId_name: { agencyId: req.agency.id, name: planningName } },
      update: {},
      create: { agencyId: req.agency.id, name: planningName },
    });

    const mission = await prisma.mission.create({
      data: {
        categoryId: category.id,
        serviceId: data.serviceId,
        title: data.title,
        description: data.description,
        address: data.address,
        lat: geocoded?.lat,
        lng: geocoded?.lng,
        desiredDate: new Date(firstDate.date),
        estimatedHours: totalHours,
        isRecurring: dates.length > 1,
        workAtHeight: data.workAtHeight,
        requiredVehicleTypes: data.requiredVehicleTypes,
        otherEquipmentNote: data.otherEquipmentNote,
        otherVehicleNote: data.otherVehicleNote,
        details: data.details,
        clientId: req.agency.id,
        corporateAgencyId: req.agency.id,
        corporateCode: generateCorporateCode(category.slug),
        visibility: 'PRIVATE',
        planningId: planning.id,
        requiredEquipment: requiredEquipmentIds.length
          ? { create: requiredEquipmentIds.map((equipmentId) => ({ equipmentId })) }
          : undefined,
        scheduleEntries: { create: dates.map((d) => ({ date: new Date(d.date), startTime: d.startTime, hours: d.hours, endTime: d.endTime })) },
      },
      include: { scheduleEntries: true, requiredEquipment: { include: { equipment: true } }, planning: true },
    });

    const offer = await prisma.offer.create({
      data: { missionId: mission.id, providerId: jobber.id, hourlyRate: 0, message: 'Mission planning — embauche directe Services 34' },
    });

    res.status(201).json({ mission, offer });
  } catch (err) {
    if (err.name === 'ZodError') { err.status = 400; err.expose = true; err.message = err.errors[0].message; }
    next(err);
  }
});

// --- Planning ---
// Missions "en cours" get assigned to a Planning so the agency can see
// who's doing what — one per category by default ("Planning Bricolage"),
// or a custom named one (e.g. "Planning Emily" for a specific employee).
router.get('/plannings', async (req, res, next) => {
  try {
    const plannings = await prisma.planning.findMany({
      where: { agencyId: req.agency.id },
      include: {
        category: true,
        missions: {
          include: { category: true, booking: { include: { provider: { select: { firstName: true, lastName: true } } } } },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ plannings });
  } catch (err) { next(err); }
});

const createPlanningSchema = z.object({ name: z.string().min(1), categoryId: z.string().optional() });

router.post('/plannings', async (req, res, next) => {
  try {
    const data = createPlanningSchema.parse(req.body);
    const planning = await prisma.planning.create({
      data: { agencyId: req.agency.id, name: data.name, categoryId: data.categoryId || undefined },
    });
    res.status(201).json({ planning });
  } catch (err) {
    if (err.code === 'P2002') { err.status = 409; err.expose = true; err.message = 'Un planning porte déjà ce nom'; }
    if (err.name === 'ZodError') { err.status = 400; err.expose = true; err.message = err.errors[0].message; }
    next(err);
  }
});

const assignPlanningSchema = z.object({ planningId: z.string() });

router.post('/missions/:id/assign-planning', async (req, res, next) => {
  try {
    const { planningId } = assignPlanningSchema.parse(req.body);
    const mission = await prisma.mission.findUnique({ where: { id: req.params.id } });
    if (!mission || mission.corporateAgencyId !== req.agency.id) return res.status(404).json({ error: 'Mission introuvable' });
    const planning = await prisma.planning.findUnique({ where: { id: planningId } });
    if (!planning || planning.agencyId !== req.agency.id) return res.status(404).json({ error: 'Planning introuvable' });

    const updated = await prisma.mission.update({ where: { id: mission.id }, data: { planningId } });
    res.json({ mission: updated });
  } catch (err) {
    if (err.name === 'ZodError') { err.status = 400; err.expose = true; err.message = err.errors[0].message; }
    next(err);
  }
});

module.exports = router;
