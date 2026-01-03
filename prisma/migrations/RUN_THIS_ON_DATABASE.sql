-- ============================================
-- RUN THIS SQL DIRECTLY ON YOUR PRODUCTION DATABASE
-- ============================================
-- Copy and paste this entire script into your Coolify database console
-- This will resolve the failed migration issue

-- Step 1: Clean up any partial migration state
ALTER TABLE "live_projects" DROP COLUMN IF EXISTS "assignedMembers_temp";

-- Step 2: If assignedMembers is TEXT, revert to JSONB (since you said data can be removed)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'live_projects' 
        AND column_name = 'assignedMembers'
        AND data_type = 'text'
    ) THEN
        ALTER TABLE "live_projects" ALTER COLUMN "assignedMembers" DROP NOT NULL;
        ALTER TABLE "live_projects" ALTER COLUMN "assignedMembers" TYPE JSONB USING '[]'::JSONB;
        UPDATE "live_projects" SET "assignedMembers" = '[]'::JSONB WHERE "assignedMembers" IS NULL;
        ALTER TABLE "live_projects" ALTER COLUMN "assignedMembers" SET NOT NULL;
    END IF;
END $$;

-- Step 3: Mark the failed migration as rolled back
UPDATE "_prisma_migrations" 
SET 
    "finished_at" = NOW(),
    "rolled_back_at" = NOW()
WHERE "migration_name" = '20260103115533_change_assigned_members_to_string'
AND ("finished_at" IS NULL OR "rolled_back_at" IS NULL);

-- Step 4: Verify it worked (should show finished_at and rolled_back_at)
SELECT 
    migration_name,
    finished_at,
    rolled_back_at,
    started_at
FROM "_prisma_migrations"
WHERE "migration_name" = '20260103115533_change_assigned_members_to_string';

