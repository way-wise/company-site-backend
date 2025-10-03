-- AlterTable
ALTER TABLE "public"."admins" ALTER COLUMN "contactNumber" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."clients" ALTER COLUMN "contactNumber" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."employees" ALTER COLUMN "contactNumber" DROP NOT NULL;
