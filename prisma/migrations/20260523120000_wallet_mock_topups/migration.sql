-- CreateEnum
CREATE TYPE "WalletTopUpStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELED');

-- CreateEnum
CREATE TYPE "WalletTopUpProvider" AS ENUM ('MOCK');

-- AlterEnum
ALTER TYPE "WalletTransactionType" ADD VALUE IF NOT EXISTS 'TOP_UP';

-- AlterTable
ALTER TABLE "WalletTransaction" ADD COLUMN "topUpId" TEXT;

-- CreateTable
CREATE TABLE "WalletTopUp" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "WalletTopUpStatus" NOT NULL DEFAULT 'PENDING',
    "provider" "WalletTopUpProvider" NOT NULL DEFAULT 'MOCK',
    "providerSessionId" TEXT NOT NULL,
    "providerPaymentId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "WalletTopUp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WalletTransaction_topUpId_key" ON "WalletTransaction"("topUpId");

-- CreateIndex
CREATE UNIQUE INDEX "WalletTopUp_providerSessionId_key" ON "WalletTopUp"("providerSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "WalletTopUp_idempotencyKey_key" ON "WalletTopUp"("idempotencyKey");

-- AddForeignKey
ALTER TABLE "WalletTopUp" ADD CONSTRAINT "WalletTopUp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_topUpId_fkey" FOREIGN KEY ("topUpId") REFERENCES "WalletTopUp"("id") ON DELETE SET NULL ON UPDATE CASCADE;
