/**
 * @curio/database - Seed Script
 *
 * Creates initial development data for local testing.
 * Safe to run multiple times (uses upsert for idempotency).
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/client/index.js';

// Initialize PrismaClient with pg adapter (Prisma 7 requirement)
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Prisma 7: PrismaPg manages connection pooling internally
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const SEED_DATA = {
  users: [
    { email: 'test@curio.dev', name: 'Test User' },
    { email: 'demo@curio.dev', name: 'Demo User' },
  ],
  sources: [
    { type: 'rss', name: 'Hacker News', url: 'https://news.ycombinator.com/rss' },
    { type: 'rss', name: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
  ],
} as const;

async function main(): Promise<void> {
  console.log('🌱 Seeding database...\n');

  // Create users
  for (const userData of SEED_DATA.users) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: { name: userData.name },
      create: userData,
    });
    console.log(`✅ User: ${user.email}`);
  }

  // Create sources (using url as unique identifier via findFirst + create pattern)
  for (const sourceData of SEED_DATA.sources) {
    const existing = await prisma.source.findFirst({
      where: { url: sourceData.url },
    });

    if (!existing) {
      const source = await prisma.source.create({ data: sourceData });
      console.log(`✅ Source: ${source.name} (created)`);
    } else {
      console.log(`⏭️  Source: ${existing.name} (exists)`);
    }
  }

  console.log('\n🎉 Seed completed!');
}

main()
  .catch((error: unknown) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

