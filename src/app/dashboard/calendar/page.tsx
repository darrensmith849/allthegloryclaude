"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Panel, Tag } from "@/components/dashboard/panel";
import { useDashboard } from "@/lib/dashboard/storage";
import {
  addDays,
  formatHuman,
  formatShort,
  isSameMonth,
  isToday,
  monthGrid,
  startOfMonth,
  todayISO,
} from "@/lib/dashboard/dates";
import {
  emptyHabits,
  resolveHabits,
  resolveTaskTags,
  DayHabits,
} from "@/lib/dashboard/types";
import { planDayFor, planForWithOverride } from "@/lib/dashboard/plan";

const HEAD = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MINI_HEAD = ["M", "T", "W", "T", "F", "S", "S"];

const DOT_MAP: { id: string; colour: string; title: string }[] = [
  { id: "bibleRead", colour: "#d8b25a", title: "Word" },
  { id: "noPorn", colour: "#b7e4c7", title: "Clean" },
  { id: "gym", colour: "#a4c2f4", title: "Gym" },
  { id: "worship", colour: "#f1d7a6", title: "Worship" },
  { id: "guitar", colour: "#cdb4db", title: "Guitar" },
  { id: "bookWriting", colour: "#cca88c", title: "Book" },
];

type ViewMode = "month" | "quarter" | "year";

function monthLabel(iso: string) {
  const [y, m] = iso.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}
function shortMonth(iso: string) {
  const [y, m] = iso.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: "short" });
}
function dayScore(h: DayHabits | undefined): number {
  if (!h) return 0;
  let n = 0;
  for (const dot of DOT_MAP) if (h[dot.id]) n++;
  return n;
}

