// Money (Daniel's private page): the balance, spending by month, and the
// regular debits that come off by themselves. Plain dollars, his account.

import type { MoneyEntry, MoneyState, MoneySub } from "./types";

export const SPEND_CATEGORIES = [
  "Coffee",
  "Groceries",
  "Eating out",
  "Fuel",
  "Cash out",
  "Tolls & transport",
  "Gym & golf",
  "Phone & data",
  "Subscriptions",
  "Bank fees",
  "Travel",
  "Other",
] as const;

export const dollars = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Math.round(n * 100) / 100);

export const uid = () => Math.random().toString(36).slice(2, 10);

const pad = (n: number) => String(n).padStart(2, "0");
export const monthOf = (date: string) => date.slice(0, 7);
export const localDate = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const shiftMonth = (ym: string, by: number) => {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + by, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};
export const monthName = (ym: string) =>
  new Date(`${ym}-15T12:00:00`).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
const daysIn = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m, 0).getDate();
};
// The date a regular debit comes off in a month (31st in a 30-day month -> the 30th).
export const dueDate = (sub: Pick<MoneySub, "day">, ym: string) => `${ym}-${pad(Math.min(sub.day, daysIn(ym)))}`;

const live = (e: MoneyEntry) => !e.deletedAt;

export function balance(m: MoneyState): number {
  let b = m.start.amount;
  for (const e of m.entries) if (live(e) && e.at >= m.start.at) b += e.kind === "add" ? e.amount : -e.amount;
  return Math.round(b * 100) / 100;
}

export function monthSummary(m: MoneyState, ym: string) {
  const spent = m.entries.filter((e) => live(e) && e.kind === "spend" && monthOf(e.date) === ym);
  const added = m.entries.filter((e) => live(e) && e.kind === "add" && monthOf(e.date) === ym);
  const total = spent.reduce((t, e) => t + e.amount, 0);
  const byCat = new Map<string, number>();
  for (const e of spent) byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amount);
  const parts = [...byCat.entries()]
    .map(([category, amount]) => ({ category, amount, pct: total ? (amount / total) * 100 : 0 }))
    .sort((a, b) => b.amount - a.amount);
  return { total, in: added.reduce((t, e) => t + e.amount, 0), parts, count: spent.length };
}

// A regular debit just set up: if its day has already passed this month,
// this month's one is already in the bank balance.
export function newSub(s: Omit<MoneySub, "id" | "lastPaid" | "active">, today = localDate()): MoneySub {
  const ym = monthOf(today);
  return { ...s, id: uid(), active: true, lastPaid: dueDate(s, ym) <= today ? ym : shiftMonth(ym, -1) };
}

// Regular debits due since they were last taken off, up to today - as
// spending entries, with each debit's lastPaid moved on. Safe to run often.
export function dueDebits(m: MoneyState, today = localDate()): { entries: MoneyEntry[]; paid: Record<string, string> } {
  const entries: MoneyEntry[] = [];
  const paid: Record<string, string> = {};
  const now = monthOf(today);
  for (const s of m.subs) {
    if (!s.active) continue;
    let ym = shiftMonth(s.lastPaid, 1);
    let last = s.lastPaid;
    while (ym <= now) {
      const date = dueDate(s, ym);
      if (date > today) break;
      entries.push({
        id: uid(),
        kind: "spend",
        amount: s.amount,
        category: s.category,
        note: s.name,
        date,
        at: new Date(`${date}T12:00:00`).toISOString(),
        sub: s.id,
      });
      last = ym;
      ym = shiftMonth(ym, 1);
    }
    if (last !== s.lastPaid) paid[s.id] = last;
  }
  return { entries, paid };
}

// First time: the balance Daniel gave, and the debits from his bank statement
// (amounts as they came off in October 2026 - he can change them).
export function startingMoney(amount: number, today = localDate()): MoneyState {
  const subs = [
    { name: "Spotify", amount: 14.97, day: 12, category: "Subscriptions" },
    { name: "Uber One", amount: 3.11, day: 12, category: "Subscriptions" },
    { name: "Apple", amount: 6.79, day: 8, category: "Subscriptions" },
    { name: "Apple", amount: 6.79, day: 9, category: "Subscriptions" },
    { name: "Apple (iCloud)", amount: 1.35, day: 9, category: "Subscriptions" },
    { name: "Account maintenance fee", amount: 90, day: 30, category: "Bank fees" },
  ].map((s) => newSub(s, today));
  return { start: { amount, at: new Date().toISOString() }, entries: [], subs };
}
