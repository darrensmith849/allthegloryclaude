// Private-dashboard gate: every /dashboard page and the dashboard's own
// APIs need a valid admin session cookie (see src/lib/admin-auth.ts).
// Pages without one go to /dashboard/login; APIs answer 401. If no
// DASHBOARD_PASSWORD secret is set, everything stays locked.
//
// The public site and its APIs (track, contact, verse, donations) are not
// matched and stay open. The dashboard is also kept out of search engines
// via `robots` in src/app/dashboard/layout.tsx.

import { NextResponse, type NextRequest } from "next/server";
import { adminPassword, SESSION_COOKIE, verifySession } from "@/lib/admin-auth";

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (pathname === "/dashboard/login") return NextResponse.next();

  const password = adminPassword();
  const signedIn = password
    ? await verifySession(req.cookies.get(SESSION_COOKIE)?.value, password)
    : false;
  if (signedIn) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Please log in to the dashboard." }, { status: 401 });
  }
  const login = req.nextUrl.clone();
  login.pathname = "/dashboard/login";
  login.search = "";
  login.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/api/dashboard-state",
    "/api/study-notes",
    "/api/word-fill",
    "/api/analytics",
  ],
};
