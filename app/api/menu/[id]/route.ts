import { NextRequest, NextResponse } from "next/server";
import { apiAdmin, jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { menuItemSchema } from "@/lib/validations";

export async function GET(
  _: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const item = await prisma.menuItem.findUnique({
    where: { id },
    include: { category: true }
  });

  if (!item) {
    return jsonError("Menu item not found.", 404);
  }

  return NextResponse.json({ item: { ...item, price: Number(item.price) } });
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { response } = await apiAdmin();
  if (response) return response;

  const { id } = await context.params;
  const body = await request.json();
  const parsed = menuItemSchema.safeParse({ ...body, id });

  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const item = await prisma.menuItem.update({
    where: { id },
    data: {
      name: parsed.data.name,
      slug: slugify(parsed.data.slug || parsed.data.name),
      description: parsed.data.description,
      price: parsed.data.price,
      imageUrl: parsed.data.imageUrl,
      categoryId: parsed.data.categoryId,
      isAvailable: parsed.data.isAvailable,
      isFeatured: parsed.data.isFeatured
    }
  });

  return NextResponse.json({ item: { ...item, price: Number(item.price) } });
}

export async function DELETE(
  _: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { response } = await apiAdmin();
  if (response) return response;

  const { id } = await context.params;
  await prisma.menuItem.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
