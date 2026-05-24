import { OrderStatus, RewardTransactionType, WalletTransactionType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { apiAdmin, jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { orderStatusSchema } from "@/lib/validations";

export async function GET(
  _: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { response } = await apiAdmin();
  if (response) return response;

  const { id } = await context.params;
  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      customerName: true,
      orderType: true,
      tableNumber: true,
      deliveryAddress: true,
      paymentMethod: true,
      status: true,
      totalPrice: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: { id: true, name: true, email: true, role: true }
      },
      items: {
        select: {
          id: true,
          orderId: true,
          menuItemId: true,
          quantity: true,
          unitPrice: true,
          subtotal: true,
          menuItem: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              price: true,
              imageUrl: true,
              categoryId: true,
              isAvailable: true,
              isFeatured: true
            }
          }
        }
      }
    }
  });

  if (!order) {
    return jsonError("Order not found.", 404);
  }

  return NextResponse.json({
    order: {
      ...order,
      totalPrice: Number(order.totalPrice),
      items: order.items.map((item) => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        subtotal: Number(item.subtotal),
        menuItem: {
          ...item.menuItem,
          price: Number(item.menuItem.price)
        }
      }))
    }
  });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { response } = await apiAdmin();
  if (response) return response;

  const { id } = await context.params;
  const parsed = orderStatusSchema.safeParse({ ...(await request.json()), id });

  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const order = await prisma.$transaction(async (tx) => {
    const existing = await tx.order.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, rewardPoints: true, walletBalance: true }
        },
        rewardTransactions: {
          where: { type: RewardTransactionType.EARNED }
        },
        walletTransactions: {
          where: { type: WalletTransactionType.ORDER_PAYMENT }
        }
      }
    });

    if (!existing) {
      return null;
    }

    const updated = await tx.order.update({
      where: { id },
      data: { status: parsed.data.status },
      select: {
        id: true,
        status: true,
        updatedAt: true
      }
    });

    if (parsed.data.status === OrderStatus.CANCELLED && existing.status !== OrderStatus.CANCELLED) {
      const earnedPoints = existing.rewardTransactions.reduce(
        (sum, transaction) => sum + Math.max(0, transaction.points),
        0
      );
      const pointsToReverse = Math.min(existing.user.rewardPoints, earnedPoints);
      const walletRefund = Number(
        existing.walletTransactions
          .reduce((sum, transaction) => sum + Math.abs(Number(transaction.amount)), 0)
          .toFixed(2)
      );
      const balanceAfter = Number((Number(existing.user.walletBalance) + walletRefund).toFixed(2));

      if (pointsToReverse > 0 || walletRefund > 0) {
        await tx.user.update({
          where: { id: existing.userId },
          data: {
            rewardPoints:
              pointsToReverse > 0 ? { decrement: pointsToReverse } : undefined,
            walletBalance: walletRefund > 0 ? balanceAfter : undefined
          }
        });
      }

      if (pointsToReverse > 0) {
        await tx.rewardTransaction.create({
          data: {
            userId: existing.userId,
            type: RewardTransactionType.REFUNDED,
            points: -pointsToReverse,
            orderId: existing.id,
            description: `Reversed ${pointsToReverse} points after order cancellation.`
          }
        });
      }

      if (walletRefund > 0) {
        await tx.walletTransaction.create({
          data: {
            userId: existing.userId,
            type: WalletTransactionType.REFUND,
            amount: walletRefund,
            balanceAfter,
            orderId: existing.id,
            description: "Wallet refund after order cancellation."
          }
        });
      }

      await tx.notification.create({
        data: {
          type: "ORDER_CANCELLED",
          message: `${existing.user.name}'s order was cancelled. Wallet and reward reversals were recorded.`,
          orderId: existing.id
        }
      });
    }

    return updated;
  });

  if (!order) {
    return jsonError("Order not found.", 404);
  }

  return NextResponse.json({ order });
}
