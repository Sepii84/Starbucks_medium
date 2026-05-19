import { NextResponse } from "next/server";
import { apiAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { response } = await apiAdmin();
  if (response) return response;

  const orders = await prisma.order.findMany({
    include: {
      user: true,
      items: { include: { menuItem: true } }
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
        subtotal: Number(item.subtotal)
      }))
    }))
  });
}
