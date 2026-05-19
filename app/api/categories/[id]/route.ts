import { NextRequest, NextResponse } from "next/server";
import { apiAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { categorySchema } from "@/lib/validations";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { response } = await apiAdmin();
  if (response) return response;

  const { id } = await context.params;
  const parsed = categorySchema.safeParse({ ...(await request.json()), id });

  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const category = await prisma.menuCategory.update({
    where: { id },
    data: {
      name: parsed.data.name,
      slug: slugify(parsed.data.slug || parsed.data.name),
      description: parsed.data.description || null
    }
  });

  return NextResponse.json({ category });
}

export async function DELETE(
  _: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { response } = await apiAdmin();
  if (response) return response;

  const { id } = await context.params;
  await prisma.menuCategory.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
