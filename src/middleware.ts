// Private-dashboard gate: every /dashboard page and the dashboard's own
// APIs need a valid admin session cookie (see src/lib/admin-auth.ts) - or,
// for the owner's team, their Study session, and only for their part
// (src/lib/team.ts).
// Pages without one go to /dashboard/login - which asks for a new password
// the first time - and APIs answer 401.
//
// The public site and its APIs (track, contact, verse, donations) are not
// matched and stay open. The Study's member APIs (/api/study/*) check their
// own member session (src/lib/study/members.ts). The dashboard is also kept out of search engines
// via `robots` in src/app/dashboard/layout.tsx.

import { NextResponse, type NextRequest } from "next/server";
import { isSignedIn } from "@/lib/admin-auth";
import { getTeamMember, teamAllowed } from "@/lib/team";

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (pathname === "/dashboard/login") return NextResponse.next();
  if (await isSignedIn(req.headers.get("cookie"))) return NextResponse.next();

  // The owner's team (signed in with their Study account): only their part.
  if (await getTeamMember(req)) {
    if (teamAllowed(pathname)) return NextResponse.next();
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "That part of the dashboard is just for Daniel." }, { status: 403 });
    }
    const home = req.nextUrl.clone();
    home.pathname = "/dashboard/community";
    home.search = "";
    return NextResponse.redirect(home);
  }

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
    "/api/words",
    "/api/study-days",
    "/api/study-names",
    "/api/word-fill",
    "/api/analytics",
    "/api/members",
    "/api/members/:path*",
  ],
};
