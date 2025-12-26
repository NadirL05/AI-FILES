import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Configuration optimisée pour Vercel serverless avec gestion des prepared statements
// Solution pour l'erreur "prepared statement already exists" (42P05)
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

// En production (Vercel), on stocke aussi dans globalThis pour réutiliser la connexion
// Cela évite les problèmes de "prepared statement already exists"
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}

// Fonction helper pour gérer les erreurs de prepared statements avec retry
export async function prismaQuery<T>(
  queryFn: () => Promise<T>,
  retries = 2
): Promise<T> {
  for (let i = 0; i <= retries; i++) {
    try {
      return await queryFn();
    } catch (error: any) {
      // Si c'est l'erreur "prepared statement already exists", on réessaie
      if (
        error?.code === '42P05' ||
        error?.message?.includes('prepared statement') ||
        error?.message?.includes('already exists')
      ) {
        if (i < retries) {
          // Attendre un peu avant de réessayer
          await new Promise((resolve) => setTimeout(resolve, 100 * (i + 1)));
          // Forcer une nouvelle connexion en reconnectant
          try {
            await prisma.$disconnect();
          } catch (disconnectError) {
            // Ignorer les erreurs de disconnect
          }
          try {
            await prisma.$connect();
          } catch (connectError) {
            // Ignorer les erreurs de connect, on réessaie quand même
          }
          continue;
        }
      }
      // Si ce n'est pas l'erreur attendue ou qu'on a épuisé les tentatives, on relance
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

export default prisma;

