/*
  Warnings:

  - You are about to drop the column `leaveTypeId` on the `leave_applications` table. All the data in the column will be lost.
  - You are about to drop the column `leaveTypeId` on the `leave_balances` table. All the data in the column will be lost.
  - You are about to drop the `leave_types` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userProfileId,leaveType,year]` on the table `leave_balances` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `leaveType` to the `leave_applications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `leaveType` to the `leave_balances` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('CASUAL', 'SICK', 'EMERGENCY');

-- DropForeignKey
ALTER TABLE "public"."leave_applications" DROP CONSTRAINT "leave_applications_leaveTypeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."leave_balances" DROP CONSTRAINT "leave_balances_leaveTypeId_fkey";

-- DropIndex
DROP INDEX "public"."leave_applications_leaveTypeId_idx";

-- DropIndex
DROP INDEX "public"."leave_balances_leaveTypeId_idx";

-- DropIndex
DROP INDEX "public"."leave_balances_userProfileId_leaveTypeId_year_key";

-- AlterTable
ALTER TABLE "leave_applications" DROP COLUMN "leaveTypeId",
ADD COLUMN     "leaveType" "LeaveType" NOT NULL;

-- AlterTable
ALTER TABLE "leave_balances" DROP COLUMN "leaveTypeId",
ADD COLUMN     "leaveType" "LeaveType" NOT NULL;

-- DropTable
DROP TABLE "public"."leave_types";

-- CreateIndex
CREATE INDEX "leave_applications_leaveType_idx" ON "leave_applications"("leaveType");

-- CreateIndex
CREATE INDEX "leave_balances_leaveType_idx" ON "leave_balances"("leaveType");

-- CreateIndex
CREATE UNIQUE INDEX "leave_balances_userProfileId_leaveType_year_key" ON "leave_balances"("userProfileId", "leaveType", "year");
