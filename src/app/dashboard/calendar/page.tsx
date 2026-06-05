"use client";

import { useMemo, useState } from "react";
import { Panel } from "@/components/dashboard/panel";
import { useDashboard } from "@/lib/dashboard/storage";
import {
  addDays,
  formatHuman,
  isSameMonth,
  isToday,
  monthGrid,
  startOfMonth,
  todayISO,
} from "@/lib/dashboard/dates";
import { emptyHabits, resolveHabits, DayHabits } from "@/lib/dashboard/types";
import { planDayFor, planForWithOverride } from "@/lib/dashboard/plan";

const HEAD = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MINI_HEAD = ["M", "T", "W", "T", "F", "S", "S"];

// Coloured dots map specific habits to colours so the month becomes a glance-able heatmap.
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
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}
function shortMonth(iso: string) {
  const [y, m] = iso.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: "short" });
}

// How many "score points" did a day rack up? Used to colour heatmap intensity.
function dayScore(h: DayHabits | undefined): number {
  if (!h) return 0;
  let n = 0;
  for (const dot of DOT_MAP) if (h[dot.id]) n++;
  return n;
}

export default function CalendarPage() {
  const { state, ready } = useDashboard();
  const [view, setView] = useState<ViewMode>("month");
  const [cursor, setCursor] = useState(() => startOfMonth(todayISO()));
  const [selected, setSelected] = useState<string>(() => todayISO());

  const selectedHabits = state.habits[selected] ?? emptyHabits();
  const selectedLog = state.bibleLogs[selected];
  const planDay = planDayFor(selected, state.settings.startDate, state.settings.startPlanDay);
  const plan = planForWithOverride(planDay, state.settings.planOverrides);
  const habitDefs = resolveHabits(state.settings);

  // ── Month grid ─────────────────────────────
  const grid = useMemo(() => monthGrid(cursor), [cursor]);

  // ── Quarter grid (3 months centered on cursor) ─────
  const quarter = useMemo(() => {
    const months: { start: string; grid: string[] }[] = [];
    for (let off = -1; off <= 1; off++) {
      const start = startOfMonth(addDays(cursor, off * 32));
      months.push({ start, grid: monthGrid(start) });
    }
    return months;
  }, [cursor]);

  // ── Year grid (12 months around cursor year) ─────
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
          <div className="dash-subtitle">A glance at every day — what was kept, what was written.</div>
        </div>
        <div className="flex gap-2 items-center">
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
          <button
            className="dash-btn dash-btn-ghost"
            onClick={() => setCursor(startOfMonth(todayISO()))}
          >
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
            {/* MONTH VIEW */}
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
                      <span
                        className="inline-block w-2 h-2 rounded-full"
                        style={{ background: dot.colour }}
                      />
                      {dot.title}
                    </span>
                  ))}
                </div>
              </>
            )}

            {/* QUARTER VIEW */}
            {view === "quarter" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {quarter.map((m) => (
                  <MiniMonth
                    key={m.start}
                    start={m.start}
                    grid={m.grid}
                    habits={state.habits}
                    selected={selected}
                    onSelect={(d) => setSelected(d)}
                  />
                ))}
              </div>
            )}

            {/* YEAR VIEW */}
            {view === "year" && (
              <div className="dash-year-grid">
                {year.map((m) => (
                  <MiniMonth
                    key={m.start}
                    start={m.start}
                    grid={m.grid}
                    habits={state.habits}
                    selected={selected}
                    onSelect={(d) => setSelected(d)}
                  />
                ))}
              </div>
            )}
          </Panel>
        </div>

        <div className="dash-col-4">
          <Panel eyebrow="Selected day" title={formatHuman(selected)}>
            <div className="text-[12.5px] text-[var(--colour-ink-quiet)] mb-2">
              Day {planDay} · {plan.passage}
            </div>
            <div className="flex flex-col gap-2">
              {habitDefs.map((h) => {
                const on = Boolean(selectedHabits[h.id]);
                return (
                  <div
                    key={h.id}
                    className="flex items-center justify-between text-[13.5px] py-1.5 border-b border-white/5"
                  >
                    <span>{h.label}</span>
                    <span style={{ color: on ? "var(--colour-glow)" : "var(--colour-ink-faint)" }}>
                      {on ? "kept" : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="dash-divider" />
            {selectedLog?.verseOfTheDay && (
              <div className="mb-3">
                <div className="eyebrow eyebrow-amber mb-1">Verse</div>
                <div className="dash-verse">{selectedLog.verseOfTheDay}</div>
              </div>
            )}
            {selectedLog?.learned && (
              <div className="mb-3">
                <div className="eyebrow mb-1">What I learnt</div>
                <p className="text-[13.5px] text-[var(--colour-ink-soft)] leading-relaxed">
                  {selectedLog.learned}
                </p>
              </div>
            )}
            {selectedLog?.notes && (
              <div className="mb-3">
                <div className="eyebrow mb-1">Journal</div>
                <p className="text-[13px] text-[var(--colour-ink-soft)] whitespace-pre-wrap leading-relaxed">
                  {selectedLog.notes}
                </p>
              </div>
            )}
            {!selectedLog && <div className="dash-empty p-3">No journal yet for this day.</div>}
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
              title={`${d}${score ? ` · ${score} kept` : ""}`}
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
