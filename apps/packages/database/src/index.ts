import { PrismaClient } from './generated/client/index.js';

// Singleton pattern for PrismaClient (prevents multiple instances in dev with HMR)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Re-export types for convenience
export * from './generated/client/index.js';
export { PrismaClient };
