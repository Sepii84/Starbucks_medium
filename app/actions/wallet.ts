"use server";

import { WalletTransactionType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireAdmin, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, normalizeEmail, type ActionState } from "@/lib/utils";
import { walletAdjustmentSchema, walletChargeSchema } from "@/lib/validations";

class UserFacingError extends Error {}

function money(value: number) {
  return Number(value.toFixed(2));
}

export async function chargeWalletAction(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = walletChargeSchema.safeParse({
    amount: String(formData.get("amount") ?? "")
  });

  if (!parsed.success) {
    return { message: "Check the charge amount.", errors: parsed.error.flatten().fieldErrors };
  }

  const amount = money(parsed.data.amount);

  await prisma.$transaction(async (tx) => {
    const current = await tx.user.findUnique({
      where: { id: user.id },
      select: { walletBalance: true }
    });

    if (!current) {
      throw new UserFacingError("User account was not found.");
    }

    const balanceAfter = money(Number(current.walletBalance) + amount);

    await tx.user.update({
      where: { id: user.id },
      data: { walletBalance: balanceAfter }
    });

    await tx.walletTransaction.create({
      data: {
        userId: user.id,
        type: WalletTransactionType.CHARGE,
        amount,
        balanceAfter,
        description: `Wallet charged by ${formatCurrency(amount)}.`
      }
    });
  });

  revalidatePath("/wallet");
  revalidatePath("/account");
  revalidatePath("/admin/wallet");
  return { ok: true, message: `Wallet charged by ${formatCurrency(amount)}.` };
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
