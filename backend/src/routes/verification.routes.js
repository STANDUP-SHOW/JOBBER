const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

const uploadSchema = z.object({
  type: z.enum(['ID_CARD', 'PROOF_OF_ADDRESS', 'BANK_ACCOUNT']),
  fileUrl: z.string().url(), // in production this comes back from your S3/Cloudinary upload step
});

// Submit a verification document (identity, address, bank account — mirrors
// "Vérification d'identité, d'adresse et de compte bancaire")
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const data = uploadSchema.parse(req.body);
    const doc = await prisma.verificationDocument.create({
      data: { userId: req.user.id, type: data.type, fileUrl: data.fileUrl },
    });
    await prisma.providerProfile.update({
      where: { userId: req.user.id },
      data: { verificationStatus: 'PENDING' },
    });
    res.status(201).json({ document: doc });
  } catch (err) {
    if (err.name === 'ZodError') { err.status = 400; err.expose = true; err.message = err.errors[0].message; }
    next(err);
  }
});

router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const documents = await prisma.verificationDocument.findMany({ where: { userId: req.user.id } });
    res.json({ documents });
  } catch (err) { next(err); }
});

// --- Admin review queue ---
router.get('/queue', requireAuth, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const documents = await prisma.verificationDocument.findMany({
      where: { status: 'PENDING' },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ documents });
  } catch (err) { next(err); }
});

router.patch('/:id/decision', requireAuth, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { approve } = req.body; // boolean
    const doc = await prisma.verificationDocument.update({
      where: { id: req.params.id },
      data: { status: approve ? 'APPROVED' : 'REJECTED', reviewedAt: new Date() },
    });

    // Once all of a provider's required docs are approved, mark the profile verified
    if (approve) {
      const remainingPending = await prisma.verificationDocument.count({
        where: { userId: doc.userId, status: 'PENDING' },
      });
      if (remainingPending === 0) {
        await prisma.providerProfile.update({ where: { userId: doc.userId }, data: { verificationStatus: 'APPROVED' } });
      }
    } else {
      await prisma.providerProfile.update({ where: { userId: doc.userId }, data: { verificationStatus: 'REJECTED' } });
    }

    res.json({ document: doc });
  } catch (err) { next(err); }
});

module.exports = router;
