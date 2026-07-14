const express = require('express');
const crypto = require('crypto');
const prisma = require('../config/prisma');
const { requireAuth } = require('../middleware/auth');
const { geocodeAddress } = require('../services/geocodingService');
const { isValidSiret } = require('../utils/siret');

const router = express.Router();

async function generateReferralCode() {
  for (let i = 0; i < 5; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    if (!(await prisma.user.findUnique({ where: { referralCode: code } }))) return code;
  }
  return crypto.randomBytes(6).toString('hex').toUpperCase();
}

// "Inviter des amis": the referral code, running total earned, and each
// filleul's status (has a booking landed yet, or still "en attente"?).
router.get('/me/referral', requireAuth, async (req, res, next) => {
  try {
    let user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user.referralCode) {
      user = await prisma.user.update({ where: { id: req.user.id }, data: { referralCode: await generateReferralCode() } });
    }

    const referrals = await prisma.user.findMany({
      where: { referredById: req.user.id },
      select: {
        id: true, firstName: true, avatarUrl: true, createdAt: true,
        bookingsAsClient: { select: { id: true }, take: 1 },
      },
    });

    res.json({
      code: user.referralCode,
      totalEarned: user.referralEarned,
      referrals: referrals.map((r) => ({
        id: r.id, firstName: r.firstName, avatarUrl: r.avatarUrl,
        createdAt: r.createdAt, active: r.bookingsAsClient.length > 0,
      })),
    });
  } catch (err) { next(err); }
});

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
        providerProfile: { include: { categories: { include: { category: true } }, services: { include: { service: true } }, equipment: { include: { equipment: true } }, vehicles: true } },
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
        providerProfile: { include: { categories: { include: { category: true } }, services: { include: { service: true } }, equipment: { include: { equipment: true } }, vehicles: true } },
        reviewsReceived: { include: { author: { select: { firstName: true, avatarUrl: true } } }, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!provider || !provider.providerProfile) return res.status(404).json({ error: 'Prestataire introuvable' });
    res.json({ provider });
  } catch (err) { next(err); }
});

router.patch('/me', requireAuth, async (req, res, next) => {
  try {
    const {
      avatarUrl, firstName, lastName, phone, email, address,
      notifyPushNews, notifyEmailNews, notifyEmailPartners, notifySmsOffers, notifySmsCancellation,
    } = req.body;

    let geocoded;
    if (address) geocoded = await geocodeAddress(address);

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        avatarUrl, firstName, lastName, phone, email,
        address,
        lat: geocoded?.lat, lng: geocoded?.lng,
        notifyPushNews, notifyEmailNews, notifyEmailPartners, notifySmsOffers, notifySmsCancellation,
      },
    });
    const { passwordHash, ...safeUser } = user;
    res.json({ user: { ...safeUser, hasPassword: !!passwordHash } });
  } catch (err) {
    if (err.code === 'P2002' && err.meta?.target?.includes('email')) {
      err.status = 409; err.expose = true; err.message = 'Cet email est déjà utilisé par un autre compte';
    }
    next(err);
  }
});

// Deletion anonymizes rather than removes the row: missions, bookings,
// payments and reviews the account took part in must survive for other
// users' history (and, eventually, tax records) — only the PII is scrubbed.
router.delete('/me', requireAuth, async (req, res, next) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        email: `deleted-${req.user.id}@jobber.deleted`,
        passwordHash: null,
        firstName: 'Compte',
        lastName: 'supprimé',
        phone: null,
        avatarUrl: null,
        address: null,
        lat: null,
        lng: null,
        googleId: null,
      },
    });
    res.json({ message: 'Compte supprimé.' });
  } catch (err) { next(err); }
});

router.patch('/me/provider-profile', requireAuth, async (req, res, next) => {
  try {
    const { bio, radiusKm, autoApply, autoPayout, categories, serviceIds, equipmentIds, vehicleTypes, address, siret } = req.body;

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
        equipment: equipmentIds
          ? {
              deleteMany: {},
              create: equipmentIds.map((equipmentId) => ({ equipmentId })),
            }
          : undefined,
        vehicles: vehicleTypes
          ? {
              deleteMany: {},
              create: vehicleTypes.map((type) => ({ type })),
            }
          : undefined,
      },
      include: { categories: { include: { category: true } }, services: { include: { service: true } }, equipment: { include: { equipment: true } }, vehicles: true },
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
