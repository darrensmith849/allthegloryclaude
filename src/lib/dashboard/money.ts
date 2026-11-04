// Money (Daniel's private page): the balance, spending by month, quick
// re-use of what he usually buys, and the regular debits that come off by
// themselves. Plain dollars, his account.

import type { MoneyEntry, MoneyExpected, MoneyState, MoneySub } from "./types";

export const SPEND_CATEGORIES = [
  "Coffee",
  "Groceries",
  "Eating out",
  "Fuel",
  "Cash out",
  "Tolls & transport",
  "Gym fees",
  "Golf",
  "Phone & data",
  "Subscriptions",
  "Bank fees",
  "Travel",
  "Other",
] as const;

export const FUEL = "Fuel";
export const CASH_OUT = "Cash out"; // money drawn from the account into cash
export const GYM = "Gym fees";

// The built-in kinds, his own, then any older kind still in use (so nothing goes missing).
export function allCategories(m: MoneyState): string[] {
  const out: string[] = [...SPEND_CATEGORIES, ...(m.categories ?? [])];
  for (const e of m.entries) if (!e.deletedAt && e.kind === "spend" && !out.includes(e.category)) out.push(e.category);
  for (const s of m.subs) if (!out.includes(s.category)) out.push(s.category);
  return out;
}

// One colour per kind, the same everywhere (warm, muted - the dashboard's look).
const PALETTE = ["#9a7425", "#6f8a5b", "#4f6d8a", "#b5654a", "#7b5a7e", "#3f7f7a", "#c2a26b", "#b0707f", "#8a8a4a", "#5b5650", "#6a9ec0", "#a0522d", "#c08a3e", "#7a8f9e", "#8e6f5a"];
export function colourFor(m: MoneyState, category: string): string {
  const i = allCategories(m).indexOf(category);
  if (i >= 0) return PALETTE[i % PALETTE.length];
  let h = 0;
  for (const ch of category) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

// The currency the Money page shows: Daniel's in dollars, family's (his
// sister's own dashboard) in rand - MoneyState.currency. Set by the page as it
// draws, before any figure is written out (one Money page at a time).
let symbol = "$";
export function setCurrency(c: MoneyState["currency"]) {
  symbol = c === "ZAR" ? "R" : "$";
}
export const currencySymbol = () => symbol;

const twoPlaces = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
// "$1,234.56" / "-$12.50" (or "R1,234.56").
export const dollars = (n: number) => {
  const v = Math.round(n * 100) / 100;
  return `${v < 0 ? "-" : ""}${symbol}${twoPlaces.format(Math.abs(v))}`;
};
// "$4" for whole amounts, "$4.50" otherwise - for buttons.
export const shortDollars = (n: number) => (Number.isInteger(n) ? `${n < 0 ? "-" : ""}${symbol}${Math.abs(n)}` : dollars(n));

export const kmText = (n: number) => `${new Intl.NumberFormat("en-US").format(Math.round(n))} km`;
export const parseKm = (v: string) => {
  const n = Math.round(Number(String(v).replace(/[^0-9.]/g, "")));
  return Number.isFinite(n) && n > 0 ? n : null;
};

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
export const daysIn = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m, 0).getDate();
};
// The date a regular debit comes off in a month (31st in a 30-day month -> the 30th).
export const dueDate = (sub: Pick<MoneySub, "day">, ym: string) => `${ym}-${pad(Math.min(sub.day, daysIn(ym)))}`;

const live = (e: MoneyEntry) => !e.deletedAt;

const byDay = (a: MoneyEntry, b: MoneyEntry) => a.date.localeCompare(b.date) || a.at.localeCompare(b.at);
const cents = (n: number) => Math.round(n * 100) / 100;

// The account and the cash in hand, walked through the entries day by day
// (in the order entered within a day). An entry for an earlier day counts
// on that day - so one logged late, after a balance was set that already
// included it, isn't taken off twice.
function walk(m: MoneyState, pick: (e: MoneyEntry) => boolean = () => true): { acct: number; cash: number } {
  let acct = m.start.amount;
  let cash = 0;
  for (const e of m.entries.filter((x) => live(x) && pick(x)).sort(byDay)) {
    if (e.cash) {
      cash = e.kind === "set" ? e.amount : e.kind === "spend" ? cash - e.amount : cash + e.amount;
      continue;
    }
    if (e.kind === "move") cash += e.amount; // drawn from the account into cash
    if (e.at < m.start.at) continue; // before the page began - already in the starting balance
    acct = e.kind === "set" ? e.amount : e.kind === "add" ? acct + e.amount : acct - e.amount; // spend and move take off
  }
  return { acct: cents(acct), cash: cents(cash) };
}

