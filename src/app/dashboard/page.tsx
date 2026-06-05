"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Panel, Stat, Tag } from "@/components/dashboard/panel";
import { useDashboard } from "@/lib/dashboard/storage";
import { todayISO, formatHuman } from "@/lib/dashboard/dates";
import { planDayFor, planForWithOverride } from "@/lib/dashboard/plan";
import {
  emptyHabits,
  resolveHabits,
  resolveSchedule,
  resolveTaskTags,
} from "@/lib/dashboard/types";
import { currentStreak, habitOn } from "@/lib/dashboard/streaks";
import { reminderForDate } from "@/lib/dashboard/reminders";

function useCurrentHour() {
  const [hour, setHour] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setHour(d.getHours() + d.getMinutes() / 60);
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);
  return hour;
}

export default function DashboardHome() {
  const { state, update, ready } = useDashboard();
  const today = todayISO();
  const currentHour = useCurrentHour();
  const habits = state.habits[today] ?? emptyHabits();
  const rowChecks = state.scheduleChecks?.[today] ?? {};
  const planDay = planDayFor(today, state.settings.startDate, state.settings.startPlanDay);
  const plan = planForWithOverride(planDay, state.settings.planOverrides);
  const bibleStreak = currentStreak(state, habitOn("bibleRead"));
  const cleanStreak = currentStreak(state, habitOn("noPorn"));

  const schedule = resolveSchedule(state.settings);
  const tracked = resolveHabits(state.settings);
  const TAGS = resolveTaskTags(state.settings);
  const reminder = reminderForDate(today);

  const currentRowIndex = (() => {
    if (currentHour == null) return -1;
    for (let i = schedule.length - 1; i >= 0; i--) {
      if (currentHour >= schedule[i].hour) return i;
    }
    return -1;
  })();

  const todayTasks = state.tasks.filter((t) => !t.done).slice(0, 6);
  const completedToday = state.tasks.filter(
    (t) => t.done && t.completedAt?.slice(0, 10) === today,
  ).length;

  // ── Per-row + per-habit toggles ────────────────────────────────
  function toggleHabit(key: string) {
    update((draft) => {
      const h = draft.habits[today] ?? emptyHabits();
      h[key] = !h[key];
      draft.habits[today] = h;
    });
  }
  function toggleScheduleRow(rowId: string, habitId?: string) {
    // If the row is linked to a habit, the habit IS the source of truth.
    if (habitId) {
      toggleHabit(habitId);
      return;
    }
    update((draft) => {
      if (!draft.scheduleChecks) draft.scheduleChecks = {};
      const day = draft.scheduleChecks[today] ?? {};
      day[rowId] = !day[rowId];
      draft.scheduleChecks[today] = day;
    });
  }
  function rowDone(rowId: string, habitId?: string): boolean {
    if (habitId) return Boolean(habits[habitId]);
    return Boolean(rowChecks[rowId]);
  }

  // ── Daily completion percentage ───────────────────────────────
  // Score = every schedule row that's done +
  //         every tracked habit that's done AND not already counted as
  //         a schedule row (i.e. surfaced only in the Habits panel).
  // Total = schedule rows + un-surfaced habits.
  // That way each visible checkbox contributes exactly 1 to the count.
  const completion = useMemo(() => {
    const scheduleHabitIds = new Set(schedule.map((r) => r.habitId).filter(Boolean));
    const habitsNotOnSchedule = tracked.filter((h) => !scheduleHabitIds.has(h.id));
    const total = schedule.length + habitsNotOnSchedule.length;
    let done = 0;
    for (const r of schedule) if (rowDone(r.id, r.habitId)) done++;
    for (const h of habitsNotOnSchedule) if (habits[h.id]) done++;
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    return { done, total, pct };
  }, [schedule, tracked, habits, rowChecks]);

  if (!ready) return null;

  return (
    <>
      <div className="dash-pagehead">
        <div>
          <div className="eyebrow eyebrow-amber">{formatHuman(today)}</div>
          <h1 className="dash-title mt-1">Good morning, {state.settings.greetingName || "friend"}</h1>
          <div className="dash-subtitle">
            Day {planDay} of 365 in the chronological plan · {plan.passage}
          </div>
        </div>
        <div className="flex gap-2">
          <Link className="dash-btn" href="/dashboard/bible">
            Open today&apos;s reading →
          </Link>
        </div>
      </div>

      {/* Daily completion bar — fills as you tick boxes through the day */}
      <div className="dash-progress-card">
        <div className="dash-progress-head">
          <div>
            <div className="eyebrow eyebrow-amber">Today&apos;s progress</div>
            <div className="dash-progress-stat">
              <span className="font-display">{completion.pct}%</span>
              <span className="text-[12.5px] text-[var(--colour-ink-quiet)] ml-2">
                {completion.done} / {completion.total} done
              </span>
            </div>
          </div>
          <div className="text-[11.5px] text-[var(--colour-ink-quiet)] max-w-[260px] text-right hidden md:block">
            Every checkbox below counts. Tick what&apos;s done; the bar fills.
          </div>
        </div>
        <div className="dash-progress-bar">
          <span style={{ width: `${completion.pct}%` }} />
        </div>
      </div>

      <div className="dash-grid">
        <div className="dash-col-3">
          <Stat label="Word streak" value={`${bibleStreak} days`} hint="Bible read consecutively" />
        </div>
        <div className="dash-col-3">
          <Stat
            label="Clean streak"
            value={`${cleanStreak} days`}
            hint={`Goal: ${state.settings.goals.cleanStreakTarget}`}
            tone="ok"
          />
        </div>
        <div className="dash-col-3">
          <Stat
            label="Tasks done today"
            value={completedToday}
            hint={`${state.tasks.filter((t) => !t.done).length} open`}
            tone="calm"
          />
        </div>
        <div className="dash-col-3">
          <Stat
            label="Plan day"
            value={`${planDay}/365`}
            hint={`${Math.round((planDay / 365) * 100)}% through the year`}
          />
        </div>

        {/* Reminder card */}
        <div className="dash-col-12">
          <Link
            href="/dashboard/reminders"
            className="dash-reminder-frame block"
            aria-label="See all reminders"
          >
            <div className="dash-reminder-frame-eyebrow">
              <span className="eyebrow eyebrow-amber">Today&apos;s reminder</span>
              <span className="dash-reminder-badge-arrow">See all →</span>
            </div>
            <div className="dash-reminder-frame-image">
              <Image
                src={reminder.src}
                alt={reminder.short}
                fill
                sizes="280px"
                className="object-contain"
                priority
              />
            </div>
          </Link>
        </div>

        {/* Daily schedule — every row checkable */}
        <div className="dash-col-8">
          <Panel
            eyebrow="Daily rhythm"
            title="Today's schedule"
            action={
              <Link href="/dashboard/settings#schedule" className="text-[12px] eyebrow">
                Edit →
              </Link>
            }
          >
            <div className="dash-schedule">
              {schedule.map((row, i) => {
                const isNow = i === currentRowIndex;
                const done = rowDone(row.id, row.habitId);
                return (
                  <div
                    key={row.id}
                    className={`dash-schedule-row ${isNow ? "is-now" : ""} ${
                      done ? "is-done" : ""
                    }`}
                  >
                    <div className="dash-schedule-time">{row.time}</div>
                    <div>
                      <div className="dash-schedule-title">{row.title}</div>
                      <div className="dash-schedule-sub">{row.sub}</div>
                    </div>
                    <button
                      type="button"
                      className={`dash-check ${done ? "is-on" : ""}`}
                      style={{ minWidth: 110 }}
                      onClick={() => toggleScheduleRow(row.id, row.habitId)}
                      aria-pressed={done}
                    >
                      <span className="dash-check-dot">{done ? "✓" : ""}</span>
                      <span className="dash-check-label" style={{ fontSize: 12 }}>
                        {done ? "Done" : "Mark"}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>

        {/* Today's habits */}
        <div className="dash-col-4">
          <Panel
            eyebrow="Disciplines"
            title="Today's habits"
            action={
              <Link href="/dashboard/settings#habits" className="text-[12px] eyebrow">
                Edit →
              </Link>
            }
          >
            <div className="flex flex-col gap-2">
              {tracked.map((h) => {
                const on = Boolean(habits[h.id]);
                return (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => toggleHabit(h.id)}
                    className={`dash-check ${on ? "is-on" : ""}`}
                  >
                    <span className="dash-check-dot">{on ? "✓" : ""}</span>
                    <span className="dash-check-label">{h.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="dash-divider" />
            <Link href="/dashboard/habits" className="text-[12.5px] text-[var(--colour-amber-soft)]">
              See all streaks →
            </Link>
          </Panel>
        </div>

        {/* Today's reading preview */}
        <div className="dash-col-6">
          <Panel eyebrow={`Chronological — Day ${planDay}`} title={plan.passage}>
            <p className="text-[14px] text-[var(--colour-ink-soft)] leading-relaxed">
              {plan.theme ?? ""}
            </p>
            <div className="dash-divider" />
            <div className="flex flex-wrap gap-2">
              <Link href="/dashboard/bible" className="dash-btn dash-btn-primary">
                Open reading &amp; journal
              </Link>
              <Link href="/dashboard/word-study" className="dash-btn">
                Study a word
              </Link>
            </div>
          </Panel>
        </div>

        {/* Open tasks preview */}
        <div className="dash-col-6">
          <Panel
            eyebrow="What's next"
            title="Open tasks"
            action={
              <Link href="/dashboard/tasks" className="text-[12px] eyebrow">
                Open list →
              </Link>
            }
          >
            {todayTasks.length === 0 ? (
              <div className="dash-empty">
                No open tasks. Quiet day, or quiet week? Add one in the Tasks tab.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {todayTasks.map((t) => {
                  const tag = TAGS.find((x) => x.id === t.tag) ?? TAGS[0];
                  return (
                    <div key={t.id} className="dash-task">
                      <button
                        className="dash-check-dot"
                        onClick={() =>
                          update((d) => {
                            const task = d.tasks.find((x) => x.id === t.id);
                            if (task) {
                              task.done = true;
                              task.completedAt = new Date().toISOString();
                            }
                          })
                        }
                        aria-label="Complete task"
                      />
                      <span className="dash-task-title">{t.title}</span>
                      <Tag tone={tag.tone}>{tag.label}</Tag>
                      <span className="dash-task-due">{t.due ?? ""}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
