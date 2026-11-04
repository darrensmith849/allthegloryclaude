"use client";

// To do - family's own list (her dashboard; Daniel's has Tasks). Things to
// do once stay ticked; things done every day are ticked afresh each morning,
// and each day's ticks are kept, so the week shows how it went. Saved with
// the rest of her dashboard; removing keeps the item (with Undo), never wipes it.

import { useEffect, useRef, useState } from "react";
import { useDashboard } from "@/lib/dashboard/storage";
import type { TodoItem, TodoState } from "@/lib/dashboard/types";
import { localDate, uid } from "@/lib/dashboard/money";

const EMPTY: TodoState = { items: [], days: {} };
const dayOf = (iso: string) => localDate(new Date(iso));
const shiftDay = (d: string, by: number) => {
  const x = new Date(`${d}T12:00:00`);
  x.setDate(x.getDate() + by);
  return localDate(x);
};
const fullDay = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
const shortDay = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("en-GB", { weekday: "short" });

export default function TodoPage() {
  const { state, update, ready } = useDashboard();
  const todo = state.todo ?? EMPTY;
  // A new day at midnight, even with the page left open.
  const [today, setToday] = useState(localDate());
  useEffect(() => {
    const t = window.setInterval(() => setToday(localDate()), 60_000);
    return () => window.clearInterval(t);
  }, []);
  const [title, setTitle] = useState("");
  const [daily, setDaily] = useState(false);
  const [editing, setEditing] = useState<{ id: string; title: string } | null>(null);
  const [showDone, setShowDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<{ text: string; undo?: () => void } | null>(null);
  const toastTimer = useRef<number | null>(null);

  function say(text: string, undo?: () => void) {
    setToast({ text, undo });
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 8000);
  }
  const change = (fn: (t: TodoState) => void) =>
    update((d) => {
      d.todo ??= { items: [], days: {} };
      fn(d.todo);
    });

  function add(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim().replace(/\s+/g, " ").slice(0, 140);
    if (!t) return inputRef.current?.focus();
    const item: TodoItem = { id: uid(), title: t, daily, at: new Date().toISOString() };
    change((x) => void x.items.push(item));
    setTitle("");
    inputRef.current?.focus();
  }

  function tick(item: TodoItem) {
    if (item.daily) {
      change((x) => {
        const list = x.days[today] ?? [];
        x.days[today] = list.includes(item.id) ? list.filter((i) => i !== item.id) : [...list, item.id];
      });
      return;
    }
    change((x) => {
      const y = x.items.find((i) => i.id === item.id);
      if (!y) return;
      if (y.doneAt) delete y.doneAt;
      else y.doneAt = new Date().toISOString();
    });
  }

  function remove(item: TodoItem) {
    change((x) => {
      const y = x.items.find((i) => i.id === item.id);
      if (y) y.deletedAt = new Date().toISOString();
    });
    setEditing(null);
    say(`“${item.title}” taken off your list`, () =>
      change((x) => {
        const y = x.items.find((i) => i.id === item.id);
        if (y) delete y.deletedAt;
      }),
    );
  }

  function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const t = editing.title.trim().replace(/\s+/g, " ").slice(0, 140);
    if (t)
      change((x) => {
        const y = x.items.find((i) => i.id === editing.id);
        if (y) y.title = t;
      });
    setEditing(null);
  }

  if (!ready) return <p className="dash-word-hint">Opening…</p>;

  const live = todo.items.filter((i) => !i.deletedAt);
  const dailyItems = live.filter((i) => i.daily);
  const ticked = new Set(todo.days[today] ?? []);
  const open = live.filter((i) => !i.daily && !i.doneAt);
  const done = live.filter((i) => !i.daily && i.doneAt).sort((a, b) => b.doneAt!.localeCompare(a.doneAt!));
  const doneToday = done.filter((i) => dayOf(i.doneAt!) === today);
  const total = dailyItems.length + open.length + doneToday.length;
  const count = dailyItems.filter((i) => ticked.has(i.id)).length + doneToday.length;
  // The week: each day's every-day things ticked, out of those on the list that day.
  const week = Array.from({ length: 7 }, (_, k) => shiftDay(today, k - 6)).map((d) => {
    const there = todo.items.filter((i) => i.daily && dayOf(i.at) <= d && (!i.deletedAt || dayOf(i.deletedAt) > d));
    const did = (todo.days[d] ?? []).filter((id) => there.some((i) => i.id === id)).length;
    return { d, did, of: there.length };
  });

  const row = (item: TodoItem, isDone: boolean) =>
    editing?.id === item.id ? (
      <form key={item.id} className="todo-row is-editing" onSubmit={saveEdit}>
        <input
          className="dash-input"
          autoFocus
          value={editing.title}
          onChange={(e) => setEditing({ ...editing, title: e.target.value })}
          onKeyDown={(e) => e.key === "Escape" && setEditing(null)}
          aria-label="Change it"
        />
        <button type="submit" className="money-btn is-primary">
          Save
        </button>
        <button type="button" className="money-btn" onClick={() => setEditing(null)}>
          Cancel
        </button>
      </form>
    ) : (
      <div key={item.id} className={`todo-row money-tx-line ${isDone ? "is-done" : ""}`}>
        <button
          type="button"
          className="todo-check"
          onClick={() => tick(item)}
          aria-pressed={isDone}
          aria-label={`${isDone ? "Untick" : "Tick off"}: ${item.title}`}
        >
          {isDone ? "✓" : ""}
        </button>
        <button type="button" className="todo-title" onClick={() => setEditing({ id: item.id, title: item.title })} title="Tap to change it">
          {item.title}
          {!item.daily && isDone && item.doneAt && dayOf(item.doneAt) !== today && <em> · done {shortDay(dayOf(item.doneAt))}</em>}
        </button>
        <button type="button" className="money-row-delete" onClick={() => remove(item)} aria-label={`Remove: ${item.title}`} title="Remove">
          ✕
        </button>
      </div>
    );

  return (
    <div className="money todo">
      <header className="money-pagehead">
        <div>
          <div className="eyebrow eyebrow-amber">Private to you</div>
          <h1 className="dash-title money-title">To do</h1>
          <p className="money-tagline">Tick it off - every day starts fresh.</p>
        </div>
      </header>

      <section className="money-card todo-card" aria-labelledby="todo-today">
        <header className="todo-head">
          <div>
            <span className="money-label">Today</span>
            <h2 id="todo-today">{fullDay(today)}</h2>
          </div>
          {total > 0 && (
            <div className="todo-progress" aria-label={`${count} of ${total} done`}>
              <strong>
                {count}
                <span> of {total}</span>
              </strong>
              <span className="todo-progress-bar" aria-hidden>
                <span style={{ width: `${(count / total) * 100}%` }} />
              </span>
            </div>
          )}
        </header>

        <form className="todo-add" onSubmit={add}>
          <input
            ref={inputRef}
            className="dash-input"
            placeholder={daily ? "Something to do every day…" : "Something to do…"}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-label="Add something to do"
          />
          <div className="money-seg" role="group" aria-label="How often">
            <button type="button" className={daily ? "" : "is-on"} aria-pressed={!daily} onClick={() => setDaily(false)}>
              Once
            </button>
            <button type="button" className={daily ? "is-on" : ""} aria-pressed={daily} onClick={() => setDaily(true)}>
              Every day
            </button>
          </div>
          <button type="submit" className="money-btn is-primary">
            Add
          </button>
        </form>

        {live.length === 0 ? (
          <p className="money-empty">Nothing here yet - add the first thing above. Choose “Every day” for things like your reading or a walk; they&apos;re fresh again each morning.</p>
        ) : (
          <>
            {dailyItems.length > 0 && (
              <div className="todo-group">
                <div className="money-day-head">
                  <span>Every day</span>
                  <span>
                    {dailyItems.filter((i) => ticked.has(i.id)).length} of {dailyItems.length}
                  </span>
                </div>
                {dailyItems.map((i) => row(i, ticked.has(i.id)))}
              </div>
            )}
            {(open.length > 0 || doneToday.length > 0) && (
              <div className="todo-group">
                <div className="money-day-head">
                  <span>To do</span>
                  <span>{open.length ? `${open.length} left` : "all done"}</span>
                </div>
                {open.map((i) => row(i, false))}
                {doneToday.map((i) => row(i, true))}
              </div>
            )}
            {done.length > doneToday.length && (
              <div className="todo-group">
                <button type="button" className="money-link money-more" onClick={() => setShowDone(!showDone)} aria-expanded={showDone}>
                  {showDone ? "Hide what's done" : `Done before today (${done.length - doneToday.length})`}
                </button>
                {showDone && done.filter((i) => dayOf(i.doneAt!) !== today).map((i) => row(i, true))}
              </div>
            )}
            <p className="money-hint">Tap a tick to tick it off (or untick it), and the words to change them.</p>
          </>
        )}
      </section>

      {dailyItems.length > 0 && (
        <section className="money-card todo-card" aria-labelledby="todo-week">
          <header className="todo-head">
            <div>
              <span className="money-label">This week</span>
              <h2 id="todo-week">Every day, day by day</h2>
            </div>
          </header>
          <div className="todo-week">
            {week.map((w) => (
              <div key={w.d} className={`todo-week-day ${w.d === today ? "is-today" : ""} ${w.of && w.did === w.of ? "is-full" : ""}`} title={fullDay(w.d)}>
                <span>{w.d === today ? "Today" : shortDay(w.d)}</span>
                <strong>{w.of ? `${w.did}/${w.of}` : "–"}</strong>
                <i aria-hidden>
                  <b style={{ height: `${w.of ? (w.did / w.of) * 100 : 0}%` }} />
                </i>
              </div>
            ))}
          </div>
        </section>
      )}

      {toast && (
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
      )}
    </div>
  );
}
