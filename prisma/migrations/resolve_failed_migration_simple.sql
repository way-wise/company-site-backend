-- Simple script to resolve failed migration
-- Run this directly on your production database via Coolify's database console

-- Step 1: Drop temporary column if it exists
ALTER TABLE "live_projects" DROP COLUMN IF EXISTS "assignedMembers_temp";

-- Step 2: If assignedMembers is TEXT, revert to JSONB
-- Check current state first, then run the appropriate command:

-- If column is TEXT, run these commands:
-- ALTER TABLE "live_projects" ALTER COLUMN "assignedMembers" DROP NOT NULL;
-- ALTER TABLE "live_projects" ALTER COLUMN "assignedMembers" TYPE JSONB USING '[]'::JSONB;
-- UPDATE "live_projects" SET "assignedMembers" = '[]'::JSONB WHERE "assignedMembers" IS NULL;
-- ALTER TABLE "live_projects" ALTER COLUMN "assignedMembers" SET NOT NULL;

-- Step 3: Mark failed migration as rolled back
UPDATE "_prisma_migrations" 
SET 
    "finished_at" = NOW(),
    "rolled_back_at" = NOW()
WHERE "migration_name" = '20260103115533_change_assigned_members_to_string'
AND "finished_at" IS NULL;

-- Verify it worked
SELECT migration_name, finished_at, rolled_back_at 
FROM "_prisma_migrations"
WHERE "migration_name" = '20260103115533_change_assigned_members_to_string';

