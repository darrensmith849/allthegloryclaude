"use client";

// Money - Daniel's own spending tracker (not for the team, never members).
// The balance up top and the cash in hand beside it (tap either to change
// it); spending paid from either; one tap on what he usually buys,
// or a kind of spending then the price; every entry editable. Each month
// broken down by kind, with how it compares to last month; Fuel (with the
// car's mileage) and Gym fees each in a tab of their own; the regular
// debits that come off by themselves, and what's still to come. Saved with
// the rest of the dashboard.

import { useEffect, useMemo, useRef, useState } from "react";
import { FoldPanel } from "@/components/dashboard/fold-panel";
import { DeleteButton, EntryEdit, editingFor, KindPanel, WalletToggle, type Editing } from "@/components/dashboard/money-panels";
import { useDashboard } from "@/lib/dashboard/storage";
import type { MoneyEntry } from "@/lib/dashboard/types";
import {
  allCategories,
  balance,
  CASH_OUT,
  cashBalance,
  colourFor,
  dollars,
  dueDate,
  dueDebits,
  FUEL,
  GYM,
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
const ordinal = (n: number) => `${n}${n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th"}`;

type Form = { mode: "spend"; category: string; cash: boolean } | { mode: "add"; cash: boolean } | { mode: "move" } | null;

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
  const [form, setForm] = useState<Form>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [km, setKm] = useState("");
  const [date, setDate] = useState(today);
  const amountRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<{ text: string; undo?: () => void } | null>(null);
  const toastTimer = useRef<number | null>(null);
  const [month, setMonth] = useState(monthOf(today));
  const [only, setOnly] = useState<string | null>(null); // the month's list, one kind only
  const [view, setView] = useState<"all" | "in" | "out">("all"); // the month: everything, money in, or spending

  function say(text: string, undo?: () => void) {
    setToast({ text, undo });
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 8000);
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
    setDate(today);
    window.setTimeout(() => amountRef.current?.focus(), 30);
  }

  function addEntry(e: Omit<MoneyEntry, "id" | "at">) {
    const entry: MoneyEntry = { ...e, id: uid(), at: new Date().toISOString() };
    update((d) => void d.money?.entries.push(entry));
    setMonth(monthOf(entry.date));
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
    setForm(null);
  }

  // ── The balance, changed in place ───────────────────────────────
  const [balanceEdit, setBalanceEdit] = useState<{ cash: boolean; value: string } | null>(null);
  const balanceRef = useRef<HTMLInputElement>(null);
  function startBalanceEdit(cash = false) {
    if (!money) return;
    setForm(null);
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
  const kindProps = {
    money,
    today,
    onAdd: addEntry,
    editing,
    setEditing,
    onSaveEdit: saveEdit,
    onRemove: removeEntry,
  };

  // "In your account" / "Cash": the figure (tap to change it), or the box to change it in.
  const balanceBlock = (cash: boolean) => {
    const value = cash ? cashNow : bal;
    return (
      <div className={`money-balance ${cash ? "is-cash" : ""}`}>
        <span className="eyebrow">{cash ? "Cash" : "In your account"}</span>
        {balanceEdit?.cash !== cash ? (
          <button
            type="button"
            className={`money-balance-amount ${value < 0 ? "is-low" : ""}`}
            onClick={() => startBalanceEdit(cash)}
            title="Tap to change it"
          >
            {dollars(value)}
            <span className="money-balance-edit" aria-hidden>
              ✎
            </span>
          </button>
        ) : (
          <form className="money-balance-form" onSubmit={saveBalance}>
            <label className={`money-amount ${cash ? "" : "is-big"}`}>
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
            <button type="submit" className="dash-btn dash-btn-primary">
              Save
            </button>
            <button type="button" className="dash-word-link" onClick={() => setBalanceEdit(null)}>
              Cancel
            </button>
            <p className="dash-word-hint money-form-hint">
              {cash ? "Count what's in your wallet - it carries on from there." : "Type what your bank says - it carries on from there."}
            </p>
          </form>
        )}
        {balanceEdit?.cash !== cash && (
          <div className="money-balance-actions">
            <button
              type="button"
              className={`dash-btn dash-note-nav ${form?.mode === "add" && form.cash === cash ? "dash-btn-primary" : "dash-btn-ghost"}`}
              onClick={() => openForm({ mode: "add", cash })}
            >
              {cash ? "+ Add cash" : "+ Add money"}
            </button>
            <button type="button" className="dash-btn dash-btn-ghost dash-note-nav" onClick={() => startBalanceEdit(cash)}>
              {cash ? "Set cash" : "Set balance"}
            </button>
          </div>
        )}
        {!cash && coming.length > 0 && balanceEdit?.cash !== false && (
          <span className="money-balance-sub">
            {dollars(bal - comingTotal)} after the {dollars(comingTotal)} still to come off this month
          </span>
        )}
      </div>
    );
  };

  const formBox = form && (
      <form className="money-form" onSubmit={save}>
        <span className="money-form-what">
          {form.mode === "spend" && <i style={{ background: colourFor(money, form.category) }} aria-hidden />}
          {form.mode === "spend"
            ? form.category
            : form.mode === "move"
              ? "Cash out - from your account into cash"
              : form.cash
                ? "Cash in"
                : "Money in"}
        </span>
        <label className="money-amount">
          <span aria-hidden>$</span>
          <input
            ref={amountRef}
            className="dash-input"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setForm(null)}
            aria-label="Amount in dollars"
          />
        </label>
        {form.mode === "spend" &&
          usualAmounts(money, form.category).map((a) => (
            <button key={a} type="button" className="money-quick" onClick={() => save(undefined, a)} title={`Take off ${dollars(a)}`}>
              {shortDollars(a)}
            </button>
          ))}
        {form.mode === "spend" && form.category === FUEL && (
          <label className="money-km">
            <input
              className="dash-input"
              inputMode="numeric"
              placeholder={fuelLast != null ? `Last ${fuelLast}` : "Mileage"}
              value={km}
              onChange={(e) => setKm(e.target.value)}
              aria-label="Mileage (km on the clock)"
            />
            <span>km</span>
          </label>
        )}
        {form.mode !== "move" && (
          <WalletToggle
            cash={form.cash}
            onChange={(cash) => setForm({ ...form, cash })}
            label={form.mode === "add" ? "Into" : "Paid with"}
          />
        )}
        <input
          className="dash-input money-note"
          list="money-notes"
          placeholder={form.mode === "add" ? "Where from? (optional)" : form.mode === "move" ? "Where? (optional)" : "Where / what? (optional)"}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <datalist id="money-notes">
          {(form.mode === "add" ? [...notesFor(money, "Money in"), ...MONEY_IN] : notesFor(money, form.mode === "move" ? CASH_OUT : form.category)).map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
        <input type="date" className="dash-input money-date" value={date} max={today} onChange={(e) => setDate(e.target.value || today)} aria-label="Date" />
        <button type="submit" className="dash-btn dash-btn-primary">
          {form.mode === "spend" ? "Take it off" : form.mode === "move" ? "Move it" : "Add it"}
        </button>
        <button type="button" className="dash-word-link" onClick={() => setForm(null)}>
          Cancel
        </button>
      </form>
    );

  const toastBox = toast && (
      <div className="money-toast" role="status">
        <span>✓ {toast.text}</span>
        {toast.undo && (
          <button
            type="button"
            className="dash-word-link"
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

  return (
    <>
      <div className="dash-pagehead">
        <div>
          <div className="eyebrow eyebrow-amber">Private to you</div>
          <h1 className="dash-title mt-1">Money</h1>
          <div className="dash-subtitle">Tap what you spent on and the price - it comes off your balance.</div>
        </div>
        <button type="button" className="dash-btn dash-btn-ghost dash-note-nav" onClick={downloadCsv}>
          Download (spreadsheet)
        </button>
      </div>

      <div className="dash-grid">
        {/* ── Balance + adding ───────────────────────────────── */}
        <div className="dash-col-12">
          <section className="dash-panel money-top">
            <div className="money-head">
              <div className="money-balances">
                {balanceBlock(false)}
                {balanceBlock(true)}
                {cashNow !== 0 && (
                  <div className="money-balance is-cash is-total">
                    <span className="eyebrow">Total</span>
                    <span className="money-balance-amount is-static">{dollars(bal + cashNow)}</span>
                    <span className="money-balance-sub">account + cash</span>
                  </div>
                )}
              </div>
              <div className="money-stats">
                <div>
                  <span>Today</span>
                  <strong>{dollars(spentOn(money, today))}</strong>
                </div>
                <div>
                  <span>{monthName(monthOf(today)).split(" ")[0]}</span>
                  <strong>{dollars(thisMonth.total)}</strong>
                </div>
                <div>
                  <span>Per day</span>
                  <strong>{dollars(thisMonth.perDay)}</strong>
                </div>
              </div>
            </div>

            {form?.mode === "add" && formBox}
            {toastBox}

            {buys.length > 0 && (
              <div className="money-again" role="group" aria-label="Log it again">
                <span className="money-again-label">Again:</span>
                {buys.map((b) => (
                  <button
                    key={`${b.category}|${b.amount}|${b.note ?? ""}|${b.cash ? "cash" : ""}`}
                    type="button"
                    className="money-again-btn"
                    onClick={() => addEntry({ kind: "spend", amount: b.amount, category: b.category, note: b.note, date: today, ...(b.cash ? { cash: true } : {}) })}
                  >
                    <i style={{ background: colourFor(money, b.category) }} aria-hidden />
                    {b.note || b.category} {shortDollars(b.amount)}
                    {b.cash && <em className="money-again-cash">cash</em>}
                  </button>
                ))}
              </div>
            )}

            <div className="money-cats" role="group" aria-label="What did you spend on?">
              {cats.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`money-cat ${(form?.mode === "spend" && form.category === c) || (form?.mode === "move" && c === CASH_OUT) ? "is-on" : ""}`}
                  onClick={() => openForm(c === CASH_OUT ? { mode: "move" } : { mode: "spend", category: c, cash: false })}
                >
                  <i style={{ background: colourFor(money, c) }} aria-hidden />
                  {c}
                </button>
              ))}
              {newCat == null ? (
                <button type="button" className="money-cat is-new" onClick={() => setNewCat("")}>
                  + New kind
                </button>
              ) : (
                <form className="money-newcat" onSubmit={addCategory}>
                  <input className="dash-input" autoFocus placeholder="e.g. Church giving" value={newCat} onChange={(e) => setNewCat(e.target.value)} />
                  <button type="submit" className="dash-btn dash-btn-primary dash-note-nav">
                    Add
                  </button>
                  <button type="button" className="dash-word-link" onClick={() => setNewCat(null)}>
                    Cancel
                  </button>
                </form>
              )}
            </div>
            {form && form.mode !== "add" && formBox}
          </section>
        </div>

        {/* ── The month ─────────────────────────────────────── */}
        <div className="dash-col-7">
          <FoldPanel
            id="money-month"
            eyebrow="Money in and out"
            title={monthName(month)}
            action={
              <div className="flex gap-1">
                <button type="button" className="dash-btn dash-btn-ghost dash-note-nav" onClick={() => (setMonth(shiftMonth(month, -1)), setOnly(null))} aria-label="Month before">
                  ‹
                </button>
                <button
                  type="button"
                  className="dash-btn dash-btn-ghost dash-note-nav"
                  onClick={() => (setMonth(shiftMonth(month, 1)), setOnly(null))}
                  disabled={month >= monthOf(today)}
                  aria-label="Month after"
                >
                  ›
                </button>
              </div>
            }
          >
            <div className="money-month-figures">
              <button
                type="button"
                className={`money-figure ${view === "in" ? "is-on" : ""}`}
                onClick={() => (setView(view === "in" ? "all" : "in"), setOnly(null))}
                aria-pressed={view === "in"}
              >
                <span>Money in</span>
                <strong className="is-in">{dollars(summary.in)}</strong>
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
              <div>
                <span>Left over</span>
                <strong className={summary.in - summary.total < 0 ? "is-low" : ""}>
                  {summary.in - summary.total < 0 ? "-" : ""}
                  {dollars(Math.abs(summary.in - summary.total))}
                </strong>
              </div>
              <div>
                <span>Spent a day</span>
                <strong>{dollars(summary.perDay)}</strong>
              </div>
            </div>

            <div className="money-view" role="group" aria-label="Show">
              {(
                [
                  ["all", "Everything"],
                  ["in", "Money in"],
                  ["out", "Spent"],
                ] as const
              ).map(([v, label]) => (
                <button key={v} type="button" className={view === v ? "is-on" : ""} aria-pressed={view === v} onClick={() => (setView(v), setOnly(null))}>
                  {label}
                </button>
              ))}
            </div>

            {view === "in" ? (
              inParts.length === 0 ? (
                <p className="dash-word-hint mt-3">No money in this month yet - tap + Add money or + Add cash at the top.</p>
              ) : (
                <ul className="money-parts">
                  {inParts.map((p) => (
                    <li key={p.from}>
                      <span className="money-part is-static">
                        <i style={{ background: "rgb(var(--ok-rgb))" }} aria-hidden />
                        <span className="money-part-name">{p.from}</span>
                        <span className="money-part-pct">{summary.in ? Math.round((p.amount / summary.in) * 100) : 0}%</span>
                        <span className="money-part-amount">{dollars(p.amount)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )
            ) : summary.parts.length === 0 ? (
              <p className="dash-word-hint mt-3">Nothing spent this month yet.</p>
            ) : (
              <>
                <div className="money-split" aria-hidden>
                  {summary.parts.map((p) => (
                    <span key={p.category} style={{ width: `${p.pct}%`, background: colourFor(money, p.category) }} title={`${p.category} ${Math.round(p.pct)}%`} />
                  ))}
                </div>
                <ul className="money-parts">
                  {summary.parts.map((p) => (
                    <li key={p.category}>
                      <button
                        type="button"
                        className={`money-part ${only === p.category ? "is-on" : ""}`}
                        onClick={() => {
                          setOnly(only === p.category ? null : p.category);
                          setView("out");
                        }}
                      >
                        <i style={{ background: colourFor(money, p.category) }} aria-hidden />
                        <span className="money-part-name">{p.category}</span>
                        <span className="money-part-pct">{Math.round(p.pct)}%</span>
                        <span className="money-part-amount">{dollars(p.amount)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {days.length > 0 && (
              <div className="money-list">
                <div className="money-list-head">
                  <span className="eyebrow">{only ? `${only} only` : view === "in" ? "Money in" : view === "out" ? "Spending" : "Every entry"}</span>
                  {only || view !== "all" ? (
                    <button type="button" className="dash-word-link" onClick={() => (setOnly(null), setView("all"))}>
                      Show everything
                    </button>
                  ) : (
                    <span className="dash-word-hint">Tap one to change it</span>
                  )}
                </div>
                {days.map((g) => (
                  <div key={g.date} className="money-day-group">
                    <div className="money-day-head">
                      <span>{dayHeading(g.date, today)}</span>
                      <span className="money-day-sums">
                        {g.in > 0 && <span className="is-in">+{dollars(g.in)}</span>}
                        {g.spent > 0 && <span>-{dollars(g.spent)}</span>}
                      </span>
                    </div>
                    {g.items.map((e) =>
                      editing?.id === e.id && editing.where === "list" ? (
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
                      ) : (
                        <div key={e.id} className="money-row-line">
                        <button
                          type="button"
                          className={`money-row is-${e.kind}`}
                          onClick={() => setEditing(editingFor(e, "list"))}
                        >
                          <i style={{ background: e.kind === "spend" ? colourFor(money, e.category) : "transparent" }} aria-hidden />
                          <span className="money-row-what">
                            {e.kind === "set" ? (e.cash ? "Cash set" : "Balance set") : e.note || (e.kind === "add" && e.cash ? "Cash in" : e.category)}
                            {e.kind !== "set" && e.note && <em> · {e.kind === "add" && e.cash ? "Cash in" : e.category}</em>}
                            {e.kind === "move" && <em> · account → cash</em>}
                            {e.kind === "spend" && e.cash && <em> · cash</em>}
                            {e.km != null && <em> · {kmText(e.km)}</em>}
                            {e.sub && <em> · comes off by itself</em>}
                          </span>
                          <span className="money-row-amount">
                            {e.kind === "set" || e.kind === "move" ? dollars(e.amount) : `${e.kind === "add" ? "+" : "-"}${dollars(e.amount)}`}
                          </span>
                        </button>
                        <DeleteButton onClick={() => removeEntry(e.id)} />
                        </div>
                      ),
                    )}
                  </div>
                ))}
              </div>
            )}
          </FoldPanel>
        </div>

        {/* ── Coming up + regular debits ───────────────────────── */}
        <div className="dash-col-5 money-side">
          <KindPanel kind="fuel" colour={colourFor(money, FUEL)} {...kindProps} />
          <KindPanel kind="gym" colour={colourFor(money, GYM)} {...kindProps} />
          {coming.length > 0 && (
            <FoldPanel id="money-coming" eyebrow="Still to come this month" title={dollars(comingTotal)}>
              <div className="money-subs">
                {coming.map((c) => (
                  <div key={c.sub.id} className="money-sub">
                    <span className="money-sub-what">
                      <strong>{c.sub.name}</strong>
                      <em>{shortDate(c.date)}</em>
                    </span>
                    <span className="money-sub-amount">{dollars(c.sub.amount)}</span>
                  </div>
                ))}
              </div>
              <p className="dash-word-hint mt-3">
                After these you&apos;ll have <strong>{dollars(bal - comingTotal)}</strong>.
              </p>
            </FoldPanel>
          )}

          <FoldPanel id="money-subs" eyebrow={`${dollars(monthlySubs)} a month`} title="Comes off by itself">
            <p className="dash-word-hint mb-3">Taken off on its day each month - no need to add these.</p>
            <div className="money-subs">
              {money.subs.filter((s) => !s.removedAt).map((s) =>
                subForm?.id === s.id ? null : (
                  <div key={s.id} className={`money-sub ${s.active ? "" : "is-paused"}`}>
                    <span className="money-sub-what">
                      <strong>{s.name}</strong>
                      <em>
                        {dollars(s.amount)} on the {ordinal(s.day)}
                        {s.active ? ` · next ${shortDate(nextDue(s, today))}` : " · paused"}
                      </em>
                    </span>
                    <span className="money-sub-tools">
                      <button
                        type="button"
                        className="dash-word-link"
                        onClick={() => setSubForm({ id: s.id, name: s.name, amount: String(s.amount), day: String(s.day), category: s.category })}
                      >
                        Change
                      </button>
                      <button type="button" className="dash-word-link" onClick={() => toggleSub(s.id)}>
                        {s.active ? "Pause" : "Start again"}
                      </button>
                      <button type="button" className="dash-word-link money-sub-remove" onClick={() => removeSub(s.id)}>
                        Remove
                      </button>
                    </span>
                  </div>
                ),
              )}
            </div>
            {subForm ? (
              <form className="money-sub-form" onSubmit={saveSub}>
                <span className="money-form-what">{subForm.id ? `Change ${subForm.name || "this debit"}` : "A new regular debit"}</span>
                <input className="dash-input" placeholder="Name, e.g. Netflix" value={subForm.name} onChange={(e) => setSubForm({ ...subForm, name: e.target.value })} />
                <div className="money-sub-form-row">
                  <label className="money-amount">
                    <span aria-hidden>$</span>
                    <input className="dash-input" inputMode="decimal" placeholder="0.00" value={subForm.amount} onChange={(e) => setSubForm({ ...subForm, amount: e.target.value })} aria-label="Amount" />
                  </label>
                  <label className="money-day">
                    <span>on the</span>
                    <input
                      className="dash-input"
                      inputMode="numeric"
                      placeholder="12"
                      value={subForm.day}
                      onChange={(e) => setSubForm({ ...subForm, day: e.target.value.replace(/\D/g, "").slice(0, 2) })}
                      aria-label="Day of the month"
                    />
                  </label>
                </div>
                <select className="dash-input" value={subForm.category} onChange={(e) => setSubForm({ ...subForm, category: e.target.value })} aria-label="Kind">
                  {cats.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <div className="flex gap-2 items-center">
                  <button type="submit" className="dash-btn dash-btn-primary">
                    {subForm.id ? "Save" : "Add it"}
                  </button>
                  <button type="button" className="dash-word-link" onClick={() => setSubForm(null)}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button type="button" className="dash-btn dash-btn-ghost dash-note-nav mt-3" onClick={() => setSubForm({ name: "", amount: "", day: "", category: "Subscriptions" })}>
                + Add a regular debit
              </button>
            )}
          </FoldPanel>
        </div>
      </div>
    </>
  );
}
