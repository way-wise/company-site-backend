-- ============================================
-- SAFE MIGRATION RESOLUTION - PRESERVES ALL DATA
-- ============================================
-- This script safely resolves the failed migration WITHOUT losing any data
-- Run this on your production database via Coolify's database console

-- Step 1: Check current state and preserve data
-- First, let's see what we're working with
DO $$
DECLARE
    col_type TEXT;
    temp_col_exists BOOLEAN;
    has_data BOOLEAN;
BEGIN
    -- Check if temp column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'live_projects' 
        AND column_name = 'assignedMembers_temp'
    ) INTO temp_col_exists;
    
    -- Check current column type
    SELECT data_type INTO col_type
    FROM information_schema.columns 
    WHERE table_name = 'live_projects' 
    AND column_name = 'assignedMembers';
    
    -- Check if table has data
    SELECT EXISTS (SELECT 1 FROM "live_projects" LIMIT 1) INTO has_data;
    
    RAISE NOTICE 'Current state: column_type=%, temp_col_exists=%, has_data=%', col_type, temp_col_exists, has_data;
    
    -- Scenario 1: Migration failed at step 1 (temp column doesn't exist, column is still JSONB)
    IF NOT temp_col_exists AND col_type = 'jsonb' THEN
        RAISE NOTICE 'Scenario 1: Migration failed early - column is still JSONB, no temp column';
        -- Just mark as rolled back, migration will run from scratch
        -- No data conversion needed yet
        
    -- Scenario 2: Migration partially ran (temp column exists, column is still JSONB)
    ELSIF temp_col_exists AND col_type = 'jsonb' THEN
        RAISE NOTICE 'Scenario 2: Migration partially ran - temp column exists, original is JSONB';
        -- Complete the migration manually preserving data
        IF has_data THEN
            -- Convert JSONB array to comma-separated string in temp column
            UPDATE "live_projects" 
            SET "assignedMembers_temp" = CASE 
                WHEN jsonb_typeof("assignedMembers") = 'array' 
                THEN (
                    SELECT string_agg(value, ', ')
                    FROM jsonb_array_elements_text("assignedMembers")
                )
                WHEN "assignedMembers" IS NOT NULL
                THEN "assignedMembers"::text
                ELSE ''
            END
            WHERE "assignedMembers_temp" IS NULL;
        END IF;
        
        -- Drop original column
        ALTER TABLE "live_projects" DROP COLUMN "assignedMembers";
        
        -- Rename temp to original
        ALTER TABLE "live_projects" RENAME COLUMN "assignedMembers_temp" TO "assignedMembers";
        
        -- Set NOT NULL if needed
        ALTER TABLE "live_projects" ALTER COLUMN "assignedMembers" SET NOT NULL;
        
        RAISE NOTICE 'Completed migration: Converted JSONB to TEXT preserving all data';
        
    -- Scenario 3: Migration completed but marked as failed (column is already TEXT)
    ELSIF col_type = 'text' THEN
        RAISE NOTICE 'Scenario 3: Column is already TEXT - migration may have succeeded';
        -- Just clean up temp column if it exists
        IF temp_col_exists THEN
            ALTER TABLE "live_projects" DROP COLUMN "assignedMembers_temp";
            RAISE NOTICE 'Cleaned up temporary column';
        END IF;
        -- Mark migration as applied (not rolled back) since it actually succeeded
        UPDATE "_prisma_migrations" 
        SET "finished_at" = NOW(),
            "rolled_back_at" = NULL
        WHERE "migration_name" = '20260103115533_change_assigned_members_to_string'
        AND "finished_at" IS NULL;
        
        RAISE NOTICE 'Marked migration as applied (it actually succeeded)';
        RETURN; -- Exit early, don't mark as rolled back
        
    ELSE
        RAISE NOTICE 'Unknown scenario - column type: %', col_type;
    END IF;
END $$;

-- Step 2: Mark failed migration as rolled back (only if not already handled above)
UPDATE "_prisma_migrations" 
SET 
    "finished_at" = NOW(),
    "rolled_back_at" = NOW()
WHERE "migration_name" = '20260103115533_change_assigned_members_to_string'
AND "finished_at" IS NULL
AND "rolled_back_at" IS NULL;

-- Step 3: Verify final state
SELECT 
    migration_name,
    finished_at,
    rolled_back_at,
    started_at
FROM "_prisma_migrations"
WHERE "migration_name" = '20260103115533_change_assigned_members_to_string';

-- Verify column state
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'live_projects' 
AND column_name IN ('assignedMembers', 'assignedMembers_temp');

-- Verify data is preserved (show sample)
SELECT 
    id,
    "clientName",
    "assignedMembers",
    LENGTH("assignedMembers") as members_length
FROM "live_projects"
LIMIT 5;

