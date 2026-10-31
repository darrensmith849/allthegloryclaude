"use client";

import { platformPath, withRoute } from "@/platform/config/client-env";

// First-party, cookie-free analytics (MASTER_PLAN §12). One anonymous ID per
// browser tab (sessionStorage), event names from a fixed list, no form
// content, no precise location, nothing sent when Global Privacy Control or
// Do Not Track is on. Authenticated platform bundles never load this module,
// so staff activity is not counted as public traffic.

export type AnalyticsEventName =
  | "page_view"
  | "profile_view"
  | "media_play"
  | "brief_start"
  | "brief_submit"
  | "application_start"
  | "application_submit"
  | "cta_click"
  | "outbound_click"
  | "demo_view";

function optedOut(): boolean {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  return nav.globalPrivacyControl === true || navigator.doNotTrack === "1";
}

function sessionId(): string {
  try {
    let id = sessionStorage.getItem("a_sid");
    if (!id) {
      id = Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 16);
      sessionStorage.setItem("a_sid", id);
    }
    return id;
  } catch {
    return "nostorage";
  }
}

export function track(name: AnalyticsEventName, props?: Record<string, string | number | boolean>): void {
  if (typeof window === "undefined" || optedOut()) return;
  const path = platformPath(window.location.pathname);
  const body = JSON.stringify({ events: [{ name, path, session: sessionId(), props }] });
  const url = withRoute("/api/events");
  try {
    if (!navigator.sendBeacon?.(url, new Blob([body], { type: "application/json" }))) {
      void fetch(url, { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true });
    }
  } catch {
    // Analytics must never interfere with the visitor.
  }
}
