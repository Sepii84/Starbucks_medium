"use server";

import { WalletTransactionType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimitMessage } from "@/lib/rate-limit";
import { formatCurrency, normalizeEmail, type ActionState } from "@/lib/utils";
import { walletAdjustmentSchema, walletTopUpSchema } from "@/lib/validations";
import {
  cancelWalletTopUp,
  confirmWalletTopUp,
  createWalletTopUp,
  money,
  WalletTopUpError
} from "@/lib/wallet/top-up";

class UserFacingError extends Error {}

export async function startWalletTopUpAction(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = walletTopUpSchema.safeParse({
    amount: String(formData.get("amount") ?? "")
  });

  if (!parsed.success) {
    return { message: "Check the top-up amount.", errors: parsed.error.flatten().fieldErrors };
  }

  const rate = checkRateLimit(`wallet-top-up-action:${user.id}`, {
    limit: 10,
    windowMs: 60_000
  });
  if (!rate.ok) {
    return { message: rateLimitMessage(rate.retryAfter) };
  }

  const amount = money(parsed.data.amount);
  let confirmationUrl = "";

  try {
    const topUp = await createWalletTopUp(user.id, amount);
    confirmationUrl = topUp.confirmationUrl;
  } catch (error) {
    return {
      message:
        error instanceof WalletTopUpError
          ? error.message
          : "Could not start the demo wallet top-up."
    };
  }

  redirect(confirmationUrl);
}

export async function confirmMockTopUpAction(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const topUpId = String(formData.get("topUpId") ?? "");

  if (!topUpId) {
    return { message: "Wallet top-up reference is missing." };
  }

  try {
    await confirmWalletTopUp(user.id, topUpId);
  } catch (error) {
    return {
      message:
        error instanceof WalletTopUpError
          ? error.message
          : "Could not confirm the demo wallet top-up."
    };
  }

  revalidatePath("/wallet");
  revalidatePath("/account");
  revalidatePath("/admin/wallet");
  redirect(`/wallet/top-up/success?topUpId=${encodeURIComponent(topUpId)}`);
}

export async function cancelMockTopUpAction(formData: FormData) {
  const user = await requireUser();
  const topUpId = String(formData.get("topUpId") ?? "");

  if (topUpId) {
    await cancelWalletTopUp(user.id, topUpId).catch(() => undefined);
  }

  revalidatePath("/wallet");
  redirect(`/wallet/top-up/cancel?topUpId=${encodeURIComponent(topUpId)}`);
}

export async function adminAdjustWalletAction(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = walletAdjustmentSchema.safeParse({
    userId: String(formData.get("userId") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    reason: String(formData.get("reason") ?? "")
  });

  if (!parsed.success) {
    return { message: "Check the wallet adjustment.", errors: parsed.error.flatten().fieldErrors };
  }

  const amount = money(parsed.data.amount);

  try {
    await prisma.$transaction(async (tx) => {
      const target = await tx.user.findUnique({
        where: { id: parsed.data.userId },
        select: { id: true, name: true, email: true, walletBalance: true }
      });

      if (!target) {
        throw new UserFacingError("User was not found.");
      }

      const balanceAfter = money(Number(target.walletBalance) + amount);

      if (balanceAfter < 0) {
        throw new UserFacingError("This adjustment would make the wallet balance negative.");
      }

      await tx.user.update({
        where: { id: target.id },
        data: { walletBalance: balanceAfter }
      });

      await tx.walletTransaction.create({
        data: {
          userId: target.id,
          type: WalletTransactionType.ADMIN_ADJUSTMENT,
          amount,
          balanceAfter,
          description: `${parsed.data.reason} (admin: ${normalizeEmail(admin.email)})`
        }
      });

      await tx.notification.create({
        data: {
          type: "WALLET_ADJUSTED",
          message: `Admin adjusted ${target.name}'s wallet by ${formatCurrency(amount)}.`
        }
      });
    });
  } catch (error) {
    return {
      message: error instanceof UserFacingError ? error.message : "Could not adjust wallet."
    };
  }

  revalidatePath("/admin/wallet");
  revalidatePath("/admin/notifications");
  revalidatePath("/wallet");
  return { ok: true, message: "Wallet adjusted." };
}
