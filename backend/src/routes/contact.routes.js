const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { optionalAuth } = require('../middleware/auth');
const { resolveAgencyFromOrigin } = require('../utils/agency');

const router = express.Router();

const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  subject: z.string().max(200).optional(),
  message: z.string().min(10).max(4000),
});

// "Nous contacter" form — public, works the same from jobber.city and any
// corporate agency's white-label site (e.g. services34.fr). Which inbox it
// lands in is resolved server-side from the request's Origin, exactly like
// Mission.corporateAgencyId — the caller never picks a recipient directly.
router.post('/', optionalAuth, async (req, res, next) => {
  try {
    const data = contactSchema.parse(req.body);
    const agency = await resolveAgencyFromOrigin(req);

    const contactMessage = await prisma.contactMessage.create({
      data: {
        agencyId: agency?.id,
        senderId: req.user?.id,
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message,
      },
    });

    res.status(201).json({ contactMessage });
  } catch (err) {
    if (err.name === 'ZodError') { err.status = 400; err.expose = true; err.message = err.errors[0].message; }
    next(err);
  }
});

module.exports = router;
