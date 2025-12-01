-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('STRIPE', 'MANUAL');

-- DropForeignKey
ALTER TABLE "public"."milestone_payments" DROP CONSTRAINT "milestone_payments_paymentMethodId_fkey";

-- AlterTable
ALTER TABLE "milestone_payments" ADD COLUMN     "manualPaymentMethod" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "paymentType" "PaymentType" NOT NULL DEFAULT 'STRIPE',
ADD COLUMN     "processedBy" TEXT,
ALTER COLUMN "stripePaymentIntentId" DROP NOT NULL,
ALTER COLUMN "paymentMethodId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "milestone_payments_paymentType_idx" ON "milestone_payments"("paymentType");

-- CreateIndex
CREATE INDEX "milestone_payments_processedBy_idx" ON "milestone_payments"("processedBy");

-- AddForeignKey
ALTER TABLE "milestone_payments" ADD CONSTRAINT "milestone_payments_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "payment_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestone_payments" ADD CONSTRAINT "milestone_payments_processedBy_fkey" FOREIGN KEY ("processedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
