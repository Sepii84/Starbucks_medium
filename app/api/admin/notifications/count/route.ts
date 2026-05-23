import { NextResponse } from "next/server";
import { apiAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { response } = await apiAdmin();
  if (response) return response;

  const count = await prisma.notification.count({ where: { isRead: false } });

  return NextResponse.json({ count });
}
