import { PrismaClient } from './generated/client/index.js';

// Connection pool configuration for Cloud Run / Serverless
// Reference: https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections
const createPrismaClient = () => {
  return new PrismaClient({
    // Enable logging in non-production for debugging
    log:
      process.env.NODE_ENV === 'production'
        ? ['error']
        : ['query', 'error', 'warn'],
  });
};

// Singleton pattern for PrismaClient
// Prevents multiple instances in dev with HMR (Hot Module Replacement)
// Reference: https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections#prevent-hot-reloading-from-creating-new-instances-of-prismaclient
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Re-export types and classes for convenience
export * from './generated/client/index.js';
export { PrismaClient };
