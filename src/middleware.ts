// Private-dashboard gate — currently disabled.
//
// The route is still excluded from search engines via `robots: { index: false,
// follow: false }` in src/app/dashboard/layout.tsx. Anyone who knows the URL
// can open it, which is what the owner asked for.
//
// To turn protection back on, replace this file with a Basic-Auth or cookie
// gate that checks env vars (DASHBOARD_PASSWORD etc.) and set the matcher
// below to "/dashboard/:path*".

import { NextResponse } from "next/server";

export function middleware() {
  return NextResponse.next();
}

export const config = {
  // Empty matcher = middleware never runs.
  matcher: [],
};
