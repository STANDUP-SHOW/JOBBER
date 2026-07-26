const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const startConversationSchema = z.object({ missionId: z.string(), providerId: z.string() });

// Find-or-create — nothing else in the app currently creates a
// Conversation, so any "contacter" entry point (e.g. services34's admin
// messaging an employee about a mission) needs this first. Only the
// mission's own client or the target provider can start it, matching the
// same access rule the rest of this file already enforces on read/send.
router.post('/conversations', requireAuth, async (req, res, next) => {
  try {
    const { missionId, providerId } = startConversationSchema.parse(req.body);
    const mission = await prisma.mission.findUnique({ where: { id: missionId } });
    if (!mission) return res.status(404).json({ error: 'Mission introuvable' });
    if (req.user.id !== mission.clientId && req.user.id !== providerId) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    const conversation = await prisma.conversation.upsert({
      where: { missionId_providerId: { missionId, providerId } },
      update: {},
      create: { missionId, clientId: mission.clientId, providerId },
    });
    res.status(201).json({ conversation });
  } catch (err) {
    if (err.name === 'ZodError') { err.status = 400; err.expose = true; err.message = err.errors[0].message; }
    next(err);
  }
});

router.get('/conversations', requireAuth, async (req, res, next) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: { OR: [{ clientId: req.user.id }, { providerId: req.user.id }] },
      include: {
        mission: { select: { id: true, title: true } },
        client: { select: { id: true, firstName: true, avatarUrl: true } },
        provider: { select: { id: true, firstName: true, avatarUrl: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ conversations });
  } catch (err) { next(err); }
});

router.get('/conversations/:id', requireAuth, async (req, res, next) => {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: req.params.id },
      include: {
        mission: { select: { id: true, title: true } },
        client: { select: { id: true, firstName: true, avatarUrl: true } },
        provider: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });
    if (!conversation) return res.status(404).json({ error: 'Conversation introuvable' });
    if (![conversation.clientId, conversation.providerId].includes(req.user.id)) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: req.params.id },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: { id: true, firstName: true, avatarUrl: true } } },
    });

    res.json({ conversation, messages });
  } catch (err) { next(err); }
});

// Fallback REST send (the socket handler in sockets/index.js does the same
// thing for real-time delivery — this endpoint exists so the app also works
// without a live socket connection, e.g. push notification services).
router.post('/conversations/:id/messages', requireAuth, async (req, res, next) => {
  try {
    const conversation = await prisma.conversation.findUnique({ where: { id: req.params.id } });
    if (!conversation) return res.status(404).json({ error: 'Conversation introuvable' });
    if (![conversation.clientId, conversation.providerId].includes(req.user.id)) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    const message = await prisma.message.create({
      data: { conversationId: req.params.id, senderId: req.user.id, content: req.body.content },
    });

    res.status(201).json({ message });
  } catch (err) { next(err); }
});

module.exports = router;
