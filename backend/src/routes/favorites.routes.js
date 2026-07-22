const express = require('express');
const prisma = require('../config/prisma');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// "Mes jobbers favoris" — a manager bookmarking a provider, independent of
// whether a booking ever took place.
router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { managerId: req.user.id },
      include: {
        provider: {
          select: {
            id: true, firstName: true, lastName: true, avatarUrl: true,
            providerProfile: { include: { categories: { include: { category: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ favorites });
  } catch (err) { next(err); }
});

router.post('/:providerId', requireAuth, async (req, res, next) => {
  try {
    if (req.params.providerId === req.user.id) {
      return res.status(400).json({ error: 'Vous ne pouvez pas vous ajouter vous-même' });
    }
    const provider = await prisma.user.findUnique({ where: { id: req.params.providerId }, include: { providerProfile: true } });
    if (!provider || !provider.providerProfile) return res.status(404).json({ error: 'Prestataire introuvable' });

    const favorite = await prisma.favorite.upsert({
      where: { managerId_providerId: { managerId: req.user.id, providerId: req.params.providerId } },
      update: {},
      create: { managerId: req.user.id, providerId: req.params.providerId },
    });
    res.status(201).json({ favorite });
  } catch (err) { next(err); }
});

router.delete('/:providerId', requireAuth, async (req, res, next) => {
  try {
    await prisma.favorite.deleteMany({ where: { managerId: req.user.id, providerId: req.params.providerId } });
    res.status(204).end();
  } catch (err) { next(err); }
});

module.exports = router;
