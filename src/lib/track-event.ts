/**
 * localStorage key marking this browser as the owner's own. Its visits are
 * never logged, so constantly checking the live site doesn't inflate the
 * numbers. Set automatically by opening the private dashboard, or by hand
 * with ?notrack=1 (and cleared with ?notrack=0). localStorage (not
 * sessionStorage) so it survives tab/browser restarts.
 */
const OPT_OUT_KEY = "atg:no-track";

/**
 * True when this browser opted out of analytics. Storage access throws in
 * some privacy modes — a failure means "not opted out", so real visitors
 * are always still counted (fail-open for data, never for the owner).
 */
export function isTrackingOptedOut(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(OPT_OUT_KEY) === "1";
  } catch {
    return false;
  }
}

/** Mark (or unmark) this browser as the owner's. Never throws. */
export function setTrackingOptOut(optOut: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (optOut) localStorage.setItem(OPT_OUT_KEY, "1");
    else localStorage.removeItem(OPT_OUT_KEY);
  } catch {
    /* storage blocked — nothing we can do, and nothing should break */
  }
}

/**
 * Fire-and-forget analytics event from the public site (client-side).
 * Never throws, never blocks — analytics must not affect the visitor.
 * The session id (set by PageViewTracker) is attached automatically so
 * plays can be de-duped per visitor if needed.
 */
export function fireTrack(payload: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  if (isTrackingOptedOut()) return;
  try {
    let sid = "";
    try {
      sid = sessionStorage.getItem("atg:sid") ?? "";
    } catch {
      /* storage blocked — send without sid */
    }
    fetch("/api/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sid, ...payload }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* never bubble */
  }
}

export function fireLinkClick(label: string, href: string): void {
  if (typeof window === "undefined") return;
  const path = `${window.location.pathname}${window.location.search}`;
  fireTrack({
    event: "link",
    label,
    href,
    path,
  });
}
