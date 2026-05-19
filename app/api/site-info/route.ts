import { NextRequest, NextResponse } from "next/server";
import { apiAdmin } from "@/lib/api";
import { getSiteInfo } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { siteInfoSchema } from "@/lib/validations";

export async function GET() {
  const siteInfo = await getSiteInfo();
  return NextResponse.json({ siteInfo });
}

export async function PATCH(request: NextRequest) {
  const { response } = await apiAdmin();
  if (response) return response;

  const parsed = siteInfoSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const existing = await prisma.siteInfo.findFirst();
  const data = {
    ...parsed.data,
    instagramUrl: parsed.data.instagramUrl || null,
    twitterUrl: parsed.data.twitterUrl || null,
    mapUrl: parsed.data.mapUrl || null
  };
  const siteInfo = existing
    ? await prisma.siteInfo.update({ where: { id: existing.id }, data })
    : await prisma.siteInfo.create({ data });

  return NextResponse.json({ siteInfo });
}
