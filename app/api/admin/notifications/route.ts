import { NextResponse } from "next/server";
import { apiAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { response } = await apiAdmin();
  if (response) return response;

  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ notifications });
}

export async function PATCH() {
  const { response } = await apiAdmin();
  if (response) return response;

  await prisma.notification.updateMany({
    where: { isRead: false },
    data: { isRead: true }
  });

  return NextResponse.json({ ok: true });
}
