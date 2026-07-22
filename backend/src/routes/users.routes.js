const express = require('express');
const crypto = require('crypto');
const prisma = require('../config/prisma');
const { requireAuth } = require('../middleware/auth');
const { geocodeAddress } = require('../services/geocodingService');
const { isValidSiret } = require('../utils/siret');
const { generateCategoryBio } = require('../services/aiService');

const router = express.Router();

// "Mes Badges et récompenses" — computed live from real provider stats
// (no separate awarded-badges table to keep in sync): a badge is earned the
// moment the underlying stat crosses its threshold, and lost if it ever
// drops back below (e.g. rating average slipping under 4.5).
const BADGE_DEFINITIONS = [
  { id: 'first-mission', icon: '🥉', name: 'Première mission', description: 'Terminez votre première mission', check: (s) => s.completedMissions >= 1 },
  { id: 'confirmed', icon: '🥈', name: 'Jobber confirmé', description: '10 missions terminées', check: (s) => s.completedMissions >= 10 },
  { id: 'expert', icon: '🥇', name: 'Jobber expert', description: '50 missions terminées', check: (s) => s.completedMissions >= 50 },
  { id: 'trusted', icon: '⭐', name: 'Jobber de confiance', description: 'Note moyenne d\'au moins 4,5 sur au moins 5 avis', check: (s) => s.ratingAverage >= 4.5 && s.ratingCount >= 5 },
  { id: 'versatile', icon: '🎯', name: 'Multi-compétences', description: 'Actif dans au moins 3 catégories', check: (s) => s.categoriesCount >= 3 },
];

router.get('/me/badges', requireAuth, async (req, res, next) => {
  try {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId: req.user.id },
      include: { categories: true },
    });
    if (!profile) return res.status(404).json({ error: 'Profil prestataire introuvable' });
    const stats = {
      completedMissions: profile.completedMissions,
      ratingAverage: profile.ratingAverage,
      ratingCount: profile.ratingCount,
      categoriesCount: profile.categories.length,
    };
    const badges = BADGE_DEFINITIONS.map(({ check, ...b }) => ({ ...b, earned: check(stats) }));
    res.json({ badges, stats });
  } catch (err) { next(err); }
});

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
        id: true, firstName: true, lastName: true, avatarUrl: true, address: true, isProfessional: true,
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
        id: true, firstName: true, lastName: true, avatarUrl: true, address: true, createdAt: true, isProfessional: true,
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
      companyName, companySiret,
      notifyPushNews, notifyEmailNews, notifyEmailPartners, notifySmsOffers, notifySmsCancellation,
    } = req.body;

    if (companySiret !== undefined && companySiret !== null && companySiret !== '' && !isValidSiret(companySiret)) {
      return res.status(400).json({ error: 'Numéro SIRET invalide (14 chiffres)' });
    }

    let geocoded;
    if (address) geocoded = await geocodeAddress(address);

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        avatarUrl, firstName, lastName, phone, email,
        address,
        lat: geocoded?.lat, lng: geocoded?.lng,
        companyName: companyName?.trim(), companySiret,
        notifyPushNews, notifyEmailNews, notifyEmailPartners, notifySmsOffers, notifySmsCancellation,
      },
    });
    const { passwordHash, ...safeUser } = user;
    res.json({ user: { ...safeUser, hasPassword: !!passwordHash } });
  } catch (err) {
    if (err.code === 'P2002' && err.meta?.target?.includes('email')) {
      err.status = 409; err.expose = true; err.message = 'Cet email est déjà utilisé par un autre compte';
    }
    if (err.code === 'P2002' && err.meta?.target?.includes('companySiret')) {
      err.status = 409; err.expose = true; err.message = 'Ce numéro SIRET est déjà utilisé par un autre compte';
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
    const { radiusKm, autoApply, autoPayout, offersLessons, categories, serviceIds, equipmentIds, vehicleTypes, address, siret } = req.body;

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
        radiusKm, autoApply, autoPayout, offersLessons,
        siret: siret !== undefined ? (siret || null) : undefined,
        categories: categories
          ? {
              deleteMany: {},
              create: categories.map(({ categoryId, level, hourlyRate, bio }) => ({
                categoryId, level: level || 'PASSIONNE', hourlyRate: hourlyRate || 15, bio: bio || null,
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

// "Générer avec l'IA" on the skill-category bio field.
router.post('/me/provider-profile/generate-bio', requireAuth, async (req, res, next) => {
  try {
    const { categoryId, level, serviceNames } = req.body;
    if (!categoryId) return res.status(400).json({ error: 'categoryId requis' });

    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) return res.status(404).json({ error: 'Catégorie introuvable' });

    const bio = await generateCategoryBio({ categoryName: category.name, level, serviceNames });
    res.json({ bio });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
