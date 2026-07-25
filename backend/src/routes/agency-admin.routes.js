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
const { REFUSAL_REASONS_JOBBER } = require('../utils/agency');

const router = express.Router();

const MAX_PIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

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
    res.json({ token, agency: { id: agency.id, companyName: agency.companyName, adminLoginId: agency.adminLoginId, serviceRadiusKm: agency.serviceRadiusKm } });
  } catch (err) {
    if (err.name === 'ZodError') { err.status = 400; err.expose = true; err.message = err.errors[0].message; }
    next(err);
  }
});

router.use(requireAgencyAuth);

router.get('/me', (req, res) => {
  res.json({ agency: { id: req.agency.id, companyName: req.agency.companyName, adminLoginId: req.agency.adminLoginId, serviceRadiusKm: req.agency.serviceRadiusKm } });
});

const credentialsSchema = z.object({
  loginId: z.string().min(1).optional(),
  pin: z.string().min(4).max(12).optional(),
  serviceRadiusKm: z.number().min(1).max(150).optional(),
});

router.patch('/credentials', async (req, res, next) => {
  try {
    const data = credentialsSchema.parse(req.body);
    const update = {};
    if (data.loginId) update.adminLoginId = data.loginId;
    if (data.pin) update.adminPinHash = await bcrypt.hash(data.pin, 10);
    if (data.serviceRadiusKm) update.serviceRadiusKm = data.serviceRadiusKm;
    const agency = await prisma.user.update({ where: { id: req.agency.id }, data: update });
    res.json({ agency: { id: agency.id, companyName: agency.companyName, adminLoginId: agency.adminLoginId, serviceRadiusKm: agency.serviceRadiusKm } });
  } catch (err) {
    if (err.name === 'ZodError') { err.status = 400; err.expose = true; err.message = err.errors[0].message; }
    if (err.code === 'P2002') { err.status = 409; err.expose = true; err.message = 'Cet identifiant est déjà utilisé'; }
    next(err);
  }
});

// --- Section 1 : Demandes d'interventions reçues ---
// Missions submitted via the agency's own site, still private and not yet
// decided (neither published to Jobber nor handled directly by the agency).
router.get('/missions/received', async (req, res, next) => {
  try {
    const missions = await prisma.mission.findMany({
      where: { corporateAgencyId: req.agency.id, visibility: 'PRIVATE', status: 'OPEN', offers: { none: {} } },
      include: { category: true, service: true, client: { select: { firstName: true, lastName: true, phone: true, email: true } } },
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

const agenceOfferSchema = z.object({ hourlyRate: z.number().positive() });

// "Mission Agence" — the agency itself takes the mission, without ever
// publishing it to Jobber. Creates a direct Offer from the agency, exactly
// like a jobber applying, so the requester gets a normal offer to accept.
router.post('/missions/:id/agence', async (req, res, next) => {
  try {
    const { hourlyRate } = agenceOfferSchema.parse(req.body);
    const mission = await prisma.mission.findUnique({ where: { id: req.params.id } });
    if (!mission || mission.corporateAgencyId !== req.agency.id) return res.status(404).json({ error: 'Demande introuvable' });

    const offer = await prisma.offer.create({
      data: { missionId: mission.id, providerId: req.agency.id, hourlyRate },
    });
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
        mission: { select: { id: true, title: true, corporateCode: true, estimatedHours: true, desiredDate: true } },
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
      include: { category: true, booking: { include: { provider: { select: { firstName: true, lastName: true } } } } },
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
      include: { category: true, booking: { include: { provider: { select: { firstName: true, lastName: true } } } } },
      orderBy: { updatedAt: 'desc' },
    });
    res.json({ missions });
  } catch (err) { next(err); }
});

// --- Sections 7-8 : Missions Agence en cours / terminées ---
// Same shape, but for missions the agency fulfilled itself (booking.providerId === agency.id).
router.get('/missions/agence/en-cours', async (req, res, next) => {
  try {
    const missions = await prisma.mission.findMany({
      where: { corporateAgencyId: req.agency.id, status: { in: ['ASSIGNED', 'IN_PROGRESS'] }, booking: { providerId: req.agency.id } },
      include: { category: true, booking: true, client: { select: { firstName: true, lastName: true, phone: true } } },
      orderBy: { desiredDate: 'asc' },
    });
    res.json({ missions });
  } catch (err) { next(err); }
});

router.get('/missions/agence/terminees', async (req, res, next) => {
  try {
    const missions = await prisma.mission.findMany({
      where: { corporateAgencyId: req.agency.id, status: 'COMPLETED', booking: { providerId: req.agency.id } },
      include: { category: true, booking: true, client: { select: { firstName: true, lastName: true, phone: true } } },
      orderBy: { updatedAt: 'desc' },
    });
    res.json({ missions });
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
router.get('/employees', async (req, res, next) => {
  try {
    const employees = await prisma.agencyEmployee.findMany({
      where: { agencyId: req.agency.id },
      include: {
        jobber: {
          select: {
            id: true, firstName: true, lastName: true, avatarUrl: true,
            providerProfile: {
              include: { categories: { include: { category: true } }, equipment: true, vehicles: true },
            },
          },
        },
      },
      orderBy: { addedAt: 'desc' },
    });
    res.json({ employees });
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
  serviceId: z.string().optional(),
  title: z.string().min(3),
  description: z.string().min(10),
  address: z.string().min(3),
  dates: z.array(z.object({
    date: z.string(), startTime: z.string(), hours: z.number().positive(), endTime: z.string(),
  })).min(1),
});

// "Embaucher pour une mission" — creates a private, planning-based mission
// addressed to one specific employee jobber (no public listing, no
// competing offers). The jobber accepts/refuses via the normal jobber.city
// offer flow, targeted just at them.
router.post('/employees/:jobberId/embauche', async (req, res, next) => {
  try {
    const data = embaucheSchema.parse(req.body);
    const jobber = await prisma.user.findUnique({ where: { id: req.params.jobberId } });
    if (!jobber) return res.status(404).json({ error: 'Jobber introuvable' });
    const isEmployee = await prisma.agencyEmployee.findUnique({ where: { agencyId_jobberId: { agencyId: req.agency.id, jobberId: jobber.id } } });
    if (!isEmployee) return res.status(403).json({ error: "Ce jobber ne fait pas partie de vos employés" });

    const firstDate = data.dates[0];
    const totalHours = data.dates.reduce((sum, d) => sum + d.hours, 0);

    const mission = await prisma.mission.create({
      data: {
        categoryId: data.categoryId,
        serviceId: data.serviceId || undefined,
        title: data.title,
        description: data.description,
        address: data.address,
        desiredDate: new Date(firstDate.date),
        estimatedHours: totalHours,
        clientId: req.agency.id,
        corporateAgencyId: req.agency.id,
        visibility: 'PRIVATE',
        scheduleEntries: { create: data.dates.map((d) => ({ date: new Date(d.date), startTime: d.startTime, hours: d.hours, endTime: d.endTime })) },
      },
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

module.exports = router;
