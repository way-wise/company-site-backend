-- AlterTable
ALTER TABLE "live_projects" ADD COLUMN     "deadline" TIMESTAMP(3),
ADD COLUMN     "progress" INTEGER;

-- CreateIndex
CREATE INDEX "live_projects_deadline_idx" ON "live_projects"("deadline");
