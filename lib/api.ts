import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function apiUser() {
  const user = await getCurrentUser();

  if (!user) {
    return { user: null, response: jsonError("Authentication required.", 401) };
  }

  return { user, response: null };
}

export async function apiAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    return { user: null, response: jsonError("Authentication required.", 401) };
  }

  if (user.role !== Role.ADMIN) {
    return { user: null, response: jsonError("Admin access required.", 403) };
  }

  return { user, response: null };
}
