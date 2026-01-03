# How to Resolve Failed Migration

## Option 1: Using Prisma CLI (Recommended if you have DB access)

```bash
# Mark the failed migration as rolled back
npx prisma migrate resolve --rolled-back 20260103115533_change_assigned_members_to_string

# Then run migrations
npx prisma migrate deploy
```

## Option 2: Using SQL directly (If you have database console access)

Run this SQL in your database console:

```sql
-- Mark failed migration as rolled back
UPDATE "_prisma_migrations" 
SET "finished_at" = NOW(), "rolled_back_at" = NOW()
WHERE "migration_name" = '20260103115533_change_assigned_members_to_string'
AND "finished_at" IS NULL;
```

## Option 3: Complete workflow (if migration partially ran)

If the migration partially ran, you need to complete it first:

```sql
-- Check if temp column exists and complete the migration
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'live_projects' 
        AND column_name = 'assignedMembers_temp'
    ) THEN
        -- Complete the migration
        UPDATE "live_projects" 
        SET "assignedMembers_temp" = CASE 
            WHEN jsonb_typeof("assignedMembers") = 'array' 
            THEN (SELECT string_agg(value, ', ') FROM jsonb_array_elements_text("assignedMembers"))
            ELSE "assignedMembers"::text
        END
        WHERE "assignedMembers_temp" IS NULL;
        
        ALTER TABLE "live_projects" DROP COLUMN "assignedMembers";
        ALTER TABLE "live_projects" RENAME COLUMN "assignedMembers_temp" TO "assignedMembers";
        ALTER TABLE "live_projects" ALTER COLUMN "assignedMembers" SET NOT NULL;
    END IF;
END $$;

-- Mark as rolled back
UPDATE "_prisma_migrations" 
SET "finished_at" = NOW(), "rolled_back_at" = NOW()
WHERE "migration_name" = '20260103115533_change_assigned_members_to_string';
```

