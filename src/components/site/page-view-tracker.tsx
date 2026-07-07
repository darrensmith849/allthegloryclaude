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
    // Referrer source is recorded once per session (on the entry page); later
    // in-site navigations report "internal" so they don't inflate sources.
    let ref = "internal";
    try {
      sid = sessionStorage.getItem("atg:sid") ?? "";
      if (!sid) {
        sid = Math.random().toString(36).slice(2, 14);
        sessionStorage.setItem("atg:sid", sid);
      }
      if (!sessionStorage.getItem("atg:reffed")) {
        sessionStorage.setItem("atg:reffed", "1");
        const r = document.referrer;
        if (!r) {
          ref = "direct";
        } else {
          const h = new URL(r).hostname.replace(/^(www|l|m|lm)\./, "");
          ref = h && h !== location.hostname.replace(/^www\./, "") ? h : "direct";
        }
      }
    } catch {
      // Private-browsing / disabled storage — send the view without sid/ref.
    }

    fetch("/api/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ event: "view", path: pathname, sid, ref }),
      keepalive: true,
    }).catch(() => {
      // never bubble — analytics outage should never affect the visitor.
    });
  }, [pathname]);

  return null;
}
