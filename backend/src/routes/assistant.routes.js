const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { optionalAuth } = require('../middleware/auth');
const { resolveAgencyFromOrigin } = require('../utils/agency');
const { reverseGeocodeLabel } = require('../services/geocodingService');
const { runAssistantTurn } = require('../services/missionAssistantService');

const router = express.Router();

// Each turn is a paid model call and the route is public (the mission is
// described before signing in), so cap it per IP. In-memory is enough for a
// single Railway instance.
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 40;
const hits = new Map();
function rateLimit(req, res, next) {
  const key = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip;
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX) {
    return res.status(429).json({ error: "Beaucoup de demandes d'un coup : réessayez dans quelques minutes." });
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  next();
}

// Photos come from our own unsigned Cloudinary upload (see
// frontend/lib/cloudinary.js) — nothing else is forwarded to the model.
const photoUrl = z.string().url().refine((u) => u.startsWith('https://res.cloudinary.com/'), 'Photo non prise en charge');

const turnSchema = z.object({
  conversation: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    text: z.string().max(2000).default(''),
    photos: z.array(photoUrl).max(5).optional().default([]),
  })).min(1).max(16)
    .refine((c) => c[0].role === 'user' && c[c.length - 1].role === 'user', 'Conversation invalide')
    .refine((c) => c.reduce((n, t) => n + t.photos.length, 0) <= 5, 'Maximum 5 photos'),
  // Set by a boutique page (e.g. Services 34's jardinage section, Mekanao's
  // mécanique) to keep the assistant within the categories it sells.
  scope: z.object({
    categorySlugs: z.array(z.string().max(60)).max(30).optional(),
    serviceSlug: z.string().max(120).optional(),
  }).optional(),
  location: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }).optional(),
});

const addressCache = new Map();
async function detectedAddressFor(location) {
  if (!location) return null;
  const key = `${location.lat.toFixed(4)},${location.lng.toFixed(4)}`;
  if (!addressCache.has(key)) {
    if (addressCache.size > 2000) addressCache.clear();
    addressCache.set(key, await reverseGeocodeLabel(location.lat, location.lng));
  }
  return addressCache.get(key);
}

// One exchange with the mission assistant: the client keeps the
// conversation and sends it back whole each turn; the reply carries the
// assistant's message plus the mission draft filled so far.
router.post('/mission', optionalAuth, rateLimit, async (req, res, next) => {
  try {
    const { conversation, scope, location } = turnSchema.parse(req.body);
    const [agency, account, detectedAddress] = await Promise.all([
      resolveAgencyFromOrigin(req),
      req.user ? prisma.user.findUnique({ where: { id: req.user.id }, select: { address: true } }) : null,
      detectedAddressFor(location),
    ]);
    let brandName = 'Jobber';
    if (agency) {
      const a = await prisma.user.findUnique({ where: { id: agency.id }, select: { companyName: true } });
      brandName = a?.companyName || brandName;
    }
    const result = await runAssistantTurn({
      conversation, scope, brandName,
      accountAddress: account?.address || null,
      detectedAddress,
    });
    res.json(result);
  } catch (err) {
    if (err.name === 'ZodError') { err.status = 400; err.expose = true; err.message = err.errors[0].message; }
    next(err);
  }
});

module.exports = router;
