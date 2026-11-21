"use client";

// The friends' Money tracker (/money-tracker): the same store shape the
// dashboard's Money screen uses (state, update, ready, synced), but kept only
// in this browser's own storage. Nothing is sent anywhere - not to the site's
// database, not to Daniel's dashboard - so each friend's figures stay theirs
// and Daniel's own Money is never touched.

import { useCallback, useEffect, useState } from "react";
import { emptyState, type DashboardState, type MoneyBudgetLine, type MoneyState } from "@/lib/dashboard/types";
import { localDate, uid } from "@/lib/dashboard/money";

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

// A starter budget for a new tracker: the everyday basics at R0, each tied to
// the kinds of spending it covers. Friends fill in their amounts, remove what
// they don't need and add their own on the Budget card. Kinds that aren't
// built in (Rent, Electricity & water, ...) are added as their own kinds.
const BASICS: { name: string; kinds: string[] }[] = [
  { name: "Rent", kinds: ["Rent"] },
  { name: "Groceries", kinds: ["Groceries"] },
  { name: "Electricity & water", kinds: ["Electricity & water"] },
  { name: "Transport & fuel", kinds: ["Fuel", "Tolls & transport"] },
  { name: "Phone, data & wifi", kinds: ["Phone & data"] },
  { name: "Medical aid", kinds: ["Medical aid"] },
  { name: "Insurance", kinds: ["Insurance"] },
  { name: "Debts & loans", kinds: ["Debt repayments"] },
  { name: "School & kids", kinds: ["School & kids"] },
  { name: "Clothing", kinds: ["Clothing"] },
  { name: "Eating out & coffee", kinds: ["Eating out", "Coffee"] },
  { name: "Subscriptions", kinds: ["Subscriptions"] },
  { name: "Gym & sport", kinds: ["Gym fees"] },
  { name: "Giving & tithe", kinds: ["Giving"] },
  { name: "Bank fees", kinds: ["Bank fees"] },
];
const BUILT_IN = new Set(["Groceries", "Fuel", "Tolls & transport", "Phone & data", "Eating out", "Coffee", "Subscriptions", "Gym fees", "Bank fees"]);

// Once per device: a tracker with no budget, or a budget with no lines (one
// set up before the starter list existed), gets the basics. After that it's
// theirs - removing every line leaves it empty.
const STARTER_ONCE = "atg:money-tracker:starterAdded";
export function needsStarter(money: MoneyState): boolean {
  try {
    if (window.localStorage.getItem(STARTER_ONCE)) return false;
  } catch {
    return !money.budget;
  }
  return !money.budget || money.budget.lines.every((l) => l.removedAt);
}
export function markStarterDone() {
  try {
    window.localStorage.setItem(STARTER_ONCE, "1");
  } catch {
    // private window - the budget itself shows it's done
  }
}

export function withStarterBudget(money: MoneyState): MoneyState {
  const live = money.budget?.lines.filter((l) => !l.removedAt) ?? [];
  if (live.length) return money;
  const lines: MoneyBudgetLine[] = BASICS.map((b) => ({ id: uid(), name: b.name, amount: 0, categories: b.kinds }));
  const extra = BASICS.flatMap((b) => b.kinds).filter((k) => !BUILT_IN.has(k));
  return {
    ...money,
    budget: { from: money.budget?.from ?? localDate(), salary: money.budget?.salary ?? 0, lines: [...lines, ...(money.budget?.lines ?? [])] },
    categories: [...new Set([...(money.categories ?? []), ...extra])],
  };
}

// The tracker is in US dollars. Trackers started before that (in rand by
// default) switch once; after that the friend's own choice stands.
const USD_ONCE = "atg:money-tracker:usdDefault";
export function inDollarsOnce(money: MoneyState): MoneyState | null {
  try {
    if (window.localStorage.getItem(USD_ONCE)) return null;
    window.localStorage.setItem(USD_ONCE, "1");
  } catch {
    return null;
  }
  return money.currency === "USD" ? null : { ...money, currency: "USD" };
}
