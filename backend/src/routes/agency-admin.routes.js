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
const { sendAgenceProposalEmail, notifyBookingAccepted } = require('../services/emailService');
const { getCounts, markSeen } = require('../services/notificationCounts');
const { runAutoSelect } = require('../services/agencyMarginWorkflow');
const { computeWaivableFee, PROVIDER_FEE, AGENCY_PLATFORM_FEE } = require('../services/bookingService');
const { captureIntent } = require('../services/stripeService');
const { notifyPaymentReceived, notifyAgencyMissionAwaitingValidation } = require('../services/notificationService');

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

// Distance from the agency's own address (set in "Ma zone d'intervention")
// to the mission's — shown as a blue/yellow badge on every mission tile in
// the admin so staff can gauge travel at a glance, not just on the detail
// page.
function attachDistanceKm(mission, agency) {
  if (mission.lat == null || mission.lng == null || agency.lat == null || agency.lng == null) {
    return { ...mission, distanceKm: null };
  }
  return { ...mission, distanceKm: Math.round(haversineDistanceKm(agency.lat, agency.lng, mission.lat, mission.lng) * 10) / 10 };
}

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

// --- Notification badges (left nav "unread" counts) ---
// Offer and ContactMessage have no updatedAt column, so those two sections
// key off createdAt alone; Mission does have updatedAt, so sections that
// are really about a mission *entering* a status (assigned, completed…)
// also count a mission updated since the section was last viewed.

router.get('/notification-counts', async (req, res, next) => {
  try {
    const agencyId = req.agency.id;
    const updatedSince = (since) => ({ OR: [{ createdAt: { gt: since } }, { updatedAt: { gt: since } }] });
    const sections = {
      'demandes-recues': (since) => prisma.mission.count({
        where: { corporateAgencyId: agencyId, clientId: { not: agencyId }, visibility: 'PRIVATE', status: 'OPEN', offers: { none: {} }, ...updatedSince(since) },
      }),
      'demandes-jobber': (since) => prisma.mission.count({
        where: { corporateAgencyId: agencyId, visibility: 'PUBLIC', status: 'OPEN', ...updatedSince(since) },
      }),
      'offres-jobber': (since) => prisma.offer.count({
        where: { status: 'PENDING', providerId: { not: agencyId }, mission: { corporateAgencyId: agencyId, visibility: 'PUBLIC' }, createdAt: { gt: since } },
      }),
      'missions-jobber-en-cours': (since) => prisma.mission.count({
        where: { corporateAgencyId: agencyId, visibility: 'PUBLIC', status: { in: ['ASSIGNED', 'IN_PROGRESS'] }, booking: { providerId: { not: agencyId } }, ...updatedSince(since) },
      }),
      'missions-jobber-terminees': (since) => prisma.mission.count({
        where: { corporateAgencyId: agencyId, visibility: 'PUBLIC', status: 'COMPLETED', booking: { providerId: { not: agencyId } }, ...updatedSince(since) },
      }),
      'missions-agence-propositions': (since) => prisma.mission.count({
        where: { corporateAgencyId: agencyId, status: 'OPEN', offers: { some: { providerId: agencyId, status: 'PENDING' } }, ...updatedSince(since) },
      }),
      'missions-agence-en-cours': (since) => prisma.mission.count({
        where: { corporateAgencyId: agencyId, visibility: 'PRIVATE', status: { in: ['ASSIGNED', 'IN_PROGRESS'] }, ...updatedSince(since) },
      }),
      'missions-agence-terminees': (since) => prisma.mission.count({
        where: { corporateAgencyId: agencyId, visibility: 'PRIVATE', status: 'COMPLETED', ...updatedSince(since) },
      }),
      clients: (since) => prisma.mission.count({
        where: { corporateAgencyId: agencyId, clientId: { not: agencyId }, createdAt: { gt: since } },
      }),
      'contact-messages': (since) => prisma.contactMessage.count({
        where: { agencyId, createdAt: { gt: since } },
      }),
    };
    const counts = await getCounts('AGENCY', agencyId, sections);
    res.json({ counts });
  } catch (err) { next(err); }
});

