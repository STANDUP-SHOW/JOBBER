const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

const createMissionSchema = z.object({
  categoryId: z.string(),
  serviceId: z.string().optional(),
  title: z.string().min(3),
  description: z.string().min(10),
  address: z.string().min(3),
  lat: z.number().optional(),
  lng: z.number().optional(),
  desiredDate: z.string(), // ISO date
  estimatedHours: z.number().positive().default(1),
});

// Create a mission (client posts a job request)
router.post('/', requireAuth, requireRole('CLIENT'), async (req, res, next) => {
  try {
    const data = createMissionSchema.parse(req.body);
    const mission = await prisma.mission.create({
      data: {
        ...data,
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

// List / search missions (e.g. providers browsing the "joblist")
router.get('/', async (req, res, next) => {
  try {
    const { categoryId, status, clientId } = req.query;
    const missions = await prisma.mission.findMany({
      where: {
        categoryId: categoryId || undefined,
        status: status || undefined,
        clientId: clientId || undefined,
      },
      include: { category: true, service: true, client: { select: { id: true, firstName: true, avatarUrl: true } }, _count: { select: { offers: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ missions });
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
    res.json({ mission });
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
