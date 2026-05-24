"use server";

import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimitMessage } from "@/lib/rate-limit";
import {
  authRedirectFor,
  clearSessionCookie,
  hashPassword,
  setSessionCookie,
  verifyPassword
} from "@/lib/auth";
import { type ActionState } from "@/lib/utils";
import { loginSchema, registerSchema } from "@/lib/validations";
import { normalizeEmail } from "@/lib/utils";

function safeNext(value: string | undefined, role: Role) {
  if (!value?.startsWith("/") || value.startsWith("//")) {
    return authRedirectFor(role);
  }

  if (role === Role.USER && value.startsWith("/admin")) {
    return "/";
  }

  if (role === Role.ADMIN) {
    return "/admin";
  }

  return value;
}

export async function loginAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: normalizeEmail(String(formData.get("email") ?? "")),
    password: String(formData.get("password") ?? ""),
    next: String(formData.get("next") ?? "")
  });

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      message: "Check the highlighted fields."
    };
  }

  const rate = checkRateLimit(`login:${parsed.data.email}`, { limit: 8, windowMs: 5 * 60_000 });
  if (!rate.ok) {
    return { message: rateLimitMessage(rate.retryAfter) };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      passwordHash: true,
      isActive: true
    }
  });

  if (!user || !user.isActive) {
    return { message: "No active account exists with that email and password." };
  }

  const passwordOk = await verifyPassword(parsed.data.password, user.passwordHash);

  if (!passwordOk) {
    return { message: "No active account exists with that email and password." };
  }

  await setSessionCookie(user);
  redirect(safeNext(parsed.data.next, user.role));
}

export async function registerAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    email: normalizeEmail(String(formData.get("email") ?? "")),
    password: String(formData.get("password") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    address: String(formData.get("address") ?? "")
  });

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      message: "Check the highlighted fields."
    };
  }

  const rate = checkRateLimit(`register:${parsed.data.email}`, {
    limit: 4,
    windowMs: 10 * 60_000
  });
  if (!rate.ok) {
    return { message: rateLimitMessage(rate.retryAfter) };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true }
  });

  if (existing) {
    return { message: "An account with this email already exists." };
  }

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: await hashPassword(parsed.data.password),
      role: Role.USER,
      phone: parsed.data.phone || null,
      address: parsed.data.address || null
    },
    select: { id: true, name: true, email: true, role: true }
  });

  await setSessionCookie(user);
  redirect("/account?message=Welcome to Starbucks Medium.");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login?message=You have been signed out.");
}
