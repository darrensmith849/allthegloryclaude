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
import { emptyHabits, HABIT_FIELDS } from "@/lib/dashboard/types";
import { planDayFor, planFor } from "@/lib/dashboard/plan";

const HEAD = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Coloured dots map specific habits to colours so the month becomes a glance-able heatmap.
const DOT_MAP: { id: keyof ReturnType<typeof emptyHabits>; colour: string; title: string }[] = [
  { id: "bibleRead", colour: "#d8b25a", title: "Word" },
  { id: "noPorn", colour: "#b7e4c7", title: "Clean" },
  { id: "gym", colour: "#a4c2f4", title: "Gym" },
  { id: "worship", colour: "#f1d7a6", title: "Worship" },
  { id: "guitar", colour: "#cdb4db", title: "Guitar" },
  { id: "bookWriting", colour: "#cca88c", title: "Book" },
];

export default function CalendarPage() {
  const { state, ready } = useDashboard();
  const [cursor, setCursor] = useState(() => startOfMonth(todayISO()));
  const [selected, setSelected] = useState<string>(() => todayISO());

  const grid = useMemo(() => monthGrid(cursor), [cursor]);

  function monthLabel(iso: string) {
    const [y, m] = iso.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
  }

  const selectedHabits = state.habits[selected] ?? emptyHabits();
  const selectedLog = state.bibleLogs[selected];
  const planDay = planDayFor(selected, state.settings.startDate, state.settings.startPlanDay);
  const plan = planFor(planDay);

  if (!ready) return null;

  return (
    <>
      <div className="dash-pagehead">
        <div>
          <div className="eyebrow eyebrow-amber">Month view</div>
          <h1 className="dash-title mt-1">Calendar</h1>
          <div className="dash-subtitle">
            A glance at every day — what was kept, what was written.
          </div>
        </div>
        <div className="flex gap-2">
          <button
            className="dash-btn dash-btn-ghost"
            onClick={() => setCursor(startOfMonth(addDays(cursor, -1)))}
          >
            ← Prev
          </button>
          <button
            className="dash-btn dash-btn-ghost"
            onClick={() => setCursor(startOfMonth(todayISO()))}
          >
            This month
          </button>
          <button
            className="dash-btn dash-btn-ghost"
            onClick={() => setCursor(startOfMonth(addDays(cursor, 35)))}
          >
            Next →
          </button>
        </div>
      </div>

      <div className="dash-grid">
        <div className="dash-col-8">
          <Panel eyebrow={monthLabel(cursor)} title="The month at a glance">
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
          </Panel>
        </div>

        <div className="dash-col-4">
          <Panel eyebrow="Selected day" title={formatHuman(selected)}>
            <div className="text-[12.5px] text-[var(--colour-ink-quiet)] mb-2">
              Day {planDay} · {plan.passage}
            </div>
            <div className="flex flex-col gap-2">
              {HABIT_FIELDS.map((h) => {
                const on = selectedHabits[h.id];
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
            {!selectedLog && (
              <div className="dash-empty p-3">No journal yet for this day.</div>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
