import { prisma } from "@curio/database";

const main = async () => {
  const total = await prisma.article.count();
  const withContent = await prisma.article.count({ where: { content: { not: null } } });
  const withoutContent = await prisma.article.count({ where: { content: null } });

  console.log("=== Database Status ===");
  console.log("Total articles:", total);
  console.log("With content:", withContent);
  console.log("Without content:", withoutContent);

  const sources = await prisma.source.findMany({ select: { id: true, name: true, type: true } });
  console.log("\nSources:", sources.length);
  for (const s of sources) {
    console.log("  -", s.name, `(${s.type})`);
  }

  // 最新の記事を表示
  const recentArticles = await prisma.article.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    select: { title: true, url: true, content: true },
  });

  console.log("\nRecent articles:");
  for (const a of recentArticles) {
    console.log("  -", a.title.slice(0, 50), a.content ? "(has content)" : "(no content)");
  }

  await prisma.$disconnect();
};

main();
