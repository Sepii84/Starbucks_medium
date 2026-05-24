import { NextResponse } from "next/server";
import { apiAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { response } = await apiAdmin();
  if (response) return response;

  const orders = await prisma.order.findMany({
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
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({
    orders: orders.map((order) => ({
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
    }))
  });
}