export const balance = (m: MoneyState) => walk(m).acct;
export const cashBalance = (m: MoneyState) => walk(m).cash;

// A day in the calendar: what it started with (carried over from the day
// before) and what it ended with.
export function dayBalances(m: MoneyState, day: string) {
  return { open: walk(m, (e) => e.date < day), close: walk(m, (e) => e.date <= day) };
}

// Each day of a month: spent and money in.
export function daySums(m: MoneyState, ym: string): Map<string, { spent: number; in: number }> {
  const out = new Map<string, { spent: number; in: number }>();
  for (const e of m.entries) {
    if (!live(e) || monthOf(e.date) !== ym || (e.kind !== "spend" && e.kind !== "add")) continue;
    const d = out.get(e.date) ?? { spent: 0, in: 0 };
    if (e.kind === "spend") d.spent += e.amount;
    else d.in += e.amount;
    out.set(e.date, d);
  }
  return out;
}

const spentIn = (m: MoneyState, pick: (date: string) => boolean) =>
  m.entries.filter((e) => live(e) && e.kind === "spend" && pick(e.date)).reduce((t, e) => t + e.amount, 0);

export function monthSummary(m: MoneyState, ym: string, today = localDate()) {
  const spent = m.entries.filter((e) => live(e) && e.kind === "spend" && monthOf(e.date) === ym);
  const total = spent.reduce((t, e) => t + e.amount, 0);
  const byCat = new Map<string, number>();
  for (const e of spent) byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amount);
  const parts = [...byCat.entries()]
    .map(([category, amount]) => ({ category, amount, pct: total ? (amount / total) * 100 : 0 }))
    .sort((a, b) => b.amount - a.amount);
  const moneyIn = m.entries.filter((e) => live(e) && e.kind === "add" && monthOf(e.date) === ym).reduce((t, e) => t + e.amount, 0);
  // Days so far: the whole month if it's over, else up to today.
  const days = ym < monthOf(today) ? daysIn(ym) : ym === monthOf(today) ? Number(today.slice(8, 10)) : 0;
  // Last month to compare with: all of it, or - while this month is still
  // going - only up to the same day, so it's like for like.
  const before = shiftMonth(ym, -1);
  const soFar = ym === monthOf(today);
  const last = spentIn(m, (d) => monthOf(d) === before && (!soFar || Number(d.slice(8, 10)) <= days));
  return {
    total,
    in: moneyIn,
    parts,
    count: spent.length,
    lastMonth: last,
    soFar,
    change: last > 0 ? ((total - last) / last) * 100 : null,
    perDay: days ? total / days : 0,
  };
}

export const spentOn = (m: MoneyState, date: string) => spentIn(m, (d) => d === date);

// The prices he usually pays for a kind of thing (most often first, then smallest).
export function usualAmounts(m: MoneyState, category: string, max = 4): number[] {
  const count = new Map<number, number>();
  for (const e of m.entries) if (live(e) && e.kind === "spend" && e.category === category) count.set(e.amount, (count.get(e.amount) ?? 0) + 1);
  return [...count.entries()]
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, max)
    .map(([a]) => a)
    .sort((a, b) => a - b);
}

// What he buys again and again - one tap to log it again.
export function usualBuys(m: MoneyState, max = 4): { category: string; amount: number; note?: string; cash?: boolean }[] {
  const seen = new Map<string, { category: string; amount: number; note?: string; cash?: boolean; n: number; last: string }>();
  for (const e of m.entries) {
    if (!live(e) || e.kind !== "spend" || e.sub) continue;
    const key = `${e.category}|${e.amount}|${e.note ?? ""}|${e.cash ? "cash" : ""}`;
    const s = seen.get(key) ?? { category: e.category, amount: e.amount, note: e.note, cash: e.cash, n: 0, last: "" };
    s.n++;
    if (e.at > s.last) s.last = e.at;
    seen.set(key, s);
  }
  return [...seen.values()]
    .sort((a, b) => b.n - a.n || b.last.localeCompare(a.last))
    .slice(0, max)
    .map(({ category, amount, note, cash }) => ({ category, amount, note, cash }));
}

