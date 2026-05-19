import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "starbucks_medium_session";

function getSecret() {
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
    const { payload } = await jwtVerify(token, getSecret());
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = await getRole(request);
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("message", "Please sign in to continue.");
  loginUrl.searchParams.set("next", pathname);

  if (pathname.startsWith("/admin")) {
    if (!role) {
      return NextResponse.redirect(loginUrl);
    }

    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  if (pathname.startsWith("/account") || pathname.startsWith("/order") || pathname.startsWith("/bag")) {
    if (!role) {
      return NextResponse.redirect(loginUrl);
    }

    if (role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/order/:path*", "/bag/:path*"]
};
