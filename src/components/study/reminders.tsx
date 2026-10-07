"use client";

// "Remind me each day": a notification on this phone or computer at the
// time the member picks - "Day 5 is waiting for you". Web Push via the
// service worker at /study/sw.js; on iPhone it works once The Study is added
// to the Home Screen (iOS 16.4+), so this explains that when it's needed.
// Daniel's dashboard uses the same switch with its own worker and API
// (target = DASHBOARD below).

import Link from "next/link";
import { useEffect, useState } from "react";
import { IosInstallGuide } from "./ios-install-guide";
import { VAPID_PUBLIC_KEY } from "@/lib/study/push";

const HOURS = Array.from({ length: 24 }, (_, h) => h);
const hourLabel = (h: number) => `${String(h).padStart(2, "0")}:00`;

function b64ToBytes(b64u: string): Uint8Array<ArrayBuffer> {
  const b64 = b64u.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(b64u.length / 4) * 4, "=");
  const bin = atob(b64);
  const bytes = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// "install": iPhone / iPad in the browser - add to Home Screen first.
// "old-ios": on the Home Screen, but iOS is older than 16.4 (no web push).
// Wait for the reminder worker to be running. (Not serviceWorker.ready: the
// home page, /study, sits just outside the worker's /study/ scope, so that
// would never settle there.)
function activated(reg: ServiceWorkerRegistration): Promise<void> {
  if (reg.active) return Promise.resolve();
  const worker = reg.installing ?? reg.waiting;
  if (!worker) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => worker.state === "activated" && resolve();
    worker.addEventListener("statechange", done);
    window.setTimeout(resolve, 10_000);
  });
}

type Support = "checking" | "yes" | "install" | "old-ios" | "no";

interface Target {
  api: string;
  sw: string;
  scope: string;
  app: string; // as it's named in the phone's Settings → Notifications
  settings: string; // where the full switch lives
}
const STUDY: Target = { api: "/api/study/reminders", sw: "/study/sw.js", scope: "/study/", app: "The Study", settings: "/study/account#reminder" };
export const DASHBOARD: Target = {
  api: "/api/owner-reminders",
  sw: "/dashboard-sw.js",
  scope: "/dashboard/",
  app: "ATG Dashboard",
  settings: "/dashboard/reminders",
};

