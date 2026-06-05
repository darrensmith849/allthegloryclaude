"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardState, emptyState } from "./types";

const KEY = "atg:dashboard:v1";

// Lazy reader so we don't blow up during SSR / build.
function read(): DashboardState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<DashboardState>;
    // Merge with empty state defensively so newly added fields don't crash old data.
    const fresh = emptyState();
    return {
      ...fresh,
      ...parsed,
      book: { ...fresh.book, ...(parsed.book ?? {}) },
      settings: { ...fresh.settings, ...(parsed.settings ?? {}) },
    } as DashboardState;
  } catch {
    return emptyState();
  }
}

function write(state: DashboardState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // quota / privacy — silently fail; the in-memory state still works for the session.
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
    const sync = (next: DashboardState) => setState(next);
    listeners.add(sync);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setState(read());
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(sync);
      window.removeEventListener("storage", onStorage);
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
