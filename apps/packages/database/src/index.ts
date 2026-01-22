/**
 * @curio/database - Database Client and Types
 *
 * Exports a singleton PrismaClient instance and all generated types.
 * Uses Prisma 7 driver adapter pattern.
 * Reference: https://www.prisma.io/docs/orm/overview/databases/postgresql
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { Prisma, PrismaClient } from "./generated/client/index.js";

// ============================================================================
// Prisma Client Singleton with Driver Adapter (Prisma 7+)
// ============================================================================

/**
 * Create a configured PrismaClient instance with pg adapter.
 * Prisma 7 requires driver adapters for all databases.
 */
const createPrismaClient = (): PrismaClient => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  // Create pg Pool for connection pooling
  const pool = new Pool({ connectionString });

  // Create Prisma adapter
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "production" ? ["error"] : ["query", "error", "warn"],
  });
};

/**
 * Global singleton to prevent multiple PrismaClient instances during HMR.
 * https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections#prevent-hot-reloading-from-creating-new-instances-of-prismaclient
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Singleton PrismaClient instance.
 * Use this in your application code.
 */
export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// ============================================================================
// Re-exports
// ============================================================================

// PrismaClient class for type annotations
export { PrismaClient };

// Prisma namespace for types (e.g., Prisma.UserCreateInput)
export { Prisma };

// All generated types and enums
export * from "./generated/client/index.js";

// ============================================================================
// Utility Types (for application code)
// ============================================================================

/**
 * Common model types for use in application code.
 * These provide proper typing without needing to import from generated client.
 */
export type {
  Article,
  Category,
  Interaction,
  InteractionType,
  Source,
  User,
  UserCategoryPreference,
  UserInterestVector,
} from "./generated/client/index.js";