router.post('/notification-counts/:section/seen', async (req, res, next) => {
  try {
    await markSeen('AGENCY', req.agency.id, req.params.section);
    res.json({ ok: true });
  } catch (err) { next(err); }
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
    res.json({ missions: missions.map((m) => attachDistanceKm(m, req.agency)) });
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
  // Same GET Mission mechanic as jobber.city's own creation form — a fixed,
  // non-negotiable total price, first jobber to claim it gets it. Only
  // meaningful once the agency publishes this mission to Jobber.
  isGetMission: z.boolean().optional().default(false),
  getMissionPrice: z.number().positive().optional(),
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
    if (!data.isGetMission) {
      data.getMissionPrice = undefined;
    } else if (!data.getMissionPrice) {
      return res.status(400).json({ error: 'Le tarif de la GET Mission est requis' });
    }
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
        isGetMission: data.isGetMission,
        getMissionPrice: data.getMissionPrice,
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
    res.json({ missions: missions.map((m) => attachDistanceKm(m, req.agency)) });
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
    await runAutoSelect(req.agency.id);
    const missions = await prisma.mission.findMany({
      where: { corporateAgencyId: req.agency.id, visibility: 'PUBLIC', status: 'OPEN' },
      include: {
        category: true, service: true,
        offers: { where: { status: 'PENDING' }, include: { provider: { select: { firstName: true, lastName: true } } } },
        ...MISSION_BADGES_INCLUDE,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ missions: missions.map((m) => attachDistanceKm(m, req.agency)) });
  } catch (err) { next(err); }
});

