import crypto from "node:crypto";
import {
  Prisma,
  WalletTopUpProvider,
  WalletTopUpStatus,
  WalletTransactionType
} from "@prisma/client";
import { getWalletTopUpPaymentProvider } from "@/lib/payments";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";

export class WalletTopUpError extends Error {}

const pendingReuseWindowMs = 30_000;

export function money(value: number) {
  return Number(value.toFixed(2));
}

export async function createWalletTopUp(userId: string, amountInput: number) {
  const amount = money(amountInput);
  const provider = getWalletTopUpPaymentProvider();
  const recentPending = await prisma.walletTopUp.findFirst({
    where: {
      userId,
      amount: new Prisma.Decimal(amount),
      provider: WalletTopUpProvider.MOCK,
      status: WalletTopUpStatus.PENDING,
      createdAt: { gte: new Date(Date.now() - pendingReuseWindowMs) }
    },
    orderBy: { createdAt: "desc" }
  });

  if (recentPending) {
    const session = await provider.createTopUpCheckoutSession({
      topUpId: recentPending.id,
      amount,
      currency: recentPending.currency
    });

    return { topUp: recentPending, confirmationUrl: session.confirmationUrl };
  }

  const topUp = await prisma.walletTopUp.create({
    data: {
      userId,
      amount,
      currency: "USD",
      provider: WalletTopUpProvider.MOCK,
      providerSessionId: `mock_pending_${crypto.randomUUID()}`,
      idempotencyKey: crypto.randomUUID()
    }
  });
  const session = await provider.createTopUpCheckoutSession({
    topUpId: topUp.id,
    amount,
    currency: topUp.currency
  });
  const updatedTopUp = await prisma.walletTopUp.update({
    where: { id: topUp.id },
    data: { providerSessionId: session.providerSessionId }
  });

  return { topUp: updatedTopUp, confirmationUrl: session.confirmationUrl };
}

export async function confirmWalletTopUp(userId: string, topUpId: string) {
  const provider = getWalletTopUpPaymentProvider();
  const confirmation = await provider.confirmMockPayment(topUpId);

  if (confirmation.provider !== "MOCK") {
    throw new WalletTopUpError("Only mock wallet top-ups are supported.");
  }

  return prisma.$transaction(async (tx) => {
    const topUp = await tx.walletTopUp.findUnique({
      where: { id: topUpId },
      include: { walletTransaction: true }
    });

    if (!topUp || topUp.userId !== userId) {
      throw new WalletTopUpError("Wallet top-up was not found.");
    }

    if (topUp.status === WalletTopUpStatus.SUCCEEDED) {
      const transaction = topUp.walletTransaction;
      const balanceAfter =
        transaction?.balanceAfter ??
        (
          await tx.user.findUnique({
            where: { id: userId },
            select: { walletBalance: true }
          })
        )?.walletBalance ??
        new Prisma.Decimal(0);

      return {
        alreadyConfirmed: true,
        topUpId: topUp.id,
        amount: money(Number(topUp.amount)),
        balanceAfter: money(Number(balanceAfter)),
        transactionId: transaction?.id ?? null
      };
    }

    if (topUp.status === WalletTopUpStatus.CANCELED) {
      throw new WalletTopUpError("This wallet top-up was canceled.");
    }

    if (topUp.status === WalletTopUpStatus.FAILED) {
      throw new WalletTopUpError("This wallet top-up failed and cannot be confirmed.");
    }

    const claimed = await tx.walletTopUp.updateMany({
      where: { id: topUp.id, status: WalletTopUpStatus.PENDING },
      data: {
        status: WalletTopUpStatus.SUCCEEDED,
        providerPaymentId: confirmation.providerPaymentId,
        confirmedAt: new Date()
      }
    });

    if (!claimed.count) {
      const current = await tx.walletTopUp.findUnique({
        where: { id: topUp.id },
        include: { walletTransaction: true }
      });

      if (current?.status !== WalletTopUpStatus.SUCCEEDED) {
        throw new WalletTopUpError("This wallet top-up is no longer pending.");
      }

      return {
        alreadyConfirmed: true,
        topUpId: topUp.id,
        amount: money(Number(topUp.amount)),
        balanceAfter: money(Number(current?.walletTransaction?.balanceAfter ?? 0)),
        transactionId: current?.walletTransaction?.id ?? null
      };
    }

    const currentUser = await tx.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true }
    });

    if (!currentUser) {
      throw new WalletTopUpError("User account was not found.");
    }

    const amount = money(Number(topUp.amount));
    const balanceAfter = money(Number(currentUser.walletBalance) + amount);

    await tx.user.update({
      where: { id: userId },
      data: { walletBalance: balanceAfter }
    });

    const transaction = await tx.walletTransaction.create({
      data: {
        userId,
        type: WalletTransactionType.TOP_UP,
        amount,
        balanceAfter,
        topUpId: topUp.id,
        description: `Demo wallet top-up confirmed by MOCK provider for ${formatCurrency(amount)}.`
      }
    });

    return {
      alreadyConfirmed: false,
      topUpId: topUp.id,
      amount,
      balanceAfter,
      transactionId: transaction.id
    };
  });
}

export async function cancelWalletTopUp(userId: string, topUpId: string) {
  const topUp = await prisma.walletTopUp.findUnique({
    where: { id: topUpId },
    select: { id: true, userId: true, status: true }
  });

  if (!topUp || topUp.userId !== userId) {
    throw new WalletTopUpError("Wallet top-up was not found.");
  }

  if (topUp.status === WalletTopUpStatus.PENDING) {
    await prisma.walletTopUp.update({
      where: { id: topUp.id },
      data: { status: WalletTopUpStatus.CANCELED }
    });
  }
}
