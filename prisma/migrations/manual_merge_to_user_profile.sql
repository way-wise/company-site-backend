-- Manual Migration: Merge Admin, Client, Employee tables into UserProfile
-- This migration safely migrates data from admins, clients, and employees tables
-- into a single user_profiles table while preserving all relationships.

-- Step 1: Create the new user_profiles table
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE,
    "profilePhoto" TEXT,
    "contactNumber" TEXT,
    "address" TEXT,
    "gender" "Gender",
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "bio" TEXT,
    "website" TEXT,
    "twitter" TEXT,
    "linkedIn" TEXT,
    "facebook" TEXT,
    "language" TEXT,
    "education" TEXT,
    "experience" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "user_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Step 2: Migrate data from admins table
INSERT INTO "user_profiles" (
    "id",
    "userId",
    "profilePhoto",
    "contactNumber",
    "isDeleted",
    "createdAt",
    "updatedAt"
)
SELECT 
    "id",
    "userId",
    "profilePhoto",
    "contactNumber",
    "isDeleted",
    "createdAt",
    "updatedAt"
FROM "admins";

-- Step 3: Migrate data from clients table
INSERT INTO "user_profiles" (
    "id",
    "userId",
    "profilePhoto",
    "contactNumber",
    "address",
    "gender",
    "isDeleted",
    "bio",
    "website",
    "twitter",
    "linkedIn",
    "facebook",
    "language",
    "education",
    "experience",
    "createdAt",
    "updatedAt"
)
SELECT 
    "id",
    "userId",
    "profilePhoto",
    "contactNumber",
    "address",
    "gender",
    "isDeleted",
    "bio",
    "website",
    "twitter",
    "linkedIn",
    "facebook",
    "language",
    "education",
    "experience",
    "createdAt",
    "updatedAt"
FROM "clients";

-- Step 4: Migrate data from employees table
INSERT INTO "user_profiles" (
    "id",
    "userId",
    "profilePhoto",
    "contactNumber",
    "address",
    "gender",
    "isDeleted",
    "createdAt",
    "updatedAt"
)
SELECT 
    "id",
    "userId",
    "profilePhoto",
    "contactNumber",
    "address",
    "gender",
    "isDeleted",
    "createdAt",
    "updatedAt"
FROM "employees";

-- Step 5: Update Blog table - rename adminId to userProfileId
ALTER TABLE "blogs" RENAME COLUMN "adminId" TO "userProfileId";

-- Step 6: Update Comment table - rename clientId to userProfileId
ALTER TABLE "comments" RENAME COLUMN "clientId" TO "userProfileId";

-- Step 7: Update Project table - rename clientId to userProfileId
ALTER TABLE "projects" RENAME COLUMN "clientId" TO "userProfileId";

-- Step 8: Update EmployeeMilestone table - rename employeeId to userProfileId
ALTER TABLE "employee_milestones" RENAME COLUMN "employeeId" TO "userProfileId";

-- Step 9: Update LeaveApplication table - rename employeeId to userProfileId
ALTER TABLE "leave_applications" RENAME COLUMN "employeeId" TO "userProfileId";

-- Step 10: Drop old foreign key constraints and add new ones for blogs
ALTER TABLE "blogs" DROP CONSTRAINT IF EXISTS "blogs_adminId_fkey";
ALTER TABLE "blogs" ADD CONSTRAINT "blogs_userProfileId_fkey" 
    FOREIGN KEY ("userProfileId") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 11: Drop old foreign key constraints and add new ones for comments
ALTER TABLE "comments" DROP CONSTRAINT IF EXISTS "comments_clientId_fkey";
ALTER TABLE "comments" ADD CONSTRAINT "comments_userProfileId_fkey" 
    FOREIGN KEY ("userProfileId") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 12: Drop old foreign key constraints and add new ones for projects
ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_clientId_fkey";
ALTER TABLE "projects" ADD CONSTRAINT "projects_userProfileId_fkey" 
    FOREIGN KEY ("userProfileId") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 13: Update project indexes
DROP INDEX IF EXISTS "projects_clientId_idx";
CREATE INDEX "projects_userProfileId_idx" ON "projects"("userProfileId");

-- Step 14: Drop old foreign key constraints and add new ones for employee_milestones
ALTER TABLE "employee_milestones" DROP CONSTRAINT IF EXISTS "employee_milestones_employeeId_fkey";
ALTER TABLE "employee_milestones" ADD CONSTRAINT "employee_milestones_userProfileId_fkey" 
    FOREIGN KEY ("userProfileId") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 15: Drop old unique constraint and add new one for employee_milestones
ALTER TABLE "employee_milestones" DROP CONSTRAINT IF EXISTS "employee_milestones_employeeId_milestoneId_key";
ALTER TABLE "employee_milestones" ADD CONSTRAINT "employee_milestones_userProfileId_milestoneId_key" 
    UNIQUE ("userProfileId", "milestoneId");

-- Step 16: Drop old foreign key constraints and add new ones for leave_applications
ALTER TABLE "leave_applications" DROP CONSTRAINT IF EXISTS "leave_applications_employeeId_fkey";
ALTER TABLE "leave_applications" DROP CONSTRAINT IF EXISTS "leave_applications_approvedBy_fkey";

ALTER TABLE "leave_applications" ADD CONSTRAINT "leave_applications_userProfileId_fkey" 
    FOREIGN KEY ("userProfileId") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "leave_applications" ADD CONSTRAINT "leave_applications_approvedBy_fkey" 
    FOREIGN KEY ("approvedBy") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 17: Update leave_application indexes
DROP INDEX IF EXISTS "leave_applications_employeeId_idx";
CREATE INDEX "leave_applications_userProfileId_idx" ON "leave_applications"("userProfileId");

-- Step 18: Drop the old tables
DROP TABLE IF EXISTS "admins";
DROP TABLE IF EXISTS "clients";
DROP TABLE IF EXISTS "employees";

-- Migration complete!
-- The admins, clients, and employees tables have been merged into user_profiles
-- All foreign key relationships have been updated accordingly

