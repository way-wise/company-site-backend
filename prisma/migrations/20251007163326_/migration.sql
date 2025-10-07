/*
  Warnings:

  - You are about to drop the column `passwordChangeRequired` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "passwordChangeRequired",
ADD COLUMN     "isPasswordChangeRequired" BOOLEAN NOT NULL DEFAULT true;
