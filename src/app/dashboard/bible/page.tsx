"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Panel, Stat } from "@/components/dashboard/panel";
import { useDashboard } from "@/lib/dashboard/storage";
import { addDays, formatHuman, formatShort, todayISO } from "@/lib/dashboard/dates";
import { CHRONO_PLAN, planDayFor, planFor } from "@/lib/dashboard/plan";
import { BibleDayLog, emptyHabits } from "@/lib/dashboard/types";
import { currentStreak, countInLastN, longestStreak } from "@/lib/dashboard/streaks";

export default function BibleReadingPage() {
  const { state, update, ready } = useDashboard();
  const [activeDate, setActiveDate] = useState(() => todayISO());

  const planDay = useMemo(
    () => planDayFor(activeDate, state.settings.startDate, state.settings.startPlanDay),
    [activeDate, state.settings.startDate, state.settings.startPlanDay],
  );
  const plan = planFor(planDay);
  const log: BibleDayLog = state.bibleLogs[activeDate] ?? { planDay };

  const bibleStreak = currentStreak(state, (h) => h.bibleRead);
  const longest = longestStreak(state, (h) => h.bibleRead);
  const last30 = countInLastN(state, 30, (h) => h.bibleRead);

  function setLog(patch: Partial<BibleDayLog>) {
    update((d) => {
      const prev: BibleDayLog = d.bibleLogs[activeDate] ?? { planDay };
      d.bibleLogs[activeDate] = { ...prev, ...patch, planDay };
    });
  }

  function markRead(value: boolean) {
    update((d) => {
      const h = d.habits[activeDate] ?? emptyHabits();
      h.bibleRead = value;
      d.habits[activeDate] = h;
    });
  }

  function rebaseToToday() {
    update((d) => {
      d.settings.startDate = todayISO();
      d.settings.startPlanDay = planDay;
    });
  }

  if (!ready) return null;

  const habitOn = state.habits[activeDate]?.bibleRead ?? false;

  return (
    <>
      <div className="dash-pagehead">
        <div>
          <div className="eyebrow eyebrow-amber">Chronological Bible plan</div>
          <h1 className="dash-title mt-1">Bible Reading</h1>
          <div className="dash-subtitle">
            {formatHuman(activeDate)} · Day {planDay} of 365
          </div>
        </div>
        <div className="flex gap-2">
          <button
            className="dash-btn dash-btn-ghost"
            onClick={() => setActiveDate(addDays(activeDate, -1))}
          >
            ← {formatShort(addDays(activeDate, -1))}
          </button>
          <button
            className="dash-btn dash-btn-ghost"
            onClick={() => setActiveDate(todayISO())}
          >
            Today
          </button>
          <button
            className="dash-btn dash-btn-ghost"
            onClick={() => setActiveDate(addDays(activeDate, 1))}
          >
            {formatShort(addDays(activeDate, 1))} →
          </button>
        </div>
      </div>

      <div className="dash-grid">
        <div className="dash-col-3">
          <Stat label="Current streak" value={`${bibleStreak} d`} hint="Don&apos;t break the chain" />
        </div>
        <div className="dash-col-3">
          <Stat label="Longest streak" value={`${longest} d`} tone="ok" />
        </div>
        <div className="dash-col-3">
          <Stat label="Days read (30d)" value={`${last30}/30`} tone="calm" />
        </div>
        <div className="dash-col-3">
          <Stat label="Plan progress" value={`${Math.round((planDay / 365) * 100)}%`} />
        </div>

        <div className="dash-col-8">
          <Panel
            eyebrow={`Day ${planDay} of the chronological plan`}
            title={plan.passage}
            action={
              <button
                className={`dash-check ${habitOn ? "is-on" : ""}`}
                onClick={() => markRead(!habitOn)}
                style={{ minWidth: 150 }}
              >
                <span className="dash-check-dot">{habitOn ? "✓" : ""}</span>
                <span className="dash-check-label">{habitOn ? "Read today" : "Mark read"}</span>
              </button>
            }
          >
            {plan.theme && (
              <p className="text-[15px] text-[var(--colour-ink-soft)] italic font-display">
                “{plan.theme}”
              </p>
            )}

            <div className="dash-divider" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="dash-label">What I actually read</label>
                <input
                  className="dash-input"
                  placeholder={plan.passage}
                  value={log.passage ?? ""}
                  onChange={(e) => setLog({ passage: e.target.value })}
                />
              </div>
              <div>
                <label className="dash-label">Minutes read</label>
                <input
                  className="dash-input"
                  type="number"
                  inputMode="numeric"
                  placeholder="e.g. 30"
                  value={log.minutes ?? ""}
                  onChange={(e) => setLog({ minutes: Number(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="dash-label">A verse that struck me</label>
              <input
                className="dash-input"
                placeholder="e.g. Numbers 21:8 — Make a fiery serpent and set it on a pole"
                value={log.verseOfTheDay ?? ""}
                onChange={(e) => setLog({ verseOfTheDay: e.target.value })}
              />
            </div>

            <div className="mt-4">
              <label className="dash-label">What I learnt</label>
              <textarea
                className="dash-textarea"
                placeholder="One sentence is enough. What did God show me?"
                value={log.learned ?? ""}
                onChange={(e) => setLog({ learned: e.target.value })}
              />
            </div>

            <div className="mt-4">
              <label className="dash-label">Journal &amp; reflection</label>
              <textarea
                className="dash-textarea"
                style={{ minHeight: 160 }}
                placeholder="Free space. Wrestle, marvel, lament, give thanks."
                value={log.notes ?? ""}
                onChange={(e) => setLog({ notes: e.target.value })}
              />
            </div>

            <div className="mt-4">
              <label className="dash-label">Prayer for the day</label>
              <textarea
                className="dash-textarea"
                placeholder="What I'm asking God for today."
                value={log.prayer ?? ""}
                onChange={(e) => setLog({ prayer: e.target.value })}
              />
            </div>

            <div className="dash-divider" />
            <div className="flex flex-wrap gap-2">
              <Link href="/dashboard/word-study" className="dash-btn">
                Look up Greek / Hebrew
              </Link>
              <Link
                href={`https://www.biblegateway.com/passage/?search=${encodeURIComponent(
                  plan.passage,
                )}&version=ESV`}
                target="_blank"
                rel="noreferrer"
                className="dash-btn"
              >
                Open passage on BibleGateway ↗
              </Link>
            </div>
          </Panel>
        </div>

        <div className="dash-col-4">
          <Panel eyebrow="Plan settings" title="Re-anchor the plan">
            <p className="text-[13.5px] text-[var(--colour-ink-soft)] leading-relaxed">
              The plan is currently aligned so that <strong>{formatShort(state.settings.startDate)}</strong> was Day{" "}
              <strong>{state.settings.startPlanDay}</strong>. If you skipped or doubled up, re-anchor here.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <button className="dash-btn" onClick={rebaseToToday}>
                Make today = Day {planDay}
              </button>
            </div>
            <div className="dash-divider" />

            <label className="dash-label">Jump to plan day</label>
            <input
              type="number"
              min={1}
              max={365}
              className="dash-input"
              defaultValue={planDay}
              onBlur={(e) => {
                const target = Math.max(1, Math.min(365, Number(e.target.value) || planDay));
                const diff = target - planDay;
                setActiveDate(addDays(activeDate, diff));
              }}
            />
            <div className="text-[11.5px] text-[var(--colour-ink-quiet)] mt-2">
              Jumps the date so the plan lines up.
            </div>
          </Panel>

          <div className="h-4" />

          <Panel eyebrow="Coming up" title="Next seven days">
            <div className="flex flex-col gap-2 text-[13.5px]">
              {Array.from({ length: 7 }, (_, i) => {
                const d = addDays(todayISO(), i);
                const pd = planDayFor(d, state.settings.startDate, state.settings.startPlanDay);
                const p = planFor(pd);
                return (
                  <button
                    key={d}
                    onClick={() => setActiveDate(d)}
                    className={`text-left p-2.5 rounded-md border transition ${
                      d === activeDate
                        ? "bg-[rgba(216,178,90,0.10)] border-[rgba(216,178,90,0.42)]"
                        : "border-white/5 hover:bg-white/5"
                    }`}
                  >
                    <div className="eyebrow">{formatShort(d)} · Day {pd}</div>
                    <div className="mt-0.5">{p.passage}</div>
                  </button>
                );
              })}
            </div>
          </Panel>
        </div>

        <div className="dash-col-12">
          <Panel eyebrow="The whole year" title="Full chronological plan">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-[420px] overflow-y-auto pr-2">
              {CHRONO_PLAN.map((entry) => {
                const isCurrent = entry.day === planDay;
                return (
                  <div
                    key={entry.day}
                    className={`p-2.5 rounded-md border text-[13px] ${
                      isCurrent
                        ? "border-[rgba(216,178,90,0.5)] bg-[rgba(216,178,90,0.10)]"
                        : "border-white/5 bg-white/[0.02]"
                    }`}
                  >
                    <div className="eyebrow">Day {entry.day}</div>
                    <div className="mt-0.5 text-[var(--colour-ink-strong)]">{entry.passage}</div>
                    {entry.theme && (
                      <div className="text-[11.5px] text-[var(--colour-ink-quiet)] mt-1">{entry.theme}</div>
                    )}
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
