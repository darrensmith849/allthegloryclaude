/**
 * Fire-and-forget analytics event from the public site (client-side).
 * Never throws, never blocks — analytics must not affect the visitor.
 * The session id (set by PageViewTracker) is attached automatically so
 * plays can be de-duped per visitor if needed.
 */
export function fireTrack(payload: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
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
