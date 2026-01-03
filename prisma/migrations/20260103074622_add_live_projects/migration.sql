-- CreateEnum
CREATE TYPE "LiveProjectType" AS ENUM ('FIXED', 'HOURLY');

-- CreateEnum
CREATE TYPE "LiveProjectStatus" AS ENUM ('PENDING', 'ACTIVE', 'ON_HOLD', 'COMPLETED');

-- CreateTable
CREATE TABLE "live_projects" (
    "id" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientLocation" TEXT,
    "projectType" "LiveProjectType" NOT NULL,
    "projectBudget" DECIMAL(65,30) NOT NULL,
    "paidAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "dueAmount" DECIMAL(65,30) NOT NULL,
    "assignedMembers" JSONB NOT NULL,
    "projectStatus" "LiveProjectStatus" NOT NULL DEFAULT 'PENDING',
    "dailyNotes" JSONB,
    "nextActions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "live_projects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "live_projects_projectStatus_idx" ON "live_projects"("projectStatus");

-- CreateIndex
CREATE INDEX "live_projects_projectType_idx" ON "live_projects"("projectType");

-- CreateIndex
CREATE INDEX "live_projects_clientName_idx" ON "live_projects"("clientName");
