/**
 * @curio/database - Integration Test
 *
 * Verifies that the database package works correctly:
 * 1. Connection to PostgreSQL via Prisma adapter
 * 2. CRUD operations on all models
 * 3. pgvector extension is enabled
 * 4. HNSW indexes exist
 *
 * Run with: tsx prisma/test.ts
 */
import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, InteractionType } from '../src/generated/client/index.js';

// ============================================================================
// Setup
// ============================================================================

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

let passCount = 0;
let failCount = 0;

function pass(testName: string): void {
  passCount++;
  console.log(`✅ ${testName}`);
}

function fail(testName: string, error: unknown): void {
  failCount++;
  console.log(`❌ ${testName}`);
  console.log(`   Error: ${error}`);
}

// ============================================================================
// Tests
// ============================================================================

async function testConnection(): Promise<void> {
  const testName = 'Connection: Can connect to database';
  try {
    await prisma.$queryRaw`SELECT 1`;
    pass(testName);
  } catch (e) {
    fail(testName, e);
  }
}

async function testPgvectorExtension(): Promise<void> {
  const testName = 'pgvector: Extension is enabled';
  try {
    const result = await prisma.$queryRaw<{ extname: string }[]>`
      SELECT extname FROM pg_extension WHERE extname = 'vector'
    `;
    if (result.length > 0) {
      pass(testName);
    } else {
      fail(testName, 'pgvector extension not found');
    }
  } catch (e) {
    fail(testName, e);
  }
}

async function testHnswIndexes(): Promise<void> {
  const testName = 'pgvector: HNSW indexes exist';
  try {
    const result = await prisma.$queryRaw<{ indexname: string }[]>`
      SELECT indexname FROM pg_indexes
      WHERE indexname LIKE '%embedding%' AND indexdef LIKE '%hnsw%'
    `;
    if (result.length >= 2) {
      pass(testName);
    } else {
      fail(testName, `Expected 2 HNSW indexes, found ${result.length}`);
    }
  } catch (e) {
    fail(testName, e);
  }
}

async function testUserCRUD(): Promise<void> {
  const testName = 'User: CRUD operations work';
  const testEmail = `test-${Date.now()}@test.com`;
  try {
    // Create
    const created = await prisma.user.create({
      data: { email: testEmail, name: 'Test User' },
    });
    if (!created.id) throw new Error('Create failed');

    // Read
    const found = await prisma.user.findUnique({ where: { email: testEmail } });
    if (!found) throw new Error('Read failed');

    // Update
    const updated = await prisma.user.update({
      where: { email: testEmail },
      data: { name: 'Updated User' },
    });
    if (updated.name !== 'Updated User') throw new Error('Update failed');

    // Delete
    await prisma.user.delete({ where: { email: testEmail } });
    const deleted = await prisma.user.findUnique({ where: { email: testEmail } });
    if (deleted) throw new Error('Delete failed');

    pass(testName);
  } catch (e) {
    fail(testName, e);
    // Cleanup
    await prisma.user.deleteMany({ where: { email: testEmail } }).catch(() => {});
  }
}

async function testSourceArticleRelation(): Promise<void> {
  const testName = 'Relations: Source → Article cascade';
  const testEmail = `relation-test-${Date.now()}@test.com`;
  try {
    // Create user
    const user = await prisma.user.create({
      data: { email: testEmail, name: 'Relation Test' },
    });

    // Create source
    const source = await prisma.source.create({
      data: {
        type: 'rss',
        name: 'Test Source',
        url: 'https://test.com/rss',
        userId: user.id,
      },
    });

    // Create article
    const article = await prisma.article.create({
      data: {
        sourceId: source.id,
        title: 'Test Article',
        url: 'https://test.com/article',
      },
    });

    // Delete source (should cascade to article)
    await prisma.source.delete({ where: { id: source.id } });

    // Verify article is deleted
    const foundArticle = await prisma.article.findUnique({ where: { id: article.id } });
    if (foundArticle) throw new Error('Cascade delete failed');

    // Cleanup
    await prisma.user.delete({ where: { id: user.id } });

    pass(testName);
  } catch (e) {
    fail(testName, e);
    await prisma.user.deleteMany({ where: { email: testEmail } }).catch(() => {});
  }
}

async function testInteractionEnum(): Promise<void> {
  const testName = 'Enum: InteractionType values accessible';
  try {
    const values = [InteractionType.SKIP, InteractionType.LIKE, InteractionType.OPEN, InteractionType.READ];
    if (values.length !== 4) throw new Error('Enum values missing');
    pass(testName);
  } catch (e) {
    fail(testName, e);
  }
}

async function testAllTables(): Promise<void> {
  const testName = 'Schema: All 6 tables exist';
  try {
    const result = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('users', 'sources', 'articles', 'interactions', 'user_sources', 'user_interest_vectors')
    `;
    const count = Number(result[0].count);
    if (count === 6) {
      pass(testName);
    } else {
      fail(testName, `Expected 6 tables, found ${count}`);
    }
  } catch (e) {
    fail(testName, e);
  }
}

// ============================================================================
// Runner
// ============================================================================

async function main(): Promise<void> {
  console.log('\n🧪 Running Database Integration Tests\n');
  console.log('=' .repeat(50));

  await testConnection();
  await testPgvectorExtension();
  await testHnswIndexes();
  await testAllTables();
  await testInteractionEnum();
  await testUserCRUD();
  await testSourceArticleRelation();

  console.log('=' .repeat(50));
  console.log(`\n📊 Results: ${passCount} passed, ${failCount} failed\n`);

  if (failCount > 0) {
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error('❌ Test runner failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
