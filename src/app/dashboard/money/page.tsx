"use client";

// Money - Daniel's own spending tracker (not for the team, never members).
// Laid out like a private-banking app, most important first: his money (the
// total, the account and the cash in hand - tap either to change it - and
// Add income / Add expense, with one tap on what he usually buys), then the
// month's activity (every entry editable), then where the money went - each
// kind of spending, and how the month compares to last month. Around them:
// the calendar, day by day (each day keeps its own entries, with the balance
// it started with and ended with), and a tabbed card for the regular debits
// that come off by themselves (and what's still to come), Fuel (with the
// car's mileage) and Gym fees. Income he's expecting is kept to one side -
// a "Projected" line under the total, changing no balance until he taps
// "It's in". Saved with the rest of the dashboard.

import { useEffect, useMemo, useRef, useState } from "react";
import { DeleteButton, EntryEdit, editingFor, Figure, KindTab, WalletToggle, type Editing } from "@/components/dashboard/money-panels";
import { useDashboard } from "@/lib/dashboard/storage";
import type { MoneyEntry, MoneyExpected } from "@/lib/dashboard/types";
import {
  allCategories,
  balance,
  CASH_OUT,
  dayBalances,
  daySums,
  daysIn,
  cashBalance,
  colourFor,
  dollars,
  dueDate,
  dueDebits,
  expectedIncome,
  FUEL,
  fuelLog,
  GYM,
  kindLog,
  kmText,
  localDate,
  monthName,
  monthOf,
  monthSummary,
  newSub,
  nextDue,
  notesFor,
  parseKm,
  shiftMonth,
  shortDollars,
  spentOn,
  startingMoney,
  stillToCome,
  toCsv,
  uid,
  usualAmounts,
  usualBuys,
} from "@/lib/dashboard/money";

const STARTING_BALANCE = 1912; // what Daniel had in the account when this began
const MONEY_IN = ["Salary", "Transfer", "Gift", "Other"];
const RECENT = 10; // entries in Recent activity before "Show all"

