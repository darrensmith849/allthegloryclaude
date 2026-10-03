"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Panel, Tag } from "@/components/dashboard/panel";
import { useDashboard } from "@/lib/dashboard/storage";
import { useWords } from "@/lib/dashboard/words-store";
import {
  formatHuman,
  formatShort,
  isSameMonth,
  isToday,
  monthGrid,
  shiftMonth,
  startOfMonth,
  todayISO,
} from "@/lib/dashboard/dates";
import {
  emptyHabits,
  getScheduleForDate,
  ScheduleRow,
  resolveTaskTags,
  DayHabits,
  Task,
} from "@/lib/dashboard/types";
import { languageLabel, wordDate } from "@/lib/dashboard/words";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

const HEAD = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MINI_HEAD = ["M", "T", "W", "T", "F", "S", "S"];

// Done-state dots, read from the per-day habits map that habit-linked
// schedule rows and the Guitar / Book session logs write to.
const DOT_MAP: { id: string; colour: string; title: string }[] = [
  { id: "bibleRead", colour: "#d8b25a", title: "The Word" },
  { id: "gym", colour: "#a4c2f4", title: "Gym" },
  { id: "worship", colour: "#f1d7a6", title: "Worship" },
  { id: "guitar", colour: "#cdb4db", title: "Guitar" },
  { id: "bookWriting", colour: "#cca88c", title: "Book" },
];
// Extra dot for days a word was saved to the journal.
const WORD_DOT = { colour: "#f4f0e8", title: "Word saved" };

type ViewMode = "month" | "quarter" | "year";

function monthLabel(iso: string) {
  const [y, m] = iso.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}
function shortMonth(iso: string) {
  const [y, m] = iso.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: "short" });
}
function dayScore(h: DayHabits | undefined, savedWord: boolean): number {
  let n = savedWord ? 1 : 0;
  if (!h) return n;
  for (const dot of DOT_MAP) if (h[dot.id]) n++;
  return n;
}

