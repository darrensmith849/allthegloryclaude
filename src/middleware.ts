// Private-dashboard gate.
//
// Protects /dashboard/* and the dashboard-only API routes with HTTP Basic Auth.
// The browser prompts for credentials the first time and remembers them for the
// session, so it works on phone and desktop with zero extra UI.
//
// Configure in Vercel → Project → Settings → Environment Variables:
//   DASHBOARD_USER       (default below, only used in local dev)
//   DASHBOARD_PASSWORD   (REQUIRED in production)
//
// If DASHBOARD_PASSWORD is missing in production the gate fails closed — the
// route returns 401 — so an unconfigured deploy can never leak.

import { NextRequest, NextResponse } from "next/server";

const DEV_USER = "daniel";
const DEV_PASS = "glory2026";

function unauthorized() {
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="All The Glory - private", charset="UTF-8"',
    },
  });
}

export function middleware(req: NextRequest) {
  // Use the dev defaults locally; require a real password in production.
  const isProd = process.env.NODE_ENV === "production";
  const user = process.env.DASHBOARD_USER ?? (isProd ? "" : DEV_USER);
  const pass = process.env.DASHBOARD_PASSWORD ?? (isProd ? "" : DEV_PASS);

  if (!pass) return unauthorized();

  const header = req.headers.get("authorization");
  if (!header?.startsWith("Basic ")) return unauthorized();

  let decoded: string;
  try {
    decoded = atob(header.slice(6));
  } catch {
    return unauthorized();
  }

  const sep = decoded.indexOf(":");
  if (sep < 0) return unauthorized();
  const u = decoded.slice(0, sep);
  const p = decoded.slice(sep + 1);

  if (u !== user || p !== pass) return unauthorized();

  return NextResponse.next();
}

export const config = {
  // Anything under /dashboard, plus the dashboard-only API routes.
  matcher: ["/dashboard/:path*", "/api/word-study/:path*", "/api/verse/:path*"],
};
