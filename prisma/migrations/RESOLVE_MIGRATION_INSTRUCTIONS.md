# Resolve Failed Migration - Quick Fix

## Problem
The migration `20260103115533_change_assigned_members_to_string` is marked as failed in the database, blocking new migrations.

## Solution

### Option 1: Run SQL Script Directly (Recommended)

Connect to your production database and run this SQL:

```sql
-- Resolve failed migration
DO $$ 
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
    ELSE
      -- Migration failed, mark as rolled back
      UPDATE "_prisma_migrations"
      SET "rolled_back_at" = NOW()
      WHERE "migration_name" = '20260103115533_change_assigned_members_to_string'
      AND "finished_at" IS NULL;
    END IF;
  END IF;
END $$;
```

### Option 2: Update Deployment Command

Update your Coolify install command to:

```bash
pnpm i && psql "$DATABASE_URL" -f prisma/migrations/auto-resolve-failed-migration.sql && npx prisma migrate deploy && npx prisma generate && pnpm seed
```

**Note:** This requires `psql` to be available in the build environment. If not available, use Option 1.

### Option 3: Use Prisma CLI

If you have database access:

```bash
npx prisma migrate resolve --rolled-back 20260103115533_change_assigned_members_to_string
npx prisma migrate deploy
```

## After Resolution

Once resolved, your deployment should succeed and the new `projectName` migration will be applied automatically.

