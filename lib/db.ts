import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Configuration optimisée pour Vercel serverless
// Important : En serverless, on réutilise la connexion entre les invocations
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// En production (Vercel), on stocke aussi dans globalThis pour réutiliser la connexion
// Cela évite les problèmes de "prepared statement already exists"
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}

export default prisma;

