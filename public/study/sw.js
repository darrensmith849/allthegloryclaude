// The Study's service worker - only for notifications. It never caches
// pages or touches page loads. A push carries no message; this asks the
// site what it's for: a new video from Daniel and Reggie's call (posted in
// the last few hours and not shown yet), else the daily reminder - with
// the day the member is up to (everyone goes at their own pace).

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

// Which video alerts this device has already shown.
async function shownBefore(id) {
  try {
    const cache = await caches.open("atg-notices");
    const key = new Request(`/__notice/${encodeURIComponent(id)}`);
    if (await cache.match(key)) return true;
    await cache.put(key, new Response("1"));
  } catch {
    // no cache - may show twice, which is fine
  }
  return false;
}

self.addEventListener("push", (event) => {
  event.waitUntil(
    (async () => {
      let info = null;
      try {
        const r = await fetch("/api/study/notices?latest=1", { credentials: "same-origin", cache: "no-store" });
        if (r.ok) info = await r.json();
      } catch {
        // offline - a plain reminder below
      }
      const n = info && info.notice;
      if (n && !(await shownBefore(n.id))) {
        const days = n.to ? `Days ${n.from}-${n.to}` : `Day ${n.from}`;
        return self.registration.showNotification(`New video · ${days}`, {
          body: `Daniel and Reggie's call is up${n.title ? ` - ${n.title}` : ""}. Tap to watch it in your journal.`,
          icon: "/study/icon-192.png",
          badge: "/study/favicon.png",
          tag: `the-study-video-${n.id}`,
          data: { url: `/study/journal?day=${n.day}` },
        });
      }
      const next = info && info.next;
      return self.registration.showNotification(next ? `Day ${next} is waiting for you` : "Time for your next reading", {
        body: "Open your journal - read, and write what God shows you. Go at your own pace.",
        icon: "/study/icon-192.png",
        badge: "/study/favicon.png",
        tag: "the-study-daily",
        renotify: true,
        data: { url: "/study/journal" },
      });
    })(),
  );
});

// The browser sometimes renews a device's push subscription; carry the
// reminder (and its time) over to the new one so it doesn't stop quietly.
const VAPID_PUBLIC_KEY = "BD7snAVy-poHpp8aaBTCwQKdcThAdlyKz3k-O6iWS2iP-xJ1VAcxTcJgDhoXmAcmTCglNtToPYAlbbdNt7P8Ces"; // same as src/lib/study/push.ts

function keyBytes(b64u) {
  const bin = atob(b64u.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(b64u.length / 4) * 4, "="));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    (async () => {
      const old = event.oldSubscription;
      const sub =
        event.newSubscription ||
        (await self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID_PUBLIC_KEY) }));
      if (!old || !sub || old.endpoint === sub.endpoint) return;
      await fetch("/api/study/reminders", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ endpoint: sub.endpoint, replaces: old.endpoint }),
      });
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/study";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      // An open Study window: take it to the day, then bring it forward.
      for (const c of list) {
        if (c.url.includes("/study") && "focus" in c) {
          return ("navigate" in c ? c.navigate(url).catch(() => c) : Promise.resolve(c)).then((w) => (w || c).focus());
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
