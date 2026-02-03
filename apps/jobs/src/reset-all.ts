import { prisma } from "@curio/database";

const main = async () => {
  console.log("=== Resetting all data ===");

  // 順番に削除（外部キー制約を考慮）
  await prisma.interaction.deleteMany({});
  console.log("✓ Interactions deleted");

  await prisma.userInterestVector.deleteMany({});
  console.log("✓ User interest vectors deleted");

  await prisma.userCategoryPreference.deleteMany({});
  console.log("✓ User category preferences deleted");

  await prisma.articleCategory.deleteMany({});
  console.log("✓ Article categories deleted");

  await prisma.article.deleteMany({});
  console.log("✓ Articles deleted");

  await prisma.category.deleteMany({});
  console.log("✓ Categories deleted");

  await prisma.source.deleteMany({});
  console.log("✓ Sources deleted");

  await prisma.session.deleteMany({});
  console.log("✓ Sessions deleted");

  await prisma.account.deleteMany({});
  console.log("✓ Accounts deleted");

  await prisma.user.deleteMany({});
  console.log("✓ Users deleted");

  console.log("\n=== Done ===");
  await prisma.$disconnect();
};

main();
