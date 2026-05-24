import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { apiAdmin, jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { menuItemSchema } from "@/lib/validations";

export async function GET() {
  const items = await prisma.menuItem.findMany({
    include: { category: true },
    orderBy: { name: "asc" }
  });

  return NextResponse.json({
    items: items.map((item) => ({
      ...item,
      price: Number(item.price)
    }))
  });
}

export async function POST(request: NextRequest) {
  const { response } = await apiAdmin();
  if (response) return response;

  const body = await request.json();
  const parsed = menuItemSchema.safeParse(body);

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
    const item = await prisma.menuItem.create({
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

    return NextResponse.json({ item: { ...item, price: Number(item.price) } }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return jsonError("A menu item with that slug already exists.", 409);
    }

    return jsonError("Menu item could not be created.", 500);
  }
}
