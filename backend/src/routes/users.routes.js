const express = require('express');
const prisma = require('../config/prisma');
const { requireAuth } = require('../middleware/auth');
const { geocodeAddress } = require('../services/geocodingService');
const { isValidSiret } = require('../utils/siret');

const router = express.Router();

// Browse providers, optionally filtered by category (for the "Trouvez un prestataire" grid).
// Every account has a providerProfile, so "is a provider" here means they've
// actually picked at least one category — not a role check.
router.get('/providers', async (req, res, next) => {
  try {
    const { categoryId } = req.query;
    const providers = await prisma.user.findMany({
      where: {
        providerProfile: { categories: { some: categoryId ? { categoryId } : {} } },
      },
      select: {
        id: true, firstName: true, lastName: true, avatarUrl: true, address: true,
        providerProfile: { include: { categories: { include: { category: true } }, services: { include: { service: true } } } },
      },
    });
    res.json({ providers });
  } catch (err) { next(err); }
});

router.get('/providers/:id', async (req, res, next) => {
  try {
    const provider = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, firstName: true, lastName: true, avatarUrl: true, address: true, createdAt: true,
        providerProfile: { include: { categories: { include: { category: true } }, services: { include: { service: true } } } },
        reviewsReceived: { include: { author: { select: { firstName: true, avatarUrl: true } } }, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!provider || !provider.providerProfile) return res.status(404).json({ error: 'Prestataire introuvable' });
    res.json({ provider });
  } catch (err) { next(err); }
});

router.patch('/me', requireAuth, async (req, res, next) => {
  try {
    const { avatarUrl } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl },
    });
    const { passwordHash, ...safeUser } = user;
    res.json({ user: safeUser });
  } catch (err) { next(err); }
});

router.patch('/me/provider-profile', requireAuth, async (req, res, next) => {
  try {
    const { bio, radiusKm, autoApply, autoPayout, categories, serviceIds, address, siret } = req.body;

    if (siret !== undefined && siret !== null && siret !== '' && !isValidSiret(siret)) {
      return res.status(400).json({ error: 'Numéro SIRET invalide (14 chiffres)' });
    }

    // "Professionnel" is a claim of registered business status — gate it on
    // a valid SIRET, whether that's already on file or supplied right now.
    if (categories?.some((c) => c.level === 'PROFESSIONNEL')) {
      const effectiveSiret = siret !== undefined
        ? siret
        : (await prisma.providerProfile.findUnique({ where: { userId: req.user.id }, select: { siret: true } }))?.siret;
      if (!isValidSiret(effectiveSiret)) {
        return res.status(400).json({ error: 'Un numéro SIRET valide est requis pour le niveau Professionnel' });
      }
    }

    if (address) {
      const geocoded = await geocodeAddress(address);
      await prisma.user.update({
        where: { id: req.user.id },
        data: { address, lat: geocoded?.lat, lng: geocoded?.lng },
      });
    }

    const profile = await prisma.providerProfile.update({
      where: { userId: req.user.id },
      data: {
        bio, radiusKm, autoApply, autoPayout,
        siret: siret !== undefined ? (siret || null) : undefined,
        categories: categories
          ? {
              deleteMany: {},
              create: categories.map(({ categoryId, level, hourlyRate }) => ({
                categoryId, level: level || 'PASSIONNE', hourlyRate: hourlyRate || 15,
              })),
            }
          : undefined,
        services: serviceIds
          ? {
              deleteMany: {},
              create: serviceIds.map((serviceId) => ({ serviceId })),
            }
          : undefined,
      },
      include: { categories: { include: { category: true } }, services: { include: { service: true } } },
    });

    res.json({ profile });
  } catch (err) {
    if (err.code === 'P2002' && err.meta?.target?.includes('siret')) {
      err.status = 409; err.expose = true; err.message = 'Ce numéro SIRET est déjà utilisé par un autre compte';
    }
    next(err);
  }
});

module.exports = router;
