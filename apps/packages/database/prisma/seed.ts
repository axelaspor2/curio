import { PrismaClient } from '../src/generated/client/index.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create test user
  const user = await prisma.user.upsert({
    where: { email: 'test@curio.dev' },
    update: {},
    create: {
      email: 'test@curio.dev',
      name: 'Test User',
    },
  });
  console.log('✅ Created user:', user.email);

  // Create sample source
  const source = await prisma.source.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      type: 'rss',
      name: 'Hacker News',
      url: 'https://news.ycombinator.com/rss',
    },
  });
  console.log('✅ Created source:', source.name);

  console.log('🎉 Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
