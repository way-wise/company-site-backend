/*
  Warnings:

  - Added the required column `leaveTypeId` to the `leave_applications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalDays` to the `leave_applications` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "LeaveStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "leave_applications" ADD COLUMN     "attachmentUrl" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "comments" TEXT,
ADD COLUMN     "leaveTypeId" TEXT NOT NULL,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "totalDays" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "leave_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "defaultDaysPerYear" INTEGER NOT NULL DEFAULT 0,
    "requiresDocument" BOOLEAN NOT NULL DEFAULT false,
    "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_balances" (
    "id" TEXT NOT NULL,
    "userProfileId" TEXT NOT NULL,
    "leaveTypeId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "totalDays" INTEGER NOT NULL DEFAULT 0,
    "usedDays" INTEGER NOT NULL DEFAULT 0,
    "remainingDays" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_balances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "leave_types_name_key" ON "leave_types"("name");

-- CreateIndex
CREATE INDEX "leave_balances_userProfileId_idx" ON "leave_balances"("userProfileId");

-- CreateIndex
CREATE INDEX "leave_balances_leaveTypeId_idx" ON "leave_balances"("leaveTypeId");

-- CreateIndex
CREATE INDEX "leave_balances_year_idx" ON "leave_balances"("year");

-- CreateIndex
CREATE UNIQUE INDEX "leave_balances_userProfileId_leaveTypeId_year_key" ON "leave_balances"("userProfileId", "leaveTypeId", "year");

-- CreateIndex
CREATE INDEX "leave_applications_leaveTypeId_idx" ON "leave_applications"("leaveTypeId");

-- CreateIndex
CREATE INDEX "leave_applications_startDate_endDate_idx" ON "leave_applications"("startDate", "endDate");

-- AddForeignKey
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "leave_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_applications" ADD CONSTRAINT "leave_applications_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "leave_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
