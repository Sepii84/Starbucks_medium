import { NextResponse } from "next/server";
import { apiAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { response } = await apiAdmin();
  if (response) return response;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      address: true,
      isActive: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return NextResponse.json({ users });
}
