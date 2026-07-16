const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { geocodeAddress, jitterCoordinate, haversineDistanceKm } = require('../services/geocodingService');

const router = express.Router();

// While a mission is still OPEN (open to candidature), expose an approximate
// pin instead of the client's exact geocoded address.
function withPublicPosition(mission) {
  if (mission.status !== 'OPEN' || mission.lat == null || mission.lng == null) return mission;
  const { lat, lng } = jitterCoordinate(mission.id, mission.lat, mission.lng);
  return { ...mission, lat, lng };
}

const createMissionSchema = z.object({
  categoryId: z.string(),
  // The form sends "" for "no service selected" — treat that as unset,
  // otherwise Prisma tries to connect a Service with id "" and 500s.
  serviceId: z.string().optional().transform((v) => (v ? v : undefined)),
  title: z.string().min(3),
  description: z.string().min(10),
  address: z.string().min(3),
  lat: z.number().optional(),
  lng: z.number().optional(),
  photos: z.array(z.string().url()).max(5).optional(),
  desiredDate: z.string(), // ISO date
  estimatedHours: z.number().positive().default(1),
  isUrgent: z.boolean().optional().default(false),
  datesFlexible: z.boolean().optional().default(false),
});

// Create a mission — any authenticated account can post a job request
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const data = createMissionSchema.parse(req.body);
    const geocoded = await geocodeAddress(data.address);
    const mission = await prisma.mission.create({
      data: {
        ...data,
        lat: geocoded?.lat ?? data.lat,
        lng: geocoded?.lng ?? data.lng,
        desiredDate: new Date(data.desiredDate),
        clientId: req.user.id,
      },
    });
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
    const { categoryId, status, clientId } = req.query;
    let missions = await prisma.mission.findMany({
      where: {
        categoryId: categoryId || undefined,
        status: status || undefined,
        clientId: clientId || undefined,
      },
      include: { category: true, service: true, client: { select: { id: true, firstName: true, avatarUrl: true } }, _count: { select: { offers: true } } },
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
          missions = missions.filter(
            (m) =>
              m.lat == null ||
              m.lng == null ||
              haversineDistanceKm(profile.user.lat, profile.user.lng, m.lat, m.lng) <= profile.radiusKm
          );
        }
      }
    }

    res.json({ missions: missions.map(withPublicPosition) });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const mission = await prisma.mission.findUnique({
      where: { id: req.params.id },
      include: {
        category: true,
        service: true,
        client: { select: { id: true, firstName: true, avatarUrl: true } },
        offers: { include: { provider: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, providerProfile: true } } } },
        booking: true,
      },
    });
    if (!mission) return res.status(404).json({ error: 'Mission introuvable' });
    res.json({ mission: withPublicPosition(mission) });
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

module.exports = router;
