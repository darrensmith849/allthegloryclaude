// Daniel's dashboard (Home Screen app): his own daily reading reminder.
// Never caches pages or touches page loads. The push carries no message.
// API: /api/owner-reminders. (Members' reminders are /study/sw.js.)

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  event.waitUntil(
    self.registration.showNotification("Time for your reading", {
      body: "Open your Study Notes - read, and write what God shows you.",
      icon: "/dashboard-app/icon-192.png",
      badge: "/dashboard-app/favicon.png",
      tag: "atg-dashboard-daily",
      renotify: true,
      data: { url: "/dashboard/notes" },
    }),
  );
});

const VAPID_PUBLIC_KEY = "BD7snAVy-poHpp8aaBTCwQKdcThAdlyKz3k-O6iWS2iP-xJ1VAcxTcJgDhoXmAcmTCglNtToPYAlbbdNt7P8Ces"; // same as src/lib/study/push.ts

function keyBytes(b64u) {
  const bin = atob(b64u.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(b64u.length / 4) * 4, "="));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

// The browser sometimes renews the subscription; keep the reminder going.
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    (async () => {
      const old = event.oldSubscription;
      const sub =
        event.newSubscription ||
        (await self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID_PUBLIC_KEY) }));
      if (!old || !sub || old.endpoint === sub.endpoint) return;
      await fetch("/api/owner-reminders", {
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
  const url = (event.notification.data && event.notification.data.url) || "/dashboard/notes";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (c.url.includes("/dashboard") && "focus" in c) {
          return ("navigate" in c ? c.navigate(url).catch(() => c) : Promise.resolve(c)).then((w) => (w || c).focus());
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
