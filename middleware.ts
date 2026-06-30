import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import JWTUtils from "./app/api/utils/jwt.utils";

// Define route categories
const publicRoutes = [
  "/",
  "/tournaments",
  "/login",
  "/tournament/register",
  "/tournament/groups",
  "/tournament/stages/groups",
  "/tournament/stages/knockout",
  "/api/admin/login",
  "/api/admin/verify",
  "/api/tournaments/list",
  "/api/players/list",
  "/api/players/create",
  "/api/players/bulk-create",
  "/api/players/fetch",
  "/api/tournaments/create",
  "/api/groups/create",
  "/api/groups/list",
  "/api/groups/delete",
  "/api/groups/create-matches",
  "/api/knockout/create-bracket",
  "/api/knockout/list",
  "/api/knockout/delete",
  "/api/matches/update-score",
  "/api/knockout/create-next-round",
  "/api/matches/create-custom",
  "/api/matches/toggle-cancelled",
  "/api/matches/vote",
  "/api/matches/reset-gambling",
];

const adminOnlyRoutes = ["/api/admin/signup"];

function isPublicRoute(pathname: string): boolean {
  // Exact match for public routes
  if (publicRoutes.includes(pathname)) {
    return true;
  }

  // Allow public access to specific tournament pages
  if (pathname.startsWith("/tournaments/") && !pathname.includes("/api/")) {
    return true;
  }

  // Allow public access to view specific tournament API
  if (
    pathname.match(/^\/api\/tournaments\/[^\/]+$/) &&
    pathname !== "/api/tournaments/create"
  ) {
    return true;
  }

  return false;
}

function isAdminOnlyRoute(pathname: string): boolean {
  return adminOnlyRoutes.some((route) => pathname === route);
}

function handleAdminOnlyRoute(request: NextRequest) {
  const adminKey = request.headers.get("x-admin-key");

  if (adminKey === process.env.ADMIN_SIGNUP_KEY) {
    return NextResponse.next();
  }
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

async function handleProtectedApiRoute(request: NextRequest, pathname: string) {
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

  // Add user context to request headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", decoded.userId as string);
  requestHeaders.set("x-user-email", decoded.email as string);
  requestHeaders.set("x-user-role", decoded.role as string);

  return NextResponse.next({ request: { headers: requestHeaders } });
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
  console.log("sagy11", pathname);

  // Skip static files and Next.js internals
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

  // Handle admin-only routes (like signup)
  if (isAdminOnlyRoute(pathname)) {
    return handleAdminOnlyRoute(request);
  }

  // Handle protected API routes
  if (pathname.startsWith("/api/")) {
    return await handleProtectedApiRoute(request, pathname);
  }

  // Handle protected app routes (admin dashboard)
  return await handleProtectedAppRoute(request, pathname);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
