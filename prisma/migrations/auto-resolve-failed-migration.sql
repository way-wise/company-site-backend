-- Auto-resolve failed migration during deployment
-- This script is safe to run multiple times (idempotent)

DO $$ 
BEGIN
  -- Check if the failed migration exists in _prisma_migrations
  IF EXISTS (
    SELECT 1 FROM "_prisma_migrations"
    WHERE "migration_name" = '20260103115533_change_assigned_members_to_string'
    AND "finished_at" IS NULL
  ) THEN
    -- Check current state of assignedMembers column
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'live_projects' 
      AND column_name = 'assignedMembers'
      AND data_type = 'text'
    ) THEN
      -- Migration actually succeeded, just mark it as finished
      UPDATE "_prisma_migrations"
      SET "finished_at" = NOW(),
          "rolled_back_at" = NULL
      WHERE "migration_name" = '20260103115533_change_assigned_members_to_string'
      AND "finished_at" IS NULL;
      
      RAISE NOTICE 'Migration was already applied - marked as finished';
    ELSE
      -- Migration failed, mark as rolled back so it can be skipped
      UPDATE "_prisma_migrations"
      SET "rolled_back_at" = NOW()
      WHERE "migration_name" = '20260103115533_change_assigned_members_to_string'
      AND "finished_at" IS NULL;
      
      RAISE NOTICE 'Failed migration marked as rolled back';
    END IF;
  END IF;
END $$;

