import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { apiUser, jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET(
  _: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { user, response } = await apiUser();
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

  if (user.role !== Role.ADMIN && order.userId !== user.id) {
    return jsonError("You cannot view this order.", 403);
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
