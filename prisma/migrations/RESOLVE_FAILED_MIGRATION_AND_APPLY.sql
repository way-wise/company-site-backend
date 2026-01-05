-- ============================================================
-- RESOLVE FAILED MIGRATION AND ALLOW NEW MIGRATIONS
-- ============================================================
-- This script resolves the failed migration and ensures
-- the database is in the correct state for new migrations
-- ============================================================

DO $$ 
BEGIN
  -- Step 1: Check if assignedMembers_temp column exists (partial migration)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'live_projects' 
    AND column_name = 'assignedMembers_temp'
  ) THEN
    -- Complete the migration: convert data and finalize
    UPDATE "live_projects" 
    SET "assignedMembers_temp" = CASE 
      WHEN jsonb_typeof("assignedMembers") = 'array' 
        THEN (
          SELECT string_agg(value, ', ')
          FROM jsonb_array_elements_text("assignedMembers")
        )
      ELSE COALESCE("assignedMembers"::text, '')
    END
    WHERE "assignedMembers_temp" IS NULL;
    
    -- Drop old column if it still exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'live_projects' 
      AND column_name = 'assignedMembers'
      AND data_type = 'jsonb'
    ) THEN
      ALTER TABLE "live_projects" DROP COLUMN "assignedMembers";
    END IF;
    
    -- Rename temp column
    ALTER TABLE "live_projects" RENAME COLUMN "assignedMembers_temp" TO "assignedMembers";
    
    -- Ensure NOT NULL
    UPDATE "live_projects" SET "assignedMembers" = '' WHERE "assignedMembers" IS NULL;
    ALTER TABLE "live_projects" ALTER COLUMN "assignedMembers" SET NOT NULL;
  END IF;
  
  -- Step 2: If assignedMembers is still JSONB, convert it
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'live_projects' 
    AND column_name = 'assignedMembers'
    AND data_type = 'jsonb'
  ) THEN
    -- Add temp column
    ALTER TABLE "live_projects" ADD COLUMN "assignedMembers_temp" TEXT;
    
    -- Convert data
    UPDATE "live_projects" 
    SET "assignedMembers_temp" = CASE 
      WHEN jsonb_typeof("assignedMembers") = 'array' 
        THEN (
          SELECT string_agg(value, ', ')
          FROM jsonb_array_elements_text("assignedMembers")
        )
      ELSE COALESCE("assignedMembers"::text, '')
    END;
    
    -- Drop old and rename
    ALTER TABLE "live_projects" DROP COLUMN "assignedMembers";
    ALTER TABLE "live_projects" RENAME COLUMN "assignedMembers_temp" TO "assignedMembers";
    
    -- Ensure NOT NULL
    UPDATE "live_projects" SET "assignedMembers" = '' WHERE "assignedMembers" IS NULL;
    ALTER TABLE "live_projects" ALTER COLUMN "assignedMembers" SET NOT NULL;
  END IF;
  
  -- Step 3: Ensure assignedMembers is TEXT and NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'live_projects' 
    AND column_name = 'assignedMembers'
    AND (data_type != 'text' OR is_nullable = 'YES')
  ) THEN
    UPDATE "live_projects" SET "assignedMembers" = '' WHERE "assignedMembers" IS NULL;
    ALTER TABLE "live_projects" ALTER COLUMN "assignedMembers" TYPE TEXT;
    ALTER TABLE "live_projects" ALTER COLUMN "assignedMembers" SET NOT NULL;
  END IF;
  
  -- Step 4: Mark the failed migration as rolled back (so we can re-apply it or skip it)
  UPDATE "_prisma_migrations"
  SET "rolled_back_at" = NOW()
  WHERE "migration_name" = '20260103115533_change_assigned_members_to_string'
  AND "finished_at" IS NULL
  AND "rolled_back_at" IS NULL;
  
  -- Step 5: If it's already marked as started but not finished, mark as rolled back
  UPDATE "_prisma_migrations"
  SET "rolled_back_at" = NOW()
  WHERE "migration_name" = '20260103115533_change_assigned_members_to_string'
  AND "finished_at" IS NULL;
  
  RAISE NOTICE 'Migration resolution completed. Database is now ready for new migrations.';
  
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Error during migration resolution: %', SQLERRM;
    -- Continue anyway - the migration might already be in the correct state
END $$;

-- Verify the state
DO $$
DECLARE
  col_type TEXT;
  col_nullable TEXT;
BEGIN
  SELECT data_type, is_nullable INTO col_type, col_nullable
  FROM information_schema.columns
  WHERE table_name = 'live_projects' 
  AND column_name = 'assignedMembers';
  
  IF col_type IS NULL THEN
    RAISE EXCEPTION 'assignedMembers column does not exist!';
  ELSIF col_type != 'text' THEN
    RAISE EXCEPTION 'assignedMembers is % (expected text)', col_type;
  ELSIF col_nullable = 'YES' THEN
    RAISE EXCEPTION 'assignedMembers is nullable (expected NOT NULL)';
  ELSE
    RAISE NOTICE '✓ assignedMembers is TEXT and NOT NULL - correct state';
  END IF;
END $$;

