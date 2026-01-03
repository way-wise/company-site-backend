-- Script to resolve failed migration: 20260103115533_change_assigned_members_to_string
-- This script safely cleans up any partial migration state and marks it as rolled back
-- Since live_projects data can be removed, we'll clean up completely

-- Step 1: Drop temporary column if it exists (from partial migration)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'live_projects' 
        AND column_name = 'assignedMembers_temp'
    ) THEN
        ALTER TABLE "live_projects" DROP COLUMN "assignedMembers_temp";
        RAISE NOTICE 'Dropped temporary column assignedMembers_temp';
    END IF;
END $$;

-- Step 2: If assignedMembers is already TEXT (from partial migration), revert to JSONB
-- Since user confirmed we can remove live_projects data, we'll revert it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'live_projects' 
        AND column_name = 'assignedMembers'
        AND data_type = 'text'
    ) THEN
        -- Revert TEXT column back to JSONB
        -- Step 2a: Remove NOT NULL constraint if it exists
        ALTER TABLE "live_projects" 
        ALTER COLUMN "assignedMembers" DROP NOT NULL;
        
        -- Step 2b: Change column type back to JSONB (using empty array as default)
        ALTER TABLE "live_projects" 
        ALTER COLUMN "assignedMembers" TYPE JSONB 
        USING '[]'::JSONB;
        
        -- Step 2c: Set default to empty array
        ALTER TABLE "live_projects" 
        ALTER COLUMN "assignedMembers" SET DEFAULT '[]'::JSONB;
        
        -- Step 2d: Update any NULL values to empty array
        UPDATE "live_projects" 
        SET "assignedMembers" = '[]'::JSONB 
        WHERE "assignedMembers" IS NULL;
        
        -- Step 2e: Set NOT NULL constraint back (as per original schema)
        ALTER TABLE "live_projects" 
        ALTER COLUMN "assignedMembers" SET NOT NULL;
        
        RAISE NOTICE 'Reverted assignedMembers column from TEXT back to JSONB';
    END IF;
END $$;

-- Step 3: Mark the failed migration as rolled back in Prisma's migration table
UPDATE "_prisma_migrations" 
SET 
    "finished_at" = NOW(),
    "rolled_back_at" = NOW(),
    "logs" = 'Migration rolled back manually to allow retry with fixed SQL'
WHERE "migration_name" = '20260103115533_change_assigned_members_to_string'
AND ("finished_at" IS NULL OR "rolled_back_at" IS NULL);

-- Step 4: Verify the update
SELECT 
    migration_name,
    finished_at,
    rolled_back_at,
    started_at,
    applied_steps_count
FROM "_prisma_migrations"
WHERE "migration_name" = '20260103115533_change_assigned_members_to_string';

