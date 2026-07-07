"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardState, emptyState, recommendedDaysFor } from "./types";

const KEY = "atg:dashboard:v1";
const TS_KEY = "atg:dashboard:v1:ts"; // last-modified epoch ms (for last-write-wins)
const API = "/api/dashboard-state"; // durable D1-backed sync

// Lazy reader so we don't blow up during SSR / build.
function read(): DashboardState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<DashboardState>;
    // Merge with empty state defensively so newly added fields don't crash old data.
    const fresh = emptyState();
    const merged = {
      ...fresh,
      ...parsed,
      book: { ...fresh.book, ...(parsed.book ?? {}) },
      settings: { ...fresh.settings, ...(parsed.settings ?? {}) },
    } as DashboardState;

    // ── Schedule day-of-week migration ──────────────────────────
    // Older rows had no daysOfWeek field - assume weekdays only.
    // Also drop in the Sunday Church default if it's not there.
    const WEEKDAYS = [1, 2, 3, 4, 5];
    const sched = merged.settings.schedule ?? [];
    let migrated = sched.map((r) =>
      r.daysOfWeek && r.daysOfWeek.length > 0 ? r : { ...r, daysOfWeek: WEEKDAYS },
    );
    if (!migrated.some((r) => r.id === "s-sun-church")) {
      migrated = [
        ...migrated,
        {
          id: "s-sun-church",
          time: "6:30",
          hour: 6.5,
          title: "Church",
          sub: "Sunday gathering",
          habitId: "worship",
          daysOfWeek: [0],
        },
      ];
    }
    merged.settings.schedule = migrated;
    if (!merged.scheduleExtras) merged.scheduleExtras = {};

    // ── Habit day-of-week migration ────────────────────────────
    // Existing habits without daysOfWeek inherit the recommended default for
    // their id (weekdays for gym/guitar/book; all-days for everything else).
    const habits = merged.settings.habits ?? [];
    merged.settings.habits = habits.map((h) =>
      h.daysOfWeek && h.daysOfWeek.length > 0
        ? h
        : { ...h, daysOfWeek: recommendedDaysFor(h.id) },
    );
    return merged;
  } catch {
    return emptyState();
  }
}

function hasLocal(): boolean {
  try {
    return typeof window !== "undefined" && window.localStorage.getItem(KEY) !== null;
  } catch {
    return false;
  }
}
function localTs(): number {
  try {
    return Number(window.localStorage.getItem(TS_KEY) ?? 0) || 0;
  } catch {
    return 0;
  }
}

function write(state: DashboardState, ts: number = Date.now()) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
    window.localStorage.setItem(TS_KEY, String(ts));
  } catch {
    // quota / privacy - silently fail; the in-memory state still works for the session.
  }
  schedulePush(); // durable copy to D1 (debounced, best-effort)
}

// ── Durable sync to Cloudflare D1 ──────────────────────────────────
// localStorage is the instant cache; D1 is the durable, cross-device store.
let pushTimer: number | null = null;
function schedulePush() {
  if (typeof window === "undefined") return;
  if (pushTimer) window.clearTimeout(pushTimer);
  pushTimer = window.setTimeout(() => {
    pushTimer = null;
    pushNow();
  }, 1500);
}
function pushNow() {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw === null) return;
    fetch(API, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ json: raw, updatedAt: localTs() }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // never let a sync failure affect the dashboard
  }
}

// On load: reconcile localStorage with the durable D1 copy.
//   - remote newer (or nothing local) → adopt remote
//   - local newer / remote empty      → seed/update D1 from local
// The server also refuses to let an empty state overwrite a non-empty one,
// so a fresh browser (e.g. the bare domain) can never wipe your history.
async function hydrateFromD1(apply: (s: DashboardState) => void) {
  if (typeof window === "undefined") return;
  try {
    const res = await fetch(API, { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { json?: string | null; updatedAt?: number };
    const remoteTs = Number(data?.updatedAt ?? 0) || 0;
    const lTs = localTs();

    if (data?.json && remoteTs >= lTs) {
      // Adopt the durable remote copy (newer, or we had nothing local).
      try {
        window.localStorage.setItem(KEY, data.json);
        window.localStorage.setItem(TS_KEY, String(remoteTs));
        apply(read());
      } catch {
        /* ignore */
      }
    } else if (hasLocal()) {
      // Local is newer, or remote is empty — seed/update the durable copy.
      if (localTs() === 0) {
        try {
          window.localStorage.setItem(TS_KEY, String(Date.now()));
        } catch {
          /* ignore */
        }
      }
      pushNow();
    }
  } catch {
    // offline / transient — the local cache still works; we'll sync next time.
  }
}

// Cross-tab / cross-component sync: a tiny event bus so a write in one
// component immediately reflects in another mounted hook.
type Listener = (state: DashboardState) => void;
const listeners = new Set<Listener>();
function broadcast(state: DashboardState) {
  for (const fn of listeners) fn(state);
}

export function useDashboard() {
  const [state, setState] = useState<DashboardState>(() => emptyState());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(read());
    setReady(true);

    // Pull the durable copy and reconcile (may replace the local cache).
    hydrateFromD1((next) => {
      setState(next);
      broadcast(next);
    });

    const sync = (next: DashboardState) => setState(next);
    listeners.add(sync);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setState(read());
    };
    // Flush any pending debounced push before the tab is hidden/closed so the
    // very last change is never lost.
    const onHide = () => {
      if (document.visibilityState === "hidden") pushNow();
    };
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      listeners.delete(sync);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, []);

  const update = useCallback(
    (mutator: (draft: DashboardState) => DashboardState | void) => {
      setState((prev) => {
        const cloned = JSON.parse(JSON.stringify(prev)) as DashboardState;
        const result = mutator(cloned);
        const next = (result ?? cloned) as DashboardState;
        write(next);
        broadcast(next);
        return next;
      });
    },
    [],
  );

  return { state, update, ready };
}

// Standalone helpers for places where you just need to read once.
export function readDashboard(): DashboardState {
  return read();
}
