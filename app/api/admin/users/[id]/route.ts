import { Prisma, Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { apiAdmin, jsonError } from "@/lib/api";
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

  try {
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
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return jsonError("A user with that email already exists.", 409);
      }

      if (error.code === "P2025") {
        return jsonError("User not found.", 404);
      }
    }

    return jsonError("User could not be updated.", 500);
  }
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

  try {
    await prisma.user.update({
      where: { id },
      data: { isActive: false }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return jsonError("User not found.", 404);
    }

    return jsonError("User could not be deactivated.", 500);
  }

  return NextResponse.json({ ok: true });
}
