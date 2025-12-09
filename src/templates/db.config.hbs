import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
// which can lead to database connection exhaustion.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query'], // Log queries for debugging
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;