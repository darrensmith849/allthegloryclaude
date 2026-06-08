"use client";

import { useEffect, useMemo, useState } from "react";
import { Panel, Stat } from "@/components/dashboard/panel";
import { useDashboard } from "@/lib/dashboard/storage";
import {
  addDays,
  diffDays,
  formatShort,
  isToday,
  todayISO,
} from "@/lib/dashboard/dates";
import {
  DEFAULT_FAST_CATEGORIES,
  defaultFast,
  FastCategory,
} from "@/lib/dashboard/types";

function uid() {
  return Math.random().toString(36).slice(2, 8);
}

export default function FastPage() {
  const { state, update, ready } = useDashboard();
  const today = todayISO();

  // Auto-initialise on first visit so "from today" works without any
  // setup step. If the user wants to restart later, the Reset button
  // wipes it and the next render re-initialises with today as Day 1.
  useEffect(() => {
    if (ready && !state.fast) {
      update((d) => {
        if (!d.fast) d.fast = defaultFast(today);
      });
    }
  }, [ready, state.fast, today, update]);

  const fast = state.fast;

  // ── Inline form state for editing categories ─────────────────────
  const [newCatLabel, setNewCatLabel] = useState("");

  if (!ready || !fast) {
    return (
      <div className="text-[13px] text-[var(--colour-ink-quiet)] p-6">
        Starting your 40-day fast…
      </div>
    );
  }

  // ── Derived values ───────────────────────────────────────────────
  const dayIndexZero = Math.max(0, diffDays(fast.startDate, today)); // 0-based
  const dayNumber = Math.min(fast.days, dayIndexZero + 1); // 1..40 (capped)
  const daysRemaining = Math.max(0, fast.days - dayNumber);
  const endDate = addDays(fast.startDate, fast.days - 1);
  const isComplete = dayIndexZero >= fast.days;

  // For each completed day, count it as "clean" only if EVERY category was
  // kept. That's a strict but honest metric for a fast.
  const dayCleanMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (let i = 0; i < fast.days; i++) {
      const date = addDays(fast.startDate, i);
      const dayChecks = fast.checks[date] ?? {};
      const allClean = fast.categories.every((c) => dayChecks[c.id]);
      map[date] = allClean;
    }
    return map;
  }, [fast]);

  // Current streak — consecutive clean days counting backwards from
  // today (or from the last day of the fast if it's over).
  const currentStreak = useMemo(() => {
    let n = 0;
    const endIdx = Math.min(dayIndexZero, fast.days - 1);
    for (let i = endIdx; i >= 0; i--) {
      const date = addDays(fast.startDate, i);
      if (dayCleanMap[date]) n++;
      else break;
    }
    return n;
  }, [dayCleanMap, dayIndexZero, fast]);

  const cleanDaysTotal = useMemo(
    () => Object.values(dayCleanMap).filter(Boolean).length,
    [dayCleanMap],
  );

  const progressPct = Math.round((cleanDaysTotal / fast.days) * 100);

  // ── Mutators ────────────────────────────────────────────────────
  function toggleCheck(date: string, categoryId: string) {
    update((d) => {
      if (!d.fast) return;
      const day = d.fast.checks[date] ?? {};
      day[categoryId] = !day[categoryId];
      d.fast.checks[date] = day;
    });
  }
  function markAllCleanForDay(date: string) {
    update((d) => {
      if (!d.fast) return;
      const day: Record<string, boolean> = {};
      for (const c of d.fast.categories) day[c.id] = true;
      d.fast.checks[date] = day;
    });
  }
  function clearAllForDay(date: string) {
    update((d) => {
      if (!d.fast) return;
      d.fast.checks[date] = {};
    });
  }
  function addCategory() {
    const label = newCatLabel.trim();
    if (!label) return;
    update((d) => {
      if (!d.fast) return;
      d.fast.categories.push({
        id: `cat-${uid()}`,
        label,
      });
    });
    setNewCatLabel("");
  }
  function removeCategory(catId: string) {
    if (!confirm("Remove this category from the fast? Your tick marks for it will be deleted.")) return;
    update((d) => {
      if (!d.fast) return;
      d.fast.categories = d.fast.categories.filter((c) => c.id !== catId);
      for (const date of Object.keys(d.fast.checks)) {
        delete d.fast.checks[date][catId];
      }
    });
  }
  function resetFast() {
    if (
      !confirm(
        "Reset the 40-day fast? This wipes every tick and starts a new fast from today.",
      )
    )
      return;
    update((d) => {
      d.fast = defaultFast(todayISO());
    });
  }
  function restoreDefaultCategories() {
    if (!confirm("Restore the default categories (Social media, Movies & TV, YouTube, News)? Custom categories you've added will be removed.")) return;
    update((d) => {
      if (!d.fast) return;
      d.fast.categories = DEFAULT_FAST_CATEGORIES.map((c) => ({ ...c }));
    });
  }

  // ── Today's quick-check row ─────────────────────────────────────
  const todayChecks = fast.checks[today] ?? {};
  const todayInWindow = dayIndexZero >= 0 && dayIndexZero < fast.days;

  // ── Day rows (all 40) ───────────────────────────────────────────
  const dayRows = Array.from({ length: fast.days }, (_, i) => {
    const date = addDays(fast.startDate, i);
    return {
      idx: i,
      date,
      isToday: isToday(date),
      isFuture: diffDays(today, date) > 0,
      clean: dayCleanMap[date],
      checks: fast.checks[date] ?? {},
    };
  });

  return (
    <>
      <div className="dash-pagehead">
        <div>
          <div className="eyebrow eyebrow-amber">40-Day Fast</div>
          <h1 className="dash-title mt-1">
            {isComplete ? "Fast complete" : `Day ${dayNumber} of ${fast.days}`}
          </h1>
          <div className="dash-subtitle">
            Started {formatShort(fast.startDate)} · ends {formatShort(endDate)}
            {!isComplete && ` · ${daysRemaining} day${daysRemaining === 1 ? "" : "s"} to go`}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="dash-btn dash-btn-ghost"
            onClick={resetFast}
            title="Wipe every tick and start a new 40-day fast from today"
          >
            Reset fast
          </button>
        </div>
      </div>

      <div className="dash-grid">
        {/* LEFT: progress, today's check, and the 40-day grid */}
        <div className="dash-col-8">
          <Panel
            eyebrow="Progress"
            title={`${cleanDaysTotal} / ${fast.days} days fully clean`}
          >
            <div className="dash-progress-bar">
              <span style={{ width: `${progressPct}%` }} />
            </div>
            <div className="flex gap-4 mt-4 flex-wrap">
              <Stat
                label="Current streak"
                value={`${currentStreak}d`}
                hint="Consecutive days where every category was kept"
              />
              <Stat
                label="Clean days"
                value={`${cleanDaysTotal}`}
                hint={`${progressPct}% of the fast`}
              />
              <Stat
                label="Days remaining"
                value={`${daysRemaining}`}
                hint={isComplete ? "All done — well fought." : "Days left in the 40-day window"}
              />
            </div>
          </Panel>

          {todayInWindow && (
            <Panel
              eyebrow="Today"
              title="Mark each category"
              action={
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="dash-btn"
                    style={{ padding: "6px 12px", fontSize: 11 }}
                    onClick={() => markAllCleanForDay(today)}
                  >
                    ✓ All clean
                  </button>
                  <button
                    type="button"
                    className="dash-btn dash-btn-ghost"
                    style={{ padding: "6px 12px", fontSize: 11 }}
                    onClick={() => clearAllForDay(today)}
                  >
                    Clear
                  </button>
                </div>
              }
            >
              <div className="flex flex-wrap gap-2">
                {fast.categories.map((c) => {
                  const on = Boolean(todayChecks[c.id]);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCheck(today, c.id)}
                      className="dash-tag"
                      style={{
                        cursor: "pointer",
                        background: on ? "rgba(216,178,90,0.16)" : "transparent",
                        color: on ? "var(--colour-glow)" : "var(--colour-ink-quiet)",
                        borderColor: on
                          ? "rgba(216,178,90,0.45)"
                          : "rgba(255,255,255,0.10)",
                      }}
                    >
                      {on ? "✓ " : ""}
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </Panel>
          )}

          <Panel eyebrow="The 40 days" title="Every day, every category">
            <div className="flex flex-col gap-1.5">
              {dayRows.map((row) => (
                <div
                  key={row.date}
                  className={`flex items-center gap-2 rounded-md px-2 py-1.5 ${
                    row.isToday ? "bg-white/5 border border-[rgba(216,178,90,0.25)]" : ""
                  } ${row.isFuture ? "opacity-50" : ""}`}
                >
                  <div className="w-12 text-[11.5px] text-[var(--colour-ink-quiet)] shrink-0">
                    Day {row.idx + 1}
                  </div>
                  <div className="w-20 text-[11.5px] text-[var(--colour-ink-soft)] shrink-0">
                    {formatShort(row.date)}
                  </div>
                  <div className="flex flex-wrap gap-1.5 flex-1">
                    {fast.categories.map((c) => {
                      const on = Boolean(row.checks[c.id]);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          disabled={row.isFuture}
                          onClick={() => toggleCheck(row.date, c.id)}
                          className="dash-tag"
                          style={{
                            cursor: row.isFuture ? "not-allowed" : "pointer",
                            padding: "3px 8px",
                            fontSize: 10.5,
                            background: on
                              ? "rgba(216,178,90,0.16)"
                              : "transparent",
                            color: on
                              ? "var(--colour-glow)"
                              : "var(--colour-ink-quiet)",
                            borderColor: on
                              ? "rgba(216,178,90,0.45)"
                              : "rgba(255,255,255,0.08)",
                          }}
                        >
                          {on ? "✓ " : ""}
                          {c.label}
                        </button>
                      );
                    })}
                  </div>
                  {row.clean && !row.isFuture && (
                    <div className="text-[10px] tracking-[0.18em] uppercase text-[var(--colour-amber-soft)] shrink-0">
                      Clean
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* RIGHT: scripture anchor + category editor */}
        <div className="dash-col-4">
          <Panel eyebrow="A word for the fast" title="Matthew 4:1–2">
            <p className="text-[13px] text-[var(--colour-ink-soft)] italic leading-relaxed">
              Then was Jesus led up of the Spirit into the wilderness to be
              tempted of the devil. And when he had fasted forty days and
              forty nights, he was afterward an hungred.
            </p>
            <p className="text-[12px] text-[var(--colour-ink-quiet)] mt-4 leading-relaxed">
              Forty days is the biblical pattern — long enough for the
              appetite to die and the spirit to be sharpened. Tick each
              category off honestly; one slip doesn&apos;t kill the fast,
              it just resets the streak counter.
            </p>
          </Panel>

          <Panel
            eyebrow="Categories"
            title="What you&rsquo;re fasting from"
            action={
              <button
                type="button"
                onClick={restoreDefaultCategories}
                className="text-[11px] text-[var(--colour-ink-quiet)] hover:text-[var(--colour-glow)] transition"
                title="Restore Social media, Movies & TV, YouTube, News"
              >
                Restore defaults
              </button>
            }
          >
            <div className="flex flex-col gap-1.5 mb-3">
              {fast.categories.map((c: FastCategory) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-2 text-[13px] text-[var(--colour-ink-soft)] px-2 py-1.5 rounded bg-white/[0.02]"
                >
                  <span>{c.label}</span>
                  <button
                    type="button"
                    onClick={() => removeCategory(c.id)}
                    className="dash-row-delete"
                    aria-label={`Remove ${c.label}`}
                    title="Remove this category"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {fast.categories.length === 0 && (
                <div className="text-[12px] text-[var(--colour-ink-quiet)]">
                  No categories yet — add one below.
                </div>
              )}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addCategory();
              }}
              className="flex gap-2"
            >
              <input
                className="dash-input"
                placeholder="Add a category (e.g. Sugar)"
                value={newCatLabel}
                onChange={(e) => setNewCatLabel(e.target.value)}
                style={{ flex: 1 }}
              />
              <button
                type="submit"
                className="dash-btn dash-btn-primary"
                style={{ padding: "8px 14px", fontSize: 11 }}
              >
                Add
              </button>
            </form>
          </Panel>
        </div>
      </div>
    </>
  );
}
