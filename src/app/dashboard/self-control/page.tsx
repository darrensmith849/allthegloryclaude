"use client";

import { useMemo, useState } from "react";
import { Panel, Stat } from "@/components/dashboard/panel";
import { useDashboard } from "@/lib/dashboard/storage";
import {
  addDays,
  diffDays,
  formatHuman,
  formatShort,
  isSameMonth,
  isToday,
  monthGrid,
  shiftMonth,
  startOfMonth,
  todayISO,
} from "@/lib/dashboard/dates";
import { emptyHabits } from "@/lib/dashboard/types";
import { currentStreak, longestStreak, habitOn } from "@/lib/dashboard/streaks";

const HABIT_KEY = "noPorn"; // single discipline this page focuses on
const CAL_HEAD = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Pretty month label ("June 2026") for the calendar panel header.
function monthLabel(iso: string) {
  const [y, m] = iso.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

// Milestones - small early wins through to a clean year.
const MILESTONES = [
  { target: 7, label: "One week" },
  { target: 14, label: "Two weeks" },
  { target: 30, label: "One month" },
  { target: 60, label: "Two months" },
  { target: 90, label: "Three months" },
  { target: 180, label: "Six months" },
  { target: 365, label: "One year" },
];

export default function SelfControlPage() {
  const { state, update, ready } = useDashboard();
  const today = todayISO();

  // ── Stats ──────────────────────────────────────────────────────
  const cleanStreakNow = currentStreak(state, habitOn(HABIT_KEY));
  const longestEver = longestStreak(state, habitOn(HABIT_KEY));
  const totalCleanDays = Object.values(state.habits).filter((h) => h[HABIT_KEY]).length;

  // ── Month calendar ─────────────────────────────────────────────
  // Cursor = the 1st of whichever month is in view. Starts on the
  // current month and the Prev / Today / Next buttons shift it around.
  const [calCursor, setCalCursor] = useState<string>(() => startOfMonth(today));
  // 42 ISO dates (6 weeks) starting on the Monday on/before the 1st of
  // the cursor's month — same shape the main /dashboard/calendar uses.
  const calGrid = useMemo(() => monthGrid(calCursor), [calCursor]);
  function shiftMonths(n: number) {
    setCalCursor((c) => shiftMonth(c, n));
  }

  // ── Mark today ─────────────────────────────────────────────────
  function setToday(value: boolean) {
    update((d) => {
      const h = d.habits[today] ?? emptyHabits();
      h[HABIT_KEY] = value;
      d.habits[today] = h;
    });
  }
  function toggleDate(date: string) {
    update((d) => {
      const h = d.habits[date] ?? emptyHabits();
      h[HABIT_KEY] = !h[HABIT_KEY];
      d.habits[date] = h;
    });
  }

  // ── Backfill - mark the last N days clean in a single click ────
  const [backfillDays, setBackfillDays] = useState(14);
  const [backfillFrom, setBackfillFrom] = useState<string>(() =>
    addDays(today, -13),
  );
  const [backfillTo, setBackfillTo] = useState<string>(() => today);
  const [confirmMsg, setConfirmMsg] = useState<string | null>(null);

  function backfillLastN() {
    if (!Number.isFinite(backfillDays) || backfillDays < 1) return;
    update((d) => {
      for (let i = 0; i < backfillDays; i++) {
        const date = addDays(today, -i);
        const h = d.habits[date] ?? emptyHabits();
        h[HABIT_KEY] = true;
        d.habits[date] = h;
      }
    });
    setConfirmMsg(`Marked the last ${backfillDays} days clean.`);
  }
  function backfillRange() {
    if (!backfillFrom || !backfillTo || backfillFrom > backfillTo) return;
    const span = diffDays(backfillFrom, backfillTo) + 1;
    update((d) => {
      for (let i = 0; i < span; i++) {
        const date = addDays(backfillFrom, i);
        const h = d.habits[date] ?? emptyHabits();
        h[HABIT_KEY] = true;
        d.habits[date] = h;
      }
    });
    setConfirmMsg(
      `Marked ${span} day${span === 1 ? "" : "s"} clean (${formatShort(
        backfillFrom,
      )} → ${formatShort(backfillTo)}).`,
    );
  }

  if (!ready) return null;

  const cleanToday = Boolean(state.habits[today]?.[HABIT_KEY]);

  return (
    <>
      <div className="dash-pagehead">
        <div>
          <div className="eyebrow eyebrow-amber">Self-control · {formatHuman(today)}</div>
          <h1 className="dash-title mt-1">Clean Streak</h1>
          <div className="dash-subtitle">
            One discipline, focused. Every day you stay clean adds to the chain.
          </div>
        </div>
        <button
          type="button"
          className={`dash-btn ${cleanToday ? "" : "dash-btn-primary"}`}
          onClick={() => setToday(!cleanToday)}
          style={{ padding: "10px 18px" }}
        >
          {cleanToday ? "✓ Today logged clean" : "Mark today clean"}
        </button>
      </div>

      <div className="dash-grid">
        <div className="dash-col-4">
          <Stat
            label="Current streak"
            value={`${cleanStreakNow} d`}
            hint={cleanStreakNow >= 14 ? "Two weeks reached" : `Goal: ${state.settings.goals.cleanStreakTarget} d`}
            tone="ok"
          />
        </div>
        <div className="dash-col-4">
          <Stat
            label="Longest ever"
            value={`${longestEver} d`}
            hint={cleanStreakNow >= longestEver ? "Personal best in motion" : "Beat it."}
            tone="amber"
          />
        </div>
        <div className="dash-col-4">
          <Stat
            label="Total clean days"
            value={totalCleanDays}
            hint="All-time count"
            tone="calm"
          />
        </div>

        {/* Backfill widget - the whole point of this page right now */}
        <div className="dash-col-12">
          <Panel
            eyebrow="Backfill"
            title="Already clean for a while? Add it now."
          >
            <p className="text-[13.5px] text-[var(--colour-ink-soft)] leading-relaxed">
              Mark past days clean retroactively. If you&apos;ve been clean for two weeks before
              you started using this dashboard, set <strong>14</strong> below and tick them in.
            </p>

            <div className="dash-divider" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Quick: last N days */}
              <div>
                <div className="eyebrow eyebrow-amber mb-2">Quick · last N days</div>
                <div className="flex items-end gap-2">
                  <div>
                    <label className="dash-label">Days back from today</label>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      className="dash-input"
                      value={backfillDays}
                      onChange={(e) => setBackfillDays(Number(e.target.value) || 0)}
                      style={{ width: 110 }}
                    />
                  </div>
                  <button
                    type="button"
                    className="dash-btn dash-btn-primary"
                    onClick={backfillLastN}
                  >
                    Mark last {backfillDays} days clean
                  </button>
                </div>
                <div className="text-[11.5px] text-[var(--colour-ink-quiet)] mt-2">
                  Marks {formatShort(addDays(today, -(backfillDays - 1)))} → {formatShort(today)} as clean.
                </div>
              </div>

              {/* Custom date range */}
              <div>
                <div className="eyebrow eyebrow-amber mb-2">Custom range</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="dash-label">From</label>
                    <input
                      type="date"
                      className="dash-input"
                      value={backfillFrom}
                      onChange={(e) => setBackfillFrom(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="dash-label">To</label>
                    <input
                      type="date"
                      className="dash-input"
                      value={backfillTo}
                      onChange={(e) => setBackfillTo(e.target.value)}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  className="dash-btn dash-btn-primary mt-2"
                  onClick={backfillRange}
                >
                  Mark range clean
                </button>
              </div>
            </div>

            {confirmMsg && (
              <div className="mt-3 text-[12.5px] text-[var(--colour-amber-soft)]">
                {confirmMsg}
              </div>
            )}
          </Panel>
        </div>

        {/* Month calendar — date numbers visible, Prev / Today / Next
            navigation, same widget shape as /dashboard/calendar so the
            two pages share a vocabulary. Click any cell to toggle its
            clean state. */}
        <div className="dash-col-8">
          <Panel
            eyebrow={monthLabel(calCursor)}
            title="Calendar"
            action={
              <div className="flex gap-2 items-center">
                <button
                  type="button"
                  className="dash-btn dash-btn-ghost"
                  onClick={() => shiftMonths(-1)}
                  aria-label="Previous month"
                  title="Previous month"
                  style={{ padding: "6px 12px", fontSize: 11 }}
                >
                  ← Prev
                </button>
                <button
                  type="button"
                  className="dash-btn dash-btn-ghost"
                  onClick={() => setCalCursor(startOfMonth(todayISO()))}
                  title="Jump to current month"
                  style={{ padding: "6px 12px", fontSize: 11 }}
                >
                  Today
                </button>
                <button
                  type="button"
                  className="dash-btn dash-btn-ghost"
                  onClick={() => shiftMonths(1)}
                  aria-label="Next month"
                  title="Next month"
                  style={{ padding: "6px 12px", fontSize: 11 }}
                >
                  Next →
                </button>
              </div>
            }
          >
            <div className="dash-cal">
              {CAL_HEAD.map((d) => (
                <div key={d} className="dash-cal-head">
                  {d}
                </div>
              ))}
              {calGrid.map((d) => {
                const clean = Boolean(state.habits[d]?.[HABIT_KEY]);
                const other = !isSameMonth(d, calCursor);
                const dayNum = Number(d.slice(8));
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDate(d)}
                    className={`dash-cal-cell ${other ? "is-other" : ""} ${
                      isToday(d) ? "is-today" : ""
                    } ${clean ? "is-selected" : ""}`}
                    title={`${formatShort(d)} · ${clean ? "clean" : "not yet"}`}
                    aria-label={`${formatShort(d)} ${clean ? "clean" : "not yet"}`}
                  >
                    <div className="dash-cal-day">{dayNum}</div>
                    {clean && (
                      <div className="dash-cal-dots">
                        <span
                          className="dash-cal-dot"
                          style={{ background: "var(--colour-amber)" }}
                          aria-hidden="true"
                        />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="dash-divider" />
            <div className="flex items-center gap-3 text-[11.5px] text-[var(--colour-ink-quiet)] flex-wrap">
              <span className="flex items-center gap-1.5">
                <span
                  className="dash-cal-dot"
                  style={{ background: "var(--colour-amber)" }}
                />
                Clean day
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="dash-cal-cell is-today"
                  style={{ width: 14, height: 14, padding: 0 }}
                />
                Today
              </span>
              <span className="ml-auto">Click any day to toggle.</span>
            </div>
          </Panel>
        </div>

        {/* Milestones */}
        <div className="dash-col-4">
          <Panel eyebrow="Milestones" title="Targets ahead">
            <div className="flex flex-col gap-3">
              {MILESTONES.map((m) => {
                const reached = cleanStreakNow >= m.target;
                const pct = Math.min(100, Math.round((cleanStreakNow / m.target) * 100));
                return (
                  <div key={m.target} className={`dash-reward ${reached ? "is-unlocked" : ""}`}>
                    <div className="flex items-baseline justify-between">
                      <span className="text-[13.5px] text-[var(--colour-ink-strong)]">
                        {m.label}
                      </span>
                      <span className="font-display text-[15px] text-[var(--colour-glow)]">
                        {Math.min(cleanStreakNow, m.target)}/{m.target}
                      </span>
                    </div>
                    <div className="dash-reward-progress">
                      <span style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>

        {/* Encouragement */}
        <div className="dash-col-12">
          <Panel eyebrow="Hold the line" title="A word for the fight">
            <p className="text-[14px] text-[var(--colour-ink-soft)] leading-relaxed italic font-display">
              &ldquo;No temptation has overtaken you that is not common to man. God is faithful,
              and he will not let you be tempted beyond your ability, but with the temptation
              he will also provide the way of escape, that you may be able to endure it.&rdquo;
            </p>
            <div className="text-[12px] text-[var(--colour-amber-soft)] mt-2">1 Corinthians 10:13</div>
          </Panel>
        </div>
      </div>
    </>
  );
}