export default function CalendarPage() {
  const { state, update, ready } = useDashboard();
  const { words } = useWords();
  const [view, setView] = useState<ViewMode>("month");
  const [cursor, setCursor] = useState(() => startOfMonth(todayISO()));
  const [selected, setSelected] = useState<string>(() => todayISO());

  const selectedHabits = state.habits[selected] ?? emptyHabits();
  const selectedRowChecks = state.scheduleChecks?.[selected] ?? {};
  const schedule = getScheduleForDate(selected, state.settings, state.scheduleExtras);
  const TAGS = resolveTaskTags(state.settings);

  // Days with at least one word saved - drives the extra calendar dot.
  const wordDays = useMemo(() => new Set(words.map(wordDate)), [words]);

  // Per-day completion percentage (mirrors the Today progress bar logic, but
  // for whatever day the user picked).
  const rowDoneForSelected = (rowId: string, habitId?: string): boolean => {
    if (habitId) return Boolean(selectedHabits[habitId]);
    return Boolean(selectedRowChecks[rowId]);
  };
  const completionDone = schedule.filter((r) => rowDoneForSelected(r.id, r.habitId)).length;
  const completionTotal = schedule.length;
  const completionPct =
    completionTotal === 0 ? 0 : Math.round((completionDone / completionTotal) * 100);

  // Quick-add task for the selected day
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskTag, setNewTaskTag] = useState<string>("personal");

  // Day-review data - everything logged for the selected day, across all modules.
  const tasksCompletedThatDay = useMemo(
    () => state.tasks.filter((t) => t.done && t.completedAt?.slice(0, 10) === selected),
    [state.tasks, selected],
  );
  const tasksDueThatDay = useMemo(
    () => state.tasks.filter((t) => !t.done && t.due === selected),
    [state.tasks, selected],
  );
  const tasksCreatedThatDay = useMemo(
    () => state.tasks.filter((t) => t.createdAt.slice(0, 10) === selected),
    [state.tasks, selected],
  );
  const guitarThatDay = useMemo(
    () => state.guitar.filter((s) => s.date === selected),
    [state.guitar, selected],
  );
  const bookThatDay = useMemo(
    () => state.book.sessions.filter((s) => s.date === selected),
    [state.book.sessions, selected],
  );
  const wordsThatDay = useMemo(
    () => words.filter((w) => wordDate(w) === selected),
    [words, selected],
  );

  function toggleHabitForSelected(habitId: string) {
    update((d) => {
      const h = d.habits[selected] ?? emptyHabits();
      h[habitId] = !h[habitId];
      d.habits[selected] = h;
    });
  }
  function toggleScheduleRowForSelected(rowId: string, habitId?: string) {
    if (habitId) {
      toggleHabitForSelected(habitId);
      return;
    }
    update((d) => {
      if (!d.scheduleChecks) d.scheduleChecks = {};
      const day = d.scheduleChecks[selected] ?? {};
      day[rowId] = !day[rowId];
      d.scheduleChecks[selected] = day;
    });
  }
  // Per-date schedule additions - only visible on the selected day.
  const [extraTime, setExtraTime] = useState("");
  const [extraTitle, setExtraTitle] = useState("");

  // Inline edit of any schedule row (extras + global) - mirrors the Today
  // page edit UX so reordering can be done by changing a row's time.
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editTime, setEditTime] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editSub, setEditSub] = useState("");
  const isExtraId = (id: string) => id.startsWith("x-");
  function startEditing(row: ScheduleRow) {
    setEditingRowId(row.id);
    setEditTime(row.time);
    setEditTitle(row.title);
    setEditSub(row.sub ?? "");
  }
  function saveEditing() {
    if (!editingRowId) return;
    const [hh, mm] = editTime.split(":").map(Number);
    const hour = (hh || 0) + (mm || 0) / 60;
    const patch = (r: ScheduleRow): ScheduleRow =>
      r.id === editingRowId
        ? { ...r, time: editTime, hour, title: editTitle.trim() || r.title, sub: editSub }
        : r;
    update((d) => {
      if (isExtraId(editingRowId)) {
        if (!d.scheduleExtras) d.scheduleExtras = {};
        d.scheduleExtras[selected] = (d.scheduleExtras[selected] ?? []).map(patch);
      } else {
        d.settings.schedule = (d.settings.schedule ?? []).map(patch);
      }
    });
    setEditingRowId(null);
  }
  function addScheduleExtraForSelected(e?: React.FormEvent) {
    e?.preventDefault();
    if (!extraTime.trim() || !extraTitle.trim()) return;
    const [hh, mm] = extraTime.split(":").map(Number);
    const hour = (hh || 0) + (mm || 0) / 60;
    const row: ScheduleRow = {
      id: `x-${uid()}`,
      time: extraTime,
      hour,
      title: extraTitle.trim(),
      sub: "",
    };
    update((d) => {
      if (!d.scheduleExtras) d.scheduleExtras = {};
      d.scheduleExtras[selected] = [...(d.scheduleExtras[selected] ?? []), row];
    });
    setExtraTime("");
    setExtraTitle("");
  }
  function removeScheduleExtra(rowId: string) {
    update((d) => {
      if (!d.scheduleExtras) return;
      d.scheduleExtras[selected] = (d.scheduleExtras[selected] ?? []).filter(
        (r) => r.id !== rowId,
      );
    });
  }
  // Delete from the global settings.schedule - removes the row from every
  // day it would have appeared on. Confirms first so it's never accidental.
  function removeGlobalScheduleRow(rowId: string, title: string) {
    const ok = confirm(
      `Delete "${title}" from the schedule? It will no longer appear on any day. Use Settings → Schedule editor to re-add it later.`,
    );
    if (!ok) return;
    update((d) => {
      d.settings.schedule = (d.settings.schedule ?? []).filter((r) => r.id !== rowId);
    });
  }
  function deleteRow(rowId: string, title: string) {
    if (rowId.startsWith("x-")) {
      removeScheduleExtra(rowId);
    } else {
      removeGlobalScheduleRow(rowId, title);
    }
  }

  function addTaskForSelected(e?: React.FormEvent) {
    e?.preventDefault();
    if (!newTaskTitle.trim()) return;
    const t: Task = {
      id: uid(),
      title: newTaskTitle.trim(),
      tag: newTaskTag,
      done: false,
      createdAt: new Date().toISOString(),
      due: selected,
    };
    update((d) => {
      d.tasks.unshift(t);
    });
    setNewTaskTitle("");
  }
  function toggleTaskDone(taskId: string) {
    update((d) => {
      const t = d.tasks.find((x) => x.id === taskId);
      if (!t) return;
      t.done = !t.done;
      t.completedAt = t.done ? new Date().toISOString() : undefined;
    });
  }

  // Views
  const grid = useMemo(() => monthGrid(cursor), [cursor]);
  const quarter = useMemo(() => {
    const months: { start: string; grid: string[] }[] = [];
    for (let off = -1; off <= 1; off++) {
      const start = shiftMonth(cursor, off);
      months.push({ start, grid: monthGrid(start) });
    }
    return months;
  }, [cursor]);
  const year = useMemo(() => {
    const months: { start: string; grid: string[] }[] = [];
    const [y] = cursor.split("-").map(Number);
    for (let m = 1; m <= 12; m++) {
      const start = `${y}-${String(m).padStart(2, "0")}-01`;
      months.push({ start, grid: monthGrid(start) });
    }
    return months;
  }, [cursor]);

  function shiftMonths(n: number) {
    setCursor((c) => shiftMonth(c, n));
  }
  function shiftYears(n: number) {
    const [y, m] = cursor.split("-").map(Number);
    setCursor(`${y + n}-${String(m).padStart(2, "0")}-01`);
  }

  if (!ready) return null;

  const headerLabel =
    view === "month"
      ? monthLabel(cursor)
      : view === "quarter"
      ? `${shortMonth(quarter[0].start)} – ${shortMonth(quarter[2].start)} ${cursor.slice(0, 4)}`
      : cursor.slice(0, 4);

  return (
    <>
      <div className="dash-pagehead">
        <div>
          <div className="eyebrow eyebrow-amber">{view} view</div>
          <h1 className="dash-title mt-1">Calendar</h1>
          <div className="dash-subtitle">
            Click any day to see everything you logged - schedule, words, tasks, sessions.
          </div>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <div className="dash-toggle">
            <button className={view === "month" ? "is-on" : ""} onClick={() => setView("month")}>
              Month
            </button>
            <button className={view === "quarter" ? "is-on" : ""} onClick={() => setView("quarter")}>
              Quarter
            </button>
            <button className={view === "year" ? "is-on" : ""} onClick={() => setView("year")}>
              Year
            </button>
          </div>
          <button
            className="dash-btn dash-btn-ghost"
            onClick={() => (view === "year" ? shiftYears(-1) : shiftMonths(view === "quarter" ? -3 : -1))}
          >
            ← Prev
          </button>
          <button className="dash-btn dash-btn-ghost" onClick={() => setCursor(startOfMonth(todayISO()))}>
            Today
          </button>
          <button
            className="dash-btn dash-btn-ghost"
            onClick={() => (view === "year" ? shiftYears(1) : shiftMonths(view === "quarter" ? 3 : 1))}
          >
            Next →
          </button>
        </div>
      </div>

      <div className="dash-grid">
        <div className="dash-col-8">
          <Panel eyebrow={headerLabel} title="The view">
            {view === "month" && (
              <>
                <div className="dash-cal">
                  {HEAD.map((d) => (
                    <div key={d} className="dash-cal-head">
                      {d}
                    </div>
                  ))}
                  {grid.map((d) => {
                    const h = state.habits[d];
                    const other = !isSameMonth(d, cursor);
                    const isSel = d === selected;
                    return (
                      <button
                        key={d}
                        className={`dash-cal-cell ${other ? "is-other" : ""} ${
                          isToday(d) ? "is-today" : ""
                        } ${isSel ? "is-selected" : ""}`}
                        onClick={() => setSelected(d)}
                      >
                        <div className="dash-cal-day">{Number(d.slice(8))}</div>
                        <div className="dash-cal-dots">
                          {h &&
                            DOT_MAP.filter((dot) => h[dot.id]).map((dot) => (
                              <span
                                key={dot.id}
                                className="dash-cal-dot"
                                title={dot.title}
                                style={{ background: dot.colour }}
                              />
                            ))}
                          {wordDays.has(d) && (
                            <span
                              className="dash-cal-dot"
                              title={WORD_DOT.title}
                              style={{ background: WORD_DOT.colour }}
                            />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="dash-divider" />
                <div className="flex flex-wrap gap-3 text-[11.5px] text-[var(--colour-ink-quiet)]">
                  {[...DOT_MAP, { id: "word", ...WORD_DOT }].map((dot) => (
                    <span key={dot.id} className="flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full" style={{ background: dot.colour }} />
                      {dot.title}
                    </span>
                  ))}
                </div>
              </>
            )}

            {view === "quarter" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {quarter.map((m) => (
                  <MiniMonth
                    key={m.start}
                    start={m.start}
                    grid={m.grid}
                    habits={state.habits}
                    wordDays={wordDays}
                    selected={selected}
                    onSelect={setSelected}
                  />
                ))}
              </div>
            )}

            {view === "year" && (
              <div className="dash-year-grid">
                {year.map((m) => (
                  <MiniMonth
                    key={m.start}
                    start={m.start}
                    grid={m.grid}
                    habits={state.habits}
                    wordDays={wordDays}
                    selected={selected}
                    onSelect={setSelected}
                  />
                ))}
              </div>
            )}
          </Panel>
        </div>

        {/* DAY-REVIEW PANEL */}
        <div className="dash-col-4">
          <Panel eyebrow="Selected day" title={formatHuman(selected)}>
            {/* Per-day completion bar - fills as you tick schedule blocks */}
            <div className="dash-mini-progress">
              <div className="dash-mini-progress-head">
                <span className="eyebrow eyebrow-amber">Day progress</span>
                <span className="text-[12.5px]">
                  <span className="font-display text-[var(--colour-glow)]">{completionPct}%</span>
                  <span className="text-[var(--colour-ink-quiet)] ml-2">
                    {completionDone}/{completionTotal}
                  </span>
                </span>
              </div>
              <div className="dash-progress-bar">
                <span style={{ width: `${completionPct}%` }} />
              </div>
            </div>

            <div className="flex flex-col gap-4 mt-4">
              {/* Daily schedule for this day - every row checkable.
                  Filtered by day-of-week, with per-date extras at the end. */}
              <section>
                <div className="eyebrow mb-2">Daily schedule</div>
                {schedule.length === 0 ? (
                  <div className="text-[12px] text-[var(--colour-ink-quiet)] mb-2">
                    Nothing scheduled for this day yet. Add something below.
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {schedule.map((row) => {
                      const done = rowDoneForSelected(row.id, row.habitId);
                      const isExtra = row.id.startsWith("x-");
                      if (editingRowId === row.id) {
                        return (
                          <div key={row.id} className="flex items-center gap-1.5">
                            <input
                              type="time"
                              className="dash-input"
                              style={{ width: 90 }}
                              value={editTime}
                              onChange={(e) => setEditTime(e.target.value)}
                            />
                            <input
                              className="dash-input"
                              style={{ flex: 1 }}
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveEditing();
                                if (e.key === "Escape") setEditingRowId(null);
                              }}
                              placeholder="Title"
                            />
                            <button
                              type="button"
                              className="dash-btn dash-btn-primary"
                              style={{ padding: "6px 10px", fontSize: 11 }}
                              onClick={saveEditing}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              className="dash-btn dash-btn-ghost"
                              style={{ padding: "6px 10px", fontSize: 11 }}
                              onClick={() => setEditingRowId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        );
                      }
                      return (
                        <div key={row.id} className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => toggleScheduleRowForSelected(row.id, row.habitId)}
                            className={`dash-mini-row flex-1 ${done ? "is-done" : ""}`}
                            title="Click to mark done · Use ✎ to change the time and re-order"
                          >
                            <span className="dash-mini-row-time">{row.time}</span>
                            <span className="dash-mini-row-title">{row.title}</span>
                            <span className={`dash-check-dot ${done ? "is-on" : ""}`}>
                              {done ? "✓" : ""}
                            </span>
                          </button>
                          <button
                            type="button"
                            className="dash-row-edit-btn"
                            onClick={() => startEditing(row)}
                            title="Edit time / title (change time to re-order)"
                            aria-label="Edit row"
                          >
                            ✎
                          </button>
                          <button
                            type="button"
                            className="dash-row-delete"
                            onClick={() => deleteRow(row.id, row.title)}
                            title={
                              isExtra
                                ? "Remove this one-off entry"
                                : "Delete this row from every day (Settings to re-add)"
                            }
                            aria-label="Delete row"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                <form
                  onSubmit={addScheduleExtraForSelected}
                  className="flex gap-2 mt-2 items-end"
                >
                  <input
                    type="time"
                    className="dash-input"
                    style={{ width: 90 }}
                    value={extraTime}
                    onChange={(e) => setExtraTime(e.target.value)}
                    required
                    placeholder="08:00"
                  />
                  <input
                    className="dash-input"
                    style={{ flex: 1 }}
                    value={extraTitle}
                    onChange={(e) => setExtraTitle(e.target.value)}
                    placeholder="What's at this time?"
                    required
                  />
                  <button
                    type="submit"
                    className="dash-btn dash-btn-primary"
                    style={{ padding: "8px 14px", fontSize: 11 }}
                  >
                    + Add
                  </button>
                </form>
                <div className="text-[11.5px] text-[var(--colour-ink-quiet)] mt-1">
                  This addition only lives on {formatHuman(selected)} - perfect for weekends.
                  New entries auto-slot into the right time slot. Use ✎ to change a row&apos;s time
                  to re-order it.
                </div>
              </section>

              {/* Words saved to the journal on this day */}
              {wordsThatDay.length > 0 && (
                <section>
                  <div className="eyebrow eyebrow-amber mb-2">Words saved</div>
                  <div className="flex flex-col gap-1.5">
                    {wordsThatDay.map((w) => (
                      <Link
                        key={w.id}
                        href={`/dashboard/word-study?q=${encodeURIComponent(w.word)}`}
                        className="flex items-baseline gap-2 text-[13px] rounded px-1.5 py-1 hover:bg-white/5 transition"
                      >
                        <span className="text-[var(--colour-ink-strong)]">{w.word}</span>
                        {w.translit && (
                          <span className="font-display italic text-[var(--colour-amber-soft)]">
                            {w.translit}
                          </span>
                        )}
                        <span className="ml-auto text-[10.5px] uppercase tracking-[0.18em] text-[var(--colour-ink-quiet)]">
                          {languageLabel(w)}
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

                {/* Tasks - quick-add for this day + clickable existing ones */}
                <section>
                  <div className="eyebrow mb-2">Tasks for this day</div>
                  <form onSubmit={addTaskForSelected} className="flex gap-2 mb-2">
                    <input
                      className="dash-input"
                      placeholder="Add a task for this day…"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <select
                      className="dash-select"
                      value={newTaskTag}
                      onChange={(e) => setNewTaskTag(e.target.value)}
                      style={{ width: 120 }}
                    >
                      {TAGS.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="dash-btn dash-btn-primary"
                      style={{ padding: "8px 14px", fontSize: 11 }}
                    >
                      Add
                    </button>
                  </form>
                  {(tasksCompletedThatDay.length > 0 || tasksDueThatDay.length > 0 || tasksCreatedThatDay.length > 0) && (
                    <div className="flex flex-col gap-1.5">
                      {tasksCompletedThatDay.map((t) => {
                        const tg = TAGS.find((x) => x.id === t.tag) ?? TAGS[0];
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => toggleTaskDone(t.id)}
                            className="flex items-center gap-2 text-[13px] text-left w-full hover:bg-white/5 rounded px-1.5 py-1 transition"
                          >
                            <span style={{ color: "var(--colour-glow)" }}>✓</span>
                            <span className="line-through opacity-70 flex-1">{t.title}</span>
                            <Tag tone={tg.tone}>{tg.label}</Tag>
                          </button>
                        );
                      })}
                      {tasksDueThatDay.map((t) => {
                        const tg = TAGS.find((x) => x.id === t.tag) ?? TAGS[0];
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => toggleTaskDone(t.id)}
                            className="flex items-center gap-2 text-[13px] text-left w-full hover:bg-white/5 rounded px-1.5 py-1 transition"
                          >
                            <span style={{ color: "var(--colour-ink-faint)" }}>○</span>
                            <span className="flex-1">{t.title}</span>
                            <Tag tone={tg.tone}>{tg.label}</Tag>
                            <span className="text-[10.5px] text-[#f1a07d]">due</span>
                          </button>
                        );
                      })}
                      {tasksCreatedThatDay
                        .filter(
                          (t) =>
                            !tasksCompletedThatDay.includes(t) && !tasksDueThatDay.includes(t),
                        )
                        .map((t) => {
                          const tg = TAGS.find((x) => x.id === t.tag) ?? TAGS[0];
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => toggleTaskDone(t.id)}
                              className="flex items-center gap-2 text-[12.5px] opacity-75 text-left w-full hover:bg-white/5 rounded px-1.5 py-1 transition"
                            >
                              <span style={{ color: "var(--colour-ink-faint)" }}>+</span>
                              <span className="flex-1">{t.title}</span>
                              <Tag tone={tg.tone}>{tg.label}</Tag>
                              <span className="text-[10.5px] text-[var(--colour-ink-quiet)]">added</span>
                            </button>
                          );
                        })}
                    </div>
                  )}
                </section>

                {/* Guitar */}
                {guitarThatDay.length > 0 && (
                  <section>
                    <div className="eyebrow mb-2">Guitar sessions</div>
                    <div className="flex flex-col gap-2">
                      {guitarThatDay.map((s) => (
                        <div key={s.id} className="text-[13px]">
                          <div className="flex items-baseline justify-between">
                            <span className="text-[var(--colour-ink-strong)]">{s.focus}</span>
                            <span className="text-[var(--colour-amber-soft)]">{s.minutes} min</span>
                          </div>
                          {s.notes && (
                            <p className="text-[12px] text-[var(--colour-ink-soft)] mt-0.5">{s.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Book */}
                {bookThatDay.length > 0 && (
                  <section>
                    <div className="eyebrow mb-2">Book writing</div>
                    <div className="flex flex-col gap-2">
                      {bookThatDay.map((s) => {
                        const ch = state.book.meta.chapters.find((c) => c.id === s.chapter);
                        return (
                          <div key={s.id} className="text-[13px]">
                            <div className="flex items-baseline justify-between">
                              <span className="text-[var(--colour-ink-strong)]">
                                {ch?.title ?? "-"}
                              </span>
                              <span className="text-[var(--colour-amber-soft)]">
                                {s.words} words · {s.minutes} min
                              </span>
                            </div>
                            {s.notes && (
                              <p className="text-[12px] text-[var(--colour-ink-soft)] mt-0.5">{s.notes}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}

function MiniMonth({
  start,
  grid,
  habits,
  wordDays,
  selected,
  onSelect,
}: {
  start: string;
  grid: string[];
  habits: Record<string, DayHabits>;
  wordDays: Set<string>;
  selected: string;
  onSelect: (d: string) => void;
}) {
  const kept = grid.filter(
    (d) => isSameMonth(d, start) && dayScore(habits[d], wordDays.has(d)) > 0,
  ).length;
  return (
    <div className="dash-mini-month">
      <div className="dash-mini-month-head">
        <span className="dash-mini-month-name">{shortMonth(start)}</span>
        <span className="dash-mini-month-count">{kept}d</span>
      </div>
      <div className="dash-cal-mini">
        {MINI_HEAD.map((d, i) => (
          <div key={i} className="dash-cal-mini-head">
            {d}
          </div>
        ))}
        {grid.map((d) => {
          const score = dayScore(habits[d], wordDays.has(d));
          const other = !isSameMonth(d, start);
          return (
            <button
              key={d}
              className={`dash-cal-mini-cell ${other ? "is-other" : ""} ${
                isToday(d) ? "is-today" : ""
              } ${selected === d ? "is-selected" : ""} ${score > 0 ? "has-data" : ""}`}
              onClick={() => onSelect(d)}
              title={`${formatShort(d)}${score ? ` · ${score} kept` : ""}`}
              style={
                score > 0 && !other
                  ? { background: `rgba(216, 178, 90, ${0.1 + Math.min(score, 6) * 0.07})` }
                  : undefined
              }
            >
              {Number(d.slice(8))}
            </button>
          );
        })}
      </div>
    </div>
  );
}
