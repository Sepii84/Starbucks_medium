import { Role, type User } from "@prisma/client";
import bcrypt from "bcryptjs";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "starbucks_medium_session";

export type SessionUser = Pick<
  User,
  | "id"
  | "name"
  | "email"
  | "role"
  | "phone"
  | "address"
  | "rewardPoints"
  | "walletBalance"
  | "isActive"
>;

export type SessionPayload = {
  userId: string;
  email: string;
  name: string;
  role: Role;
};

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET is required in production.");
  }

  return new TextEncoder().encode(
    secret ?? "development-only-secret-change-me-before-production-12345"
  );
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getAuthSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getAuthSecret());

    if (
      typeof payload.userId !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.name !== "string" ||
      (payload.role !== Role.USER && payload.role !== Role.ADMIN)
    ) {
      return null;
    }

    return {
      userId: payload.userId,
      email: payload.email,
      name: payload.name,
      role: payload.role
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(user: Pick<User, "id" | "email" | "name" | "role">) {
  const token = await signSession({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const session = await verifySessionToken(token);

  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      address: true,
      rewardPoints: true,
      walletBalance: true,
      isActive: true
    }
  });

  if (!user?.isActive) {
    return null;
  }

  return user;
}

export async function getSessionUser(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}

export async function requireSessionUser() {
  const session = await getSessionUser();

  if (!session) {
    redirect("/login?message=Please sign in to continue.");
  }

  return session;
}

export async function requireUserSession() {
  const session = await requireSessionUser();

  if (session.role === Role.ADMIN) {
    redirect("/admin");
  }

  return session;
}

export async function requireAdminSession() {
  const session = await requireSessionUser();

  if (session.role !== Role.ADMIN) {
    redirect("/");
  }

  return session;
}

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?message=Please sign in to continue.");
  }

  return user;
}

export async function requireUser() {
  const user = await requireAuth();

  if (user.role === Role.ADMIN) {
    redirect("/admin");
  }

  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();

  if (user.role !== Role.ADMIN) {
    redirect("/");
  }

  return user;
}

export function authRedirectFor(role: Role) {
  return role === Role.ADMIN ? "/admin" : "/";
}
