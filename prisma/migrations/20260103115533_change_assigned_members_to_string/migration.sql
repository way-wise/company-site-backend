-- AlterTable
-- Convert JSONB to TEXT using multi-step approach
-- Step 1: Add temporary TEXT column
ALTER TABLE "live_projects" ADD COLUMN "assignedMembers_temp" TEXT;

-- Step 2: Convert and copy data from JSONB to TEXT
-- If assignedMembers is a JSONB array, convert to comma-separated string
-- Otherwise, convert to text directly
UPDATE "live_projects" 
SET "assignedMembers_temp" = CASE 
  WHEN jsonb_typeof("assignedMembers") = 'array' 
    THEN (
      SELECT string_agg(value, ', ')
      FROM jsonb_array_elements_text("assignedMembers")
    )
  ELSE "assignedMembers"::text
END;

-- Step 3: Drop the old JSONB column
ALTER TABLE "live_projects" DROP COLUMN "assignedMembers";

-- Step 4: Rename the temporary column to the original name
ALTER TABLE "live_projects" RENAME COLUMN "assignedMembers_temp" TO "assignedMembers";
