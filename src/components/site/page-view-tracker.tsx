"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { isTrackingOptedOut, setTrackingOptOut } from "@/lib/track-event";

/**
 * Fires a single fire-and-forget POST to /api/track every time the
 * pathname changes. Lives at the root layout so every public-site
 * page is counted.
 *
 * What is NOT counted:
 *   - /dashboard/* (private app chrome — visiting your own dashboard
 *     should never inflate the visitor numbers)
 *   - /api/*       (server-only routes)
 *   - any browser marked as the owner's own (see below) — so checking
 *     the live site all day never shows up as real traffic.
 *
 * Owner opt-out: opening the private dashboard marks this browser
 * permanently (localStorage), and ?notrack=1 / ?notrack=0 toggles it by
 * hand on any page. It is per-browser, so each device must be marked once.
 *
 * Session ID is a random 12-char token stored in sessionStorage so the
 * "active now" gauge can dedupe a single visitor across multiple page
 * views in the same tab. Cleared automatically when the tab closes.
 */
export default function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    // Explicit manual toggle, usable from any page: ?notrack=1 marks this
    // browser as the owner's, ?notrack=0 undoes it. Read straight off
    // location so this needs no Suspense boundary.
    try {
      const flag = new URLSearchParams(window.location.search).get("notrack");
      if (flag === "1") setTrackingOptOut(true);
      else if (flag === "0") setTrackingOptOut(false);
    } catch {
      /* malformed URL / blocked storage — ignore */
    }

    // Opening the private dashboard is a reliable "this is my browser"
    // signal, so mark it and stop counting this device from then on.
    if (pathname.startsWith("/dashboard")) {
      setTrackingOptOut(true);
      return;
    }
    if (pathname.startsWith("/api")) return;
    if (isTrackingOptedOut()) return;

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
