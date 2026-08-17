const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Recent in-app notifications for the header bell — most recent first,
// capped since this is a popup list, not a full paginated feed.
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.notification.count({ where: { userId: req.user.id, read: false } }),
    ]);
    res.json({ notifications, unreadCount });
  } catch (err) { next(err); }
});

router.post('/:id/read', requireAuth, async (req, res, next) => {
  try {
    await prisma.notification.updateMany({ where: { id: req.params.id, userId: req.user.id }, data: { read: true } });
    res.status(204).end();
  } catch (err) { next(err); }
});

router.post('/read-all', requireAuth, async (req, res, next) => {
  try {
    await prisma.notification.updateMany({ where: { userId: req.user.id, read: false }, data: { read: true } });
    res.status(204).end();
  } catch (err) { next(err); }
});

router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || null });
});

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string(), auth: z.string() }),
});

// Saves (or refreshes) this browser's Web Push registration — called once
// the user grants notification permission and the frontend subscribes via
// the Push API. Upsert on endpoint so re-subscribing the same browser is a
// no-op rather than a duplicate row.
router.post('/push-subscribe', requireAuth, async (req, res, next) => {
  try {
    const data = subscribeSchema.parse(req.body);
    await prisma.pushSubscription.upsert({
      where: { endpoint: data.endpoint },
      update: { userId: req.user.id, p256dh: data.keys.p256dh, auth: data.keys.auth },
      create: { userId: req.user.id, endpoint: data.endpoint, p256dh: data.keys.p256dh, auth: data.keys.auth },
    });
    res.status(201).json({ ok: true });
  } catch (err) {
    if (err.name === 'ZodError') { err.status = 400; err.expose = true; err.message = err.errors[0].message; }
    next(err);
  }
});

router.post('/push-unsubscribe', requireAuth, async (req, res, next) => {
  try {
    const { endpoint } = z.object({ endpoint: z.string() }).parse(req.body);
    await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: req.user.id } });
    res.status(204).end();
  } catch (err) { next(err); }
});

module.exports = router;
