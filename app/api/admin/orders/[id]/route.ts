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
    include: { user: true, items: { include: { menuItem: true } } }
  });

  if (!order) {
    return jsonError("Order not found.", 404);
  }

  return NextResponse.json({ order });
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

  const order = await prisma.order.update({
    where: { id },
    data: { status: parsed.data.status }
  });

  return NextResponse.json({ order });
}
