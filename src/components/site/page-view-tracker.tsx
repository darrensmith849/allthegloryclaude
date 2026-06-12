"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Fires a single fire-and-forget POST to /api/track every time the
 * pathname changes. Lives at the root layout so every public-site
 * page is counted.
 *
 * What is NOT counted:
 *   - /dashboard/* (private app chrome — visiting your own dashboard
 *     should never inflate the visitor numbers)
 *   - /api/*       (server-only routes)
 *
 * Session ID is a random 12-char token stored in sessionStorage so the
 * "active now" gauge can dedupe a single visitor across multiple page
 * views in the same tab. Cleared automatically when the tab closes.
 */
export default function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith("/dashboard")) return;
    if (pathname.startsWith("/api")) return;

    let sid = "";
    try {
      sid = sessionStorage.getItem("atg:sid") ?? "";
      if (!sid) {
        sid = Math.random().toString(36).slice(2, 14);
        sessionStorage.setItem("atg:sid", sid);
      }
    } catch {
      // Private-browsing / disabled storage — just send the view without a sid.
    }

    fetch("/api/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ event: "view", path: pathname, sid }),
      keepalive: true,
    }).catch(() => {
      // never bubble — analytics outage should never affect the visitor.
    });
  }, [pathname]);

  return null;
}
