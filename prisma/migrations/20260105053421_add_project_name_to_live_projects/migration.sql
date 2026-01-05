/*
  Warnings:

  - Added the required column `projectName` to the `live_projects` table without a default value. This is not possible if the table is not empty.
  - Made the column `assignedMembers` on table `live_projects` required. This step will fail if there are existing NULL values in that column.

*/
-- Step 1: Add projectName column as nullable first
ALTER TABLE "live_projects" ADD COLUMN "projectName" TEXT;

-- Step 2: Update existing rows with a default project name based on clientName
UPDATE "live_projects" 
SET "projectName" = COALESCE("clientName", 'Untitled Project')
WHERE "projectName" IS NULL;

-- Step 3: Make projectName NOT NULL
ALTER TABLE "live_projects" ALTER COLUMN "projectName" SET NOT NULL;

-- Step 4: Ensure assignedMembers is NOT NULL (if it's not already)
DO $$ 
BEGIN
  -- Update any NULL assignedMembers to empty string if they exist
  UPDATE "live_projects" 
  SET "assignedMembers" = '' 
  WHERE "assignedMembers" IS NULL;
  
  -- Then set NOT NULL constraint
  ALTER TABLE "live_projects" ALTER COLUMN "assignedMembers" SET NOT NULL;
EXCEPTION
  WHEN others THEN
    -- If column is already NOT NULL, just continue
    NULL;
END $$;

-- CreateIndex
CREATE INDEX "live_projects_projectName_idx" ON "live_projects"("projectName");
