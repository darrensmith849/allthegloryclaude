"use client";

// The friends' Money tracker (/money-tracker): the same store shape the
// dashboard's Money screen uses (state, update, ready, synced), but kept only
// in this browser's own storage. Nothing is sent anywhere - not to the site's
// database, not to Daniel's dashboard - so each friend's figures stay theirs
// and Daniel's own Money is never touched.

import { useCallback, useEffect, useState } from "react";
import { emptyState, type DashboardState, type MoneyState } from "@/lib/dashboard/types";

const KEY = "atg:money-tracker:v1";

export type Backup = { app: "atg-money-tracker"; version: 1; savedAt: string; money: MoneyState };

function readMoney(): MoneyState | undefined {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? ((JSON.parse(raw) as { money?: MoneyState }).money ?? undefined) : undefined;
  } catch {
    return undefined;
  }
}

function writeMoney(money: MoneyState | undefined): boolean {
  try {
    if (money) window.localStorage.setItem(KEY, JSON.stringify({ money }));
    else window.localStorage.removeItem(KEY);
    return true;
  } catch {
    return false; // private window or storage full - see `saved`
  }
}

export function useTrackerStore() {
  const [state, setState] = useState<DashboardState>(() => emptyState());
  const [ready, setReady] = useState(false);
  const [synced, setSynced] = useState<boolean | null>(null);
  // False when this browser won't keep it (private window): the page says so.
  const [saved, setSaved] = useState(true);

  useEffect(() => {
    setState((s) => ({ ...s, money: readMoney() }));
    setSaved(writeMoney(readMoney()) || readMoney() !== undefined);
    setReady(true);
    setSynced(true);
    // Another tab of the tracker changed it: show the newest.
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setState((s) => ({ ...s, money: readMoney() }));
    };
    window.addEventListener("storage", onStorage);
    // Ask the browser to keep it (no prompt; ignored where unsupported).
    void navigator.storage?.persist?.().catch(() => {});
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const update = useCallback((mutator: (draft: DashboardState) => DashboardState | void) => {
    setState((prev) => {
      const draft = JSON.parse(JSON.stringify(prev)) as DashboardState;
      const next = (mutator(draft) ?? draft) as DashboardState;
      setSaved(writeMoney(next.money));
      return next;
    });
  }, []);

  // Backups: a file the friend keeps, and putting one back.
  const backup = useCallback((): Backup | null => {
    const money = readMoney();
    return money ? { app: "atg-money-tracker", version: 1, savedAt: new Date().toISOString(), money } : null;
  }, []);
  const restore = useCallback((b: unknown): boolean => {
    const money = (b as Partial<Backup> | null)?.money;
    if ((b as Partial<Backup> | null)?.app !== "atg-money-tracker" || !money || !Array.isArray(money.entries) || !money.start) return false;
    setState((s) => ({ ...s, money }));
    setSaved(writeMoney(money));
    return true;
  }, []);

  return { store: { state, update, ready, synced }, saved, backup, restore };
}
