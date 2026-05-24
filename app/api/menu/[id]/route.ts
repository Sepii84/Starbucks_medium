import { Prisma } from "@prisma/client";
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

  const category = await prisma.menuCategory.findUnique({
    where: { id: parsed.data.categoryId },
    select: { id: true }
  });

  if (!category) {
    return NextResponse.json(
      { errors: { categoryId: ["Choose an existing category."] } },
      { status: 422 }
    );
  }

  try {
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
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return jsonError("A menu item with that slug already exists.", 409);
      }

      if (error.code === "P2025") {
        return jsonError("Menu item not found.", 404);
      }
    }

    return jsonError("Menu item could not be updated.", 500);
  }
}

export async function DELETE(
  _: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { response } = await apiAdmin();
  if (response) return response;

  const { id } = await context.params;
  try {
    await prisma.menuItem.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return jsonError("Menu item not found.", 404);
    }

    return jsonError("Menu item could not be deleted.", 500);
  }

  return NextResponse.json({ ok: true });
}
