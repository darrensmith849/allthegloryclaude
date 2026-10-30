"use client";

// Pieces of the Money page: a balance in big type, account or cash, changing
// one entry, and the Fuel and Gym fees tabs (their totals show on the tabs).

import { useState } from "react";
import type { MoneyEntry, MoneyState } from "@/lib/dashboard/types";
import { allCategories, currencySymbol, dollars, FUEL, fuelLog, GYM, kindLog, kmText, monthName, monthOf, parseKm } from "@/lib/dashboard/money";

export type Editing = { id: string; amount: string; category: string; note: string; date: string; km: string; cash: boolean; where: string };

export const editingFor = (e: MoneyEntry, where: string): Editing => ({
  id: e.id,
  amount: String(e.amount),
  category: e.category,
  note: e.note ?? "",
  date: e.date,
  km: e.km != null ? String(e.km) : "",
  cash: e.cash === true,
  where,
});

// "$2,142" in full, ".00" smaller beside it - the way a banking app shows a balance.
export function Figure({ n, className = "" }: { n: number; className?: string }) {
  const s = dollars(n);
  const dot = s.lastIndexOf(".");
  return (
    <span className={className}>
      {s.slice(0, dot)}
      <span className="money-cents">{s.slice(dot)}</span>
    </span>
  );
}

// Account or cash - for spending ("Paid with") and money coming in ("Into").
export function WalletToggle({ cash, onChange, label }: { cash: boolean; onChange: (cash: boolean) => void; label: string }) {
  return (
    <div className="money-field">
      <span className="money-field-label">{label}</span>
      <span className="money-wallet" role="group" aria-label={label}>
        <button type="button" className={cash ? "" : "is-on"} aria-pressed={!cash} onClick={() => onChange(false)}>
          Account
        </button>
        <button type="button" className={cash ? "is-on" : ""} aria-pressed={cash} onClick={() => onChange(true)}>
          Cash
        </button>
      </span>
    </div>
  );
}

const shortDate = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const parseAmount = (v: string) => {
  const n = Number(String(v).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
};

// One entry, being changed.
export function EntryEdit({
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
  editing: Editing;
  setEditing: (e: Editing | null) => void;
  onSave: (e: React.FormEvent) => void;
  onRemove: () => void;
  today: string;
}) {
  return (
    <form className="money-edit" onSubmit={onSave}>
      <div className="money-form-top">
        <span className="money-form-what">
          {entry.kind === "set"
            ? entry.cash
              ? "Cash set to"
              : "Balance set to"
            : entry.kind === "move"
              ? "Cash out - from your account into cash"
              : entry.kind === "add"
                ? "Money in"
                : "Spent"}
        </span>
      </div>
      <label className="money-amount">
        <span aria-hidden>{currencySymbol()}</span>
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
      <div className="money-form-fields">
        {entry.kind === "spend" && (
          <label className="money-field">
            <span className="money-field-label">Kind</span>
            <select className="dash-input" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>
              {[...new Set([...allCategories(money), editing.category])].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        )}
        {(entry.kind === "spend" || entry.kind === "add") && (
          <WalletToggle cash={editing.cash} onChange={(cash) => setEditing({ ...editing, cash })} label={entry.kind === "add" ? "Into" : "Paid with"} />
        )}
        {entry.kind === "spend" && editing.category === FUEL && (
          <label className="money-field">
            <span className="money-field-label">Mileage (km on the clock)</span>
            <input className="dash-input" inputMode="numeric" placeholder="Mileage" value={editing.km} onChange={(e) => setEditing({ ...editing, km: e.target.value })} />
          </label>
        )}
        {entry.kind !== "set" && (
          <>
            <label className="money-field">
              <span className="money-field-label">Date</span>
              <input type="date" className="dash-input" value={editing.date} max={today} onChange={(e) => setEditing({ ...editing, date: e.target.value })} />
            </label>
            <label className="money-field is-wide">
              <span className="money-field-label">Where / what?</span>
              <input className="dash-input" placeholder="Where / what?" value={editing.note} onChange={(e) => setEditing({ ...editing, note: e.target.value })} />
            </label>
          </>
        )}
      </div>
      <div className="money-form-actions">
        <button type="submit" className="money-btn is-primary">
          Save
        </button>
        <button type="button" className="money-btn" onClick={() => setEditing(null)}>
          Cancel
        </button>
        <button type="button" className="money-link is-danger money-edit-remove" onClick={onRemove}>
          Remove
        </button>
      </div>
    </form>
  );
}

// The ✕ on a row: deletes it straight away (Undo is offered, nothing is wiped).
export function DeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="money-row-delete" onClick={onClick} aria-label="Delete" title="Delete">
      ✕
    </button>
  );
}

const SHOW = 5; // payments listed before "Show all"

