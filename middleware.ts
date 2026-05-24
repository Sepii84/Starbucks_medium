import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "starbucks_medium_session";

function getSecret() {
  if (!process.env.AUTH_SECRET && process.env.NODE_ENV === "production") {
    return null;
  }

  return new TextEncoder().encode(
    process.env.AUTH_SECRET ?? "development-only-secret-change-me-before-production-12345"
  );
}

async function getRole(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const secret = getSecret();
    if (!secret) {
      return null;
    }

    const { payload } = await jwtVerify(token, secret);
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

function isUnsafeMethod(method: string) {
  return !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());
}

function isSameOriginRequest(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (!origin) {
    return !request.nextUrl.pathname.startsWith("/api");
  }

  try {
    return new URL(origin).host === request.nextUrl.host;
  } catch {
    return false;
  }
}

function withSecurityHeaders(response: NextResponse) {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=()"
  );
  response.headers.set("Content-Security-Policy", "frame-ancestors 'none'; base-uri 'self'; object-src 'none'");

  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isUnsafeMethod(request.method) && !isSameOriginRequest(request)) {
    return withSecurityHeaders(
      NextResponse.json({ error: "Cross-site mutation requests are not allowed." }, { status: 403 })
    );
  }

  const role = await getRole(request);
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("message", "Please sign in to continue.");
  loginUrl.searchParams.set("next", pathname);

  if (pathname.startsWith("/admin")) {
    if (!role) {
      return withSecurityHeaders(NextResponse.redirect(loginUrl));
    }

    if (role !== "ADMIN") {
      return withSecurityHeaders(NextResponse.redirect(new URL("/", request.url)));
    }
  }

  if (pathname.startsWith("/account") || pathname.startsWith("/order") || pathname.startsWith("/bag")) {
    if (!role) {
      return withSecurityHeaders(NextResponse.redirect(loginUrl));
    }

    if (role === "ADMIN") {
      return withSecurityHeaders(NextResponse.redirect(new URL("/admin", request.url)));
    }
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/order/:path*", "/bag/:path*", "/api/:path*"]
};
