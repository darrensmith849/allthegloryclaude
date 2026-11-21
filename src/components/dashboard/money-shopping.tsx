"use client";

// The shopping list on the Money page: type what's needed, tick it off once
// it's in the trolley. Ticked things stay below as "Got before" - one tap puts
// one back on the list for next time.

import { useRef, useState } from "react";
import type { DashboardState, MoneyState, ShoppingItem } from "@/lib/dashboard/types";
import { uid } from "@/lib/dashboard/money";

type Update = (fn: (d: DashboardState) => void) => void;

export function ShoppingCard({
  money,
  update,
  fold,
  folded = false,
}: {
  money: MoneyState;
  update: Update;
  fold?: React.ReactNode;
  folded?: boolean;
}) {
  const [text, setText] = useState("");
  const [allBefore, setAllBefore] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const items = (money.shopping ?? []).filter((x) => !x.deletedAt);
  const need = items.filter((x) => x.need).sort((a, b) => a.at.localeCompare(b.at));
  const before = items.filter((x) => !x.need).sort((a, b) => (b.gotAt ?? "").localeCompare(a.gotAt ?? ""));
  const shownBefore = allBefore ? before : before.slice(0, 12);

  const change = (id: string, fn: (x: ShoppingItem) => void) =>
    update((d) => {
      const x = d.money?.shopping?.find((y) => y.id === id);
      if (x) fn(x);
    });

  function add(e: React.FormEvent) {
    e.preventDefault();
    // "milk, bread, eggs" adds three.
    const names = text
      .split(/[,\n]/)
      .map((t) => t.trim().replace(/\s+/g, " ").slice(0, 60))
      .filter(Boolean);
    if (!names.length) return;
    update((d) => {
      if (!d.money) return;
      const list = (d.money.shopping ??= []);
      for (const name of names) {
        // Already there (got before, or removed): back on the list, not twice.
        const same = list.find((x) => x.name.toLowerCase() === name.toLowerCase());
        if (same) {
          same.need = true;
          delete same.deletedAt;
        } else list.push({ id: uid(), name, need: true, at: new Date().toISOString() });
      }
    });
    setText("");
    inputRef.current?.focus();
  }

  const got = (id: string) =>
    change(id, (x) => {
      x.need = false;
      x.gotAt = new Date().toISOString();
    });
  const again = (id: string) =>
    change(id, (x) => {
      x.need = true;
      x.at = new Date().toISOString();
    });
  const remove = (id: string) => change(id, (x) => void (x.deletedAt = new Date().toISOString()));

  return (
    <section className={`money-card money-shopping ${folded ? "is-folded" : ""}`} aria-labelledby="money-shopping-title">
      {fold}
      <header className="money-card-head">
        <div>
          <h2 id="money-shopping-title" className="money-card-title">
            Shopping list
          </h2>
          <p className="money-card-sub">{need.length ? `${need.length} to get` : "Nothing to get"}</p>
        </div>
      </header>

      <form className="money-shop-add" onSubmit={add}>
        <input
          ref={inputRef}
          className="dash-input"
          placeholder="Add something - e.g. milk, bread"
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="Something to get"
          enterKeyHint="done"
        />
        <button type="submit" className="money-btn is-primary" aria-label="Add to the list">
          Add
        </button>
      </form>

      {need.length > 0 && (
        <ul className="money-shop-list">
          {need.map((x) => (
            <li key={x.id} className="money-shop-item">
              <button type="button" className="money-shop-tick" onClick={() => got(x.id)} aria-label={`Got ${x.name}`}>
                <span className="money-shop-box" aria-hidden />
                <span className="money-shop-name">{x.name}</span>
              </button>
              <button type="button" className="money-row-delete money-shop-remove" onClick={() => remove(x.id)} aria-label={`Remove ${x.name}`}>
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {before.length > 0 && (
        <div className="money-shop-before">
          <span className="money-label">Got before - tap to need it again</span>
          <div className="money-shop-chips">
            {shownBefore.map((x) => (
              <span key={x.id} className="money-shop-chip">
                <button type="button" onClick={() => again(x.id)} aria-label={`Put ${x.name} back on the list`}>
                  <span aria-hidden>+</span> {x.name}
                </button>
                <button type="button" className="money-shop-chip-x" onClick={() => remove(x.id)} aria-label={`Forget ${x.name}`}>
                  ✕
                </button>
              </span>
            ))}
          </div>
          {before.length > 12 && (
            <button type="button" className="money-link money-more" onClick={() => setAllBefore(!allBefore)}>
              {allBefore ? "Show fewer" : `Show all ${before.length}`}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
