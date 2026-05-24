import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { serializeUserForClient } from "@/lib/serializers";

export async function GET() {
  const user = await getCurrentUser();

  return NextResponse.json({ user: user ? serializeUserForClient(user) : null });
}
