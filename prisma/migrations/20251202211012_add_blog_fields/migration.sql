-- CreateEnum
CREATE TYPE "BlogStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "public"."blogs" ADD COLUMN     "excerpt" TEXT,
ADD COLUMN     "featuredImage" TEXT,
ADD COLUMN     "status" "BlogStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "tags" JSONB,
ADD COLUMN     "metaTitle" TEXT,
ADD COLUMN     "metaDescription" TEXT,
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "publishedAt" TIMESTAMP(3);

-- Update existing blogs to have a slug (using title as base)
-- Pattern matches generateSlug function: replace all non-alphanumeric with single hyphen
UPDATE "public"."blogs" SET "slug" = LOWER(REGEXP_REPLACE(REGEXP_REPLACE("title", '[^a-zA-Z0-9]+', '-', 'g'), '-+', '-', 'g')) || '-' || SUBSTRING("id", 1, 8) WHERE "slug" IS NULL;

-- Make slug NOT NULL and unique after setting values
ALTER TABLE "public"."blogs" ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "blogs_slug_key" ON "public"."blogs"("slug");

-- CreateIndex
CREATE INDEX "blogs_status_idx" ON "public"."blogs"("status");

