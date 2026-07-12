const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { z } = require('zod');
const { OAuth2Client } = require('google-auth-library');
const prisma = require('../config/prisma');
const { signToken } = require('../utils/jwt');
const { requireAuth } = require('../middleware/auth');
const { sendPasswordResetEmail } = require('../services/emailService');

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
});

router.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      const err = new Error('Un compte existe déjà avec cet email');
      err.status = 409; err.expose = true; throw err;
    }

    // Every account can both post missions (manager) and apply to them
    // (jobber) — a providerProfile is always created so nobody needs to
    // "upgrade" before they can candidater.
    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        providerProfile: { create: {} },
      },
    });

    const token = signToken(user);
    res.status(201).json({ token, user: sanitize(user) });
  } catch (err) {
    if (err.name === 'ZodError') { err.status = 400; err.expose = true; err.message = err.errors[0].message; }
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) { const e = new Error('Identifiants invalides'); e.status = 401; e.expose = true; throw e; }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) { const e = new Error('Identifiants invalides'); e.status = 401; e.expose = true; throw e; }

    const token = signToken(user);
    res.json({ token, user: sanitize(user) });
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { providerProfile: { include: { categories: true } } },
    });
    res.json({ user: sanitize(user) });
  } catch (err) {
    next(err);
  }
});

router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    // Always respond the same way whether or not the email exists, so the
    // endpoint can't be used to check which addresses have an account.
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken: token, resetTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000) },
      });
      const resetUrl = `${process.env.CLIENT_ORIGIN?.split(',')[0]}/auth/reset-password?token=${token}`;
      await sendPasswordResetEmail(email, resetUrl);
    }

    res.json({ message: 'Si un compte existe avec cet email, un lien de réinitialisation vient d\'être envoyé.' });
  } catch (err) {
    next(err);
  }
});

router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password || password.length < 8) {
      const e = new Error('Le mot de passe doit contenir au moins 8 caractères');
      e.status = 400; e.expose = true; throw e;
    }

    const user = await prisma.user.findUnique({ where: { resetToken: token } });
    if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
      const e = new Error('Lien de réinitialisation invalide ou expiré');
      e.status = 400; e.expose = true; throw e;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetToken: null, resetTokenExpiresAt: null },
    });

    res.json({ message: 'Mot de passe mis à jour.' });
  } catch (err) {
    next(err);
  }
});

async function findOrCreateGoogleUser(credential) {
  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();

  let user = await prisma.user.findUnique({ where: { email: payload.email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: payload.email,
        firstName: payload.given_name || 'Utilisateur',
        lastName: payload.family_name || '',
        avatarUrl: payload.picture,
        isEmailVerified: !!payload.email_verified,
        googleId: payload.sub,
        providerProfile: { create: {} },
      },
    });
  } else if (!user.googleId) {
    user = await prisma.user.update({ where: { id: user.id }, data: { googleId: payload.sub } });
  }
  return user;
}

// JSON flow (credential obtained client-side via GSI popup/One Tap)
router.post('/google', async (req, res, next) => {
  try {
    const { credential } = req.body;
    if (!credential) { const e = new Error('Jeton Google manquant'); e.status = 400; e.expose = true; throw e; }

    const user = await findOrCreateGoogleUser(credential);
    const token = signToken(user);
    res.json({ token, user: sanitize(user) });
  } catch (err) {
    if (err.message?.includes('Token used too late') || err.message?.includes('Wrong recipient')) {
      err.status = 401; err.expose = true; err.message = 'Jeton Google invalide';
    }
    next(err);
  }
});

// Redirect flow (Google POSTs the credential here directly — avoids popup
// blocking, which happens for users with third-party cookies restricted).
router.post('/google/callback', async (req, res) => {
  const clientOrigin = process.env.CLIENT_ORIGIN?.split(',')[0] || '/';
  try {
    const { credential } = req.body;
    if (!credential) return res.redirect(`${clientOrigin}/auth/login?error=google`);

    const user = await findOrCreateGoogleUser(credential);
    const token = signToken(user);
    res.redirect(`${clientOrigin}/auth/google-callback?token=${encodeURIComponent(token)}`);
  } catch (err) {
    console.error('Google redirect callback failed:', err);
    res.redirect(`${clientOrigin}/auth/login?error=google`);
  }
});

function sanitize(user) {
  const { passwordHash, ...rest } = user;
  return rest;
}

module.exports = router;
