import { NextRequest, NextResponse } from "next/server";
import { apiAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  _: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { response } = await apiAdmin();
  if (response) return response;

  const { id } = await context.params;
  const notification = await prisma.notification.update({
    where: { id },
    data: { isRead: true }
  });

  return NextResponse.json({ notification });
}
