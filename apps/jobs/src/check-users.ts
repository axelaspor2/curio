import { prisma } from "@curio/database";

const main = async () => {
  console.log("=== User Data Status ===");

  const users = await prisma.user.count();
  const interactions = await prisma.interaction.count();
  const preferences = await prisma.userCategoryPreference.count();
  const vectors = await prisma.userInterestVector.count();
  const categories = await prisma.category.count();

  console.log("Users:", users);
  console.log("Interactions:", interactions);
  console.log("Category Preferences:", preferences);
  console.log("Interest Vectors:", vectors);
  console.log("Categories:", categories);

  if (categories > 0) {
    const cats = await prisma.category.findMany({ select: { slug: true, name: true } });
    console.log("\nCategories:");
    for (const c of cats) {
      console.log(`  - ${c.slug}: ${c.name}`);
    }
  }

  await prisma.$disconnect();
};

main();
