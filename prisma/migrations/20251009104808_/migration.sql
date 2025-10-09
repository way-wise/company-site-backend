/*
  Warnings:

  - You are about to drop the column `adminId` on the `blogs` table. All the data in the column will be lost.
  - You are about to drop the column `clientId` on the `comments` table. All the data in the column will be lost.
  - You are about to drop the column `employeeId` on the `employee_milestones` table. All the data in the column will be lost.
  - You are about to drop the column `employeeId` on the `leave_applications` table. All the data in the column will be lost.
  - You are about to drop the column `clientId` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the `admins` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `clients` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `employees` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userProfileId,milestoneId]` on the table `employee_milestones` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userProfileId` to the `blogs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userProfileId` to the `comments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userProfileId` to the `employee_milestones` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userProfileId` to the `leave_applications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userProfileId` to the `projects` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."admins" DROP CONSTRAINT "admins_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."blogs" DROP CONSTRAINT "blogs_adminId_fkey";

-- DropForeignKey
ALTER TABLE "public"."clients" DROP CONSTRAINT "clients_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."comments" DROP CONSTRAINT "comments_clientId_fkey";

-- DropForeignKey
ALTER TABLE "public"."employee_milestones" DROP CONSTRAINT "employee_milestones_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."employees" DROP CONSTRAINT "employees_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."leave_applications" DROP CONSTRAINT "leave_applications_approvedBy_fkey";

-- DropForeignKey
ALTER TABLE "public"."leave_applications" DROP CONSTRAINT "leave_applications_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."projects" DROP CONSTRAINT "projects_clientId_fkey";

-- DropIndex
DROP INDEX "public"."employee_milestones_employeeId_milestoneId_key";

-- DropIndex
DROP INDEX "public"."leave_applications_employeeId_idx";

-- DropIndex
DROP INDEX "public"."projects_clientId_idx";

-- AlterTable
ALTER TABLE "blogs" DROP COLUMN "adminId",
ADD COLUMN     "userProfileId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "comments" DROP COLUMN "clientId",
ADD COLUMN     "userProfileId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "employee_milestones" DROP COLUMN "employeeId",
ADD COLUMN     "userProfileId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "leave_applications" DROP COLUMN "employeeId",
ADD COLUMN     "userProfileId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "projects" DROP COLUMN "clientId",
ADD COLUMN     "userProfileId" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."admins";

-- DropTable
DROP TABLE "public"."clients";

-- DropTable
DROP TABLE "public"."employees";

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profilePhoto" TEXT,
    "contactNumber" TEXT,
    "address" TEXT,
    "gender" "Gender",
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "bio" TEXT,
    "website" TEXT,
    "twitter" TEXT,
    "linkedIn" TEXT,
    "facebook" TEXT,
    "language" TEXT,
    "education" TEXT,
    "experience" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_userId_key" ON "user_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "employee_milestones_userProfileId_milestoneId_key" ON "employee_milestones"("userProfileId", "milestoneId");

-- CreateIndex
CREATE INDEX "leave_applications_userProfileId_idx" ON "leave_applications"("userProfileId");

-- CreateIndex
CREATE INDEX "projects_userProfileId_idx" ON "projects"("userProfileId");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_milestones" ADD CONSTRAINT "employee_milestones_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blogs" ADD CONSTRAINT "blogs_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_applications" ADD CONSTRAINT "leave_applications_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_applications" ADD CONSTRAINT "leave_applications_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
