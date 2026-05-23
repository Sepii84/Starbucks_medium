import { PaymentMethod, RewardTransactionType, Role, WalletTransactionType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { apiUser, jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { createOrderSchema } from "@/lib/validations";

function money(value: number) {
  return Number(value.toFixed(2));
}

export async function GET() {
  const { user, response } = await apiUser();
  if (response) return response;

  const orders = await prisma.order.findMany({
    where: user.role === Role.ADMIN ? undefined : { userId: user.id },
    include: { user: true, items: { include: { menuItem: true } } },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({
    orders: orders.map((order) => ({
      ...order,
      totalPrice: Number(order.totalPrice),
      items: order.items.map((item) => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        subtotal: Number(item.subtotal)
      }))
    }))
  });
}

export async function POST(request: NextRequest) {
  const { user, response } = await apiUser();
  if (response) return response;

  if (user.role !== Role.USER) {
    return jsonError("Only user accounts can place orders.", 403);
  }

  const parsed = createOrderSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const quantities = new Map<string, number>();
  for (const item of parsed.data.items) {
    quantities.set(item.menuItemId, (quantities.get(item.menuItemId) ?? 0) + item.quantity);
  }

  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: [...quantities.keys()] }, isAvailable: true },
    select: {
      id: true,
      name: true,
      price: true
    }
  });

  if (menuItems.length !== quantities.size) {
    return jsonError("One or more items are no longer available.", 409);
  }

  const items = menuItems.map((menuItem) => {
    const quantity = quantities.get(menuItem.id) ?? 1;
    const unitPrice = Number(menuItem.price);
    const subtotal = Number((unitPrice * quantity).toFixed(2));
    return { menuItem, quantity, unitPrice, subtotal };
  });
  const totalPrice = Number(items.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));
  const summary = items.map((item) => `${item.quantity}x ${item.menuItem.name}`).join(", ");
  const paymentMethod = parsed.data.paymentMethod;
  const paidWithWallet = paymentMethod === PaymentMethod.WALLET;
  const rewardPointsEarned = Math.floor(totalPrice);
  const orderData = {
    userId: user.id,
    customerName: parsed.data.customerName,
    orderType: parsed.data.orderType,
    tableNumber:
      parsed.data.orderType === "DINE_IN" ? parsed.data.tableNumber?.trim() : null,
    deliveryAddress:
      parsed.data.orderType === "DINE_IN" ? null : parsed.data.deliveryAddress?.trim(),
    paymentMethod,
    totalPrice
  };
  const orderItemRows = items.map((item) => ({
    menuItemId: item.menuItem.id,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    subtotal: item.subtotal
  }));

  try {
    const order = await prisma.$transaction(
      async (tx) => {
        let walletBalanceAfter: number | null = null;

        if (paidWithWallet) {
          const updated = await tx.user.updateMany({
            where: {
              id: user.id,
              walletBalance: { gte: totalPrice }
            },
            data: {
              walletBalance: { decrement: totalPrice },
              ...(rewardPointsEarned > 0
                ? { rewardPoints: { increment: rewardPointsEarned } }
                : {})
            }
          });

          if (!updated.count) {
            throw new Error("Your wallet balance is too low for this order.");
          }

          const updatedUser = await tx.user.findUnique({
            where: { id: user.id },
            select: { walletBalance: true }
          });

          if (!updatedUser) {
            throw new Error("User account was not found.");
          }

          walletBalanceAfter = money(Number(updatedUser.walletBalance));
        } else if (rewardPointsEarned > 0) {
          await tx.user.update({
            where: { id: user.id },
            data: { rewardPoints: { increment: rewardPointsEarned } }
          });
        }

        const created = await tx.order.create({
          data: orderData,
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
            updatedAt: true
          }
        });

        await tx.orderItem.createMany({
          data: orderItemRows.map((item) => ({
            orderId: created.id,
            ...item
          }))
        });

        if (paidWithWallet && walletBalanceAfter !== null) {
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
            message: `${parsed.data.customerName} placed an order and earned ${rewardPointsEarned} points. Items: ${summary}`,
            orderId: created.id
          }
        });

        return created;
      },
      { maxWait: 10000, timeout: 15000 }
    );

    return NextResponse.json({ order: { ...order, totalPrice: Number(order.totalPrice) } }, { status: 201 });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Order could not be placed. Please try again.",
      409
    );
  }
}
