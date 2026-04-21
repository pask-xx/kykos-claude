import { PrismaClient } from '@prisma/client';

// Don't use global caching in development to avoid stale connections
export const prisma = new PrismaClient({
  log: ['error', 'warn'],
});
