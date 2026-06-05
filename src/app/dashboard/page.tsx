"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { Panel, Stat, Tag } from "@/components/dashboard/panel";
import { useDashboard } from "@/lib/dashboard/storage";
import { todayISO, formatHuman } from "@/lib/dashboard/dates";
import { planDayFor, planForWithOverride } from "@/lib/dashboard/plan";
import {
  emptyHabits,
  resolveHabits,
  resolveSchedule,
  resolveTaskTags,
  ScheduleRow,
} from "@/lib/dashboard/types";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}
import { currentStreak, habitOn } from "@/lib/dashboard/streaks";
import { REMINDERS, reminderForDate } from "@/lib/dashboard/reminders";

export default function DashboardHome() {
  const { state, update, ready } = useDashboard();
  const today = todayISO();
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

  // Bulk operations — flip every visible checkbox in a single click.
  function markAllDone() {
    update((draft) => {
      const h = draft.habits[today] ?? emptyHabits();
      for (const habit of tracked) h[habit.id] = true;
      draft.habits[today] = h;
      if (!draft.scheduleChecks) draft.scheduleChecks = {};
      const day = draft.scheduleChecks[today] ?? {};
      for (const row of schedule) {
        if (!row.habitId) day[row.id] = true;
      }
      draft.scheduleChecks[today] = day;
    });
  }
  function clearAll() {
    update((draft) => {
      const h = draft.habits[today] ?? emptyHabits();
      for (const habit of tracked) h[habit.id] = false;
      draft.habits[today] = h;
      if (!draft.scheduleChecks) draft.scheduleChecks = {};
      draft.scheduleChecks[today] = {};
    });
  }

  // Inline "+ Add block" form state and handler — adds a row to the user's
  // editable schedule so any time of day can be tracked, not just the presets.
  const [addOpen, setAddOpen] = useState(false);
  const [addTime, setAddTime] = useState("11:00");
  const [addTitle, setAddTitle] = useState("");
  function addCustomBlock(e?: React.FormEvent) {
    e?.preventDefault();
    if (!addTime.trim() || !addTitle.trim()) return;
    const [hh, mm] = addTime.split(":").map(Number);
    const hour = (hh || 0) + (mm || 0) / 60;
    const row: ScheduleRow = {
      id: `s-${uid()}`,
      time: addTime,
      hour,
      title: addTitle.trim(),
      sub: "",
    };
    update((draft) => {
      // Persist into settings.schedule so the row sticks across days.
      const rows = [...(draft.settings.schedule ?? []), row].sort((a, b) => a.hour - b.hour);
      draft.settings.schedule = rows;
    });
    setAddTitle("");
    setAddOpen(false);
  }

  // ── Inline-edit a schedule row right on the Today page (double-click) ──
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editTime, setEditTime] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editSub, setEditSub] = useState("");
  function startEditing(row: ScheduleRow) {
    setEditingRowId(row.id);
    setEditTime(row.time);
    setEditTitle(row.title);
    setEditSub(row.sub);
  }
  function saveEditing() {
    if (!editingRowId) return;
    const [hh, mm] = editTime.split(":").map(Number);
    const hour = (hh || 0) + (mm || 0) / 60;
    update((draft) => {
      const rows = (draft.settings.schedule ?? []).map((r) =>
        r.id === editingRowId
          ? { ...r, time: editTime, hour, title: editTitle.trim() || r.title, sub: editSub }
          : r,
      );
      rows.sort((a, b) => a.hour - b.hour);
      draft.settings.schedule = rows;
    });
    setEditingRowId(null);
  }
  function deleteEditing() {
    if (!editingRowId) return;
    update((draft) => {
      draft.settings.schedule = (draft.settings.schedule ?? []).filter(
        (r) => r.id !== editingRowId,
      );
    });
    setEditingRowId(null);
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
          <div className="flex gap-2 items-center flex-wrap justify-end">
            <button
              type="button"
              className="dash-btn dash-btn-primary"
              style={{ padding: "7px 14px", fontSize: 11 }}
              onClick={markAllDone}
            >
              ✓ Mark all done
            </button>
            <button
              type="button"
              className="dash-btn dash-btn-ghost"
              style={{ padding: "7px 14px", fontSize: 11 }}
              onClick={clearAll}
            >
              Clear all
            </button>
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

        {/* Reminders card — all five in a row, today's highlighted. */}
        <div className="dash-col-12">
          <div className="dash-reminder-frame">
            <div className="dash-reminder-frame-eyebrow">
              <span className="eyebrow eyebrow-amber">Reminders · all five</span>
              <Link
                href="/dashboard/reminders"
                className="dash-reminder-badge-arrow"
                style={{ textDecoration: "none" }}
              >
                Open page →
              </Link>
            </div>
            <div className="dash-reminder-strip">
              {REMINDERS.map((r) => {
                const isToday = r.id === reminder.id;
                return (
                  <Link
                    key={r.id}
                    href="/dashboard/reminders"
                    className={`dash-reminder-strip-tile ${isToday ? "is-today" : ""}`}
                    aria-label={r.short}
                  >
                    <Image
                      src={r.src}
                      alt={r.short}
                      fill
                      sizes="(min-width: 1280px) 230px, (min-width: 720px) 22vw, 50vw"
                      className="object-cover object-center"
                      priority={isToday}
                      loading={isToday ? "eager" : "lazy"}
                    />
                    {isToday && (
                      <span className="dash-reminder-strip-badge">
                        <span className="eyebrow eyebrow-amber">Today</span>
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Daily schedule — every row is a button. Click anywhere on a row to tick it. */}
        <div className="dash-col-8">
          <Panel
            eyebrow="Daily rhythm · double-click any row to edit"
            title="Today's schedule"
            action={
              <button
                type="button"
                className="dash-btn dash-btn-primary"
                style={{ padding: "6px 12px", fontSize: 11 }}
                onClick={() => setAddOpen((v) => !v)}
              >
                {addOpen ? "Close" : "+ Add block"}
              </button>
            }
          >
            {addOpen && (
              <form onSubmit={addCustomBlock} className="dash-add-block">
                <input
                  type="time"
                  className="dash-input"
                  value={addTime}
                  onChange={(e) => setAddTime(e.target.value)}
                  style={{ width: 110 }}
                  required
                />
                <input
                  className="dash-input"
                  placeholder="What's at this time?"
                  value={addTitle}
                  onChange={(e) => setAddTitle(e.target.value)}
                  style={{ flex: 1 }}
                  autoFocus
                  required
                />
                <button type="submit" className="dash-btn dash-btn-primary">
                  Add
                </button>
              </form>
            )}

            <div className="dash-schedule">
              {schedule.map((row) => {
                const done = rowDone(row.id, row.habitId);
                if (editingRowId === row.id) {
                  return (
                    <div key={row.id} className="dash-schedule-row dash-schedule-row-edit">
                      <input
                        type="time"
                        className="dash-input"
                        style={{ width: 110 }}
                        value={editTime}
                        onChange={(e) => setEditTime(e.target.value)}
                      />
                      <div className="flex flex-col gap-1 flex-1">
                        <input
                          className="dash-input"
                          placeholder="Title"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEditing();
                            if (e.key === "Escape") setEditingRowId(null);
                          }}
                        />
                        <input
                          className="dash-input"
                          placeholder="Subtitle"
                          value={editSub}
                          onChange={(e) => setEditSub(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEditing();
                            if (e.key === "Escape") setEditingRowId(null);
                          }}
                        />
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          className="dash-btn dash-btn-primary"
                          style={{ padding: "6px 12px", fontSize: 11 }}
                          onClick={saveEditing}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="dash-btn dash-btn-ghost"
                          style={{ padding: "6px 12px", fontSize: 11 }}
                          onClick={() => setEditingRowId(null)}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="dash-btn dash-btn-danger"
                          style={{ padding: "6px 12px", fontSize: 11 }}
                          onClick={deleteEditing}
                          title="Delete this block"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                }
                return (
                  <button
                    type="button"
                    key={row.id}
                    onClick={() => toggleScheduleRow(row.id, row.habitId)}
                    onDoubleClick={(e) => {
                      e.preventDefault();
                      // Cancel the toggle effect of the double-click: the
                      // 1st click toggled it, the 2nd toggled it back to its
                      // original state, so net = no change. Just open editor.
                      startEditing(row);
                    }}
                    aria-pressed={done}
                    className={`dash-schedule-row dash-schedule-row-btn ${done ? "is-done" : ""}`}
                    title="Click to mark done · Double-click to edit"
                  >
                    <div className="dash-schedule-time">{row.time}</div>
                    <div className="text-left">
                      <div className="dash-schedule-title">{row.title}</div>
                      <div className="dash-schedule-sub">{row.sub}</div>
                    </div>
                    <span className={`dash-check-dot ${done ? "is-on" : ""}`}>
                      {done ? "✓" : ""}
                    </span>
                  </button>
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
