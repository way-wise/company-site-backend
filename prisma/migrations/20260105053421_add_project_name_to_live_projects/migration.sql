/*
  Warnings:

  - Added the required column `projectName` to the `live_projects` table without a default value. This is not possible if the table is not empty.
  - Made the column `assignedMembers` on table `live_projects` required. This step will fail if there are existing NULL values in that column.

*/
-- Step 1: Add projectName column as nullable first (only if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'live_projects' 
    AND column_name = 'projectName'
  ) THEN
    ALTER TABLE "live_projects" ADD COLUMN "projectName" TEXT;
  END IF;
END $$;

-- Step 2: Update existing rows with a default project name based on clientName
UPDATE "live_projects" 
SET "projectName" = COALESCE("clientName", 'Untitled Project')
WHERE "projectName" IS NULL;

-- Step 3: Make projectName NOT NULL (only if it's not already NOT NULL)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'live_projects' 
    AND column_name = 'projectName'
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE "live_projects" ALTER COLUMN "projectName" SET NOT NULL;
  END IF;
END $$;

-- Step 4: Ensure assignedMembers is NOT NULL (if it's not already)
DO $$ 
BEGIN
  -- Update any NULL assignedMembers to empty string if they exist
  UPDATE "live_projects" 
  SET "assignedMembers" = '' 
  WHERE "assignedMembers" IS NULL;
  
  -- Then set NOT NULL constraint if it's not already
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'live_projects' 
    AND column_name = 'assignedMembers'
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE "live_projects" ALTER COLUMN "assignedMembers" SET NOT NULL;
  END IF;
EXCEPTION
  WHEN others THEN
    -- If there's an error, just continue
    NULL;
END $$;

-- CreateIndex (only if it doesn't exist)
CREATE INDEX IF NOT EXISTS "live_projects_projectName_idx" ON "live_projects"("projectName");
