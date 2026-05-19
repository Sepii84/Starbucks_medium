import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { apiUser, jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { createOrderSchema } from "@/lib/validations";

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
    where: { id: { in: [...quantities.keys()] }, isAvailable: true }
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
          create: items.map((item) => ({
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
        message: `${parsed.data.customerName} ordered ${summary}`,
        orderId: created.id
      }
    });

    return created;
  });

  return NextResponse.json({ order }, { status: 201 });
}
