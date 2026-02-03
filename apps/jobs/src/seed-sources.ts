import { prisma } from "@curio/database";

const SOURCES = [
  {
    type: "rss",
    name: "Zenn Trending",
    url: "https://zenn.dev/feed",
  },
  {
    type: "rss",
    name: "Hacker News",
    url: "https://hnrss.org/frontpage",
  },
  {
    type: "rss",
    name: "TechCrunch",
    url: "https://techcrunch.com/feed/",
  },
];

const main = async () => {
  console.log("=== Seeding RSS Sources ===");

  for (const source of SOURCES) {
    const existing = await prisma.source.findFirst({
      where: { url: source.url },
    });

    if (existing) {
      console.log(`  ✓ Already exists: ${source.name}`);
      continue;
    }

    await prisma.source.create({ data: source });
    console.log(`  + Created: ${source.name}`);
  }

  console.log("\n=== Done ===");
  await prisma.$disconnect();
};

main();
