"use client";

import { useMemo, useState } from "react";
import { Panel, Stat } from "@/components/dashboard/panel";
import { useDashboard } from "@/lib/dashboard/storage";
import { formatShort, startOfWeek, todayISO, weekdayShort, addDays } from "@/lib/dashboard/dates";
import Link from "next/link";
import { GuitarSession, resolveGuitarWeek, emptyHabits } from "@/lib/dashboard/types";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export default function GuitarPage() {
  const { state, update, ready } = useDashboard();
  const today = todayISO();
  const weekStart = startOfWeek(today);
  const week = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const WEEK_PLAN = resolveGuitarWeek(state.settings);
  const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

  const [minutes, setMinutes] = useState<number>(25);
  const [focus, setFocus] = useState<string>(WEEK_PLAN[todayIdx]?.focus ?? "");
  const [notes, setNotes] = useState("");

  function addSession(e?: React.FormEvent) {
    e?.preventDefault();
    if (!focus.trim() || !minutes) return;
    const s: GuitarSession = {
      id: uid(),
      date: today,
      minutes,
      focus: focus.trim(),
      notes: notes.trim() || undefined,
    };
    update((d) => {
      d.guitar.unshift(s);
      const h = d.habits[today] ?? emptyHabits();
      h["guitar"] = true;
      d.habits[today] = h;
    });
    setNotes("");
  }

  function removeSession(id: string) {
    update((d) => {
      d.guitar = d.guitar.filter((s) => s.id !== id);
    });
  }

  const sessionsByDate: Record<string, number> = {};
  for (const s of state.guitar) {
    sessionsByDate[s.date] = (sessionsByDate[s.date] || 0) + s.minutes;
  }
  const weekMinutes = week.reduce((sum, d) => sum + (sessionsByDate[d] || 0), 0);
  const target = state.settings.goals.guitarMinutesPerWeek;
  const totalMinutes = state.guitar.reduce((sum, s) => sum + s.minutes, 0);

  if (!ready) return null;

  return (
    <>
      <div className="dash-pagehead">
        <div>
          <div className="eyebrow eyebrow-amber">Weekly practice plan</div>
          <h1 className="dash-title mt-1">Guitar</h1>
          <div className="dash-subtitle">A rotating week. Show up small, often.</div>
        </div>
      </div>

      <div className="dash-grid">
        <div className="dash-col-4">
          <Stat label="This week" value={`${weekMinutes} min`} hint={`Target: ${target} min`} />
        </div>
        <div className="dash-col-4">
          <Stat label="Lifetime minutes" value={totalMinutes} tone="calm" />
        </div>
        <div className="dash-col-4">
          <Stat label="Sessions logged" value={state.guitar.length} tone="ok" />
        </div>

        <div className="dash-col-8">
          <Panel eyebrow="The plan" title="Weekly rotation">
            <div className="flex flex-col gap-2">
              {WEEK_PLAN.map((p, i) => {
                const d = week[i];
                const minutesOnDay = sessionsByDate[d] || 0;
                const isToday = d === today;
                return (
                  <div
                    key={i}
                    className={`grid gap-3 p-3 rounded-md border ${
                      isToday
                        ? "border-[rgba(216,178,90,0.42)] bg-[rgba(216,178,90,0.06)]"
                        : "border-white/6 bg-white/[0.02]"
                    }`}
                    style={{ gridTemplateColumns: "70px 1fr auto" }}
                  >
                    <div>
                      <div className="font-display text-[16px] text-[var(--colour-amber-soft)]">
                        {p.day}
                      </div>
                      <div className="text-[11px] text-[var(--colour-ink-quiet)]">{formatShort(d)}</div>
                    </div>
                    <div>
                      <div className="text-[14px] text-[var(--colour-ink-strong)]">{p.focus}</div>
                      <div className="text-[12.5px] text-[var(--colour-ink-soft)] mt-1 leading-relaxed">
                        {p.drill}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-[20px] text-[var(--colour-glow)]">
                        {minutesOnDay || 0}
                      </div>
                      <div className="text-[11px] text-[var(--colour-ink-quiet)]">
                        / {p.minutes} min
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>

        <div className="dash-col-4">
          <Panel eyebrow="Log a session" title="Today">
            <form onSubmit={addSession} className="flex flex-col gap-3">
              <div>
                <label className="dash-label">Focus</label>
                <input
                  className="dash-input"
                  value={focus}
                  onChange={(e) => setFocus(e.target.value)}
                />
              </div>
              <div>
                <label className="dash-label">Minutes</label>
                <input
                  type="number"
                  className="dash-input"
                  value={minutes}
                  onChange={(e) => setMinutes(Number(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="dash-label">Notes</label>
                <textarea
                  className="dash-textarea"
                  placeholder="What clicked? What was clumsy?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <button type="submit" className="dash-btn dash-btn-primary">
                Log session
              </button>
            </form>
          </Panel>
        </div>

        <div className="dash-col-12">
          <Panel eyebrow="History" title="Recent sessions">
            {state.guitar.length === 0 ? (
              <div className="dash-empty">No sessions logged yet. Pick up the guitar.</div>
            ) : (
              <div className="flex flex-col gap-2">
                {state.guitar.slice(0, 24).map((s) => (
                  <div
                    key={s.id}
                    className="grid items-start gap-3 p-3 rounded-md border border-white/6 bg-white/[0.02]"
                    style={{ gridTemplateColumns: "100px 1fr 60px auto" }}
                  >
                    <div className="text-[12px] text-[var(--colour-amber-soft)]">{formatShort(s.date)}</div>
                    <div>
                      <div className="text-[14px] text-[var(--colour-ink-strong)]">{s.focus}</div>
                      {s.notes && (
                        <div className="text-[12.5px] text-[var(--colour-ink-soft)] mt-0.5">{s.notes}</div>
                      )}
                    </div>
                    <div className="font-display text-[16px] text-[var(--colour-glow)] text-right">
                      {s.minutes}
                    </div>
                    <button
                      onClick={() => removeSession(s.id)}
                      className="opacity-50 hover:opacity-100"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
