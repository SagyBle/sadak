import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import JWTUtils from "./app/api/utils/jwt.utils";

const publicRoutes = [
  "/",
  "/login",
  "/api/auth/users",
  "/api/auth/login",
  "/api/auth/god-login",
  "/api/auth/verify",
  "/api/auth/bootstrap",
];

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.includes(pathname);
}

async function handleProtectedApiRoute(request: NextRequest) {
  const token = JWTUtils.getTokenFromRequest(request);

  if (!token) {
    return NextResponse.json(
      { error: "Authentication required", code: "NO_TOKEN" },
      { status: 401 }
    );
  }

  const decoded = await JWTUtils.verifyToken(token);

  if (!decoded) {
    return NextResponse.json(
      { error: "Invalid token", code: "INVALID_TOKEN" },
      { status: 401 }
    );
  }

  // Propagate only ASCII-safe values to middleware-injected headers.
  try {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", String(decoded.userId || ""));
    requestHeaders.set("x-user-role", String(decoded.role || ""));
    requestHeaders.set("x-department-id", String(decoded.departmentId || ""));
    return NextResponse.next({ request: { headers: requestHeaders } });
  } catch {
    // Fallback: do not block valid authenticated requests due to header encoding issues.
    return NextResponse.next();
  }
}

async function handleProtectedAppRoute(request: NextRequest, pathname: string) {
  const token = JWTUtils.getTokenFromRequest(request);

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const decoded = await JWTUtils.verifyToken(token);

  if (!decoded) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/static/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return await handleProtectedApiRoute(request);
  }

  return await handleProtectedAppRoute(request, pathname);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
