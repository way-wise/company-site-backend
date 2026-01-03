-- AlterTable
-- Convert JSONB to TEXT
-- If assignedMembers is a JSONB array, convert to comma-separated string
-- Otherwise, convert to text directly
ALTER TABLE "live_projects" 
  ALTER COLUMN "assignedMembers" TYPE TEXT 
  USING CASE 
    WHEN jsonb_typeof("assignedMembers") = 'array' 
      THEN array_to_string(ARRAY(SELECT jsonb_array_elements_text("assignedMembers")), ', ')
    ELSE "assignedMembers"::text
  END;