export default function CalendarPage() {
  const { state, update, ready } = useDashboard();
  const [view, setView] = useState<ViewMode>("month");
  const [cursor, setCursor] = useState(() => startOfMonth(todayISO()));
  const [selected, setSelected] = useState<string>(() => todayISO());

  const selectedHabits = state.habits[selected] ?? emptyHabits();
  const selectedLog = state.bibleLogs[selected];
  const planDay = planDayFor(selected, state.settings.startDate, state.settings.startPlanDay);
  const plan = planForWithOverride(planDay, state.settings.planOverrides);
  const habitDefs = resolveHabits(state.settings);
  const TAGS = resolveTaskTags(state.settings);

  // Day-review data — everything logged for the selected day, across all modules.
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
  const habitsKeptThatDay = habitDefs.filter((h) => selectedHabits[h.id]);

  const hasAnything =
    Boolean(selectedLog) ||
    habitsKeptThatDay.length > 0 ||
    tasksCompletedThatDay.length > 0 ||
    tasksDueThatDay.length > 0 ||
    guitarThatDay.length > 0 ||
    bookThatDay.length > 0;

  // Inline-edit helpers — save journal fields straight into state from the calendar panel.
  function patchLog(patch: Partial<typeof selectedLog>) {
    update((d) => {
      const planDayLocal = planDayFor(selected, d.settings.startDate, d.settings.startPlanDay);
      const prev = d.bibleLogs[selected] ?? { planDay: planDayLocal };
      d.bibleLogs[selected] = { ...prev, ...patch, planDay: planDayLocal };
    });
  }
  function toggleHabitForSelected(habitId: string) {
    update((d) => {
      const h = d.habits[selected] ?? emptyHabits();
      h[habitId] = !h[habitId];
      d.habits[selected] = h;
    });
  }

  // Views
  const grid = useMemo(() => monthGrid(cursor), [cursor]);
  const quarter = useMemo(() => {
    const months: { start: string; grid: string[] }[] = [];
    for (let off = -1; off <= 1; off++) {
      const start = startOfMonth(addDays(cursor, off * 32));
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
    setCursor(startOfMonth(addDays(cursor, n * 32)));
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
            Click any day to see everything you logged — readings, habits, tasks, sessions.
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
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="dash-divider" />
                <div className="flex flex-wrap gap-3 text-[11.5px] text-[var(--colour-ink-quiet)]">
                  {DOT_MAP.map((dot) => (
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
          <Panel
            eyebrow={`Selected day · Day ${planDay}`}
            title={formatHuman(selected)}
            action={
              <Link
                href={`/dashboard/bible?date=${selected}`}
                className="text-[12px] eyebrow text-[var(--colour-amber-soft)]"
              >
                Open journal →
              </Link>
            }
          >
            <div className="text-[12.5px] text-[var(--colour-ink-quiet)] mb-3">{plan.passage}</div>

            <div className="flex flex-col gap-4">
              {/* Habits — every one toggleable, not just the kept ones */}
              <section>
                <div className="eyebrow mb-2">Disciplines</div>
                <div className="flex flex-wrap gap-1.5">
                  {habitDefs.map((h) => {
                    const on = Boolean(selectedHabits[h.id]);
                    return (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => toggleHabitForSelected(h.id)}
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
                        {h.label}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Bible journal — fully inline-editable, even if empty */}
              <section>
                <div className="eyebrow eyebrow-amber mb-2">Bible journal</div>
                <label className="dash-label" style={{ marginTop: 6 }}>
                  What I read
                </label>
                <input
                  className="dash-input"
                  placeholder={plan.passage}
                  value={selectedLog?.passage ?? ""}
                  onChange={(e) => patchLog({ passage: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <label className="dash-label">Minutes</label>
                    <input
                      type="number"
                      className="dash-input"
                      placeholder="e.g. 30"
                      value={selectedLog?.minutes ?? ""}
                      onChange={(e) =>
                        patchLog({ minutes: Number(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div>
                    <label className="dash-label">Verse</label>
                    <input
                      className="dash-input"
                      placeholder="e.g. Numbers 21:8"
                      value={selectedLog?.verseOfTheDay ?? ""}
                      onChange={(e) => patchLog({ verseOfTheDay: e.target.value })}
                    />
                  </div>
                </div>
                <label className="dash-label" style={{ marginTop: 10 }}>
                  What I learnt
                </label>
                <textarea
                  className="dash-textarea"
                  placeholder="One sentence is enough."
                  style={{ minHeight: 64 }}
                  value={selectedLog?.learned ?? ""}
                  onChange={(e) => patchLog({ learned: e.target.value })}
                />
                <label className="dash-label" style={{ marginTop: 10 }}>
                  Journal
                </label>
                <textarea
                  className="dash-textarea"
                  placeholder="Wrestle, marvel, lament, give thanks."
                  style={{ minHeight: 90 }}
                  value={selectedLog?.notes ?? ""}
                  onChange={(e) => patchLog({ notes: e.target.value })}
                />
                <label className="dash-label" style={{ marginTop: 10 }}>
                  Prayer
                </label>
                <textarea
                  className="dash-textarea"
                  placeholder="What I'm asking God for."
                  style={{ minHeight: 64 }}
                  value={selectedLog?.prayer ?? ""}
                  onChange={(e) => patchLog({ prayer: e.target.value })}
                />
                <div className="text-[11.5px] text-[var(--colour-ink-quiet)] mt-2">
                  Saves as you type. Click another day to switch.
                </div>
              </section>

              {!hasAnything && (
                <div className="text-[11.5px] text-[var(--colour-ink-quiet)] -mt-2">
                  Tip — clicking any past or future day works the same. The fields
                  above belong to <strong>{formatHuman(selected)}</strong>.
                </div>
              )}

                {/* Tasks */}
                {(tasksCompletedThatDay.length > 0 || tasksDueThatDay.length > 0 || tasksCreatedThatDay.length > 0) && (
                  <section>
                    <div className="eyebrow mb-2">Tasks</div>
                    <div className="flex flex-col gap-1.5">
                      {tasksCompletedThatDay.map((t) => {
                        const tg = TAGS.find((x) => x.id === t.tag) ?? TAGS[0];
                        return (
                          <div key={t.id} className="flex items-center gap-2 text-[13px]">
                            <span style={{ color: "var(--colour-glow)" }}>✓</span>
                            <span className="line-through opacity-70">{t.title}</span>
                            <Tag tone={tg.tone}>{tg.label}</Tag>
                          </div>
                        );
                      })}
                      {tasksDueThatDay.map((t) => {
                        const tg = TAGS.find((x) => x.id === t.tag) ?? TAGS[0];
                        return (
                          <div key={t.id} className="flex items-center gap-2 text-[13px]">
                            <span style={{ color: "var(--colour-ink-faint)" }}>○</span>
                            <span>{t.title}</span>
                            <Tag tone={tg.tone}>{tg.label}</Tag>
                            <span className="text-[10.5px] text-[#f1a07d]">due</span>
                          </div>
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
                            <div key={t.id} className="flex items-center gap-2 text-[12.5px] opacity-75">
                              <span style={{ color: "var(--colour-ink-faint)" }}>+</span>
                              <span>{t.title}</span>
                              <Tag tone={tg.tone}>{tg.label}</Tag>
                              <span className="text-[10.5px] text-[var(--colour-ink-quiet)]">added</span>
                            </div>
                          );
                        })}
                    </div>
                  </section>
                )}

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
                                {ch?.title ?? "—"}
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

              <div className="flex flex-wrap gap-2 mt-2">
                <Link
                  href={`/dashboard/bible?date=${selected}`}
                  className="dash-btn"
                  style={{ padding: "8px 14px", fontSize: 11 }}
                >
                  Open full journal page →
                </Link>
              </div>
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
  selected,
  onSelect,
}: {
  start: string;
  grid: string[];
  habits: Record<string, DayHabits>;
  selected: string;
  onSelect: (d: string) => void;
}) {
  const kept = grid.filter((d) => isSameMonth(d, start) && dayScore(habits[d]) > 0).length;
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
          const score = dayScore(habits[d]);
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
