-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('PROJECT', 'TASK', 'LEAVE', 'PAYMENT', 'MILESTONE', 'CHAT', 'FILE', 'COMMENT', 'SYSTEM');

-- CreateTable
CREATE TABLE "notifications" (
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

-- CreateIndex
CREATE INDEX "notifications_userProfileId_idx" ON "notifications"("userProfileId");

-- CreateIndex
CREATE INDEX "notifications_read_idx" ON "notifications"("read");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "notifications_userProfileId_read_idx" ON "notifications"("userProfileId", "read");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
