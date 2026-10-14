"use client";

// Money - Daniel's own spending tracker (not for the team, never members).
// The balance up top; tap what you spent on, type the price, and it comes
// off. Money in adds to it; "Set balance" makes it match the bank. Each month
// is broken down by percentage, and regular debits (Spotify, Apple...) come
// off by themselves on their day. Saved with the rest of the dashboard.

import { useEffect, useMemo, useRef, useState } from "react";
import { FoldPanel } from "@/components/dashboard/fold-panel";
import { useDashboard } from "@/lib/dashboard/storage";
import type { MoneyEntry } from "@/lib/dashboard/types";
import {
  SPEND_CATEGORIES,
  balance,
  dollars,
  dueDate,
  dueDebits,
  localDate,
  monthName,
  monthOf,
  monthSummary,
  newSub,
  shiftMonth,
  startingMoney,
  uid,
} from "@/lib/dashboard/money";

const STARTING_BALANCE = 1912; // what Daniel had in the account when this began

const parseAmount = (v: string) => {
  const n = Number(v.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
};
const shortDate = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const ordinal = (n: number) => `${n}${n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th"}`;

type Form = { mode: "spend"; category: string } | { mode: "add" } | { mode: "set" } | null;

export default function MoneyPage() {
  const { state, update, ready, synced } = useDashboard();
  const money = state.money;
  const today = localDate();

  // First visit: start from the balance Daniel gave, with his regular debits -
  // only once the saved copy has loaded, so it never replaces one from another device.
  useEffect(() => {
    if (ready && synced && !state.money) update((d) => void (d.money = startingMoney(STARTING_BALANCE)));
  }, [ready, synced, state.money, update]);

  // Regular debits that have come due since last time come off by themselves
  // (again only on the latest saved copy).
  useEffect(() => {
    if (!money || !synced) return;
    const due = dueDebits(money, today);
    if (!due.entries.length) return;
    update((d) => {
      if (!d.money) return;
      const again = dueDebits(d.money, today); // on the latest copy, so it's only ever once
      d.money.entries.push(...again.entries);
      for (const s of d.money.subs) if (again.paid[s.id]) s.lastPaid = again.paid[s.id];
    });
  }, [money, synced, today, update]);

  const [form, setForm] = useState<Form>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(today);
  const [done, setDone] = useState<string | null>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const [month, setMonth] = useState(monthOf(today));

  function open(f: Form) {
    setForm(f);
    setAmount("");
    setNote("");
    setDate(today);
    setDone(null);
    window.setTimeout(() => amountRef.current?.focus(), 30);
  }

  function save(e?: React.FormEvent) {
    e?.preventDefault();
    if (!form) return;
    const n = parseAmount(amount);
    if (n == null) return amountRef.current?.focus();
    if (form.mode === "set") {
      update((d) => {
        if (d.money) d.money.start = { amount: n, at: new Date().toISOString() };
      });
      setDone(`Balance set to ${dollars(n)}.`);
    } else {
      const entry: MoneyEntry = {
        id: uid(),
        kind: form.mode === "add" ? "add" : "spend",
        amount: n,
        category: form.mode === "add" ? "Money in" : form.category,
        note: note.trim() || undefined,
        date,
        at: new Date().toISOString(),
      };
      update((d) => void d.money?.entries.push(entry));
      setDone(form.mode === "add" ? `${dollars(n)} added.` : `${dollars(n)} on ${entry.category.toLowerCase()} - taken off.`);
      setMonth(monthOf(date));
    }
    setForm(null);
  }

  function remove(e: MoneyEntry) {
    if (!confirm(`Remove ${dollars(e.amount)} (${e.note || e.category}, ${shortDate(e.date)})? ${e.kind === "spend" ? "It goes back on the balance." : ""}`)) return;
    update((d) => {
      const x = d.money?.entries.find((y) => y.id === e.id);
      if (x) x.deletedAt = new Date().toISOString();
    });
  }

  const summary = useMemo(() => (money ? monthSummary(money, month) : null), [money, month]);
  const list = useMemo(
    () =>
      (money?.entries ?? [])
        .filter((e) => !e.deletedAt && monthOf(e.date) === month)
        .sort((a, b) => b.date.localeCompare(a.date) || b.at.localeCompare(a.at)),
    [money, month],
  );

  // Regular debits: change, pause, add.
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

  if (synced === false && !money) {
    return <p className="dash-word-hint">Couldn&apos;t load your money page - check your connection and refresh.</p>;
  }
  if (!ready || !money || !summary) return <p className="dash-word-hint">Opening…</p>;
  const bal = balance(money);
  const monthlySubs = money.subs.filter((s) => s.active).reduce((t, s) => t + s.amount, 0);

  return (
    <>
      <div className="dash-pagehead">
        <div>
          <div className="eyebrow eyebrow-amber">Private to you</div>
          <h1 className="dash-title mt-1">Money</h1>
          <div className="dash-subtitle">Tap what you spent on and type the price - it comes off your balance.</div>
        </div>
      </div>

      <div className="dash-grid">
        {/* ── Balance + quick add ───────────────────────────── */}
        <div className="dash-col-12">
          <section className="dash-panel money-top">
            <div className="money-balance">
              <span className="eyebrow">In your account</span>
              <strong className={bal < 0 ? "is-low" : ""}>{dollars(bal)}</strong>
              <span className="money-balance-sub">
                {monthName(monthOf(today))}: {dollars(monthSummary(money, monthOf(today)).total)} spent
              </span>
            </div>

            <div className="money-cats" role="group" aria-label="What did you spend on?">
              {SPEND_CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`money-cat ${form?.mode === "spend" && form.category === c ? "is-on" : ""}`}
                  onClick={() => open({ mode: "spend", category: c })}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="money-actions">
              <button type="button" className="dash-btn dash-btn-ghost dash-note-nav" onClick={() => open({ mode: "add" })}>
                + Add money
              </button>
              <button type="button" className="dash-btn dash-btn-ghost dash-note-nav" onClick={() => open({ mode: "set" })}>
                Set balance
              </button>
            </div>

            {form && (
              <form className="money-form" onSubmit={save}>
                <span className="money-form-what">
                  {form.mode === "spend" ? form.category : form.mode === "add" ? "Money in" : "Your balance at the bank right now"}
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
                    aria-label="Amount in dollars"
                  />
                </label>
                {form.mode !== "set" && (
                  <>
                    <input
                      className="dash-input money-note"
                      placeholder={form.mode === "add" ? "Where from? (optional)" : "What was it? (optional)"}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                    <input
                      type="date"
                      className="dash-input money-date"
                      value={date}
                      max={today}
                      onChange={(e) => setDate(e.target.value || today)}
                      aria-label="Date"
                    />
                  </>
                )}
                <button type="submit" className="dash-btn dash-btn-primary">
                  {form.mode === "spend" ? "Take it off" : form.mode === "add" ? "Add it" : "Set balance"}
                </button>
                <button type="button" className="dash-word-link" onClick={() => setForm(null)}>
                  Cancel
                </button>
                {form.mode === "set" && (
                  <p className="dash-word-hint money-form-hint">
                    Use this when this page and your bank don&apos;t match - it starts the count again from what you type.
                  </p>
                )}
              </form>
            )}
            {done && <p className="dash-word-saved mt-3">✓ {done}</p>}
          </section>
        </div>

        {/* ── The month, by percentage ───────────────────────── */}
        <div className="dash-col-7">
          <FoldPanel
            id="money-month"
            eyebrow="Where it went"
            title={monthName(month)}
            action={
              <div className="flex gap-1">
                <button type="button" className="dash-btn dash-btn-ghost dash-note-nav" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Month before">
                  ‹
                </button>
                <button
                  type="button"
                  className="dash-btn dash-btn-ghost dash-note-nav"
                  onClick={() => setMonth(shiftMonth(month, 1))}
                  disabled={month >= monthOf(today)}
                  aria-label="Month after"
                >
                  ›
                </button>
              </div>
            }
          >
            <div className="money-month-total">
              <strong>{dollars(summary.total)}</strong> spent
              {summary.in > 0 && <span> · {dollars(summary.in)} in</span>}
            </div>
            {summary.parts.length === 0 ? (
              <p className="dash-word-hint mt-3">Nothing spent this month yet.</p>
            ) : (
              <ul className="money-parts">
                {summary.parts.map((p) => (
                  <li key={p.category}>
                    <div className="money-part-row">
                      <span>{p.category}</span>
                      <span>
                        <strong>{Math.round(p.pct)}%</strong> · {dollars(p.amount)}
                      </span>
                    </div>
                    <span className="money-bar" aria-hidden>
                      <span style={{ width: `${Math.max(2, p.pct)}%` }} />
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {list.length > 0 && (
              <div className="money-list">
                <div className="eyebrow mb-1">Everything this month</div>
                {list.map((e) => (
                  <div key={e.id} className="money-row">
                    <span className="money-row-date">{shortDate(e.date)}</span>
                    <span className="money-row-what">
                      {e.note || e.category}
                      {e.note && <em> · {e.category}</em>}
                      {e.sub && <em> · comes off by itself</em>}
                    </span>
                    <span className={`money-row-amount ${e.kind === "add" ? "is-in" : ""}`}>
                      {e.kind === "add" ? "+" : "-"}
                      {dollars(e.amount)}
                    </span>
                    <button type="button" className="money-row-remove" onClick={() => remove(e)} aria-label="Remove" title="Remove">
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </FoldPanel>
        </div>

        {/* ── Regular debits ───────────────────────────────── */}
        <div className="dash-col-5">
          <FoldPanel id="money-subs" eyebrow={`${dollars(monthlySubs)} a month`} title="Comes off by itself">
            <p className="dash-word-hint mb-3">Taken off your balance on its day each month - no need to add these.</p>
            <div className="money-subs">
              {money.subs.map((s) => (
                <div key={s.id} className={`money-sub ${s.active ? "" : "is-paused"}`}>
                  <span className="money-sub-what">
                    <strong>{s.name}</strong>
                    <em>
                      {dollars(s.amount)} on the {ordinal(s.day)}
                      {s.active ? "" : " · paused"}
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
              ))}
            </div>
            {subForm ? (
              <form className="money-sub-form" onSubmit={saveSub}>
                <input className="dash-input" placeholder="Name, e.g. Netflix" value={subForm.name} onChange={(e) => setSubForm({ ...subForm, name: e.target.value })} />
                <div className="money-sub-form-row">
                  <label className="money-amount">
                    <span aria-hidden>$</span>
                    <input className="dash-input" inputMode="decimal" placeholder="0.00" value={subForm.amount} onChange={(e) => setSubForm({ ...subForm, amount: e.target.value })} aria-label="Amount" />
                  </label>
                  <label className="money-day">
                    <span>on the</span>
                    <input className="dash-input" inputMode="numeric" placeholder="12" value={subForm.day} onChange={(e) => setSubForm({ ...subForm, day: e.target.value.replace(/\D/g, "").slice(0, 2) })} aria-label="Day of the month" />
                  </label>
                </div>
                <select className="dash-input" value={subForm.category} onChange={(e) => setSubForm({ ...subForm, category: e.target.value })} aria-label="Kind">
                  {SPEND_CATEGORIES.map((c) => (
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
              <button
                type="button"
                className="dash-btn dash-btn-ghost dash-note-nav mt-3"
                onClick={() => setSubForm({ name: "", amount: "", day: "", category: "Subscriptions" })}
              >
                + Add a regular debit
              </button>
            )}
          </FoldPanel>
        </div>
      </div>
    </>
  );
}