// --- Section 3 : Offres Jobber ---
// Offers auto-SELECTED as the best of 5+ received (or after 11h open) on
// one of the agency's published missions — ready for the agency to build a
// client devis from (POST /offers/:id/quote), never the agency's own
// self-offers.
router.get('/offers', async (req, res, next) => {
  try {
    await runAutoSelect(req.agency.id);
    const offers = await prisma.offer.findMany({
      where: {
        status: 'SELECTED',
        providerId: { not: req.agency.id },
        mission: { corporateAgencyId: req.agency.id, visibility: 'PUBLIC' },
      },
      include: {
        mission: {
          select: {
            id: true, title: true, corporateCode: true, estimatedHours: true, desiredDate: true,
            address: true, lat: true, lng: true, isUrgent: true, datesFlexible: true, workAtHeight: true, isRecurring: true,
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
    res.json({
      offers: offers.map((o) => ({ ...o, mission: attachDistanceKm(o.mission, req.agency) })),
      refusalReasons: REFUSAL_REASONS_JOBBER,
    });
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

// AGENCY_PLATFORM_FEE now imported from bookingService.js (shared with
// offers.routes.js's isAgenceOffer branch, which actually collects it from
// the client at devis-acceptance time — see /bookings/:id/commander below
// for why it's not subtracted again from the agency's margin).

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
    notifyBookingAccepted(booking.id);

    res.json({ booking });
  } catch (err) { next(err); }
});

const quoteSchema = z.object({ amount: z.number().positive() });

// "Devis client" — turns a SELECTED jobber offer into the agency's own
// client-facing offer, priced at whatever the agency chooses (defaults to
// jobber total + 30% margin client-side). This is a normal Offer with the
// agency as provider, so it flows through the exact same client "mes
// offres reçues" accept flow as a direct Mission Agence offer — the client
// never sees the jobber. `sourceOfferId` remembers which jobber offer this
// was built from, so "Commander la mission" (after the client accepts)
// knows who to actually book.
router.post('/offers/:id/quote', async (req, res, next) => {
  try {
    const { amount } = quoteSchema.parse(req.body);
    const offer = await prisma.offer.findUnique({ where: { id: req.params.id }, include: { mission: true } });
    if (!offer || offer.mission.corporateAgencyId !== req.agency.id) return res.status(404).json({ error: 'Offre introuvable' });
    if (offer.status !== 'SELECTED') return res.status(400).json({ error: "Cette offre n'est plus disponible pour un devis" });

    const hourlyRate = round2(amount / offer.mission.estimatedHours);
    const quoteOffer = await prisma.offer.create({
      data: {
        missionId: offer.missionId,
        providerId: req.agency.id,
        hourlyRate,
        sourceOfferId: offer.id,
      },
    });

    res.status(201).json({ offer: quoteOffer });
  } catch (err) {
    if (err.name === 'ZodError') { err.status = 400; err.expose = true; err.message = err.errors[0].message; }
    if (err.code === 'P2002') { err.status = 409; err.expose = true; err.message = 'Un devis existe déjà pour cette demande'; }
    next(err);
  }
});

// --- Offre acceptée par le client ---
// Once the client accepts the agency's devis (via the normal offers.routes
// /accept — same isAgenceOffer path as a direct Mission Agence booking),
// that devis Offer flips to ACCEPTED and its Booking still has
// providerId = the agency itself. That's exactly what makes a booking show
// up here: the agency has been paid its due, but the real jobber isn't
// booked yet. Offer has no Prisma relation back to Booking (Booking.offerId
// is a bare scalar), so bookings are matched to their devis by missionId.
router.get('/missions/offre-acceptee', async (req, res, next) => {
  try {
    const quoteOffers = await prisma.offer.findMany({
      where: {
        providerId: req.agency.id,
        status: 'ACCEPTED',
        sourceOfferId: { not: null },
        mission: { corporateAgencyId: req.agency.id },
      },
      include: {
        mission: { include: { category: true, client: { select: { firstName: true, lastName: true, phone: true } } } },
        sourceOffer: { include: { provider: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const bookings = await prisma.booking.findMany({ where: { missionId: { in: quoteOffers.map((o) => o.missionId) } } });
    const bookingByMission = Object.fromEntries(bookings.map((b) => [b.missionId, b]));

    const pending = quoteOffers
      .map((offer) => ({ offer, booking: bookingByMission[offer.missionId] }))
      .filter(({ booking }) => booking && booking.providerId === req.agency.id);

    res.json({ pending });
  } catch (err) { next(err); }
});

// "Commander la mission" — the agency confirms the client's accepted devis
// and only NOW does the actual jobber get notified. Reassigns the existing
// booking's provider from the agency to the jobber (same move as
// "Embaucher un employé" on a Mission Agence booking) rather than creating
// a second booking, since Booking.missionId is unique — one booking per
// mission throughout. The client's escrowed payment is untouched; only the
// payout is revised down to what the jobber actually quoted (the agency
// keeps the difference as its margin, net of Jobber's 10€ facilitation fee
// — there's no separate money movement for that fee in this model yet).
router.post('/bookings/:id/commander', async (req, res, next) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { mission: true, payment: true },
    });
    if (!booking || booking.mission.corporateAgencyId !== req.agency.id) return res.status(404).json({ error: 'Mission introuvable' });
    if (booking.providerId !== req.agency.id) return res.status(400).json({ error: 'Mission déjà commandée' });

    const quoteOffer = await prisma.offer.findUnique({ where: { id: booking.offerId } });
    const sourceOffer = quoteOffer?.sourceOfferId ? await prisma.offer.findUnique({ where: { id: quoteOffer.sourceOfferId } }) : null;
    if (!sourceOffer) return res.status(400).json({ error: "Cette mission n'a pas de devis basé sur une offre jobber" });

    const jobberHours = sourceOffer.hours ?? booking.mission.estimatedHours;
    const jobberExtraFeesTotal = (sourceOffer.extraFees || []).reduce((sum, f) => sum + f.amount, 0);
    const jobberTotal = round2(sourceOffer.hourlyRate * jobberHours + jobberExtraFeesTotal);

    // Same MANAGER/JOBBER subscription-waiver rule as a normal mission,
    // applied to the real jobber now that we know who they are.
    const { fee: providerFee, waived: providerFeeWaived, sub: providerSub } = await computeWaivableFee({
      userId: sourceOffer.providerId, family: 'JOBBER', baseFee: PROVIDER_FEE,
    });
    const providerPayout = round2(jobberTotal - providerFee);

    // The client's devis price (booking.totalAmount) already bakes in
    // whatever markup the agency chose over the jobber's own quote — that
    // markup IS the agency's margin. AGENCY_PLATFORM_FEE was already
    // collected from the client directly at devis-acceptance time (see
    // offers.routes.js isAgenceOffer, folded into payment.managerFee), so it
    // must NOT be subtracted again here — doing so would double-charge it.
    const agencyMargin = round2(booking.totalAmount - jobberTotal);
    // Jobber-the-platform's own revenue accumulates: managerFee +
    // AGENCY_PLATFORM_FEE were already in payment.platformFee since accept;
    // providerFee (taken from the jobber's payout) adds to it now.
    const platformFee = round2((booking.payment?.platformFee ?? 0) + providerFee);

    // hours/hourlyRate stay as the client's contract terms (booking.totalAmount
    // is what the client is paying, unaffected by this step) — only who does
    // the work changes, exactly like reassigning an employee.
    const [updatedBooking] = await prisma.$transaction([
      prisma.booking.update({
        where: { id: booking.id },
        data: { providerId: sourceOffer.providerId },
      }),
      prisma.payment.update({
        where: { bookingId: booking.id },
        data: { providerPayout, providerFee, platformFee, agencyCommission: agencyMargin },
      }),
      prisma.offer.update({ where: { id: sourceOffer.id }, data: { status: 'ACCEPTED' } }),
      ...(providerFeeWaived
        ? [prisma.subscription.update({ where: { id: providerSub.id }, data: { missionsUsedInPeriod: { increment: 1 } } })]
        : []),
    ]);
    notifyBookingAccepted(updatedBooking.id);

    res.json({ booking: updatedBooking });
  } catch (err) { next(err); }
});

// "Valider et payer" — the agency's own completion-validation step. For a
// corporate-agency-sourced mission the real end client already paid upfront
// at devis-acceptance, so the client's PATCH /bookings/:id/complete is
// blocked for these (see bookings.routes.js) — this is the only path that
// captures the escrowed Stripe payment, pays the jobber's wallet, and
// credits the agency's own commission to its creditBalance. Mirrors
// payments.routes.js's POST /:bookingId/release, just scoped to req.agency
// instead of booking.clientId since the agency is the validator here.
router.patch('/bookings/:id/valider-fin-mission', async (req, res, next) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { mission: true, payment: true },
    });
    if (!booking || booking.mission.corporateAgencyId !== req.agency.id) {
      return res.status(404).json({ error: 'Mission introuvable' });
    }
    if (booking.status !== 'AWAITING_VALIDATION') {
      return res.status(400).json({ error: "Le jobber doit d'abord marquer la mission comme terminée" });
    }
    if (booking.payment?.status !== 'HELD_IN_ESCROW' || !booking.payment.stripePaymentIntentId) {
      return res.status(400).json({ error: "Le client n'a pas encore payé cette mission" });
    }

    await captureIntent(booking.payment.stripePaymentIntentId);

    const [, , payment] = await prisma.$transaction([
      prisma.booking.update({ where: { id: booking.id }, data: { status: 'COMPLETED' } }),
      prisma.mission.update({ where: { id: booking.missionId }, data: { status: 'COMPLETED' } }),
      prisma.payment.update({
        where: { bookingId: booking.id },
        data: { status: 'RELEASED', paidAt: new Date(), releasedAt: new Date() },
      }),
      prisma.providerProfile.update({
        where: { userId: booking.providerId },
        data: {
          walletBalance: { increment: booking.payment.providerPayout },
          completedMissions: { increment: 1 },
        },
      }),
      prisma.user.update({
        where: { id: req.agency.id },
        data: { creditBalance: { increment: booking.payment.agencyCommission } },
      }),
    ]);
    notifyPaymentReceived(booking.id, booking.payment.providerPayout);

    res.json({ payment });
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
        // OPEN (just published to jobber.city, no offer accepted yet — no
        // Booking exists) has no booking relation to filter on, so it's
        // matched unconditionally; ASSIGNED/IN_PROGRESS still need the
        // booking.providerId check to exclude the agency's own "Mission
        // Agence" bookings (those live in the separate agence/en-cours list).
        OR: [
          { status: 'OPEN' },
          { status: { in: ['ASSIGNED', 'IN_PROGRESS'] }, booking: { providerId: { not: req.agency.id } } },
        ],
      },
      include: { category: true, planning: true, booking: { include: { provider: { select: { firstName: true, lastName: true } } } }, _count: { select: { offers: true } }, ...MISSION_BADGES_INCLUDE },
      orderBy: { desiredDate: 'asc' },
    });
    res.json({ missions: missions.map((m) => attachDistanceKm(m, req.agency)) });
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
    res.json({ missions: missions.map((m) => attachDistanceKm(m, req.agency)) });
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
    res.json({ missions: missions.map((m) => attachDistanceKm(m, req.agency)) });
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
    res.json({ missions: missions.map((m) => attachDistanceKm(m, req.agency)) });
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
    res.json({ missions: missions.map((m) => attachDistanceKm(m, req.agency)) });
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

// --- Nous contacter — this agency's own inbox (agencyId = req.agency.id) ---

router.get('/contact-messages', async (req, res, next) => {
  try {
    const contactMessages = await prisma.contactMessage.findMany({
      where: { agencyId: req.agency.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ contactMessages });
  } catch (err) { next(err); }
});

router.get('/contact-messages/:id', async (req, res, next) => {
  try {
    const contactMessage = await prisma.contactMessage.findFirst({ where: { id: req.params.id, agencyId: req.agency.id } });
    if (!contactMessage) return res.status(404).json({ error: 'Message introuvable' });
    res.json({ contactMessage });
  } catch (err) { next(err); }
});

router.patch('/contact-messages/:id', async (req, res, next) => {
  try {
    const status = ['NEW', 'READ', 'REPLIED'].includes(req.body.status) ? req.body.status : undefined;
    if (!status) return res.status(400).json({ error: 'Statut invalide' });
    const { count } = await prisma.contactMessage.updateMany({ where: { id: req.params.id, agencyId: req.agency.id }, data: { status } });
    if (!count) return res.status(404).json({ error: 'Message introuvable' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// --- Clients — visitors who registered on this agency's own site and posted
// a mission through it. Distinct from "Mes employés" (agency-admin/employees),
// which is the jobber-side roster. There's no stored "signed up via this
// agency" flag on User, so membership here is derived from having at least
// one Mission with this agency's corporateAgencyId (excluding the agency's
// own self-authored missions). ---

async function clientActivityStats(agencyId, clientId) {
  const missionWhere = { corporateAgencyId: agencyId, clientId };
  const [missionsPublished, missionsCompleted, missionsCancelled, reviewsGiven, spentAgg] = await Promise.all([
    prisma.mission.count({ where: missionWhere }),
    prisma.mission.count({ where: { ...missionWhere, status: 'COMPLETED' } }),
    prisma.mission.count({ where: { ...missionWhere, status: 'CANCELLED' } }),
    prisma.review.count({ where: { authorId: clientId, booking: { mission: { corporateAgencyId: agencyId } } } }),
    prisma.payment.aggregate({
      where: { status: 'RELEASED', booking: { mission: missionWhere } },
      _sum: { amount: true },
    }),
  ]);
  return { missionsPublished, missionsCompleted, missionsCancelled, reviewsGiven, totalSpent: spentAgg._sum.amount || 0 };
}

router.get('/clients', async (req, res, next) => {
  try {
    const clientIdRows = await prisma.mission.findMany({
      where: { corporateAgencyId: req.agency.id, clientId: { not: req.agency.id } },
      distinct: ['clientId'],
      select: { clientId: true },
    });
    const clientIds = clientIdRows.map((r) => r.clientId);
    if (!clientIds.length) return res.json({ clients: [] });

    const { search } = req.query;
    const users = await prisma.user.findMany({
      where: {
        id: { in: clientIds },
        ...(search ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        } : {}),
      },
      select: {
        id: true, firstName: true, lastName: true, email: true, phone: true, avatarUrl: true, address: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const clients = await Promise.all(users.map(async (u) => ({ ...u, ...(await clientActivityStats(req.agency.id, u.id)) })));
    res.json({ clients });
  } catch (err) { next(err); }
});

router.get('/clients/:id', async (req, res, next) => {
  try {
    const isClient = await prisma.mission.findFirst({ where: { corporateAgencyId: req.agency.id, clientId: req.params.id } });
    if (!isClient) return res.status(404).json({ error: 'Client introuvable' });

    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatarUrl: true, address: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: 'Client introuvable' });

    const [stats, missions] = await Promise.all([
      clientActivityStats(req.agency.id, user.id),
      prisma.mission.findMany({
        where: { corporateAgencyId: req.agency.id, clientId: user.id },
        select: { id: true, title: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    res.json({ client: { ...user, ...stats, missions } });
  } catch (err) { next(err); }
});

module.exports = router;