// One kind of spending: every payment (latest first), this month's and this year's.
export function kindLog(m: MoneyState, category: string, ym: string) {
  const all = m.entries
    .filter((e) => live(e) && e.kind === "spend" && e.category === category)
    .sort((a, b) => b.date.localeCompare(a.date) || b.at.localeCompare(a.at));
  const sum = (pick: (e: MoneyEntry) => boolean) => all.filter(pick).reduce((t, e) => t + e.amount, 0);
  return { all, month: sum((e) => monthOf(e.date) === ym), year: sum((e) => e.date.slice(0, 4) === ym.slice(0, 4)) };
}

// Fuel, with the mileage at each fill-up: the km since the fill-up before,
// km driven in the month, and what the car costs a km - the fuel bought
// after the first reading, over the km from the first reading to the last.
export function fuelLog(m: MoneyState, ym: string) {
  const log = kindLog(m, FUEL, ym);
  const oldest = [...log.all].reverse();
  const since = new Map<string, number>();
  let prev: number | undefined;
  for (const e of oldest) {
    if (e.km == null) continue;
    if (prev != null && e.km > prev) since.set(e.id, e.km - prev);
    prev = e.km;
  }
  let km = 0;
  for (const e of log.all) if (monthOf(e.date) === ym) km += since.get(e.id) ?? 0;
  const read = oldest.filter((e) => e.km != null);
  let perKm: number | null = null;
  if (read.length >= 2) {
    const first = read[0];
    const last = read[read.length - 1];
    const dist = last.km! - first.km!;
    const paid = oldest.slice(oldest.indexOf(first) + 1, oldest.indexOf(last) + 1).reduce((t, e) => t + e.amount, 0);
    if (dist > 0) perKm = paid / dist;
  }
  return { ...log, since, km, perKm, lastKm: read.length ? read[read.length - 1].km! : null };
}

// Places / notes used before for a kind, latest first.
export function notesFor(m: MoneyState, category: string, max = 8): string[] {
  const out: string[] = [];
  for (const e of [...m.entries].sort((a, b) => b.at.localeCompare(a.at))) {
    if (!live(e) || e.category !== category || !e.note || out.includes(e.note)) continue;
    out.push(e.note);
    if (out.length >= max) break;
  }
  return out;
}

// Income he expects but hasn't had yet, soonest first. Never counted in a
// balance - only once he marks it as in (then it's an ordinary "add" entry).
export function expectedIncome(m: MoneyState): MoneyExpected[] {
  return (m.expected ?? [])
    .filter((x) => !x.deletedAt && !x.receivedAt)
    .sort((a, b) => a.date.localeCompare(b.date) || a.at.localeCompare(b.at));
}

// Regular debits still to come off this month.
export function stillToCome(m: MoneyState, today = localDate()) {
  const ym = monthOf(today);
  return m.subs
    .filter((s) => s.active && !s.removedAt && s.lastPaid < ym && dueDate(s, ym) > today)
    .map((s) => ({ sub: s, date: dueDate(s, ym) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// The next date a regular debit comes off.
export function nextDue(s: MoneySub, today = localDate()): string {
  let ym = shiftMonth(s.lastPaid, 1);
  while (dueDate(s, ym) < today) ym = shiftMonth(ym, 1);
  return dueDate(s, ym);
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
    if (!s.active || s.removedAt) continue;
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

// Every entry, for a spreadsheet.
export function toCsv(m: MoneyState): string {
  const cell = (v: unknown) => {
    const t = String(v ?? "");
    return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  const rows = [["Date", "Kind", "What", "Note", "Amount", "Account or cash", "Mileage (km)", "Regular debit"]];
  for (const e of [...m.entries].filter(live).sort((a, b) => a.date.localeCompare(b.date) || a.at.localeCompare(b.at))) {
    const kind = e.kind === "spend" ? "Spent" : e.kind === "add" ? "Money in" : e.kind === "move" ? "Account to cash" : "Balance set";
    const amount = e.kind === "spend" ? -e.amount : e.amount;
    const where = e.kind === "move" ? "Account to cash" : e.cash ? "Cash" : "Account";
    rows.push([e.date, kind, e.kind === "set" ? "" : e.category, e.note ?? "", amount.toFixed(2), where, e.km != null ? String(e.km) : "", e.sub ? "yes" : ""]);
  }
  return rows.map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
}

// First time for family (her own dashboard): nothing yet, in rand - she taps
// her balance to set it, and adds her own regular debits.
export function blankMoney(): MoneyState {
  return { start: { amount: 0, at: new Date().toISOString() }, entries: [], subs: [], currency: "ZAR" };
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
