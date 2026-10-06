// The Study's service worker - only for the daily reading reminder. It
// caches nothing and never touches page loads. A reminder push carries no
// message; this works out which day of the plan it is and says so - or,
// until everyone starts together at Day 1 on 1 January 2027 (STUDY_START in
// src/lib/study/plan.ts), just that it's time to read, opening the journal.
const STUDY_START = Date.UTC(2027, 0, 1);

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function planDay(d) {
  const y = d.getFullYear();
  const n = Math.round((Date.UTC(y, d.getMonth(), d.getDate()) - Date.UTC(y, 0, 1)) / 86400000) + 1;
  const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  return leap && n >= 60 ? n - 1 : n;
}

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  const now = new Date();
  const early = now.getTime() < STUDY_START;
  const day = planDay(now);
  event.waitUntil(
    self.registration.showNotification(early ? "Time for today's reading" : `Day ${day} is ready`, {
      body: early
        ? "We're reading the Bible from the beginning - open your journal and carry on where you are."
        : `Today's reading - ${now.getDate()} ${MONTHS[now.getMonth()]}. Open it, read, and write what God shows you.`,
      icon: "/study/icon-192.png",
      badge: "/study/favicon.png",
      tag: "the-study-daily",
      renotify: true,
      data: { url: early ? "/study/journal" : "/study" },
    }),
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
      for (const c of list) {
        if (c.url.includes("/study") && "focus" in c) return c.focus();
      }
      return self.clients.openWindow(url);
    }),
  );
});
