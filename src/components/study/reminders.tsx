"use client";

// "Remind me each day": a notification on this phone or computer at the
// time the member picks - "Day 277 is ready". Web Push via the service
// worker at /study/sw.js; on iPhone it works once The Study is added to the
// Home Screen (iOS 16.4+), so this explains that when it's needed.

import { useEffect, useState } from "react";

const HOURS = Array.from({ length: 24 }, (_, h) => h);
const hourLabel = (h: number) => `${String(h).padStart(2, "0")}:00`;

function b64ToBytes(b64u: string): Uint8Array<ArrayBuffer> {
  const b64 = b64u.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(b64u.length / 4) * 4, "=");
  const bin = atob(b64);
  const bytes = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

type Support = "checking" | "yes" | "install" | "no";

export function Reminders({ compact = false }: { compact?: boolean }) {
  const [support, setSupport] = useState<Support>("checking");
  const [endpoint, setEndpoint] = useState<string | null>(null);
  const [hour, setHour] = useState(7);
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState("");

  useEffect(() => {
    const ok = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
    if (!ok) {
      setSupport(ios && !standalone ? "install" : "no");
      return;
    }
    setSupport("yes");
    void (async () => {
      const data = (await fetch("/api/study/reminders", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null)) as { reminders?: { endpoint: string; hour: number }[]; publicKey?: string } | null;
      setPublicKey(data?.publicKey ?? "");
      const reg = await navigator.serviceWorker.getRegistration("/study/");
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
    const r = await fetch("/api/study/reminders", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ endpoint: ep, hour: nextHour, tz: Intl.DateTimeFormat().resolvedOptions().timeZone || "Africa/Johannesburg" }),
    }).catch(() => null);
    return Boolean(r?.ok);
  }

  async function turnOn() {
    setBusy(true);
    setMessage(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMessage("Notifications are blocked for this site - allow them in your browser or phone settings, then try again.");
        return;
      }
      const reg = await navigator.serviceWorker.register("/study/sw.js", { scope: "/study/" });
      await navigator.serviceWorker.ready;
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

  async function turnOff() {
    setBusy(true);
    try {
      await fetch("/api/study/reminders", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ endpoint }),
      }).catch(() => {});
      const reg = await navigator.serviceWorker.getRegistration("/study/");
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
    const r = await fetch("/api/study/reminders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ endpoint, test: true }),
    }).catch(() => null);
    const d = r ? ((await r.json().catch(() => ({}))) as { error?: string }) : null;
    setMessage(r?.ok ? "Sent - it should pop up in a moment." : (d?.error ?? "Couldn't send one just now."));
  }

  if (support === "checking") return null;
  if (support === "install") {
    return (
      <div className="dash-reminder">
        <p className="dash-word-hint">
          On iPhone or iPad, reminders work from the app: tap <strong>Share</strong> then <strong>Add to Home Screen</strong>,
          open The Study from your Home Screen, and turn reminders on here.
        </p>
      </div>
    );
  }
  if (support === "no") {
    return compact ? null : (
      <p className="dash-word-hint">This browser can&apos;t show reminders - try Chrome, Edge, Firefox or Safari on a phone or computer.</p>
    );
  }

  return (
    <div className="dash-reminder">
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
    </div>
  );
}
