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

  // ─── All hooks must run on every render. Anything that would otherwise
  //     sit behind an early-return goes here, guarded with null-safe
  //     defaults so it works whether or not the fast has been seeded yet.

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

  // Inline form state for editing categories.
  const [newCatLabel, setNewCatLabel] = useState("");
  // Per-row inline rename state — only one category is being edited at a time.
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatLabel, setEditingCatLabel] = useState("");

  const fast = state.fast;

  // Derived values — computed even when fast is null, returning safe
  // defaults so the hooks below stay stable across renders.
  const dayIndexZero = fast
    ? Math.max(0, diffDays(fast.startDate, today))
    : 0; // 0-based
  const fastDays = fast?.days ?? 40;
  const dayNumber = Math.min(fastDays, dayIndexZero + 1); // 1..40 (capped)
  const daysRemaining = Math.max(0, fastDays - dayNumber);
  const endDate = fast ? addDays(fast.startDate, fast.days - 1) : today;
  const isComplete = fast ? dayIndexZero >= fast.days : false;

  // For each day of the fast, count it as "clean" only if EVERY category
  // was kept. Strict but honest metric.
  const dayCleanMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    if (!fast) return map;
    for (let i = 0; i < fast.days; i++) {
      const date = addDays(fast.startDate, i);
      const dayChecks = fast.checks[date] ?? {};
      const allClean =
        fast.categories.length > 0 && fast.categories.every((c) => dayChecks[c.id]);
      map[date] = allClean;
    }
    return map;
  }, [fast]);

  // Current streak — consecutive clean days counting backwards from
  // today (or from the last day of the fast if it's over).
  const currentStreak = useMemo(() => {
    if (!fast) return 0;
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

  // ─── Now that every hook has been called, it's safe to short-circuit ─
  if (!ready || !fast) {
    return (
      <div className="text-[13px] text-[var(--colour-ink-quiet)] p-6">
        Starting your 40-day fast…
      </div>
    );
  }

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
  function startEditingCategory(c: FastCategory) {
    setEditingCatId(c.id);
    setEditingCatLabel(c.label);
  }
  function saveEditingCategory() {
    if (!editingCatId) return;
    const newLabel = editingCatLabel.trim();
    if (!newLabel) {
      // Empty rename = treat as cancel rather than wipe the category's
      // label out from under the user.
      setEditingCatId(null);
      return;
    }
    update((d) => {
      if (!d.fast) return;
      d.fast.categories = d.fast.categories.map((c) =>
        c.id === editingCatId ? { ...c, label: newLabel } : c,
      );
    });
    setEditingCatId(null);
  }
  function cancelEditingCategory() {
    setEditingCatId(null);
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

      {/* The Vow — the major framing for every visit. This is the first
          thing the eye lands on after the page header, so the daily ticks
          below are read in the right spirit. Amber gradient + display
          font + italic supporting line so the whole banner reads as
          "the reason for the fast" rather than just a quote. */}
      <section
        className="dash-panel"
        style={{
          marginBottom: 18,
          borderColor: "rgba(216,178,90,0.35)",
          background:
            "linear-gradient(135deg, rgba(216,178,90,0.10), rgba(216,178,90,0.02) 60%, transparent)",
        }}
      >
        <div className="eyebrow eyebrow-amber">The Vow</div>
        <h2 className="font-display mt-2 text-[22px] md:text-[28px] leading-tight tracking-tight text-white/95">
          This is not the wilderness I am entering — it is the wilderness
          I am coming <span className="italic text-[var(--colour-amber)]">out of</span>.
        </h2>
        <p className="font-display italic mt-3 text-[15px] md:text-[17px] leading-relaxed text-[var(--colour-amber-soft)]">
          For 40 days I am with the Lord — to honour Him, serve Him, learn
          more about Him, and draw closer to Him.
        </p>
      </section>

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
          <Panel eyebrow="A word for the fast" title="Drawing near">
            <p className="text-[12.5px] uppercase tracking-[0.16em] text-[var(--colour-amber-soft)]">
              James 4:8
            </p>
            <p className="text-[13px] text-[var(--colour-ink-soft)] italic leading-relaxed mt-1">
              Draw nigh to God, and he will draw nigh to you.
            </p>

            <p className="text-[12.5px] uppercase tracking-[0.16em] text-[var(--colour-amber-soft)] mt-5">
              Hosea 6:1, 3
            </p>
            <p className="text-[13px] text-[var(--colour-ink-soft)] italic leading-relaxed mt-1">
              Come, and let us return unto the LORD … Then shall we know,
              if we follow on to know the LORD: his going forth is
              prepared as the morning; and he shall come unto us as the
              rain, as the latter and former rain unto the earth.
            </p>

            <p className="text-[12.5px] uppercase tracking-[0.16em] text-[var(--colour-amber-soft)] mt-5">
              Matthew 4:2
            </p>
            <p className="text-[13px] text-[var(--colour-ink-soft)] italic leading-relaxed mt-1">
              And when he had fasted forty days and forty nights …
            </p>

            <p className="text-[12px] text-[var(--colour-ink-quiet)] mt-5 leading-relaxed">
              Forty days is the biblical pattern. These aren&apos;t empty
              days — they&apos;re days to honour Him, serve Him, learn Him,
              and draw closer. Tick each category off honestly; one slip
              doesn&apos;t kill the fast, it just resets the streak counter.
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
              {fast.categories.map((c: FastCategory) => {
                const isEditing = editingCatId === c.id;
                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-2 text-[13px] text-[var(--colour-ink-soft)] px-2 py-1.5 rounded bg-white/[0.02]"
                  >
                    {isEditing ? (
                      <>
                        <input
                          className="dash-input"
                          value={editingCatLabel}
                          onChange={(e) => setEditingCatLabel(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEditingCategory();
                            if (e.key === "Escape") cancelEditingCategory();
                          }}
                          autoFocus
                          style={{ flex: 1 }}
                        />
                        <button
                          type="button"
                          onClick={saveEditingCategory}
                          className="dash-btn dash-btn-primary"
                          style={{ padding: "5px 10px", fontSize: 10.5 }}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditingCategory}
                          className="dash-btn dash-btn-ghost"
                          style={{ padding: "5px 10px", fontSize: 10.5 }}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Whole label is also clickable for fast rename — */}
                        {/* the ✎ button is the redundant discoverable hint.  */}
                        <button
                          type="button"
                          onClick={() => startEditingCategory(c)}
                          className="text-left flex-1 hover:text-[var(--colour-glow)] transition truncate"
                          title="Click to rename"
                        >
                          {c.label}
                        </button>
                        <button
                          type="button"
                          onClick={() => startEditingCategory(c)}
                          className="dash-row-edit-btn"
                          aria-label={`Rename ${c.label}`}
                          title="Rename this category"
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          onClick={() => removeCategory(c.id)}
                          className="dash-row-delete"
                          aria-label={`Remove ${c.label}`}
                          title="Remove this category"
                        >
                          ✕
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
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
