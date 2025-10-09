-- Migration: Add Token Fields to User Table
-- This migration adds fields for storing access tokens, refresh tokens, and token expiration

-- Add token fields to users table
ALTER TABLE "users" ADD COLUMN "refreshToken" TEXT;
ALTER TABLE "users" ADD COLUMN "accessToken" TEXT;
ALTER TABLE "users" ADD COLUMN "expiresAt" INTEGER;

-- Add indexes for faster token lookups (optional but recommended for performance)
CREATE INDEX "users_refreshToken_idx" ON "users"("refreshToken");
CREATE INDEX "users_accessToken_idx" ON "users"("accessToken");

-- Migration complete
-- The fields are nullable to support existing users and allow for logout functionality

