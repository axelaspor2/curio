/*
  Warnings:

  - You are about to drop the column `categories` on the `articles` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `sources` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `sources` table. All the data in the column will be lost.
  - You are about to drop the `user_sources` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "sources" DROP CONSTRAINT "sources_user_id_fkey";

-- DropForeignKey
ALTER TABLE "user_sources" DROP CONSTRAINT "user_sources_source_id_fkey";

-- DropForeignKey
ALTER TABLE "user_sources" DROP CONSTRAINT "user_sources_user_id_fkey";

-- AlterTable
ALTER TABLE "accounts" ALTER COLUMN "account_id" SET DATA TYPE TEXT,
ALTER COLUMN "provider_id" SET DATA TYPE TEXT,
ALTER COLUMN "access_token_expires_at" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "refresh_token_expires_at" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "articles" DROP COLUMN "categories",
ALTER COLUMN "external_id" SET DATA TYPE TEXT,
ALTER COLUMN "published_at" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "fetched_at" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "interactions" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "sessions" ALTER COLUMN "token" SET DATA TYPE TEXT,
ALTER COLUMN "expires_at" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "ip_address" SET DATA TYPE TEXT,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "sources" DROP COLUMN "is_active",
DROP COLUMN "user_id",
ALTER COLUMN "type" SET DATA TYPE TEXT,
ALTER COLUMN "name" SET DATA TYPE TEXT,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "user_interest_vectors" ALTER COLUMN "last_calculated_at" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "email" SET DATA TYPE TEXT,
ALTER COLUMN "name" SET DATA TYPE TEXT,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "verifications" ALTER COLUMN "identifier" SET DATA TYPE TEXT,
ALTER COLUMN "expires_at" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ;

-- DropTable
DROP TABLE "user_sources";

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_categories" (
    "article_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "confidence" DECIMAL(3,2),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_categories_pkey" PRIMARY KEY ("article_id","category_id")
);

-- CreateTable
CREATE TABLE "user_category_preferences" (
    "user_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "preference_score" DECIMAL(5,4) NOT NULL DEFAULT 0.5,
    "is_initial_selection" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_category_preferences_pkey" PRIMARY KEY ("user_id","category_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "article_categories_category_id_idx" ON "article_categories"("category_id");

-- CreateIndex
CREATE INDEX "user_category_preferences_category_id_idx" ON "user_category_preferences"("category_id");

-- CreateIndex
CREATE INDEX "user_category_preferences_user_id_preference_score_idx" ON "user_category_preferences"("user_id", "preference_score" DESC);

-- CreateIndex
CREATE INDEX "interactions_user_id_type_idx" ON "interactions"("user_id", "type");

-- CreateIndex
CREATE INDEX "interactions_created_at_idx" ON "interactions"("created_at" DESC);

-- AddForeignKey
ALTER TABLE "article_categories" ADD CONSTRAINT "article_categories_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_categories" ADD CONSTRAINT "article_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_category_preferences" ADD CONSTRAINT "user_category_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_category_preferences" ADD CONSTRAINT "user_category_preferences_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
