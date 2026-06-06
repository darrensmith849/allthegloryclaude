"use client";

import { Panel, Stat } from "@/components/dashboard/panel";
import { useDashboard } from "@/lib/dashboard/storage";
import {
  addDays,
  formatHuman,
  formatShort,
  startOfWeek,
  todayISO,
  weekdayShort,
} from "@/lib/dashboard/dates";
import { DayHabits, emptyHabits, resolveHabits } from "@/lib/dashboard/types";
import { countInLastN, currentStreak, longestStreak, habitOn } from "@/lib/dashboard/streaks";

const DAYS_BACK = 30;

export default function HabitsPage() {
  const { state, update, ready } = useDashboard();
  const today = todayISO();
  const weekStart = startOfWeek(today);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  function get(date: string): DayHabits {
    return state.habits[date] ?? emptyHabits();
  }

  function toggle(date: string, key: string) {
    update((d) => {
      const h = d.habits[date] ?? emptyHabits();
      h[key] = !h[key];
      d.habits[date] = h;
    });
  }

  // Allowed-day quotas for the week / month
  const socialThisWeek = days.filter((d) => get(d).socialMediaAllowed).length;
  const tradingThisMonth = Object.entries(state.habits).filter(
    ([k, v]) => k.startsWith(today.slice(0, 7)) && v.tradingChartsAllowed,
  ).length;

  function setAllowed(date: string, kind: "socialMediaAllowed" | "tradingChartsAllowed") {
    update((d) => {
      const h = d.habits[date] ?? emptyHabits();
      h[kind] = !h[kind];
      // If marked as an "allowed" day, treat it as not breaking the discipline.
      if (kind === "socialMediaAllowed" && h[kind]) h["noSocialMedia"] = true;
      if (kind === "tradingChartsAllowed" && h[kind]) h["noTradingCharts"] = true;
      d.habits[date] = h;
    });
  }

  const trackedHabits = resolveHabits(state.settings);

  if (!ready) return null;

  return (
    <>
      <div className="dash-pagehead">
        <div>
          <div className="eyebrow eyebrow-amber">Disciplines · {formatHuman(today)}</div>
          <h1 className="dash-title mt-1">Habits &amp; Streaks</h1>
          <div className="dash-subtitle">
            Daily reps. The disciplines you want to keep — and the ones you want to keep at a distance.
          </div>
        </div>
      </div>

      <div className="dash-grid">
        <div className="dash-col-3">
          <Stat
            label="Word streak"
            value={`${currentStreak(state, habitOn("bibleRead"))} d`}
            hint={`Best: ${longestStreak(state, habitOn("bibleRead"))} d`}
          />
        </div>
        <div className="dash-col-3">
          <Stat
            label="Clean streak"
            value={`${currentStreak(state, habitOn("noPorn"))} d`}
            hint={`Goal: ${state.settings.goals.cleanStreakTarget} d`}
            tone="ok"
          />
        </div>
        <div className="dash-col-3">
          <Stat
            label="Social media (week)"
            value={`${socialThisWeek}/${state.settings.socialMediaPerWeek}`}
            hint="Allowed days used"
            tone={socialThisWeek >= state.settings.socialMediaPerWeek ? "warn" : "calm"}
          />
        </div>
        <div className="dash-col-3">
          <Stat
            label="Trading (month)"
            value={`${tradingThisMonth}/${state.settings.tradingChartsPerMonth}`}
            hint="Allowed days used"
            tone={tradingThisMonth >= state.settings.tradingChartsPerMonth ? "warn" : "calm"}
          />
        </div>

        <div className="dash-col-12">
          <Panel eyebrow="This week" title={`Week of ${formatShort(weekStart)}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] border-separate" style={{ borderSpacing: "4px" }}>
                <thead>
                  <tr>
                    <th className="text-left p-2 eyebrow">Discipline</th>
                    {days.map((d) => (
                      <th key={d} className="p-2 eyebrow text-center" style={{ minWidth: 64 }}>
                        {weekdayShort(d)}
                        <div className="text-[10px] mt-0.5 normal-case tracking-normal text-[var(--colour-ink-quiet)]">
                          {d.slice(8)}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {trackedHabits.map((h) => (
                    <tr key={h.id}>
                      <td className="p-2 text-[var(--colour-ink-strong)]">{h.label}</td>
                      {days.map((d) => {
                        const on = get(d)[h.id];
                        const isToday = d === today;
                        return (
                          <td key={d} className="p-1 text-center">
                            <button
                              onClick={() => toggle(d, h.id)}
                              className={`w-9 h-9 rounded-md border transition ${
                                on
                                  ? "bg-[rgba(216,178,90,0.18)] border-[rgba(216,178,90,0.55)] text-[var(--colour-glow)]"
                                  : "border-white/8 hover:bg-white/5"
                              } ${isToday ? "ring-1 ring-[rgba(216,178,90,0.35)]" : ""}`}
                            >
                              {on ? "✓" : ""}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}

                  {/* Allowed-day rows */}
                  <tr>
                    <td className="pt-4 p-2 text-[var(--colour-ink-quiet)] text-[12px]">
                      Allowed social-media day
                    </td>
                    {days.map((d) => {
                      const on = get(d).socialMediaAllowed;
                      return (
                        <td key={d} className="p-1 pt-4 text-center">
                          <button
                            onClick={() => setAllowed(d, "socialMediaAllowed")}
                            className={`w-9 h-9 rounded-md border transition ${
                              on
                                ? "bg-rgba(154,147,139,0.18) border-[rgba(154,147,139,0.55)] text-[var(--colour-storm)]"
                                : "border-white/8 hover:bg-white/5"
                            }`}
                            style={
                              on
                                ? {
                                    background: "rgba(154,147,139,0.18)",
                                    borderColor: "rgba(154,147,139,0.55)",
                                    color: "#d2c8b8",
                                  }
                                : undefined
                            }
                          >
                            {on ? "★" : ""}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="p-2 text-[var(--colour-ink-quiet)] text-[12px]">
                      Allowed trading-charts day
                    </td>
                    {days.map((d) => {
                      const on = get(d).tradingChartsAllowed;
                      return (
                        <td key={d} className="p-1 text-center">
                          <button
                            onClick={() => setAllowed(d, "tradingChartsAllowed")}
                            className={`w-9 h-9 rounded-md border transition`}
                            style={
                              on
                                ? {
                                    background: "rgba(204,168,140,0.18)",
                                    borderColor: "rgba(204,168,140,0.55)",
                                    color: "#e9c272",
                                  }
                                : { borderColor: "rgba(255,255,255,0.08)" }
                            }
                          >
                            {on ? "$" : ""}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="dash-divider" />
            <div className="text-[12.5px] text-[var(--colour-ink-quiet)] leading-relaxed">
              Rules: social media is for {state.settings.socialMediaPerWeek} marked days each week,
              trading charts for {state.settings.tradingChartsPerMonth} marked day(s) each month.
              Marking a day as “allowed” counts the discipline as kept — you set the rhythm,
              the rhythm doesn&apos;t set you.
            </div>
          </Panel>
        </div>

        <div className="dash-col-12">
          <Panel eyebrow="Last 30 days" title="At a glance">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {trackedHabits.map((h) => {
                const done = countInLastN(state, DAYS_BACK, (x) => Boolean(x[h.id]));
                const pct = Math.round((done / DAYS_BACK) * 100);
                return (
                  <div key={h.id} className="dash-reward">
                    <div className="flex items-baseline justify-between">
                      <div className="text-[14px] text-[var(--colour-ink-strong)]">{h.label}</div>
                      <div className="font-display text-[20px] text-[var(--colour-glow)]">
                        {done}/{DAYS_BACK}
                      </div>
                    </div>
                    <div className="dash-reward-progress">
                      <span style={{ width: `${pct}%` }} />
                    </div>
                    <div className="text-[11.5px] text-[var(--colour-ink-quiet)]">{pct}%</div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