// The Fuel tab (with mileage) or the Gym fees tab.
export function KindTab({
  kind,
  money,
  today,
  colour,
  onAdd,
  editing,
  setEditing,
  onSaveEdit,
  onRemove,
}: {
  kind: "fuel" | "gym";
  money: MoneyState;
  today: string;
  colour: string;
  onAdd: (e: Omit<MoneyEntry, "id" | "at">) => void;
  editing: Editing | null;
  setEditing: (e: Editing | null) => void;
  onSaveEdit: (e: React.FormEvent) => void;
  onRemove: (id: string) => void;
}) {
  const fuel = kind === "fuel";
  const category = fuel ? FUEL : GYM;
  const ym = monthOf(today);
  const thisMonth = monthName(ym).split(" ")[0];
  const flog = fuel ? fuelLog(money, ym) : null;
  const log = flog ?? kindLog(money, GYM, ym);
  const [adding, setAdding] = useState<{ amount: string; km: string; date: string; note: string } | null>(null);
  const [all, setAll] = useState(false);

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!adding) return;
    const amount = parseAmount(adding.amount);
    if (amount == null) return;
    const km = fuel ? parseKm(adding.km) : null;
    onAdd({ kind: "spend", amount, category, note: adding.note.trim() || undefined, date: adding.date || today, ...(km != null ? { km } : {}) });
    setAdding(null);
  }

  const shown = all ? log.all : log.all.slice(0, SHOW);

  return (
    <div className="money-kindtab">
      <div className="money-kind-figures">
        <div>
          <span>{thisMonth}</span>
          <strong>{dollars(log.month)}</strong>
        </div>
        {flog ? (
          <>
            <div>
              <span>Driven</span>
              <strong>{flog.km ? kmText(flog.km) : "-"}</strong>
            </div>
            <div>
              <span>Per km</span>
              <strong>{flog.perKm != null ? `${currencySymbol()}${flog.perKm.toFixed(2)}` : "-"}</strong>
            </div>
            <div>
              <span>On the clock</span>
              <strong>{flog.lastKm != null ? kmText(flog.lastKm) : "-"}</strong>
            </div>
          </>
        ) : (
          <>
            <div>
              <span>{ym.slice(0, 4)}</span>
              <strong>{dollars(log.year)}</strong>
            </div>
            <div>
              <span>Last paid</span>
              <strong>{log.all[0] ? shortDate(log.all[0].date) : "-"}</strong>
            </div>
          </>
        )}
      </div>
      {fuel && (flog?.lastKm == null || flog.perKm == null) && (
        <p className="money-hint">Put in the mileage each time you fill up - it works out the km you drive and what the car costs a km.</p>
      )}

      {adding ? (
        <form className="money-form money-kind-form" onSubmit={add}>
          <div className="money-form-top">
            <span className="money-form-what">
              <i style={{ background: colour }} aria-hidden />
              {fuel ? "Filled up" : "Gym fee"}
            </span>
          </div>
          <label className="money-amount">
            <span aria-hidden>{currencySymbol()}</span>
            <input
              className="dash-input"
              inputMode="decimal"
              placeholder="0.00"
              autoFocus
              value={adding.amount}
              onChange={(e) => setAdding({ ...adding, amount: e.target.value })}
              onKeyDown={(e) => e.key === "Escape" && setAdding(null)}
              aria-label="Amount"
            />
          </label>
          <div className="money-form-fields">
            {fuel && (
              <label className="money-field">
                <span className="money-field-label">Mileage (km on the clock)</span>
                <input
                  className="dash-input"
                  inputMode="numeric"
                  placeholder={flog?.lastKm != null ? `Last ${flog.lastKm}` : "Mileage"}
                  value={adding.km}
                  onChange={(e) => setAdding({ ...adding, km: e.target.value })}
                />
              </label>
            )}
            <label className="money-field">
              <span className="money-field-label">Date</span>
              <input type="date" className="dash-input" value={adding.date} max={today} onChange={(e) => setAdding({ ...adding, date: e.target.value || today })} />
            </label>
            <label className="money-field is-wide">
              <span className="money-field-label">{fuel ? "Where?" : "Which gym?"}</span>
              <input
                className="dash-input"
                placeholder="Optional"
                value={adding.note}
                onChange={(e) => setAdding({ ...adding, note: e.target.value })}
              />
            </label>
          </div>
          <div className="money-form-actions">
            <button type="submit" className="money-btn is-primary">
              Take it off
            </button>
            <button type="button" className="money-btn" onClick={() => setAdding(null)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          className="money-add-line"
          onClick={() =>
            setAdding({
              amount: !fuel && log.all[0] ? String(log.all[0].amount) : "",
              km: "",
              date: today,
              note: !fuel && log.all[0]?.note ? log.all[0].note : "",
            })
          }
        >
          <span aria-hidden>+</span> {fuel ? "Add a fill-up" : "Add a gym fee"}
        </button>
      )}

      {log.all.length > 0 && (
        <div className="money-kind-list">
          {shown.map((e) =>
            editing?.id === e.id && editing.where === kind ? (
              <EntryEdit
                key={e.id}
                money={money}
                entry={e}
                editing={editing}
                setEditing={setEditing}
                onSave={onSaveEdit}
                onRemove={() => onRemove(e.id)}
                today={today}
              />
            ) : (
              <div key={e.id} className="money-tx-line">
                <button type="button" className="money-tx is-compact" onClick={() => setEditing(editingFor(e, kind))}>
                  <span className="money-tx-date">{shortDate(e.date)}</span>
                  <span className="money-tx-main">
                    <span className="money-tx-name">{fuel ? (e.km != null ? kmText(e.km) : <em>No mileage</em>) : e.note || "Gym"}</span>
                    {fuel && (flog?.since.get(e.id) != null || e.note) && (
                      <span className="money-tx-meta">
                        {[flog?.since.get(e.id) != null ? `+${kmText(flog.since.get(e.id)!)}` : null, e.note].filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </span>
                  <span className="money-tx-amount">{dollars(e.amount)}</span>
                </button>
                <DeleteButton onClick={() => onRemove(e.id)} />
              </div>
            ),
          )}
          {log.all.length > SHOW && (
            <button type="button" className="money-link money-more" onClick={() => setAll(!all)}>
              {all ? "Show fewer" : `Show all ${log.all.length}`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
