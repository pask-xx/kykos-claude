import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// In production (Vercel), don't cache to avoid connection issues
const isProduction = process.env.NODE_ENV === 'production';

export const prisma = isProduction
  ? new PrismaClient({
      log: ['error'],
    })
  : (globalForPrisma.prisma ?? new PrismaClient({
      log: ['error', 'warn'],
    }));

if (!isProduction && process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
