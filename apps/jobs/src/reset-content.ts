import { prisma } from "@curio/database";

const main = async () => {
  console.log("=== Deleting all articles ===");

  const result = await prisma.article.deleteMany({});

  console.log(`Deleted ${result.count} articles`);
  await prisma.$disconnect();
};

main();
