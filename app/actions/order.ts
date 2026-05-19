"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createOrderSchema } from "@/lib/validations";

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

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        userId: user.id,
        customerName: parsed.data.customerName,
        orderType: parsed.data.orderType,
        tableNumber:
          parsed.data.orderType === "DINE_IN" ? parsed.data.tableNumber?.trim() : null,
        deliveryAddress:
          parsed.data.orderType === "DINE_IN" ? null : parsed.data.deliveryAddress?.trim(),
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

    await tx.notification.create({
      data: {
        type: "ORDER_CREATED",
        message: `${parsed.data.customerName} ordered ${itemSummary}`,
        orderId: created.id
      }
    });

    return created;
  });

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/notifications");
  revalidatePath("/order");

  return {
    ok: true,
    orderId: order.id,
    message: "Order placed. The bar has been notified."
  };
}
