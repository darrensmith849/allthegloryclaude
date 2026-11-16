"use client";

// The budget card on the Money page: each line of the month's budget - what
// it allows, what's gone on it and what's left (or how far over) - the fuel
// allowance on top of the salary, and the salary no line has. What a line
// doesn't spend can be put aside as savings, one line at a time or all of it
// once the month is done. Savings stay in the account, marked as not for
// spending; they can be taken back out.

import { useState } from "react";
import type { DashboardState, MoneyBudget, MoneySaving, MoneyState } from "@/lib/dashboard/types";
import { allCategories, budgetMonth, CASH_OUT, cashBalance, colourFor, currencySymbol, dollars, localDate, monthName, monthOf, REST, savedTotal, uid } from "@/lib/dashboard/money";

type Update = (fn: (d: DashboardState) => void) => void;
type Draft = { from: string; salary: string; lines: { id: string; name: string; amount: string; categories: string[]; allowance: boolean }[] };

const parse = (v: string) => {
  const n = Number(String(v).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
};
const shortDay = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long" });
const draftOf = (b: MoneyBudget): Draft => ({
  from: b.from ?? "",
  salary: String(b.salary || ""),
  lines: b.lines.filter((l) => !l.removedAt).map((l) => ({ id: l.id, name: l.name, amount: String(l.amount), categories: [...l.categories], allowance: l.allowance === true })),
});

export function BudgetCard({
  money,
  month,
  today = localDate(),
  update,
  say,
  onShow,
  fold,
  folded = false,
}: {
  money: MoneyState;
  month: string;
  today?: string;
  update: Update;
  say: (text: string, undo?: () => void) => void;
  onShow: (categories: string[]) => void;
  fold?: React.ReactNode; // the button that folds the card away
  folded?: boolean;
}) {
  const [open, setOpen] = useState<string | null>(null); // the line tapped open
  const [draft, setDraft] = useState<Draft | null>(null); // changing the budget
  const [takeOut, setTakeOut] = useState<{ amount: string; note: string } | null>(null);
  const [quiet, setQuiet] = useState(false); // the lines nothing's gone on yet, shown

  const done = month < monthOf(today); // the month is over
  const name = monthName(month).split(" ")[0];

  function putAside(items: { line: string; amount: number }[], text: string) {
    const at = new Date().toISOString();
    const made: MoneySaving[] = items.filter((x) => x.amount > 0).map((x) => ({ id: uid(), amount: x.amount, ym: month, line: x.line, at }));
    if (!made.length) return;
    update((d) => {
      if (d.money) d.money.savings = [...(d.money.savings ?? []), ...made];
    });
    setOpen(null);
    say(text, () =>
      update((d) => {
        for (const s of d.money?.savings ?? []) if (made.some((x) => x.id === s.id)) s.deletedAt = new Date().toISOString();
      }),
    );
  }

  function unsave(line: string) {
    const now = new Date().toISOString();
    const ids = (money.savings ?? []).filter((s) => !s.deletedAt && s.ym === month && s.line === line).map((s) => s.id);
    update((d) => {
      for (const s of d.money?.savings ?? []) if (ids.includes(s.id)) s.deletedAt = now;
    });
    setOpen(null);
    say("Taken back out of savings - it's free to spend again", () =>
      update((d) => {
        for (const s of d.money?.savings ?? []) if (ids.includes(s.id)) delete s.deletedAt;
      }),
    );
  }

  function saveTakeOut(e: React.FormEvent) {
    e.preventDefault();
    if (!takeOut) return;
    const n = parse(takeOut.amount);
    if (!n || n > savedTotal(money)) return;
    const s: MoneySaving = { id: uid(), amount: -n, ym: monthOf(today), note: takeOut.note.trim() || undefined, at: new Date().toISOString() };
    update((d) => {
      if (d.money) d.money.savings = [...(d.money.savings ?? []), s];
    });
    setTakeOut(null);
    say(`${dollars(n)} taken out of savings`, () =>
      update((d) => {
        const x = d.money?.savings?.find((y) => y.id === s.id);
        if (x) x.deletedAt = new Date().toISOString();
      }),
    );
  }

  // The budget starts again today: spending before today stops counting against it.
  function startAgain() {
    const before = money.budget?.from;
    update((d) => {
      if (d.money?.budget) d.money.budget.from = today;
    });
    setOpen(null);
    say(`Budget starts again from today - only spending from ${shortDay(today)} counts`, () =>
      update((d) => {
        if (!d.money?.budget) return;
        if (before) d.money.budget.from = before;
        else delete d.money.budget.from;
      }),
    );
  }

  function saveDraft(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    const salary = parse(draft.salary) ?? 0;
    const lines = draft.lines
      .map((l) => ({ ...l, name: l.name.trim(), n: parse(l.amount) }))
      .filter((l) => l.name && l.n != null);
    update((d) => {
      if (!d.money) return;
      const before = d.money.budget?.lines ?? [];
      const now = new Date().toISOString();
      const kept = lines.map((l) => ({
        id: l.id,
        name: l.name,
        amount: l.n!,
        categories: l.categories,
        ...(l.allowance ? { allowance: true } : {}),
      }));
      // Lines taken out are kept (savings point at them), marked removed.
      const gone = before.filter((b) => !b.removedAt && !kept.some((k) => k.id === b.id)).map((b) => ({ ...b, removedAt: now }));
      const old = before.filter((b) => b.removedAt);
      d.money.budget = { ...(draft.from ? { from: draft.from } : {}), salary, lines: [...kept, ...gone, ...old] };
    });
    setDraft(null);
    say("Budget saved");
  }

  if (!money.budget) {
    return (
      <section className={`money-card money-budget ${folded ? "is-folded" : ""}`} aria-labelledby="money-budget-title">
        {fold}
        <header className="money-card-head">
          <div>
            <h2 id="money-budget-title" className="money-card-title">
              Budget
            </h2>
            <p className="money-card-sub">Set what each kind of spending gets a month</p>
          </div>
        </header>
        <p className="money-empty">No budget yet. Put in what comes in each month and what you allow for each thing - then you&apos;ll see what&apos;s left as you go, and can save what you don&apos;t spend.</p>
        <button
          type="button"
          className="money-btn is-primary"
          onClick={() => {
            update((d) => {
              if (d.money && !d.money.budget) d.money.budget = { from: today, salary: 0, lines: [] };
            });
            setDraft({ from: today, salary: "", lines: [] });
          }}
        >
          Set up a budget
        </button>
      </section>
    );
  }

  const b = budgetMonth(money, month);
  const saved = savedTotal(money);
  const cats = allCategories(money).filter((c) => c !== CASH_OUT);
  const quietCount = b.rows.filter((r) => r.spent + r.saved === 0).length;
  const allowanceNames = b.rows.filter((r) => r.line.allowance).map((r) => r.line.name.toLowerCase());

  // ── Changing the budget ──
  if (draft) {
    const setLine = (i: number, patch: Partial<Draft["lines"][number]>) => setDraft({ ...draft, lines: draft.lines.map((l, j) => (j === i ? { ...l, ...patch } : l)) });
    const total = draft.lines.filter((l) => !l.allowance).reduce((t, l) => t + (parse(l.amount) ?? 0), 0);
    const left = (parse(draft.salary) ?? 0) - total;
    return (
      <section className="money-card money-budget" aria-labelledby="money-budget-title">
        <form className="money-budget-edit" onSubmit={saveDraft}>
          <header className="money-card-head">
            <div>
              <h2 id="money-budget-title" className="money-card-title">
                Change your budget
              </h2>
              <p className="money-card-sub">
                Lines from salary {dollars(total)} · {left < 0 ? "over the salary by" : "not budgeted"} {dollars(Math.abs(left))}
              </p>
            </div>
          </header>
          <div className="money-budget-edit-top">
            <label className="money-field">
              <span className="money-field-label">Salary a month ({currencySymbol()})</span>
              <input className="dash-input" inputMode="decimal" value={draft.salary} onChange={(e) => setDraft({ ...draft, salary: e.target.value })} />
            </label>
            <label className="money-field">
              <span className="money-field-label">Counting from</span>
              <input type="date" className="dash-input" value={draft.from} max={today} onChange={(e) => setDraft({ ...draft, from: e.target.value })} />
            </label>
          </div>
          <div className="money-budget-edit-lines">
            {draft.lines.map((l, i) => {
              const taken = new Set(draft.lines.filter((_, j) => j !== i).flatMap((x) => x.categories));
              return (
                <div key={l.id} className="money-budget-edit-line">
                  <div className="money-budget-edit-top">
                    <input className="dash-input" value={l.name} onChange={(e) => setLine(i, { name: e.target.value })} aria-label="Name" placeholder="Name" />
                    <label className="money-amount">
                      <span aria-hidden>{currencySymbol()}</span>
                      <input className="dash-input" inputMode="decimal" value={l.amount} onChange={(e) => setLine(i, { amount: e.target.value })} aria-label={`${l.name || "Line"} a month`} />
                    </label>
                  </div>
                  <div className="money-budget-chips" role="group" aria-label="Kinds of spending it covers">
                    {cats.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`money-budget-chip ${l.categories.includes(c) ? "is-on" : ""}`}
                        disabled={taken.has(c)}
                        title={taken.has(c) ? "In another line" : undefined}
                        aria-pressed={l.categories.includes(c)}
                        onClick={() => setLine(i, { categories: l.categories.includes(c) ? l.categories.filter((x) => x !== c) : [...l.categories, c] })}
                      >
                        <i style={{ background: colourFor(money, c) }} aria-hidden />
                        {c}
                      </button>
                    ))}
                  </div>
                  <div className="money-budget-edit-foot">
                    <label className="money-budget-check">
                      <input type="checkbox" checked={l.allowance} onChange={(e) => setLine(i, { allowance: e.target.checked })} />
                      Paid by an allowance on top of the salary
                    </label>
                    <button type="button" className="money-link is-danger" onClick={() => setDraft({ ...draft, lines: draft.lines.filter((_, j) => j !== i) })}>
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <button type="button" className="money-kind is-new money-budget-add" onClick={() => setDraft({ ...draft, lines: [...draft.lines, { id: uid(), name: "", amount: "", categories: [], allowance: false }] })}>
            <span>+ Add a line</span>
          </button>
          <p className="money-hint">Each kind of spending can be in one line. Spending on a kind that isn&apos;t in any line comes out of the salary you haven&apos;t budgeted.</p>
          <div className="money-form-actions">
            <button type="submit" className="money-btn is-primary">
              Save budget
            </button>
            <button type="button" className="money-btn" onClick={() => setDraft(null)}>
              Cancel
            </button>
          </div>
        </form>
      </section>
    );
  }

  // ── A month before the budget began ──
  if (!b.started)
    return (
      <section className={`money-card money-budget ${folded ? "is-folded" : ""}`} aria-labelledby="money-budget-title">
        {fold}
        <header className="money-card-head">
          <div>
            <h2 id="money-budget-title" className="money-card-title">
              Budget
            </h2>
            <p className="money-card-sub">Starts {shortDay(b.from!)}</p>
          </div>
        </header>
        <p className="money-empty">Your budget began on {shortDay(b.from!)} - {name} was before it.</p>
      </section>
    );

  // ── The month against the budget ──
  const restRow = (
    <li key={REST}>
      <button type="button" className={`money-bar money-budget-row ${open === REST ? "is-on" : ""}`} onClick={() => setOpen(open === REST ? null : REST)} aria-expanded={open === REST}>
        <span className="money-bar-name">
          <i style={{ background: "rgb(var(--ok-rgb))" }} aria-hidden />
          Not budgeted
        </span>
        <span className={`money-bar-amount money-budget-figure ${b.restOver > 0 ? "is-over" : ""}`}>{b.restOver > 0 ? `${dollars(b.restOver)} over` : `${dollars(b.restLeft)} left`}</span>
        <span className="money-bar-track" aria-hidden>
          <span
            style={{
              width: `${Math.min(100, b.unplanned > 0 ? ((b.outsideTotal + b.overTotal) / b.unplanned) * 100 : b.outsideTotal + b.overTotal > 0 ? 100 : 0)}%`,
              background: b.restOver > 0 ? "rgb(var(--bad-rgb))" : "rgb(var(--ok-rgb))",
            }}
          />
        </span>
        <span className="money-budget-left">
          {dollars(b.outsideTotal + b.overTotal)} of {dollars(b.unplanned)}
          {b.restSaved > 0 && <span className="money-budget-saved"> · saved {dollars(b.restSaved)}</span>}
        </span>
      </button>
      {open === REST && (
        <div className="money-budget-open">
          <p className="money-hint">
            The salary no line has. {b.outside.length > 0 && <>Spending outside the budget - {b.outside.map((o) => `${o.category} ${dollars(o.amount)}`).join(", ")}. </>}
            {b.overTotal > 0 && <>Going over lines took {dollars(b.overTotal)}. </>}
          </p>
          <div className="money-form-actions">
            {b.restLeft > 0 && (
              <button type="button" className="money-btn is-primary" onClick={() => putAside([{ line: REST, amount: b.restLeft }], `${dollars(b.restLeft)} put aside from what you didn't budget`)}>
                Save {dollars(b.restLeft)}
              </button>
            )}
            {b.outside.length > 0 && (
              <button type="button" className="money-btn" onClick={() => onShow(b.outside.map((o) => o.category))}>
                Show these
              </button>
            )}
            {b.restSaved > 0 && (
              <button type="button" className="money-link" onClick={() => unsave(REST)}>
                Undo saving
              </button>
            )}
          </div>
        </div>
      )}
    </li>
  );

  return (
    <section className={`money-card money-budget ${folded ? "is-folded" : ""}`} aria-labelledby="money-budget-title">
      {fold}
      <header className="money-card-head">
        <div>
          <h2 id="money-budget-title" className="money-card-title">
            Budget
          </h2>
          <p className="money-card-sub">
            {folded
              ? `${name} · ${b.overTotal > 0 ? `${dollars(b.overTotal)} over in some lines · ` : ""}saved ${dollars(saved)}`
              : `${b.from && monthOf(b.from) === month ? `From ${shortDay(b.from)}` : name} · Salary ${dollars(b.salary)}`}
            {!folded && b.allowance > 0 && ` + ${allowanceNames.length === 1 ? `${allowanceNames[0]} allowance` : "allowances"} ${dollars(b.allowance)}`}
          </p>
        </div>
        <button type="button" className="money-link" onClick={() => setDraft(draftOf(money.budget!))}>
          Change
        </button>
      </header>

      {!b.from && month === monthOf(today) && (
        <div className="money-budget-done money-budget-fresh">
          <span>Starting fresh? Only spending from today will count.</span>
          <button type="button" className="money-btn is-primary" onClick={startAgain}>
            Start from today
          </button>
        </div>
      )}
      <dl className="money-budget-sums">
        <div>
          <dt>Left to spend</dt>
          <dd>{dollars(b.rows.reduce((t, r) => t + r.left, 0) + b.restLeft)}</dd>
        </div>
        <div>
          <dt>Cash on hand</dt>
          <dd>{dollars(cashBalance(money))}</dd>
        </div>
        <div>
          <dt>Saved</dt>
          <dd className="is-in">{dollars(saved)}</dd>
        </div>
      </dl>

      <ul className="money-bars">
        {b.rows.map((r) => {
          const c = colourFor(money, r.line.categories[0] ?? r.line.name);
          const isOpen = open === r.line.id;
          if (r.spent + r.saved === 0 && !quiet && open !== r.line.id) return null;
          return (
            <li key={r.line.id}>
              <button type="button" className={`money-bar money-budget-row ${isOpen ? "is-on" : ""}`} onClick={() => setOpen(isOpen ? null : r.line.id)} aria-expanded={isOpen}>
                <span className="money-bar-name">
                  <i style={{ background: c }} aria-hidden />
                  {r.line.name}
                  {r.line.allowance && <span className="money-budget-tag">allowance</span>}
                </span>
                <span className={`money-bar-amount money-budget-figure ${r.over > 0 ? "is-over" : ""}`}>{r.over > 0 ? `${dollars(r.over)} over` : `${dollars(r.left)} left`}</span>
                <span className="money-bar-track money-budget-track" aria-hidden>
                  <span style={{ width: `${Math.min(100, r.line.amount ? (r.spent / r.line.amount) * 100 : r.spent ? 100 : 0)}%`, background: r.over > 0 ? "rgb(var(--bad-rgb))" : c }} />
                  {r.saved > 0 && r.line.amount > 0 && <span className="is-saved" style={{ width: `${Math.min(100, (r.saved / r.line.amount) * 100)}%`, left: `${Math.min(100, (r.spent / r.line.amount) * 100)}%` }} />}
                </span>
                <span className="money-budget-left">
                  {dollars(r.spent)} of {dollars(r.line.amount)}
                  {r.saved > 0 && <span className="money-budget-saved"> · saved {dollars(r.saved)}</span>}
                </span>
              </button>
              {isOpen && (
                <div className="money-budget-open">
                  <p className="money-hint">
                    Covers {r.line.categories.length ? r.line.categories.join(", ") : "no kinds yet - tap Change to pick some"}.
                    {r.over > 0 && r.line.allowance && <> The allowance is used up - the {dollars(r.over)} over comes out of your salary.</>}
                    {r.left > 0 && !done && <> If you save the {dollars(r.left)} now, anything more you spend on it this month shows as over.</>}
                  </p>
                  <div className="money-form-actions">
                    {r.left > 0 && (
                      <button type="button" className="money-btn is-primary" onClick={() => putAside([{ line: r.line.id, amount: r.left }], `${dollars(r.left)} left from ${r.line.name} - put aside`)}>
                        Save {dollars(r.left)}
                      </button>
                    )}
                    {r.line.categories.length > 0 && (
                      <button type="button" className="money-btn" onClick={() => onShow(r.line.categories)}>
                        Show these
                      </button>
                    )}
                    {r.saved > 0 && (
                      <button type="button" className="money-link" onClick={() => unsave(r.line.id)}>
                        Undo saving
                      </button>
                    )}
                  </div>
                </div>
              )}
            </li>
          );
        })}
        {restRow}
      </ul>
      {quietCount > 0 && (
        <button type="button" className="money-link money-more" onClick={() => setQuiet(!quiet)}>
          {quiet ? "Hide the lines with nothing spent" : `${quietCount} more ${quietCount === 1 ? "line" : "lines"} with nothing spent yet`}
        </button>
      )}

      {done && b.canSave > 0 && (
        <div className="money-budget-done">
          <span>
            {name} is done - <strong>{dollars(b.canSave)}</strong> wasn&apos;t spent.
          </span>
          <button
            type="button"
            className="money-btn is-primary"
            onClick={() =>
              putAside(
                [...b.rows.map((r) => ({ line: r.line.id, amount: r.left })), { line: REST, amount: b.restLeft }],
                `${dollars(b.canSave)} from ${name} put aside`,
              )
            }
          >
            Save it all
          </button>
        </div>
      )}

      <div className="money-budget-savings">
        <div>
          <span className="money-label">Savings</span>
          <strong>{dollars(saved)}</strong>
          <span className="money-budget-quiet">in your account, not for spending · tap a line to save what&apos;s left</span>
        </div>
        {saved > 0 && !takeOut && (
          <button type="button" className="money-link" onClick={() => setTakeOut({ amount: "", note: "" })}>
            Take some out
          </button>
        )}
      </div>
      {month === monthOf(today) && b.from && b.from !== today && (
        <button type="button" className="money-link money-budget-again" onClick={startAgain}>
          Start the budget again from today
        </button>
      )}
      {takeOut && (
        <form className="money-form money-budget-takeout" onSubmit={saveTakeOut}>
          <div className="money-form-fields">
            <label className="money-field">
              <span className="money-field-label">How much ({currencySymbol()})</span>
              <input className="dash-input" inputMode="decimal" autoFocus value={takeOut.amount} onChange={(e) => setTakeOut({ ...takeOut, amount: e.target.value })} />
            </label>
            <label className="money-field">
              <span className="money-field-label">What for?</span>
              <input className="dash-input" placeholder="Optional" value={takeOut.note} onChange={(e) => setTakeOut({ ...takeOut, note: e.target.value })} />
            </label>
          </div>
          <div className="money-form-actions">
            <button type="submit" className="money-btn is-primary">
              Take out
            </button>
            <button type="button" className="money-btn" onClick={() => setTakeOut(null)}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
