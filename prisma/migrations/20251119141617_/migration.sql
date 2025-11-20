/*
  Warnings:

  - A unique constraint covering the columns `[projectId,index]` on the table `milestones` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `index` to the `milestones` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PAID');

-- AlterTable
ALTER TABLE "milestones" ADD COLUMN     "cost" DECIMAL(65,30),
ADD COLUMN     "index" INTEGER NOT NULL,
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID';

-- CreateTable
CREATE TABLE "milestone_payments" (
    "id" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "stripePaymentIntentId" TEXT NOT NULL,
    "stripeChargeId" TEXT,
    "paymentMethodId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'succeeded',
    "invoiceNumber" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "milestone_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "milestone_payments_invoiceNumber_key" ON "milestone_payments"("invoiceNumber");

-- CreateIndex
CREATE INDEX "milestone_payments_milestoneId_idx" ON "milestone_payments"("milestoneId");

-- CreateIndex
CREATE INDEX "milestone_payments_userId_idx" ON "milestone_payments"("userId");

-- CreateIndex
CREATE INDEX "milestone_payments_invoiceNumber_idx" ON "milestone_payments"("invoiceNumber");

-- CreateIndex
CREATE INDEX "milestones_paymentStatus_idx" ON "milestones"("paymentStatus");

-- CreateIndex
CREATE INDEX "milestones_projectId_index_idx" ON "milestones"("projectId", "index");

-- CreateIndex
CREATE UNIQUE INDEX "milestones_projectId_index_key" ON "milestones"("projectId", "index");

-- AddForeignKey
ALTER TABLE "milestone_payments" ADD CONSTRAINT "milestone_payments_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "milestones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestone_payments" ADD CONSTRAINT "milestone_payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestone_payments" ADD CONSTRAINT "milestone_payments_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "payment_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