const parseAmount = (v: string) => {
  const n = Number(String(v).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
};
const shortDate = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const dayHeading = (d: string, today: string) => {
  if (d === today) return "Today";
  const y = new Date(`${today}T12:00:00`);
  y.setDate(y.getDate() - 1);
  if (d === localDate(y)) return "Yesterday";
  return new Date(`${d}T12:00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
};
const fullDay = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
const shiftDay = (d: string, by: number) => {
  const x = new Date(`${d}T12:00:00`);
  x.setDate(x.getDate() + by);
  return localDate(x);
};
const CAL_HEAD = ["M", "T", "W", "T", "F", "S", "S"];
const ordinal = (n: number) => `${n}${n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th"}`;

type Form = { mode: "spend"; category: string; cash: boolean } | { mode: "add"; cash: boolean; expected?: boolean } | { mode: "move" } | null;
type Sheet = "income" | "expense" | "expected";
type Tool = "recurring" | "fuel" | "gym";

// A small remembered choice on this device (which calendar view, which tab).
function useRemembered<T extends string>(key: string, initial: T, allowed: readonly T[]): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(initial);
  useEffect(() => {
    try {
      const v = localStorage.getItem(key) as T | null;
      if (v && allowed.includes(v)) setValue(v);
    } catch {
      // no storage - the default
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const set = (v: T) => {
    setValue(v);
    try {
      localStorage.setItem(key, v);
    } catch {
      // not remembered - fine
    }
  };
  return [value, set];
}

export default function MoneyPage() {
  const { state, update, ready, synced } = useDashboard();
  const money = state.money;
  const today = localDate();

  // First visit: start from the balance Daniel gave, with his regular debits -
  // only once the saved copy has loaded, so it never replaces one from another device.
  useEffect(() => {
    if (ready && synced && !state.money) update((d) => void (d.money = startingMoney(STARTING_BALANCE)));
  }, [ready, synced, state.money, update]);

  // Regular debits that have come due come off by themselves (on the latest copy, once).
  useEffect(() => {
    if (!money || !synced) return;
    if (!dueDebits(money, today).entries.length) return;
    update((d) => {
      if (!d.money) return;
      const due = dueDebits(d.money, today);
      d.money.entries.push(...due.entries);
      for (const s of d.money.subs) if (due.paid[s.id]) s.lastPaid = due.paid[s.id];
    });
  }, [money, synced, today, update]);

  // ── Adding ─────────────────────────────────────────────────────
  // The sheet under Add income / Add expense (for an expense, a kind is picked
  // first), or the list of income still expected.
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [form, setForm] = useState<Form>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [km, setKm] = useState("");
  const [date, setDate] = useState(today);
  const amountRef = useRef<HTMLInputElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const activityRef = useRef<HTMLElement>(null);
  const [toast, setToast] = useState<{ text: string; undo?: () => void } | null>(null);
  const toastTimer = useRef<number | null>(null);
  const [month, setMonth] = useState(monthOf(today));
  const [only, setOnly] = useState<string | null>(null); // the month's list, one kind only
  const [view, setView] = useState<"all" | "in" | "out">("all"); // the month: everything, money in, or spending
  const [showAll, setShowAll] = useState(false);
  // The day open in the calendar - what's added goes on this day (today unless another is picked).
  const [day, setDay] = useState(today);
  const [calMonth, setCalMonth] = useState(monthOf(today));
  const [calView, setCalView] = useRemembered("atg:money:calView", "month", ["month", "year"] as const);
  const [tool, setTool] = useRemembered<Tool>("atg:money:tool", "recurring", ["recurring", "fuel", "gym"] as const);
  const pickDay = (d: string) => {
    const next = d > today ? today : d;
    setDay(next);
    setCalMonth(monthOf(next));
    setEditing(null);
  };
  // /dashboard/money?day=2026-10-13 (from the Calendar) opens that day.
  useEffect(() => {
    const d = new URLSearchParams(window.location.search).get("day");
    if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) pickDay(d);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function say(text: string, undo?: () => void) {
    setToast({ text, undo });
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 8000);
  }

  // The sheet comes into view on a phone, where it opens below the fold.
  function showSheet() {
    window.setTimeout(() => {
      const el = sheetRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.bottom > window.innerHeight || r.top < 0) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 40);
  }

  function openForm(f: Form) {
    const same =
      f &&
      form &&
      f.mode === form.mode &&
      (f.mode !== "spend" || (form.mode === "spend" && f.category === form.category)) &&
      (f.mode !== "add" || (form.mode === "add" && f.cash === form.cash));
    if (same) {
      setForm(null); // the same button again closes it
      return;
    }
    setForm(f);
    setAmount("");
    setNote("");
    setKm("");
    setDate(day);
    window.setTimeout(() => amountRef.current?.focus(), 30);
    showSheet();
  }

  function openSheet(s: Sheet) {
    setBalanceEdit(null);
    setExpEdit(null);
    if (sheet === s) return closeSheet(); // the same button again closes it
    setSheet(s);
    setNewCat(null);
    if (s === "income") openForm({ mode: "add", cash: false });
    else {
      setForm(null);
      showSheet();
    }
  }
  function closeSheet() {
    setSheet(null);
    setForm(null);
    setNewCat(null);
    setExpEdit(null);
  }

  function addEntry(e: Omit<MoneyEntry, "id" | "at">) {
    const entry: MoneyEntry = { ...e, id: uid(), at: new Date().toISOString() };
    update((d) => void d.money?.entries.push(entry));
    setMonth(monthOf(entry.date));
    if (entry.date !== day) pickDay(entry.date);
    say(
      entry.kind === "add"
        ? `${dollars(entry.amount)} added${entry.cash ? " to your cash" : ""}`
        : entry.kind === "move"
          ? `${dollars(entry.amount)} moved from your account to cash`
          : `${dollars(entry.amount)} ${entry.note ? `at ${entry.note}` : `on ${entry.category.toLowerCase()}`} - taken off${entry.cash ? " your cash" : ""}`,
      () => update((d) => {
        const x = d.money?.entries.find((y) => y.id === entry.id);
        if (x) x.deletedAt = new Date().toISOString();
      }),
    );
  }

  function save(e?: React.FormEvent, quick?: number) {
    e?.preventDefault();
    if (!form) return;
    const n = quick ?? parseAmount(amount);
    if (n == null) return amountRef.current?.focus();
    if (form.mode === "add" && form.expected) {
      addExpected({ amount: n, note: note.trim() || undefined, date, ...(form.cash ? { cash: true } : {}) });
      return closeSheet();
    }
    const reading = form.mode === "spend" && form.category === FUEL ? parseKm(km) : null;
    addEntry({
      kind: form.mode,
      amount: n,
      category: form.mode === "add" ? "Money in" : form.mode === "move" ? CASH_OUT : form.category,
      note: note.trim() || undefined,
      date,
      ...(reading != null ? { km: reading } : {}),
      ...(form.mode !== "move" && form.cash ? { cash: true } : {}),
    });
    closeSheet();
  }

  // ── Income still to come in (kept to one side) ──────────────────
  const [expEdit, setExpEdit] = useState<{ id: string; amount: string; note: string; date: string; cash: boolean } | null>(null);
  function addExpected(x: Omit<MoneyExpected, "id" | "at">) {
    const item: MoneyExpected = { ...x, id: uid(), at: new Date().toISOString() };
    update((d) => {
      if (d.money) d.money.expected = [...(d.money.expected ?? []), item];
    });
    say(`${dollars(item.amount)} expected ${item.date === today ? "today" : `on ${shortDate(item.date)}`} - your balance stays as it is`, () =>
      update((d) => {
        const y = d.money?.expected?.find((z) => z.id === item.id);
        if (y) y.deletedAt = new Date().toISOString();
      }),
    );
  }
  // It came in: now it's an ordinary money-in entry, on the day open in the calendar.
  function receiveExpected(id: string) {
    const x = money?.expected?.find((y) => y.id === id);
    if (!x) return;
    const now = new Date().toISOString();
    const entry: MoneyEntry = { id: uid(), kind: "add", amount: x.amount, category: "Money in", note: x.note, date: day, at: now, ...(x.cash ? { cash: true } : {}) };
    update((d) => {
      if (!d.money) return;
      d.money.entries.push(entry);
      const y = d.money.expected?.find((z) => z.id === id);
      if (y) Object.assign(y, { receivedAt: now, entry: entry.id });
    });
    setMonth(monthOf(entry.date));
    setExpEdit(null);
    say(`${dollars(x.amount)} in${x.note ? ` from ${x.note}` : ""} - added to your ${x.cash ? "cash" : "balance"}`, () =>
      update((d) => {
        const e = d.money?.entries.find((y) => y.id === entry.id);
        if (e) e.deletedAt = new Date().toISOString();
        const y = d.money?.expected?.find((z) => z.id === id);
        if (y) {
          delete y.receivedAt;
          delete y.entry;
        }
      }),
    );
  }
  function saveExpectedEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!expEdit) return;
    const n = parseAmount(expEdit.amount);
    if (n == null || !expEdit.date) return;
    update((d) => {
      const y = d.money?.expected?.find((z) => z.id === expEdit.id);
      if (!y) return;
      y.amount = n;
      y.date = expEdit.date;
      y.note = expEdit.note.trim() || undefined;
      if (expEdit.cash) y.cash = true;
      else delete y.cash;
    });
    setExpEdit(null);
  }
  function removeExpected(id: string) {
    update((d) => {
      const y = d.money?.expected?.find((z) => z.id === id);
      if (y) y.deletedAt = new Date().toISOString();
    });
    setExpEdit(null);
    say("Taken off what you're expecting", () =>
      update((d) => {
        const y = d.money?.expected?.find((z) => z.id === id);
        if (y) delete y.deletedAt;
      }),
    );
  }

  // ── The balance, changed in place ───────────────────────────────
  const [balanceEdit, setBalanceEdit] = useState<{ cash: boolean; value: string } | null>(null);
  const balanceRef = useRef<HTMLInputElement>(null);
  function startBalanceEdit(cash = false) {
    if (!money) return;
    closeSheet();
    setBalanceEdit({ cash, value: (cash ? cashBalance(money) : balance(money)).toFixed(2) });
    window.setTimeout(() => {
      balanceRef.current?.focus();
      balanceRef.current?.select();
    }, 30);
  }
  function saveBalance(e?: React.FormEvent) {
    e?.preventDefault();
    if (balanceEdit == null || !money) return;
    const { cash } = balanceEdit;
    const n = Number(balanceEdit.value.replace(/[^0-9.-]/g, ""));
    if (!Number.isFinite(n)) return balanceRef.current?.focus();
    const now = cash ? cashBalance(money) : balance(money);
    setBalanceEdit(null);
    if (Math.round(n * 100) === Math.round(now * 100)) return;
    const entry: MoneyEntry = {
      id: uid(),
      kind: "set",
      amount: Math.round(n * 100) / 100,
      category: cash ? "Cash" : "Balance",
      date: today,
      at: new Date().toISOString(),
      ...(cash ? { cash: true } : {}),
    };
    update((d) => void d.money?.entries.push(entry));
    say(`${cash ? "Cash" : "Balance"} set to ${dollars(entry.amount)}`, () =>
      update((d) => {
        const x = d.money?.entries.find((y) => y.id === entry.id);
        if (x) x.deletedAt = new Date().toISOString();
      }),
    );
  }

  // ── Editing an entry ────────────────────────────────────────────
  const [editing, setEditing] = useState<Editing | null>(null);
  function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const n = parseAmount(editing.amount);
    if (n == null) return;
    update((d) => {
      const x = d.money?.entries.find((y) => y.id === editing.id);
      if (!x) return;
      x.amount = n;
      if (x.kind !== "set") {
        x.category = editing.category;
        x.note = editing.note.trim() || undefined;
        x.date = editing.date || x.date;
        const reading = x.category === FUEL ? parseKm(editing.km) : null;
        if (reading != null) x.km = reading;
        else delete x.km;
        if (x.kind === "spend" || x.kind === "add") {
          if (editing.cash) x.cash = true;
          else delete x.cash;
        }
      }
    });
    setEditing(null);
  }
  function removeEntry(id: string) {
    update((d) => {
      const x = d.money?.entries.find((y) => y.id === id);
      if (x) x.deletedAt = new Date().toISOString();
    });
    setEditing(null);
    say("Deleted - your balance is back to what it was without it", () =>
      update((d) => {
        const x = d.money?.entries.find((y) => y.id === id);
        if (x) delete x.deletedAt;
      }),
    );
  }

  // ── Kinds of spending of his own ────────────────────────────────
  const [newCat, setNewCat] = useState<string | null>(null);
  function addCategory(e: React.FormEvent) {
    e.preventDefault();
    const c = (newCat ?? "").trim().replace(/\s+/g, " ").slice(0, 30);
    if (!c || !money) return;
    if (!allCategories(money).some((x) => x.toLowerCase() === c.toLowerCase())) {
      update((d) => {
        if (d.money) d.money.categories = [...(d.money.categories ?? []), c];
      });
    }
    setNewCat(null);
    openForm({ mode: "spend", category: c, cash: false });
  }

  // ── Regular debits ──────────────────────────────────────────────
  const [subForm, setSubForm] = useState<{ id?: string; name: string; amount: string; day: string; category: string } | null>(null);
  const [subOpen, setSubOpen] = useState<string | null>(null); // the debit tapped open: Change / Pause / Remove
  function saveSub(e: React.FormEvent) {
    e.preventDefault();
    if (!subForm) return;
    const n = parseAmount(subForm.amount);
    const day = Math.round(Number(subForm.day));
    if (!subForm.name.trim() || n == null || !(day >= 1 && day <= 31)) return;
    update((d) => {
      if (!d.money) return;
      const existing = subForm.id ? d.money.subs.find((s) => s.id === subForm.id) : null;
      if (existing) Object.assign(existing, { name: subForm.name.trim(), amount: n, day, category: subForm.category });
      else d.money.subs.push(newSub({ name: subForm.name.trim(), amount: n, day, category: subForm.category }, today));
    });
    setSubForm(null);
  }
  function toggleSub(id: string) {
    update((d) => {
      const s = d.money?.subs.find((x) => x.id === id);
      if (!s) return;
      s.active = !s.active;
      // Back on: carry on from this month, without back-charging the paused months.
      if (s.active) s.lastPaid = dueDate(s, monthOf(today)) <= today ? monthOf(today) : shiftMonth(monthOf(today), -1);
    });
  }

  function removeSub(id: string) {
    const s = money?.subs.find((x) => x.id === id);
    update((d) => {
      const x = d.money?.subs.find((y) => y.id === id);
      if (x) x.removedAt = new Date().toISOString();
    });
    if (subForm?.id === id) setSubForm(null);
    say(`${s?.name ?? "Debit"} removed - it won't come off any more`, () =>
      update((d) => {
        const x = d.money?.subs.find((y) => y.id === id);
        if (x) delete x.removedAt;
      }),
    );
  }

  function downloadCsv() {
    if (!money) return;
    const url = URL.createObjectURL(new Blob([toCsv(money)], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `money-${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Figures ─────────────────────────────────────────────────────
  const summary = useMemo(() => (money ? monthSummary(money, month, today) : null), [money, month, today]);
  const thisMonth = useMemo(() => (money ? monthSummary(money, monthOf(today), today) : null), [money, today]);
  const days = useMemo(() => {
    if (!money) return [];
    const shown = (e: MoneyEntry) =>
      view === "in" ? e.kind === "add" : view === "out" || only ? e.kind === "spend" && (!only || e.category === only) : true;
    const list = money.entries
      .filter((e) => !e.deletedAt && monthOf(e.date) === month && shown(e))
      .sort((a, b) => b.date.localeCompare(a.date) || b.at.localeCompare(a.at));
    const out: { date: string; items: MoneyEntry[]; spent: number; in: number }[] = [];
    for (const e of list) {
      let g = out[out.length - 1];
      if (!g || g.date !== e.date) out.push((g = { date: e.date, items: [], spent: 0, in: 0 }));
      g.items.push(e);
      if (e.kind === "spend") g.spent += e.amount;
      if (e.kind === "add") g.in += e.amount;
    }
    return out;
  }, [money, month, only, view]);
  // Where the month's money came from (by what was noted, e.g. "Salary").
  const inParts = useMemo(() => {
    if (!money) return [];
    const by = new Map<string, number>();
    for (const e of money.entries) {
      if (e.deletedAt || e.kind !== "add" || monthOf(e.date) !== month) continue;
      const from = e.note || (e.cash ? "Cash in" : "Money in");
      by.set(from, (by.get(from) ?? 0) + e.amount);
    }
    return [...by.entries()].map(([from, amount]) => ({ from, amount })).sort((a, b) => b.amount - a.amount);
  }, [money, month]);
  const coming = useMemo(() => (money ? stillToCome(money, today) : []), [money, today]);
  const expected = useMemo(() => (money ? expectedIncome(money) : []), [money]);
  const buys = useMemo(() => (money ? usualBuys(money) : []), [money]);

  if (synced === false && !money) {
    return <p className="dash-word-hint">Couldn&apos;t load your money page - check your connection and refresh.</p>;
  }
  if (!ready || !money || !summary || !thisMonth) return <p className="dash-word-hint">Opening…</p>;

  const bal = balance(money);
  const cashNow = cashBalance(money);
  const comingTotal = coming.reduce((t, c) => t + c.sub.amount, 0);
  const monthlySubs = money.subs.filter((s) => s.active && !s.removedAt).reduce((t, s) => t + s.amount, 0);
  const cats = allCategories(money);
  const fuelLast = money.entries
    .filter((e) => !e.deletedAt && e.category === FUEL && e.km != null)
    .sort((a, b) => b.date.localeCompare(a.date) || b.at.localeCompare(a.at))[0]?.km;
  const fuelNow = fuelLog(money, monthOf(today));
  const gymNow = kindLog(money, GYM, monthOf(today));
  const left = summary.in - summary.total;
  const expectedTotal = expected.reduce((t, x) => t + x.amount, 0);
  const expectedInMonth = expected.filter((x) => monthOf(x.date) === month).reduce((t, x) => t + x.amount, 0);
  const whenText = (d: string) => {
    const n = Math.round((new Date(`${d}T12:00:00`).getTime() - new Date(`${today}T12:00:00`).getTime()) / 86400000);
    return n === 0 ? "today" : n === 1 ? "tomorrow" : n > 1 ? `in ${n} days` : `was due ${shortDate(d)}`;
  };

  // One entry as a transaction row: tap to change it, ✕ to delete it.
  const entryRow = (e: MoneyEntry, where: string) => {
    if (editing?.id === e.id && editing.where === where)
      return (
        <EntryEdit
          key={e.id}
          money={money}
          entry={e}
          editing={editing}
          setEditing={setEditing}
          onSave={saveEdit}
          onRemove={() => removeEntry(e.id)}
          today={today}
        />
      );
    const kindName = e.kind === "add" ? (e.cash ? "Cash in" : "Money in") : e.category;
    const name = e.kind === "set" ? (e.cash ? "Cash set" : "Balance set") : e.note || kindName;
    const meta = [
      e.kind !== "set" && e.note ? kindName : null,
      e.kind === "move" ? "Account → cash" : e.cash ? "Cash" : "Account",
      e.km != null ? kmText(e.km) : null,
      e.sub ? "Recurring" : null,
    ].filter(Boolean);
    const colour = e.kind === "spend" ? colourFor(money, e.category) : e.kind === "add" ? "rgb(var(--ok-rgb))" : "var(--colour-amber)";
    return (
      <div key={e.id} className="money-tx-line">
        <button type="button" className={`money-tx is-${e.kind}`} onClick={() => setEditing(editingFor(e, where))}>
          <span className="money-tx-mark" style={{ "--c": colour } as React.CSSProperties} aria-hidden>
            {e.kind === "add" ? "+" : e.kind === "set" ? "=" : e.kind === "move" ? "⇄" : (e.category[0] ?? "·").toUpperCase()}
          </span>
          <span className="money-tx-main">
            <span className="money-tx-name">{name}</span>
            <span className="money-tx-meta">{meta.join(" · ")}</span>
          </span>
          <span className="money-tx-amount">
            {e.kind === "set" || e.kind === "move" ? dollars(e.amount) : `${e.kind === "add" ? "+" : "−"}${dollars(e.amount)}`}
          </span>
        </button>
        <DeleteButton onClick={() => removeEntry(e.id)} />
      </div>
    );
  };

  // The calendar: the open day's entries and balances, and each day of its month.
  const dayEntries = money.entries.filter((e) => !e.deletedAt && e.date === day).sort((a, b) => a.at.localeCompare(b.at));
  const dayBal = dayBalances(money, day);
  const sums = daySums(money, calMonth);
  const daySum = daySums(money, monthOf(day)).get(day) ?? { spent: 0, in: 0 };
  const calLead = (new Date(`${calMonth}-01T12:00:00`).getDay() + 6) % 7;
  const calDays = Array.from({ length: daysIn(calMonth) }, (_, k) => `${calMonth}-${String(k + 1).padStart(2, "0")}`);
  const showCash = dayBal.open.cash !== 0 || dayBal.close.cash !== 0;
  // The year view: every month's days, shaded by what was spent.
  const calYear = calMonth.slice(0, 4);
  const yearMonths = Array.from({ length: 12 }, (_, k) => `${calYear}-${String(k + 1).padStart(2, "0")}`);
  const yearSums = calView === "year" ? yearMonths.map((ym) => daySums(money, ym)) : [];
  const yearMax = Math.max(1, ...yearSums.flatMap((m) => [...m.values()].map((v) => v.spent)));
  const yearTotal = yearSums.reduce(
    (t, m) => {
      for (const v of m.values()) {
        t.spent += v.spent;
        t.in += v.in;
      }
      return t;
    },
    { spent: 0, in: 0 },
  );
  const goYear = (by: number) => {
    const y = Number(calYear) + by;
    const ym = `${y}-${calMonth.slice(5)}`;
    setCalMonth(ym > monthOf(today) ? monthOf(today) : ym);
  };

  // Recent activity: the newest entries first, the rest behind "Show all".
  const rowCount = days.reduce((t, g) => t + g.items.length, 0);
  let room = showAll ? Infinity : RECENT;
  const shownDays: typeof days = [];
  for (const g of days) {
    if (room <= 0) break;
    shownDays.push({ ...g, items: g.items.slice(0, room) });
    room -= g.items.length;
  }
  const pickMonth = (ym: string) => {
    setMonth(ym);
    setOnly(null);
    setShowAll(false);
  };
  // A kind in the breakdown shows only that kind in the activity (scrolled to on a phone).
  const pickKind = (c: string) => {
    setOnly(only === c ? null : c);
    setView("out");
    setShowAll(false);
    const el = activityRef.current;
    if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const partMax = Math.max(1, ...(view === "in" ? inParts.map((p) => p.amount) : summary.parts.map((p) => p.amount)));

  const kindProps = {
    money,
    today,
    onAdd: addEntry,
    editing,
    setEditing,
    onSaveEdit: saveEdit,
    onRemove: removeEntry,
  };

  // Account balance / Cash on hand: the figure (tap to change it), or the box to change it in.
  const walletTile = (cash: boolean) => {
    const value = cash ? cashNow : bal;
    const label = cash ? "Cash on hand" : "Account balance";
    if (balanceEdit?.cash === cash)
      return (
        <form className={`money-tile is-editing ${cash ? "is-cash" : ""}`} onSubmit={saveBalance}>
          <span className="money-label">{label}</span>
          <label className="money-amount">
            <span aria-hidden>$</span>
            <input
              ref={balanceRef}
              className="dash-input"
              inputMode="decimal"
              value={balanceEdit.value}
              onChange={(e) => setBalanceEdit({ cash, value: e.target.value })}
              onKeyDown={(e) => e.key === "Escape" && setBalanceEdit(null)}
              aria-label={cash ? "The cash you have" : "Your balance at the bank"}
            />
          </label>
          <p className="money-hint">{cash ? "Count what's in your wallet - it carries on from there." : "Type what your bank says - it carries on from there."}</p>
          <div className="money-form-actions">
            <button type="submit" className="money-btn is-primary">
              Save
            </button>
            <button type="button" className="money-btn" onClick={() => setBalanceEdit(null)}>
              Cancel
            </button>
          </div>
        </form>
      );
    return (
      <button type="button" className={`money-tile ${cash ? "is-cash" : ""}`} onClick={() => startBalanceEdit(cash)} title="Tap to change it">
        <span className="money-label">{label}</span>
        <span className="money-tile-edit" aria-hidden>
          ✎
        </span>
        <Figure n={value} className={`money-tile-amount ${value < 0 ? "is-low" : ""}`} />
        <span className="money-tile-foot">
          {!cash && coming.length > 0 ? (
            <>
              <strong>{dollars(bal - comingTotal)}</strong> after the {dollars(comingTotal)} still to come off this month
            </>
          ) : cash ? (
            "In your wallet - tap to count it"
          ) : (
            "At the bank - tap to match it"
          )}
        </span>
      </button>
    );
  };

  const formBox = form && (
    <form className="money-form" onSubmit={save}>
      {form.mode === "add" && (
        <div className="money-seg money-when" role="group" aria-label="Has it come in yet?">
          <button
            type="button"
            className={form.expected ? "" : "is-on"}
            aria-pressed={!form.expected}
            onClick={() => {
              setForm({ ...form, expected: false });
              if (date > today) setDate(day);
            }}
          >
            Came in
          </button>
          <button type="button" className={form.expected ? "is-on" : ""} aria-pressed={!!form.expected} onClick={() => setForm({ ...form, expected: true })}>
            Expected
          </button>
        </div>
      )}
      {(form.mode !== "add" || date !== today) && (
        <div className="money-form-top">
          {form.mode !== "add" && (
            <span className="money-form-what">
              {form.mode === "spend" && <i style={{ background: colourFor(money, form.category) }} aria-hidden />}
              {form.mode === "spend" ? form.category : "Cash out - from your account into cash"}
              <button type="button" className="money-link" onClick={() => setForm(null)}>
                Change
              </button>
            </span>
          )}
          {date !== today && (
            <em className="money-form-day">
              {form.mode === "add" && form.expected ? "expected" : "for"} {fullDay(date)}
            </em>
          )}
        </div>
      )}
      <div className="money-amount-row">
        <label className="money-amount is-big">
          <span aria-hidden>$</span>
          <input
            ref={amountRef}
            className="dash-input"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && closeSheet()}
            aria-label="Amount in dollars"
          />
        </label>
        {form.mode === "spend" && usualAmounts(money, form.category).length > 0 && (
          <div className="money-quicks" role="group" aria-label="Usual prices - one tap takes it off">
            {usualAmounts(money, form.category).map((a) => (
              <button key={a} type="button" className="money-quick" onClick={() => save(undefined, a)} title={`Take off ${dollars(a)}`}>
                {shortDollars(a)}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="money-form-fields">
        {form.mode !== "move" && (
          <WalletToggle cash={form.cash} onChange={(cash) => setForm({ ...form, cash })} label={form.mode === "add" ? "Into" : "Paid with"} />
        )}
        {form.mode === "spend" && form.category === FUEL && (
          <label className="money-field">
            <span className="money-field-label">Mileage (km on the clock)</span>
            <input
              className="dash-input"
              inputMode="numeric"
              placeholder={fuelLast != null ? `Last ${fuelLast}` : "Mileage"}
              value={km}
              onChange={(e) => setKm(e.target.value)}
            />
          </label>
        )}
        <label className="money-field">
          <span className="money-field-label">{form.mode === "add" && form.expected ? "When do you expect it?" : "Date"}</span>
          <input
            type="date"
            className="dash-input"
            value={date}
            max={form.mode === "add" ? undefined : today}
            onChange={(e) => {
              const d = e.target.value || today;
              setDate(d);
              // Income on a later date hasn't come in yet - it's expected.
              if (form.mode === "add" && d > today && !form.expected) setForm({ ...form, expected: true });
            }}
          />
        </label>
        <label className="money-field is-wide">
          <span className="money-field-label">{form.mode === "add" ? "Where from?" : form.mode === "move" ? "Where?" : "Where / what?"}</span>
          <input className="dash-input" list="money-notes" placeholder="Optional" value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        <datalist id="money-notes">
          {(form.mode === "add" ? [...notesFor(money, "Money in"), ...MONEY_IN] : notesFor(money, form.mode === "move" ? CASH_OUT : form.category)).map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
      </div>
      {form.mode === "add" && form.expected && (
        <p className="money-hint">Kept to one side - your balance doesn&apos;t change until you tap “It&apos;s in” when it arrives.</p>
      )}
      <div className="money-form-actions">
        <button type="submit" className="money-btn is-primary">
          {form.mode === "spend" ? "Take it off" : form.mode === "move" ? "Move it" : form.expected ? "Add to expected" : "Add it"}
        </button>
        <button type="button" className="money-btn" onClick={closeSheet}>
          Cancel
        </button>
      </div>
    </form>
  );

  const toastBox = toast && (
    <div className="money-toast" role="status">
      <span>✓ {toast.text}</span>
      {toast.undo && (
        <button
          type="button"
          className="money-toast-undo"
          onClick={() => {
            toast.undo?.();
            setToast(null);
          }}
        >
          Undo
        </button>
      )}
    </div>
  );

  const tools: { id: Tool; label: string; sub: string }[] = [
    { id: "recurring", label: "Recurring", sub: `${dollars(monthlySubs)} a month` },
    { id: "fuel", label: "Fuel", sub: `${dollars(fuelNow.month)}${fuelNow.km ? ` · ${kmText(fuelNow.km)}` : ""}` },
    { id: "gym", label: "Gym fees", sub: `${dollars(gymNow.month)} in ${monthName(monthOf(today)).split(" ")[0].slice(0, 3)}` },
  ];

  // Day by day: the calendar, and the open day.
  const calendarCard = (
    <section className="money-card money-calendar" aria-labelledby="money-calendar-title">
      <header className="money-card-head">
        <div>
          <h2 id="money-calendar-title" className="money-card-title">
            Day by day
          </h2>
          <p className="money-card-sub">Each day keeps its own entries and balance</p>
        </div>
        <div className="money-seg" role="group" aria-label="Calendar">
          {(
            [
              ["month", "Month"],
              ["year", "Year"],
            ] as const
          ).map(([v, label]) => (
            <button key={v} type="button" className={calView === v ? "is-on" : ""} aria-pressed={calView === v} onClick={() => setCalView(v)}>
              {label}
            </button>
          ))}
        </div>
      </header>
      <div className={`money-days ${calView === "year" ? "is-year" : ""}`}>
        <div className="money-cal">
          {calView === "year" ? (
            <div className="money-year">
              <div className="money-cal-head">
                <button type="button" onClick={() => goYear(-1)} aria-label="Year before">
                  ‹
                </button>
                <span>
                  {calYear} · spent {dollars(yearTotal.spent)}
                  {yearTotal.in > 0 && <span className="money-year-in"> · in {dollars(yearTotal.in)}</span>}
                </span>
                <button type="button" onClick={() => goYear(1)} disabled={calYear >= today.slice(0, 4)} aria-label="Year after">
                  ›
                </button>
              </div>
              <div className="money-year-grid">
                {yearMonths.map((ym, k) => {
                  const m = yearSums[k];
                  const spent = [...m.values()].reduce((t, v) => t + v.spent, 0);
                  const lead = (new Date(`${ym}-01T12:00:00`).getDay() + 6) % 7;
                  const later = ym > monthOf(today);
                  return (
                    <div key={ym} className={`money-year-month ${later ? "is-later" : ""}`}>
                      <button
                        type="button"
                        className="money-year-name"
                        onClick={() => {
                          setCalMonth(ym);
                          setCalView("month");
                        }}
                        disabled={later}
                        title={`Open ${monthName(ym)}`}
                      >
                        <span>{monthName(ym).split(" ")[0].slice(0, 3)}</span>
                        {spent > 0 && <span className="money-year-spent">${Math.round(spent)}</span>}
                      </button>
                      <div className="money-year-days">
                        {Array.from({ length: lead }, (_, x) => (
                          <span key={`x${x}`} />
                        ))}
                        {Array.from({ length: daysIn(ym) }, (_, x) => {
                          const d = `${ym}-${String(x + 1).padStart(2, "0")}`;
                          const t = m.get(d);
                          const heat = t && t.spent > 0 ? 0.18 + 0.72 * Math.min(1, t.spent / yearMax) : 0;
                          return (
                            <button
                              key={d}
                              type="button"
                              className={`money-year-day ${d === day ? "is-on" : ""} ${d === today ? "is-today" : ""}`}
                              style={heat ? { background: `rgb(var(--gold-rgb) / ${heat.toFixed(2)})` } : undefined}
                              onClick={() => pickDay(d)}
                              disabled={d > today}
                              title={`${fullDay(d)}${t ? ` · spent ${dollars(t.spent)}${t.in ? ` · in ${dollars(t.in)}` : ""}` : ""}`}
                              aria-label={`${fullDay(d)}${t ? `: spent ${dollars(t.spent)}` : ""}`}
                            >
                              {t && t.in > 0 && <i aria-hidden />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="money-hint">Darker = more spent that day · green dot = money in. Tap a day to open it, or a month to see it bigger.</p>
            </div>
          ) : (
            <>
              <div className="money-cal-head">
                <button type="button" onClick={() => setCalMonth(shiftMonth(calMonth, -1))} aria-label="Month before">
                  ‹
                </button>
                <span>{monthName(calMonth)}</span>
                <button type="button" onClick={() => setCalMonth(shiftMonth(calMonth, 1))} disabled={calMonth >= monthOf(today)} aria-label="Month after">
                  ›
                </button>
              </div>
              <div className="money-cal-grid">
                {CAL_HEAD.map((h, k) => (
                  <span key={k} className="money-cal-dow">
                    {h}
                  </span>
                ))}
                {Array.from({ length: calLead }, (_, k) => (
                  <span key={`x${k}`} />
                ))}
                {calDays.map((d) => {
                  const t = sums.get(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      className={`money-cal-day ${d === day ? "is-on" : ""} ${d === today ? "is-today" : ""}`}
                      onClick={() => pickDay(d)}
                      disabled={d > today}
                      aria-label={`${fullDay(d)}${t ? `: spent ${dollars(t.spent)}${t.in ? `, in ${dollars(t.in)}` : ""}` : ""}`}
                      aria-pressed={d === day}
                    >
                      <span className="money-cal-num">{Number(d.slice(8))}</span>
                      {t && t.spent > 0 && <span className="money-cal-spent">${Math.round(t.spent)}</span>}
                      {t && t.in > 0 && <i className="money-cal-in" aria-hidden />}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="money-daycard">
          <div className="money-daycard-head">
            <div>
              <span className="money-label">{day === today ? "Today" : dayHeading(day, today) === "Yesterday" ? "Yesterday" : "The day"}</span>
              <h3>{fullDay(day)}</h3>
            </div>
            <div className="money-nav">
              <button type="button" onClick={() => pickDay(shiftDay(day, -1))} aria-label="Day before">
                ‹
              </button>
              <button type="button" onClick={() => pickDay(shiftDay(day, 1))} disabled={day >= today} aria-label="Day after">
                ›
              </button>
            </div>
          </div>
          <div className="money-daycard-bal">
            <div>
              <span>Started the day</span>
              <strong>{dollars(dayBal.open.acct)}</strong>
            </div>
            <div>
              <span>{day === today ? "Now" : "Ended the day"}</span>
              <strong>{dollars(dayBal.close.acct)}</strong>
            </div>
            {showCash && (
              <div>
                <span>Cash</span>
                <strong>
                  {dollars(dayBal.open.cash)} → {dollars(dayBal.close.cash)}
                </strong>
              </div>
            )}
          </div>
          <div className="money-daycard-sums">
            <span>
              Spent <strong>{dollars(daySum.spent)}</strong>
            </span>
            <span>
              In <strong className="is-in">{dollars(daySum.in)}</strong>
            </span>
          </div>
          {dayEntries.length ? (
            <div className="money-daycard-list">{dayEntries.map((e) => entryRow(e, "day"))}</div>
          ) : (
            <p className="money-empty">{day === today ? "Nothing logged today yet - tap Add expense or Add income at the top." : "Nothing was logged on this day."}</p>
          )}
          {day !== today ? (
            <p className="money-hint">
              Anything you add at the top now goes on this day.{" "}
              <button type="button" className="money-link" onClick={() => pickDay(today)}>
                Back to today
              </button>
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );

  // Recurring payments, Fuel and Gym fees - one card, three tabs.
  const toolsCard = (
    <section className="money-card money-tools" aria-label="Recurring payments, fuel and gym fees">
      <div className="money-tabs" role="tablist" aria-label="Recurring payments, fuel and gym fees">
        {tools.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`money-tab-${t.id}`}
            aria-selected={tool === t.id}
            aria-controls="money-tool-panel"
            className={`money-tab ${tool === t.id ? "is-on" : ""}`}
            onClick={() => setTool(t.id)}
          >
            <span>{t.label}</span>
            <em>{t.sub}</em>
          </button>
        ))}
      </div>
      <div className="money-tool" role="tabpanel" id="money-tool-panel" aria-labelledby={`money-tab-${tool}`}>
        {tool === "recurring" ? (
          <>
            {coming.length > 0 && (
              <div className="money-coming">
                <div className="money-subhead">
                  <span>Still to come this month</span>
                  <strong>{dollars(comingTotal)}</strong>
                </div>
                <div className="money-subs">
                  {coming.map((c) => (
                    <div key={c.sub.id} className="money-sub is-coming">
                      <span className="money-sub-date">{shortDate(c.date)}</span>
                      <span className="money-sub-what">
                        <strong>{c.sub.name}</strong>
                      </span>
                      <span className="money-sub-amount">{dollars(c.sub.amount)}</span>
                    </div>
                  ))}
                </div>
                <p className="money-hint">
                  After these you&apos;ll have <strong>{dollars(bal - comingTotal)}</strong>.
                </p>
              </div>
            )}

            <div className="money-subhead">
              <span>Comes off by itself</span>
              <strong>{dollars(monthlySubs)} a month</strong>
            </div>
            <p className="money-hint">Taken off on its day each month - no need to add these.</p>
            <div className="money-subs">
              {money.subs.filter((s) => !s.removedAt).map((s) =>
                subForm?.id === s.id ? null : (
                  <div key={s.id} className={`money-sub ${s.active ? "" : "is-paused"} ${subOpen === s.id ? "is-open" : ""}`}>
                    <button type="button" className="money-sub-row" onClick={() => setSubOpen(subOpen === s.id ? null : s.id)} aria-expanded={subOpen === s.id}>
                      <span className="money-sub-what">
                        <strong>{s.name}</strong>
                        <em>
                          On the {ordinal(s.day)}
                          {s.active ? ` · next ${shortDate(nextDue(s, today))}` : " · paused"}
                        </em>
                      </span>
                      <span className="money-sub-amount">{dollars(s.amount)}</span>
                    </button>
                    {subOpen === s.id && (
                    <span className="money-sub-tools">
                      <button
                        type="button"
                        className="money-link"
                        onClick={() => setSubForm({ id: s.id, name: s.name, amount: String(s.amount), day: String(s.day), category: s.category })}
                      >
                        Change
                      </button>
                      <button type="button" className="money-link" onClick={() => toggleSub(s.id)}>
                        {s.active ? "Pause" : "Start again"}
                      </button>
                      <button type="button" className="money-link is-danger" onClick={() => removeSub(s.id)}>
                        Remove
                      </button>
                    </span>
                    )}
                  </div>
                ),
              )}
            </div>
            {subForm ? (
              <form className="money-form money-sub-form" onSubmit={saveSub}>
                <div className="money-form-top">
                  <span className="money-form-what">{subForm.id ? `Change ${subForm.name || "this debit"}` : "A new regular debit"}</span>
                </div>
                <div className="money-form-fields">
                  <label className="money-field is-wide">
                    <span className="money-field-label">Name</span>
                    <input className="dash-input" placeholder="e.g. Netflix" value={subForm.name} onChange={(e) => setSubForm({ ...subForm, name: e.target.value })} />
                  </label>
                  <label className="money-field">
                    <span className="money-field-label">Amount ($)</span>
                    <input className="dash-input" inputMode="decimal" placeholder="0.00" value={subForm.amount} onChange={(e) => setSubForm({ ...subForm, amount: e.target.value })} />
                  </label>
                  <label className="money-field">
                    <span className="money-field-label">On the (day of the month)</span>
                    <input
                      className="dash-input"
                      inputMode="numeric"
                      placeholder="12"
                      value={subForm.day}
                      onChange={(e) => setSubForm({ ...subForm, day: e.target.value.replace(/\D/g, "").slice(0, 2) })}
                    />
                  </label>
                  <label className="money-field">
                    <span className="money-field-label">Kind</span>
                    <select className="dash-input" value={subForm.category} onChange={(e) => setSubForm({ ...subForm, category: e.target.value })}>
                      {cats.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="money-form-actions">
                  <button type="submit" className="money-btn is-primary">
                    {subForm.id ? "Save" : "Add it"}
                  </button>
                  <button type="button" className="money-btn" onClick={() => setSubForm(null)}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button type="button" className="money-add-line" onClick={() => setSubForm({ name: "", amount: "", day: "", category: "Subscriptions" })}>
                <span aria-hidden>+</span> Add a regular debit
              </button>
            )}
          </>
        ) : (
          <KindTab key={tool} kind={tool} colour={colourFor(money, tool === "fuel" ? FUEL : GYM)} {...kindProps} />
        )}
      </div>
    </section>
  );

  return (
    <div className="money">
      <header className="money-pagehead">
        <div>
          <div className="eyebrow eyebrow-amber">Private to you</div>
          <h1 className="dash-title money-title">Money</h1>
          <p className="money-tagline">Your finances, beautifully organized.</p>
        </div>
        <button type="button" className="money-btn money-export" onClick={downloadCsv} title="Every entry, as a spreadsheet">
          <span aria-hidden>↓</span> Export CSV
        </button>
      </header>

      {/* ── 1. Your money ─────────────────────────────────────── */}
      <section className="money-hero" aria-label="Your money">
        <div className="money-hero-top">
          <div className="money-total">
            <span className="money-label">Total balance</span>
            <Figure n={bal + cashNow} className={`money-total-amount ${bal + cashNow < 0 ? "is-low" : ""}`} />
            <span className="money-total-sub">Account and cash on hand together</span>
            {expected.length > 0 && (
              <button
                type="button"
                className={`money-projected ${sheet === "expected" ? "is-on" : ""}`}
                onClick={() => openSheet("expected")}
                aria-expanded={sheet === "expected"}
                title="Not in your balance - tap to see what's expected"
              >
                <span className="money-projected-label">Projected</span>
                <strong>{dollars(bal + cashNow + expectedTotal)}</strong>
                <span className="money-projected-sub">with {dollars(expectedTotal)} expected</span>
                <span className="money-projected-more" aria-hidden>
                  ›
                </span>
              </button>
            )}
          </div>
          <dl className="money-stats">
            <div>
              <dt>Spent today</dt>
              <dd>{dollars(spentOn(money, today))}</dd>
            </div>
            <div>
              <dt>This month</dt>
              <dd>{dollars(thisMonth.total)}</dd>
            </div>
            <div>
              <dt>Daily average</dt>
              <dd>{dollars(thisMonth.perDay)}</dd>
            </div>
          </dl>
        </div>

        <div className="money-tiles">
          {walletTile(false)}
          {walletTile(true)}
        </div>

        {day !== today && (
          <div className="money-dayflag">
            <span>
              Adding to <strong>{fullDay(day)}</strong>
            </span>
            <button type="button" className="money-link" onClick={() => pickDay(today)}>
              Back to today
            </button>
          </div>
        )}

        <div className="money-actions">
          <button type="button" className={`money-action is-income ${sheet === "income" ? "is-on" : ""}`} onClick={() => openSheet("income")} aria-expanded={sheet === "income"}>
            <span className="money-action-sign" aria-hidden>
              +
            </span>
            Add income
          </button>
          <button type="button" className={`money-action is-expense ${sheet === "expense" ? "is-on" : ""}`} onClick={() => openSheet("expense")} aria-expanded={sheet === "expense"}>
            <span className="money-action-sign" aria-hidden>
              −
            </span>
            Add expense
          </button>
        </div>

        {sheet && (
          <div className="money-sheet" ref={sheetRef}>
            <div className="money-sheet-head">
              <h2>{sheet === "income" ? "Add income" : sheet === "expense" ? "Add expense" : "Expected income"}</h2>
              <button type="button" className="money-sheet-close" onClick={closeSheet} aria-label="Close">
                ✕
              </button>
            </div>
            {sheet === "expected" && (
              <>
                <p className="money-sheet-ask">Not in your balance yet. Tap “It&apos;s in” when it arrives and it&apos;s added then.</p>
                <div className="money-exp-list">
                  {expected.map((x) =>
                    expEdit?.id === x.id ? (
                      <form key={x.id} className="money-edit" onSubmit={saveExpectedEdit}>
                        <div className="money-form-top">
                          <span className="money-form-what">Expected</span>
                        </div>
                        <label className="money-amount">
                          <span aria-hidden>$</span>
                          <input
                            className="dash-input"
                            inputMode="decimal"
                            autoFocus
                            value={expEdit.amount}
                            onChange={(e) => setExpEdit({ ...expEdit, amount: e.target.value })}
                            onKeyDown={(e) => e.key === "Escape" && setExpEdit(null)}
                            aria-label="Amount"
                          />
                        </label>
                        <div className="money-form-fields">
                          <WalletToggle cash={expEdit.cash} onChange={(cash) => setExpEdit({ ...expEdit, cash })} label="Into" />
                          <label className="money-field">
                            <span className="money-field-label">When do you expect it?</span>
                            <input type="date" className="dash-input" value={expEdit.date} onChange={(e) => setExpEdit({ ...expEdit, date: e.target.value })} />
                          </label>
                          <label className="money-field is-wide">
                            <span className="money-field-label">Where from?</span>
                            <input className="dash-input" placeholder="Optional" value={expEdit.note} onChange={(e) => setExpEdit({ ...expEdit, note: e.target.value })} />
                          </label>
                        </div>
                        <div className="money-form-actions">
                          <button type="submit" className="money-btn is-primary">
                            Save
                          </button>
                          <button type="button" className="money-btn" onClick={() => setExpEdit(null)}>
                            Cancel
                          </button>
                          <button type="button" className="money-link is-danger money-edit-remove" onClick={() => removeExpected(x.id)}>
                            Remove
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div key={x.id} className="money-tx-line money-exp-line">
                        <button
                          type="button"
                          className="money-tx is-compact is-expected"
                          onClick={() => setExpEdit({ id: x.id, amount: String(x.amount), note: x.note ?? "", date: x.date, cash: x.cash === true })}
                        >
                          <span className="money-tx-date">{shortDate(x.date)}</span>
                          <span className="money-tx-main">
                            <span className="money-tx-name">{x.note || "Money in"}</span>
                            <span className={`money-tx-meta ${x.date < today ? "is-late" : ""}`}>
                              {x.cash ? "Cash" : "Account"} · {whenText(x.date)}
                            </span>
                          </span>
                          <span className="money-tx-amount">+{dollars(x.amount)}</span>
                        </button>
                        <button type="button" className="money-btn money-exp-in" onClick={() => receiveExpected(x.id)}>
                          It&apos;s in
                        </button>
                      </div>
                    ),
                  )}
                </div>
                <button
                  type="button"
                  className="money-add-line"
                  onClick={() => {
                    setExpEdit(null);
                    setSheet("income");
                    openForm({ mode: "add", cash: false, expected: true });
                  }}
                >
                  <span aria-hidden>+</span> Add expected income
                </button>
              </>
            )}
            {sheet === "expense" && !form && (
              <>
                <p className="money-sheet-ask">What was it for?</p>
                <div className="money-kinds" role="group" aria-label="What did you spend on?">
                  {cats.map((c) => (
                    <button key={c} type="button" className="money-kind" onClick={() => openForm(c === CASH_OUT ? { mode: "move" } : { mode: "spend", category: c, cash: false })}>
                      <i style={{ background: colourFor(money, c) }} aria-hidden />
                      <span>
                        {c}
                        {c === CASH_OUT && <em>account → cash</em>}
                      </span>
                    </button>
                  ))}
                  {newCat == null ? (
                    <button type="button" className="money-kind is-new" onClick={() => setNewCat("")}>
                      <span>+ New kind</span>
                    </button>
                  ) : (
                    <form className="money-newcat" onSubmit={addCategory}>
                      <input className="dash-input" autoFocus placeholder="e.g. Church giving" value={newCat} onChange={(e) => setNewCat(e.target.value)} aria-label="The new kind of spending" />
                      <button type="submit" className="money-btn is-primary">
                        Add
                      </button>
                      <button type="button" className="money-btn" onClick={() => setNewCat(null)}>
                        Cancel
                      </button>
                    </form>
                  )}
                </div>
              </>
            )}
            {formBox}
          </div>
        )}

        {buys.length > 0 && (
          <div className="money-usual" role="group" aria-label="Log it again">
            <span className="money-label">Usual buys - one tap logs it</span>
            <div className="money-usual-row">
              {buys.map((b) => (
                <button
                  key={`${b.category}|${b.amount}|${b.note ?? ""}|${b.cash ? "cash" : ""}`}
                  type="button"
                  className="money-usual-btn"
                  onClick={() => addEntry({ kind: "spend", amount: b.amount, category: b.category, note: b.note, date: day, ...(b.cash ? { cash: true } : {}) })}
                >
                  <i style={{ background: colourFor(money, b.category) }} aria-hidden />
                  <span>{b.note || b.category}</span>
                  <strong>{shortDollars(b.amount)}</strong>
                  {b.cash && <em>cash</em>}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
      {toastBox}

      {/* ── 2 & 3. The month: activity, and where it went ─────── */}
      {/* Two columns on a wide screen (activity + calendar | where it went + the tools);
          one on a phone, in order of importance. */}
      <div className="money-monthbar">
        <div className="money-monthbar-title">
          <span className="money-label">The month</span>
          <div className="money-monthbar-name">
            <h2>{monthName(month)}</h2>
            <div className="money-nav">
              <button type="button" onClick={() => pickMonth(shiftMonth(month, -1))} aria-label="Month before">
                ‹
              </button>
              <button type="button" onClick={() => pickMonth(shiftMonth(month, 1))} disabled={month >= monthOf(today)} aria-label="Month after">
                ›
              </button>
            </div>
          </div>
        </div>
        <div className="money-figures">
          <button
            type="button"
            className={`money-figure ${view === "in" ? "is-on" : ""}`}
            onClick={() => (setView(view === "in" ? "all" : "in"), setOnly(null))}
            aria-pressed={view === "in"}
          >
            <span>Money in</span>
            <strong className="is-in">{dollars(summary.in)}</strong>
            {expectedInMonth > 0 && <em className="is-expected">+{dollars(expectedInMonth)} expected</em>}
          </button>
          <button
            type="button"
            className={`money-figure ${view === "out" ? "is-on" : ""}`}
            onClick={() => (setView(view === "out" ? "all" : "out"), setOnly(null))}
            aria-pressed={view === "out"}
          >
            <span>Spent</span>
            <strong>{dollars(summary.total)}</strong>
            {summary.change != null && (
              <em className={summary.change > 0 ? "is-up" : "is-down"}>
                {summary.change > 0 ? "▲" : "▼"} {Math.abs(Math.round(summary.change))}% {summary.soFar ? "on this time in" : "on"} {monthName(shiftMonth(month, -1)).split(" ")[0]}
              </em>
            )}
          </button>
          <div className="money-figure is-static">
            <span>{left < 0 ? "Short" : "Surplus"}</span>
            <strong className={left < 0 ? "is-low" : ""}>
              {left < 0 ? "-" : ""}
              {dollars(Math.abs(left))}
            </strong>
          </div>
          <div className="money-figure is-static">
            <span>Spent a day</span>
            <strong>{dollars(summary.perDay)}</strong>
          </div>
        </div>
      </div>

      <div className="money-grid">
        <div className="money-col">
          <section className="money-card money-activity" ref={activityRef} aria-labelledby="money-activity-title">
            <header className="money-card-head">
              <div>
                <h2 id="money-activity-title" className="money-card-title">
                  Recent activity
                </h2>
                <p className="money-card-sub">{only ? `${only} only` : view === "in" ? "Money in" : view === "out" ? "Spending" : "Tap one to change it"}</p>
              </div>
              <div className="money-seg" role="group" aria-label="Show">
                {(
                  [
                    ["all", "All"],
                    ["in", "Money in"],
                    ["out", "Spent"],
                  ] as const
                ).map(([v, label]) => (
                  <button key={v} type="button" className={view === v && (v !== "all" || !only) ? "is-on" : ""} aria-pressed={view === v} onClick={() => (setView(v), setOnly(null))}>
                    {label}
                  </button>
                ))}
              </div>
            </header>
            {only && (
              <div className="money-only">
                <i style={{ background: colourFor(money, only) }} aria-hidden />
                <span>
                  Only <strong>{only}</strong>
                </span>
                <button type="button" className="money-link" onClick={() => (setOnly(null), setView("all"))}>
                  Show everything
                </button>
              </div>
            )}
            {days.length === 0 ? (
              <p className="money-empty">
                {view === "in" ? "No money in this month yet - tap Add income at the top." : `Nothing logged in ${monthName(month).split(" ")[0]} yet.`}
              </p>
            ) : (
              <div className="money-list">
                {shownDays.map((g) => (
                  <div key={g.date} className="money-day-group">
                    <div className="money-day-head">
                      <span>{dayHeading(g.date, today)}</span>
                      <span className="money-day-sums">
                        {g.in > 0 && <span className="is-in">+{dollars(g.in)}</span>}
                        {g.spent > 0 && <span>−{dollars(g.spent)}</span>}
                      </span>
                    </div>
                    {g.items.map((e) => entryRow(e, "list"))}
                  </div>
                ))}
                {rowCount > RECENT && (
                  <button type="button" className="money-link money-more" onClick={() => setShowAll(!showAll)}>
                    {showAll ? "Show fewer" : `Show all ${rowCount} in ${monthName(month).split(" ")[0]}`}
                  </button>
                )}
              </div>
            )}
          </section>
          {calendarCard}
        </div>

        <div className="money-col">
          <section className="money-card money-breakdown" aria-labelledby="money-breakdown-title">
            <header className="money-card-head">
              <div>
                <h2 id="money-breakdown-title" className="money-card-title">
                  {view === "in" ? "Where it came from" : "Where it went"}
                </h2>
                <p className="money-card-sub">
                  {monthName(month)} · {view === "in" ? `In ${dollars(summary.in)}` : `Spent ${dollars(summary.total)}`} · {left < 0 ? "Short" : "Surplus"} {dollars(Math.abs(left))}
                </p>
              </div>
            </header>
            {view === "in" ? (
              inParts.length === 0 ? (
                <p className="money-empty">No money in this month yet.</p>
              ) : (
                <ul className="money-bars">
                  {inParts.map((p) => (
                    <li key={p.from}>
                      <div className="money-bar is-static">
                        <span className="money-bar-name">
                          <i style={{ background: "rgb(var(--ok-rgb))" }} aria-hidden />
                          {p.from}
                        </span>
                        <span className="money-bar-amount">
                          {dollars(p.amount)}
                          <em>{summary.in ? Math.round((p.amount / summary.in) * 100) : 0}%</em>
                        </span>
                        <span className="money-bar-track" aria-hidden>
                          <span style={{ width: `${(p.amount / partMax) * 100}%`, background: "rgb(var(--ok-rgb))" }} />
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )
            ) : summary.parts.length === 0 ? (
              <p className="money-empty">Nothing spent this month yet.</p>
            ) : (
              <>
                <div className="money-split" role="img" aria-label={summary.parts.map((p) => `${p.category} ${Math.round(p.pct)}%`).join(", ")}>
                  {summary.parts.map((p) => (
                    <span key={p.category} style={{ flexGrow: p.amount, background: colourFor(money, p.category) }} title={`${p.category} · ${dollars(p.amount)} · ${Math.round(p.pct)}%`} />
                  ))}
                </div>
                <ul className="money-bars">
                  {summary.parts.map((p) => (
                    <li key={p.category}>
                      <button type="button" className={`money-bar ${only === p.category ? "is-on" : ""}`} onClick={() => pickKind(p.category)} aria-pressed={only === p.category}>
                        <span className="money-bar-name">
                          <i style={{ background: colourFor(money, p.category) }} aria-hidden />
                          {p.category}
                        </span>
                        <span className="money-bar-amount">
                          {dollars(p.amount)}
                          <em>{Math.round(p.pct)}%</em>
                        </span>
                        <span className="money-bar-track" aria-hidden>
                          <span style={{ width: `${(p.amount / partMax) * 100}%`, background: colourFor(money, p.category) }} />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="money-hint">Tap a kind to see only those in Recent activity.</p>
              </>
            )}
          </section>
          {toolsCard}
        </div>
      </div>
    </div>
  );
}
