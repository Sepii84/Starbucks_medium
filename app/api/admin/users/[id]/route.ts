import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { apiAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { adminUserSchema } from "@/lib/validations";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { user: admin, response } = await apiAdmin();
  if (response) return response;

  const { id } = await context.params;
  const parsed = adminUserSchema.safeParse({ ...(await request.json()), id });

  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  if (id === admin.id && parsed.data.role !== Role.ADMIN) {
    return NextResponse.json({ error: "You cannot remove your own admin role." }, { status: 409 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
      role: parsed.data.role,
      isActive: id === admin.id ? true : parsed.data.isActive
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      address: true,
      isActive: true
    }
  });

  return NextResponse.json({ user });
}

export async function DELETE(
  _: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { user: admin, response } = await apiAdmin();
  if (response) return response;

  const { id } = await context.params;

  if (id === admin.id) {
    return NextResponse.json(
      { error: "You cannot deactivate your own admin account." },
      { status: 409 }
    );
  }

  await prisma.user.update({
    where: { id },
    data: { isActive: false }
  });

  return NextResponse.json({ ok: true });
}
