const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      include: { services: true, equipment: true },
      orderBy: { name: 'asc' },
    });
    res.json({ categories });
  } catch (err) {
    next(err);
  }
});

function slugify(str) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const categorySchema = z.object({ name: z.string().min(2), icon: z.string().optional() });

// --- Admin-only mutations below ---

router.post('/', requireAuth, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const data = categorySchema.parse(req.body);
    const category = await prisma.category.create({
      data: { name: data.name, icon: data.icon, slug: slugify(data.name) },
    });
    res.status(201).json({ category });
  } catch (err) {
    if (err.code === 'P2002') { err.status = 409; err.expose = true; err.message = 'Cette catégorie existe déjà'; }
    if (err.name === 'ZodError') { err.status = 400; err.expose = true; err.message = err.errors[0].message; }
    next(err);
  }
});

router.patch('/:id', requireAuth, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const data = categorySchema.partial().parse(req.body);
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: { ...data, slug: data.name ? slugify(data.name) : undefined },
    });
    res.json({ category });
  } catch (err) {
    if (err.name === 'ZodError') { err.status = 400; err.expose = true; err.message = err.errors[0].message; }
    next(err);
  }
});

router.delete('/:id', requireAuth, requireRole('ADMIN'), async (req, res, next) => {
  try {
    await prisma.category.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    if (err.code === 'P2003') { err.status = 409; err.expose = true; err.message = 'Impossible de supprimer : des missions, services ou compétences de prestataires y sont rattachés'; }
    next(err);
  }
});

const serviceSchema = z.object({ name: z.string().min(2), categoryId: z.string() });

router.post('/:categoryId/services', requireAuth, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const data = serviceSchema.parse({ ...req.body, categoryId: req.params.categoryId });
    const slug = `${data.categoryId}-${slugify(data.name)}-${Date.now().toString(36)}`;
    const service = await prisma.service.create({
      data: { name: data.name, categoryId: data.categoryId, slug },
    });
    res.status(201).json({ service });
  } catch (err) {
    if (err.name === 'ZodError') { err.status = 400; err.expose = true; err.message = err.errors[0].message; }
    next(err);
  }
});

router.delete('/services/:id', requireAuth, requireRole('ADMIN'), async (req, res, next) => {
  try {
    await prisma.service.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

const equipmentSchema = z.object({ name: z.string().min(2), categoryId: z.string() });

router.post('/:categoryId/equipment', requireAuth, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const data = equipmentSchema.parse({ ...req.body, categoryId: req.params.categoryId });
    const equipment = await prisma.equipment.create({
      data: { name: data.name, categoryId: data.categoryId },
    });
    res.status(201).json({ equipment });
  } catch (err) {
    if (err.code === 'P2002') { err.status = 409; err.expose = true; err.message = 'Ce matériel existe déjà pour cette catégorie'; }
    if (err.name === 'ZodError') { err.status = 400; err.expose = true; err.message = err.errors[0].message; }
    next(err);
  }
});

router.delete('/equipment/:id', requireAuth, requireRole('ADMIN'), async (req, res, next) => {
  try {
    await prisma.equipment.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
