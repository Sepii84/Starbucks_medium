import { NextRequest, NextResponse } from "next/server";
import { apiAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { categorySchema } from "@/lib/validations";

export async function GET() {
  const categories = await prisma.menuCategory.findMany({
    include: { items: true },
    orderBy: { name: "asc" }
  });

  return NextResponse.json({ categories });
}

export async function POST(request: NextRequest) {
  const { response } = await apiAdmin();
  if (response) return response;

  const parsed = categorySchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const category = await prisma.menuCategory.create({
    data: {
      name: parsed.data.name,
      slug: slugify(parsed.data.slug || parsed.data.name),
      description: parsed.data.description || null
    }
  });

  return NextResponse.json({ category }, { status: 201 });
}