export function Reminders({
  compact = false,
  target = STUDY,
  hideWhenOn = false,
  installGuide,
}: {
  compact?: boolean;
  target?: Target;
  hideWhenOn?: boolean;
  installGuide?: React.ReactNode;
}) {
  const [support, setSupport] = useState<Support>("checking");
  const [endpoint, setEndpoint] = useState<string | null>(null);
  const [hour, setHour] = useState(7);
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  // The public half of the push key is fixed - no need to wait for it.
  const [publicKey, setPublicKey] = useState(VAPID_PUBLIC_KEY);
  // What this phone reports (shown small under the switch, to help sort out a problem).
  const [status, setStatus] = useState("");

  useEffect(() => {
    const ok = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
    const iosVersion = navigator.userAgent.match(/OS (\d+)_(\d+)/);
    setStatus(
      [
        standalone ? "opened as an app" : "opened in the browser",
        "Notification" in window ? `notifications: ${Notification.permission}` : "notifications: not available here",
        "PushManager" in window ? "push: yes" : "push: no",
        iosVersion ? `iOS ${iosVersion[1]}.${iosVersion[2]}` : "",
      ]
        .filter(Boolean)
        .join(" · "),
    );
    if (!ok) {
      setSupport(ios ? (standalone ? "old-ios" : "install") : "no");
      return;
    }
    setSupport("yes");
    void (async () => {
      const data = (await fetch(target.api, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null)) as { reminders?: { endpoint: string; hour: number }[]; publicKey?: string } | null;
      if (data?.publicKey) setPublicKey(data.publicKey);
      // Turned down before: the phone won't ask again - say how to allow it.
      if (Notification.permission === "denied") setMessage(blockedHelp());
      const reg = await navigator.serviceWorker.getRegistration(target.scope);
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        setEndpoint(sub.endpoint);
        const mine = data?.reminders?.find((r) => r.endpoint === sub.endpoint);
        if (mine && Notification.permission === "granted") {
          setOn(true);
          setHour(mine.hour);
        }
      }
    })();
  }, []);

  async function save(nextHour: number, sub?: PushSubscription | null) {
    const ep = sub?.endpoint ?? endpoint;
    if (!ep) return false;
    const r = await fetch(target.api, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ endpoint: ep, hour: nextHour, tz: Intl.DateTimeFormat().resolvedOptions().timeZone || "Africa/Johannesburg" }),
    }).catch(() => null);
    return Boolean(r?.ok);
  }

  async function turnOn() {
    setBusy(true);
    // The question comes from the phone / browser, not the page - say so,
    // or the button just seems stuck on "Turning on…".
    setMessage(
      Notification.permission === "granted"
        ? null
        : "Your phone or browser should now ask to allow notifications - tap Allow. (In Chrome on a computer it pops up at the top left, or as a bell in the address bar.)",
    );
    try {
      const permission = await Promise.race([
        Notification.requestPermission(),
        new Promise<NotificationPermission | "timeout">((r) => window.setTimeout(() => r("timeout"), 60_000)),
      ]);
      if (permission === "timeout") {
        setMessage("No answer to the notification question - tap Turn on reminders again, and choose Allow.");
        return;
      }
      if (permission !== "granted") {
        setMessage(blockedHelp());
        return;
      }
      const reg = await navigator.serviceWorker.register(target.sw, { scope: target.scope });
      await activated(reg);
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(publicKey) }));
      setEndpoint(sub.endpoint);
      if (!(await save(hour, sub))) throw new Error("save");
      setOn(true);
      setMessage(`Done - you'll get a reminder at ${hourLabel(hour)} each day you haven't read yet.`);
    } catch {
      setMessage("Couldn't turn reminders on here - try again, or on another device.");
    } finally {
      setBusy(false);
    }
  }

  // How to allow notifications once they've been turned down.
  function blockedHelp(): string {
    return /iPhone|iPad|iPod/.test(navigator.userAgent)
      ? `Your iPhone has notifications off for ${target.app}. Open the iPhone's Settings → Notifications → ${target.app}, turn on Allow Notifications, then come back and tap Turn on reminders. Not in that list? Delete the ${target.app} icon from your Home Screen and add it again from Safari (Share → Add to Home Screen, with "Open as Web App" on).`
      : "Notifications are blocked for this site. Click the icon just left of the web address → Notifications → Allow, reload the page, then tap Turn on reminders.";
  }

  async function turnOff() {
    setBusy(true);
    try {
      await fetch(target.api, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ endpoint }),
      }).catch(() => {});
      const reg = await navigator.serviceWorker.getRegistration(target.scope);
      await (await reg?.pushManager.getSubscription())?.unsubscribe().catch(() => {});
      setOn(false);
      setEndpoint(null);
      setMessage("Reminders are off on this device.");
    } finally {
      setBusy(false);
    }
  }

  async function changeHour(h: number) {
    setHour(h);
    if (on && (await save(h))) setMessage(`Reminder moved to ${hourLabel(h)}.`);
  }

  async function test() {
    setMessage(null);
    const r = await fetch(target.api, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ endpoint, test: true }),
    }).catch(() => null);
    const d = r ? ((await r.json().catch(() => ({}))) as { error?: string }) : null;
    setMessage(r?.ok ? "Sent - it should pop up in a moment." : (d?.error ?? "Couldn't send one just now."));
  }

  if (support === "checking") return null;
  if (support === "install") {
    return compact ? (
      <Link href={target.settings} className="study-remind-link">
        🔔 Get a daily reminder on your phone →
      </Link>
    ) : (
      <>
        {installGuide ?? <IosInstallGuide forReminders />}
        {status && <p className="dash-reminder-status">This device: {status}</p>}
      </>
    );
  }
  if (support === "old-ios") {
    return (
      <p className="dash-word-hint">
        Reminders need iOS 16.4 or newer - update your iPhone in Settings → General → Software Update, then come back here.
        {status && <span className="dash-reminder-status block">This device: {status}</span>}
      </p>
    );
  }
  if (support === "no") {
    return compact ? null : (
      <p className="dash-word-hint">This browser can&apos;t show reminders - try Chrome, Edge, Firefox or Safari on a phone or computer.</p>
    );
  }
  // On the home page: a one-line switch, or a quiet note once it's on.
  if (on && hideWhenOn) return null;
  if (compact && on) {
    return (
      <Link href={target.settings} className="study-remind-on">
        🔔 Daily reminder on at {hourLabel(hour)} · change
      </Link>
    );
  }

  return (
    <div className={`dash-reminder ${compact ? "is-compact" : ""}`}>
      {compact && <div className="dash-reminder-title">🔔 Get a daily reminder on this phone</div>}
      <div className="dash-reminder-row">
        <label className="dash-reminder-time">
          <span>Remind me at</span>
          <select className="dash-select" value={hour} onChange={(e) => void changeHour(Number(e.target.value))} aria-label="Reminder time">
            {HOURS.map((h) => (
              <option key={h} value={h}>
                {hourLabel(h)}
              </option>
            ))}
          </select>
        </label>
        {on ? (
          <button type="button" className="dash-btn dash-btn-ghost" onClick={turnOff} disabled={busy}>
            Turn off
          </button>
        ) : (
          <button type="button" className="dash-btn dash-btn-primary" onClick={turnOn} disabled={busy || !publicKey}>
            {busy ? "Turning on…" : "Turn on reminders"}
          </button>
        )}
        {on && (
          <button type="button" className="dash-word-link" onClick={test}>
            Send me one now
          </button>
        )}
      </div>
      {on && !message && <p className="dash-word-hint mt-2">On for this device · skipped on days you&apos;ve already marked as read.</p>}
      {message && <p className="dash-word-hint mt-2">{message}</p>}
      {!compact && status && <p className="dash-reminder-status">This device: {status}</p>}
    </div>
  );
}
