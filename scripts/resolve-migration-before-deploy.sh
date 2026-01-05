#!/bin/bash
# Script to resolve failed migration before running migrate deploy
# This can be added to your deployment process

set -e

echo "🔍 Checking for failed migrations..."

# Run SQL to resolve failed migration
psql "$DATABASE_URL" <<EOF
DO \$\$ 
BEGIN
  -- Check if the failed migration exists
  IF EXISTS (
    SELECT 1 FROM "_prisma_migrations"
    WHERE "migration_name" = '20260103115533_change_assigned_members_to_string'
    AND "finished_at" IS NULL
  ) THEN
    -- Check if migration actually succeeded (column is TEXT)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'live_projects' 
      AND column_name = 'assignedMembers'
      AND data_type = 'text'
    ) THEN
      -- Migration succeeded, mark as finished
      UPDATE "_prisma_migrations"
      SET "finished_at" = NOW(),
          "rolled_back_at" = NULL
      WHERE "migration_name" = '20260103115533_change_assigned_members_to_string'
      AND "finished_at" IS NULL;
      
      RAISE NOTICE 'Migration was already applied - marked as finished';
    ELSE
      -- Migration failed, mark as rolled back
      UPDATE "_prisma_migrations"
      SET "rolled_back_at" = NOW()
      WHERE "migration_name" = '20260103115533_change_assigned_members_to_string'
      AND "finished_at" IS NULL;
      
      RAISE NOTICE 'Failed migration marked as rolled back';
    END IF;
  END IF;
END \$\$;
EOF

echo "✅ Migration resolution complete"

