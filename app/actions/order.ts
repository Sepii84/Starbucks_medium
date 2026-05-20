"use server";

import { PaymentMethod, RewardTransactionType, WalletTransactionType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createOrderSchema } from "@/lib/validations";

class UserFacingError extends Error {}

function money(value: number) {
  return Number(value.toFixed(2));
}

export type CreateOrderResult =
  | {
      ok: true;
      orderId: string;
      message: string;
    }
  | {
      ok: false;
      message: string;
      errors?: Record<string, string[]>;
    };

export async function createOrderAction(input: unknown): Promise<CreateOrderResult> {
  const user = await requireUser();
  const parsed = createOrderSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the order details before submitting.",
      errors: parsed.error.flatten().fieldErrors
    };
  }

  const quantities = new Map<string, number>();
  for (const item of parsed.data.items) {
    quantities.set(item.menuItemId, (quantities.get(item.menuItemId) ?? 0) + item.quantity);
  }

  const menuItems = await prisma.menuItem.findMany({
    where: {
      id: { in: [...quantities.keys()] },
      isAvailable: true
    },
    include: { category: true }
  });

  if (menuItems.length !== quantities.size) {
    return {
      ok: false,
      message: "One or more items in your bag are no longer available."
    };
  }

  const orderItems = menuItems.map((menuItem) => {
    const quantity = quantities.get(menuItem.id) ?? 1;
    const unitPrice = Number(menuItem.price);
    const subtotal = Number((unitPrice * quantity).toFixed(2));

    return {
      menuItem,
      quantity,
      unitPrice,
      subtotal
    };
  });

  const totalPrice = Number(
    orderItems.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2)
  );
  const itemSummary = orderItems
    .map((item) => `${item.quantity}x ${item.menuItem.name}`)
    .join(", ");

  let order;

  try {
    order = await prisma.$transaction(async (tx) => {
      const currentUser = await tx.user.findUnique({
        where: { id: user.id },
        select: { walletBalance: true, rewardPoints: true, name: true }
      });

      if (!currentUser) {
        throw new UserFacingError("User account was not found.");
      }

      const paymentMethod = parsed.data.paymentMethod;
      const paidWithWallet = paymentMethod === PaymentMethod.WALLET;
      const walletBalanceAfter = money(Number(currentUser.walletBalance) - totalPrice);

      if (paidWithWallet && walletBalanceAfter < 0) {
        throw new UserFacingError("Your wallet balance is too low for this order.");
      }

      const rewardPointsEarned = Math.floor(totalPrice);

      const created = await tx.order.create({
        data: {
          userId: user.id,
          customerName: parsed.data.customerName,
          orderType: parsed.data.orderType,
          tableNumber:
            parsed.data.orderType === "DINE_IN" ? parsed.data.tableNumber?.trim() : null,
          deliveryAddress:
            parsed.data.orderType === "DINE_IN" ? null : parsed.data.deliveryAddress?.trim(),
          paymentMethod,
          totalPrice,
          items: {
            create: orderItems.map((item) => ({
              menuItemId: item.menuItem.id,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal
            }))
          }
        }
      });

      if (paidWithWallet) {
        await tx.user.update({
          where: { id: user.id },
          data: {
            walletBalance: walletBalanceAfter,
            rewardPoints: { increment: rewardPointsEarned }
          }
        });

        await tx.walletTransaction.create({
          data: {
            userId: user.id,
            type: WalletTransactionType.ORDER_PAYMENT,
            amount: -totalPrice,
            balanceAfter: walletBalanceAfter,
            orderId: created.id,
            description: `Wallet payment for order #${created.id.slice(-8).toUpperCase()}.`
          }
        });
      } else if (rewardPointsEarned > 0) {
        await tx.user.update({
          where: { id: user.id },
          data: { rewardPoints: { increment: rewardPointsEarned } }
        });
      }

      if (rewardPointsEarned > 0) {
        await tx.rewardTransaction.create({
          data: {
            userId: user.id,
            type: RewardTransactionType.EARNED,
            points: rewardPointsEarned,
            orderId: created.id,
            description: `Earned ${rewardPointsEarned} points from order #${created.id
              .slice(-8)
              .toUpperCase()}.`
          }
        });
      }

      await tx.notification.create({
        data: {
          type: "ORDER_CREATED",
          message: `${parsed.data.customerName} placed an order and earned ${rewardPointsEarned} points. Items: ${itemSummary}`,
          orderId: created.id
        }
      });

      return created;
    });
  } catch (error) {
    return {
      ok: false,
      message: error instanceof UserFacingError ? error.message : "Could not place order."
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/notifications");
  revalidatePath("/order");
  revalidatePath("/wallet");
  revalidatePath("/rewards");

  return {
    ok: true,
    orderId: order.id,
    message: "Order placed. The bar has been notified and reward points were updated."
  };
}
