"use client";

// Money - Daniel's own spending tracker (not for the team, never members).
// The balance up top (tap it to change it); one tap on what he usually buys,
// or a kind of spending then the price; every entry editable. Each month
// broken down by kind, with how it compares to last month; the regular
// debits that come off by themselves, and what's still to come. Saved with
// the rest of the dashboard.

import { useEffect, useMemo, useRef, useState } from "react";
import { FoldPanel } from "@/components/dashboard/fold-panel";
import { useDashboard } from "@/lib/dashboard/storage";
import type { MoneyEntry, MoneyState } from "@/lib/dashboard/types";
import {
  allCategories,
  balance,
  colourFor,
  dollars,
  dueDate,
  dueDebits,
  localDate,
  monthName,
  monthOf,
  monthSummary,
  newSub,
  nextDue,
  notesFor,
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

type Form = { mode: "spend"; category: string } | { mode: "add" } | null;

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
  const [date, setDate] = useState(today);
  const amountRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<{ text: string; undo?: () => void } | null>(null);
  const toastTimer = useRef<number | null>(null);
  const [month, setMonth] = useState(monthOf(today));
  const [only, setOnly] = useState<string | null>(null); // the month's list, one kind only

  function say(text: string, undo?: () => void) {
    setToast({ text, undo });
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 8000);
  }

  function openForm(f: Form) {
    if (f && form && f.mode === form.mode && (f.mode !== "spend" || (form.mode === "spend" && f.category === form.category))) {
      setForm(null); // the same button again closes it
      return;
    }
    setForm(f);
    setAmount("");
    setNote("");
    setDate(today);
    window.setTimeout(() => amountRef.current?.focus(), 30);
  }

  function addEntry(e: Omit<MoneyEntry, "id" | "at">) {
    const entry: MoneyEntry = { ...e, id: uid(), at: new Date().toISOString() };
    update((d) => void d.money?.entries.push(entry));
    setMonth(monthOf(entry.date));
    say(
      entry.kind === "add"
        ? `${dollars(entry.amount)} added`
        : `${dollars(entry.amount)} ${entry.note ? `at ${entry.note}` : `on ${entry.category.toLowerCase()}`} - taken off`,
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
    addEntry({
      kind: form.mode === "add" ? "add" : "spend",
      amount: n,
      category: form.mode === "add" ? "Money in" : form.category,
      note: note.trim() || undefined,
      date,
    });
    setForm(null);
  }

  // ── The balance, changed in place ───────────────────────────────
  const [balanceEdit, setBalanceEdit] = useState<string | null>(null);
  const balanceRef = useRef<HTMLInputElement>(null);
  function startBalanceEdit() {
    if (!money) return;
    setBalanceEdit(balance(money).toFixed(2));
    window.setTimeout(() => {
      balanceRef.current?.focus();
      balanceRef.current?.select();
    }, 30);
  }
  function saveBalance(e?: React.FormEvent) {
    e?.preventDefault();
    if (balanceEdit == null || !money) return;
    const n = Number(balanceEdit.replace(/[^0-9.-]/g, ""));
    if (!Number.isFinite(n)) return balanceRef.current?.focus();
    const now = balance(money);
    setBalanceEdit(null);
    if (Math.round(n * 100) === Math.round(now * 100)) return;
    const entry: MoneyEntry = { id: uid(), kind: "set", amount: Math.round(n * 100) / 100, category: "Balance", date: today, at: new Date().toISOString() };
    update((d) => void d.money?.entries.push(entry));
    say(`Balance set to ${dollars(entry.amount)}`, () =>
      update((d) => {
        const x = d.money?.entries.find((y) => y.id === entry.id);
        if (x) x.deletedAt = new Date().toISOString();
      }),
    );
  }

  // ── Editing an entry ────────────────────────────────────────────
  const [editing, setEditing] = useState<{ id: string; amount: string; category: string; note: string; date: string } | null>(null);
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
    say("Removed", () =>
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
    openForm({ mode: "spend", category: c });
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
    const list = money.entries
      .filter((e) => !e.deletedAt && monthOf(e.date) === month && (!only || (e.kind === "spend" && e.category === only)))
      .sort((a, b) => b.date.localeCompare(a.date) || b.at.localeCompare(a.at));
    const out: { date: string; items: MoneyEntry[]; spent: number }[] = [];
    for (const e of list) {
      let g = out[out.length - 1];
      if (!g || g.date !== e.date) out.push((g = { date: e.date, items: [], spent: 0 }));
      g.items.push(e);
      if (e.kind === "spend") g.spent += e.amount;
    }
    return out;
  }, [money, month, only]);
  const coming = useMemo(() => (money ? stillToCome(money, today) : []), [money, today]);
  const buys = useMemo(() => (money ? usualBuys(money) : []), [money]);

  if (synced === false && !money) {
    return <p className="dash-word-hint">Couldn&apos;t load your money page - check your connection and refresh.</p>;
  }
  if (!ready || !money || !summary || !thisMonth) return <p className="dash-word-hint">Opening…</p>;

  const bal = balance(money);
  const comingTotal = coming.reduce((t, c) => t + c.sub.amount, 0);
  const monthlySubs = money.subs.filter((s) => s.active).reduce((t, s) => t + s.amount, 0);
  const cats = allCategories(money);

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
              <div className="money-balance">
                <span className="eyebrow">In your account</span>
                {balanceEdit == null ? (
                  <button type="button" className={`money-balance-amount ${bal < 0 ? "is-low" : ""}`} onClick={startBalanceEdit} title="Tap to change it">
                    {dollars(bal)}
                    <span className="money-balance-edit" aria-hidden>
                      ✎
                    </span>
                  </button>
                ) : (
                  <form className="money-balance-form" onSubmit={saveBalance}>
                    <label className="money-amount is-big">
                      <span aria-hidden>$</span>
                      <input
                        ref={balanceRef}
                        className="dash-input"
                        inputMode="decimal"
                        value={balanceEdit}
                        onChange={(e) => setBalanceEdit(e.target.value)}
                        onKeyDown={(e) => e.key === "Escape" && setBalanceEdit(null)}
                        aria-label="Your balance at the bank"
                      />
                    </label>
                    <button type="submit" className="dash-btn dash-btn-primary">
                      Save
                    </button>
                    <button type="button" className="dash-word-link" onClick={() => setBalanceEdit(null)}>
                      Cancel
                    </button>
                    <p className="dash-word-hint money-form-hint">Type what your bank says - it carries on from there.</p>
                  </form>
                )}
                {coming.length > 0 && balanceEdit == null && (
                  <span className="money-balance-sub">
                    {dollars(bal - comingTotal)} after the {dollars(comingTotal)} still to come off this month
                  </span>
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

            {buys.length > 0 && (
              <div className="money-again" role="group" aria-label="Log it again">
                <span className="money-again-label">Again:</span>
                {buys.map((b) => (
                  <button
                    key={`${b.category}|${b.amount}|${b.note ?? ""}`}
                    type="button"
                    className="money-again-btn"
                    onClick={() => addEntry({ kind: "spend", amount: b.amount, category: b.category, note: b.note, date: today })}
                  >
                    <i style={{ background: colourFor(money, b.category) }} aria-hidden />
                    {b.note || b.category} {shortDollars(b.amount)}
                  </button>
                ))}
              </div>
            )}

            <div className="money-cats" role="group" aria-label="What did you spend on?">
              {cats.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`money-cat ${form?.mode === "spend" && form.category === c ? "is-on" : ""}`}
                  onClick={() => openForm({ mode: "spend", category: c })}
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
            <div className="money-actions">
              <button type="button" className={`dash-btn dash-note-nav ${form?.mode === "add" ? "dash-btn-primary" : "dash-btn-ghost"}`} onClick={() => openForm({ mode: "add" })}>
                + Add money
              </button>
              <button type="button" className="dash-btn dash-btn-ghost dash-note-nav" onClick={startBalanceEdit}>
                Set balance
              </button>
            </div>

            {form && (
              <form className="money-form" onSubmit={save}>
                <span className="money-form-what">
                  {form.mode === "spend" && <i style={{ background: colourFor(money, form.category) }} aria-hidden />}
                  {form.mode === "spend" ? form.category : "Money in"}
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
                <input
                  className="dash-input money-note"
                  list="money-notes"
                  placeholder={form.mode === "add" ? "Where from? (optional)" : "Where / what? (optional)"}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <datalist id="money-notes">
                  {(form.mode === "add" ? [...notesFor(money, "Money in"), ...MONEY_IN] : notesFor(money, form.category)).map((n) => (
                    <option key={n} value={n} />
                  ))}
                </datalist>
                <input type="date" className="dash-input money-date" value={date} max={today} onChange={(e) => setDate(e.target.value || today)} aria-label="Date" />
                <button type="submit" className="dash-btn dash-btn-primary">
                  {form.mode === "spend" ? "Take it off" : "Add it"}
                </button>
                <button type="button" className="dash-word-link" onClick={() => setForm(null)}>
                  Cancel
                </button>
              </form>
            )}

            {toast && (
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
            )}
          </section>
        </div>

        {/* ── The month ─────────────────────────────────────── */}
        <div className="dash-col-7">
          <FoldPanel
            id="money-month"
            eyebrow="Where it went"
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
              <div>
                <span>Spent</span>
                <strong>{dollars(summary.total)}</strong>
                {summary.change != null && (
                  <em className={summary.change > 0 ? "is-up" : "is-down"}>
                    {summary.change > 0 ? "▲" : "▼"} {Math.abs(Math.round(summary.change))}% {summary.soFar ? "on this time in" : "on"} {monthName(shiftMonth(month, -1)).split(" ")[0]}
                  </em>
                )}
              </div>
              <div>
                <span>Money in</span>
                <strong>{dollars(summary.in)}</strong>
              </div>
              <div>
                <span>Per day</span>
                <strong>{dollars(summary.perDay)}</strong>
              </div>
            </div>

            {summary.parts.length === 0 ? (
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
                      <button type="button" className={`money-part ${only === p.category ? "is-on" : ""}`} onClick={() => setOnly(only === p.category ? null : p.category)}>
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
                  <span className="eyebrow">{only ? `${only} only` : "Every entry"}</span>
                  {only ? (
                    <button type="button" className="dash-word-link" onClick={() => setOnly(null)}>
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
                      {g.spent > 0 && <span>{dollars(g.spent)}</span>}
                    </div>
                    {g.items.map((e) =>
                      editing?.id === e.id ? (
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
                        <button
                          key={e.id}
                          type="button"
                          className={`money-row is-${e.kind}`}
                          onClick={() => setEditing({ id: e.id, amount: String(e.amount), category: e.category, note: e.note ?? "", date: e.date })}
                        >
                          <i style={{ background: e.kind === "spend" ? colourFor(money, e.category) : "transparent" }} aria-hidden />
                          <span className="money-row-what">
                            {e.kind === "set" ? "Balance set" : e.note || e.category}
                            {e.kind !== "set" && e.note && <em> · {e.category}</em>}
                            {e.sub && <em> · comes off by itself</em>}
                          </span>
                          <span className="money-row-amount">
                            {e.kind === "set" ? dollars(e.amount) : `${e.kind === "add" ? "+" : "-"}${dollars(e.amount)}`}
                          </span>
                        </button>
                      ),
                    )}
                  </div>
                ))}
              </div>
            )}
          </FoldPanel>
        </div>

        {/* ── Coming up + regular debits ───────────────────────── */}
        <div className="dash-col-5">
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
              {money.subs.map((s) =>
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

// One entry, being changed.
function EntryEdit({
  money,
  entry,
  editing,
  setEditing,
  onSave,
  onRemove,
  today,
}: {
  money: MoneyState;
  entry: MoneyEntry;
  editing: { id: string; amount: string; category: string; note: string; date: string };
  setEditing: (e: { id: string; amount: string; category: string; note: string; date: string } | null) => void;
  onSave: (e: React.FormEvent) => void;
  onRemove: () => void;
  today: string;
}) {
  return (
    <form className="money-edit" onSubmit={onSave}>
      <span className="money-form-what">{entry.kind === "set" ? "Balance set to" : entry.kind === "add" ? "Money in" : "Spent"}</span>
      <label className="money-amount">
        <span aria-hidden>$</span>
        <input
          className="dash-input"
          inputMode="decimal"
          autoFocus
          value={editing.amount}
          onChange={(e) => setEditing({ ...editing, amount: e.target.value })}
          onKeyDown={(e) => e.key === "Escape" && setEditing(null)}
          aria-label="Amount"
        />
      </label>
      {entry.kind === "spend" && (
        <select className="dash-input money-edit-cat" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} aria-label="Kind">
          {[...new Set([...allCategories(money), editing.category])].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      )}
      {entry.kind !== "set" && (
        <>
          <input className="dash-input money-note" placeholder="Where / what?" value={editing.note} onChange={(e) => setEditing({ ...editing, note: e.target.value })} />
          <input type="date" className="dash-input money-date" value={editing.date} max={today} onChange={(e) => setEditing({ ...editing, date: e.target.value })} aria-label="Date" />
        </>
      )}
      <button type="submit" className="dash-btn dash-btn-primary dash-note-nav">
        Save
      </button>
      <button type="button" className="dash-word-link" onClick={() => setEditing(null)}>
        Cancel
      </button>
      <button type="button" className="dash-word-link money-edit-remove" onClick={onRemove}>
        Remove
      </button>
    </form>
  );
}
