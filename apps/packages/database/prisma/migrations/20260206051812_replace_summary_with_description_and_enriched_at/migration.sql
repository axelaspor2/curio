-- AlterTable
ALTER TABLE "articles" ADD COLUMN "description" TEXT;
ALTER TABLE "articles" ADD COLUMN "enriched_at" TIMESTAMPTZ;

-- Migrate existing summary data to description
UPDATE "articles" SET "description" = "summary" WHERE "summary" IS NOT NULL;

-- Set enriched_at for already enriched articles (those with embedding)
UPDATE "articles" SET "enriched_at" = "created_at" WHERE "embedding" IS NOT NULL;

-- DropColumn
ALTER TABLE "articles" DROP COLUMN "summary";
