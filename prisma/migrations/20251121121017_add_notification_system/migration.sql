-- CreateEnum (only if it doesn't exist)
DO $$ BEGIN
    CREATE TYPE "NotificationType" AS ENUM ('PROJECT', 'TASK', 'LEAVE', 'PAYMENT', 'MILESTONE', 'CHAT', 'FILE', 'COMMENT', 'SYSTEM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS "notifications" (
    "id" TEXT NOT NULL,
    "userProfileId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (only if they don't exist)
CREATE INDEX IF NOT EXISTS "notifications_userProfileId_idx" ON "notifications"("userProfileId");
CREATE INDEX IF NOT EXISTS "notifications_read_idx" ON "notifications"("read");
CREATE INDEX IF NOT EXISTS "notifications_createdAt_idx" ON "notifications"("createdAt");
CREATE INDEX IF NOT EXISTS "notifications_type_idx" ON "notifications"("type");
CREATE INDEX IF NOT EXISTS "notifications_userProfileId_read_idx" ON "notifications"("userProfileId", "read");

-- AddForeignKey (only if it doesn't exist)
DO $$ BEGIN
    ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
