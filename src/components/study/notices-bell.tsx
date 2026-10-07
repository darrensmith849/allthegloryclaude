"use client";

// Members' bell, beside "The Study" at the top of the menu: lights up when
// Daniel posts a video from a call (one call can cover several days), and
// lists what's new with a link to the day. Phones with notifications on
// get an alert too (src/lib/study/notices.ts).

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface Notice {
  id: string;
  kind: "video";
  day: string;
  from: number;
  to: number | null;
  title: string;
  at: number;
}

function ago(at: number): string {
  const mins = Math.round((Date.now() - at) / 60_000);
  if (mins < 60) return mins <= 1 ? "just now" : `${mins} minutes ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return hours === 1 ? "an hour ago" : `${hours} hours ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return days === 1 ? "yesterday" : `${days} days ago`;
  return new Date(at).toLocaleDateString("en-GB", { day: "numeric", month: "long" });
}

export function NoticesBell() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [unseen, setUnseen] = useState(0);
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState(false);
  // The panel floats over the page (the menu would clip it), below the bell.
  const [at, setAt] = useState<{ top: number; left: number; width: number } | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    fetch("/api/study/notices", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { notices?: Notice[]; unseen?: number } | null) => {
        if (!d?.notices) return;
        setNotices(d.notices);
        setUnseen(d.unseen ?? 0);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
    setAlerts(typeof Notification !== "undefined" && Notification.permission === "granted");
    // Back to the app after a while: check again.
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  // Close on a tap outside, or Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!box.current?.contains(t) && !panel.current?.contains(t)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onScroll = () => setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);

  function toggle() {
    const next = !open;
    const r = btn.current?.getBoundingClientRect();
    if (next && r) {
      const width = Math.min(340, window.innerWidth - 32);
      setAt({ top: r.bottom + 8, left: Math.max(16, Math.min(r.left, window.innerWidth - width - 16)), width });
    }
    setOpen(next);
    if (next && unseen > 0) {
      setUnseen(0);
      void fetch("/api/study/notices", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ seen: true }),
      }).catch(() => {});
    }
  }

  return (
    <div className="study-bell" ref={box}>
      <button
        ref={btn}
        type="button"
        className={`study-bell-btn ${unseen ? "has-new" : ""}`}
        onClick={toggle}
        aria-expanded={open}
        aria-label={unseen ? `What's new - ${unseen} new` : "What's new"}
        title="What's new"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.6 1.8H4.4L6 16.5ZM10 20.3a2.1 2.1 0 0 0 4 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {unseen > 0 && <span className="study-bell-count">{unseen > 9 ? "9+" : unseen}</span>}
      </button>
      {open &&
        createPortal(
        <div
          ref={panel}
          className="study-bell-panel"
          role="dialog"
          aria-label="What's new"
          style={at ? { top: at.top, left: at.left, width: at.width } : undefined}
        >
          <div className="eyebrow eyebrow-amber">What&apos;s new</div>
          {notices.length ? (
            <ul className="study-bell-list">
              {notices.map((n) => (
                <li key={n.id}>
                  <Link href={`/study/journal?day=${n.day}`} className="study-bell-item" onClick={() => setOpen(false)}>
                    <strong>▶ New video · {n.to ? `Days ${n.from}-${n.to}` : `Day ${n.from}`}</strong>
                    <span>
                      {n.title ? `${n.title} · ` : ""}Daniel and Reggie&apos;s call · {ago(n.at)}
                    </span>
                    <em>Watch it on Day {n.from} →</em>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="study-bell-empty">
              Nothing new yet. When Daniel and Reggie post a video from their call, it shows up here.
            </p>
          )}
          <p className="study-bell-foot">
            {alerts ? (
              "✓ This device gets an alert too."
            ) : (
              <Link href="/study/account#reminder" onClick={() => setOpen(false)}>
                Get an alert on your phone too - turn on notifications →
              </Link>
            )}
          </p>
        </div>,
          // Over the whole page - the menu column is its own layer, so a panel
          // inside it went under the cards beside it. (Inside .study-root so
          // it keeps the light / dark colours.)
          box.current?.closest(".study-root") ?? document.body,
        )}
    </div>
  );
}
