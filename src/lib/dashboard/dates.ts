// Date helpers. ALL dates are local-time YYYY-MM-DD.
// We deliberately avoid timezone-shifting "toISOString" except where the local
// machine timezone aligns with the user's calendar day.

import { ISODate } from "./types";

export function todayISO(d: Date = new Date()): ISODate {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(iso: ISODate, n: number): ISODate {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  return todayISO(dt);
}

export function diffDays(from: ISODate, to: ISODate): number {
  const [ay, am, ad] = from.split("-").map(Number);
  const [by, bm, bd] = to.split("-").map(Number);
  const a = Date.UTC(ay, am - 1, ad);
  const b = Date.UTC(by, bm - 1, bd);
  return Math.round((b - a) / 86_400_000);
}

export function startOfWeek(iso: ISODate): ISODate {
  // Week starts on Monday.
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const day = dt.getDay(); // 0 = Sun
  const offset = day === 0 ? -6 : 1 - day;
  dt.setDate(dt.getDate() + offset);
  return todayISO(dt);
}

export function startOfMonth(iso: ISODate): ISODate {
  const [y, m] = iso.split("-").map(Number);
  return `${y}-${String(m).padStart(2, "0")}-01`;
}

export function monthGrid(iso: ISODate): ISODate[] {
  // Always returns 42 ISO dates (6 weeks) starting on the Monday on or before the 1st.
  const first = startOfMonth(iso);
  const start = startOfWeek(first);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

export function formatHuman(iso: ISODate): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatShort(iso: ISODate): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function isToday(iso: ISODate): boolean {
  return iso === todayISO();
}

export function isSameMonth(iso: ISODate, ref: ISODate): boolean {
  return iso.slice(0, 7) === ref.slice(0, 7);
}

export function weekdayShort(iso: ISODate): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "short" });
}
