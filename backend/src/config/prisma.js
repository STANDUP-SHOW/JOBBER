const { PrismaClient } = require('@prisma/client');

// A single shared Prisma instance avoids exhausting DB connections in dev
// (Next.js / nodemon hot-reload safe pattern)
const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

module.exports = prisma;
