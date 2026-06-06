"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Panel, Stat } from "@/components/dashboard/panel";
import { useDashboard } from "@/lib/dashboard/storage";
import { addDays, formatHuman, formatShort, todayISO } from "@/lib/dashboard/dates";
import { CHRONO_PLAN, planDayFor, planFor, planForWithOverride } from "@/lib/dashboard/plan";
import { BibleDayLog, emptyHabits } from "@/lib/dashboard/types";
import { currentStreak, countInLastN, longestStreak, habitOn } from "@/lib/dashboard/streaks";

// useSearchParams must sit under a Suspense boundary in App Router; wrap here
// rather than push the boundary down into every consumer.
export default function BibleReadingPage() {
  return (
    <Suspense fallback={null}>
      <BibleReadingInner />
    </Suspense>
  );
}

function BibleReadingInner() {
  const { state, update, ready } = useDashboard();
  const search = useSearchParams();
  // Allow ?date=YYYY-MM-DD to drop in on a specific day (used by the calendar's
  // "Open journal" link). Falls back to today.
  const initialDate = (() => {
    const d = search?.get("date");
    return d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : todayISO();
  })();
  const [activeDate, setActiveDate] = useState(initialDate);

  // If the user navigates to ?date=... while the page is mounted, follow it.
  useEffect(() => {
    const d = search?.get("date");
    if (d && /^\d{4}-\d{2}-\d{2}$/.test(d) && d !== activeDate) setActiveDate(d);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const planDay = useMemo(
    () => planDayFor(activeDate, state.settings.startDate, state.settings.startPlanDay),
    [activeDate, state.settings.startDate, state.settings.startPlanDay],
  );
  const plan = planForWithOverride(planDay, state.settings.planOverrides);
  const log: BibleDayLog = state.bibleLogs[activeDate] ?? { planDay };
  const overrideActive = Boolean(state.settings.planOverrides?.[planDay]);

  const bibleStreak = currentStreak(state, habitOn("bibleRead"));
  const longest = longestStreak(state, habitOn("bibleRead"));
  const last30 = countInLastN(state, 30, habitOn("bibleRead"));

  function setPlanOverride(text: string | null) {
    update((d) => {
      if (!d.settings.planOverrides) d.settings.planOverrides = {};
      if (text == null || text.trim() === "" || text.trim() === planFor(planDay).passage) {
        delete d.settings.planOverrides[planDay];
      } else {
        d.settings.planOverrides[planDay] = text.trim();
      }
    });
  }

  function setLog(patch: Partial<BibleDayLog>) {
    update((d) => {
      const prev: BibleDayLog = d.bibleLogs[activeDate] ?? { planDay };
      d.bibleLogs[activeDate] = { ...prev, ...patch, planDay };
    });
  }

  function markRead(value: boolean) {
    update((d) => {
      const h = d.habits[activeDate] ?? emptyHabits();
      h["bibleRead"] = value;
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

  const readToday = Boolean(state.habits[activeDate]?.["bibleRead"]);

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
        <div className="flex gap-2 items-center flex-wrap">
          <button
            className="dash-btn dash-btn-ghost"
            onClick={() => setActiveDate(addDays(activeDate, -1))}
          >
            ← {formatShort(addDays(activeDate, -1))}
          </button>
          <input
            type="date"
            className="dash-input"
            style={{ width: 160, padding: "9px 10px" }}
            value={activeDate}
            onChange={(e) => {
              if (e.target.value && /^\d{4}-\d{2}-\d{2}$/.test(e.target.value)) {
                setActiveDate(e.target.value);
              }
            }}
            title="Jump to any date"
          />
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
                className={`dash-check ${readToday ? "is-on" : ""}`}
                onClick={() => markRead(!readToday)}
                style={{ minWidth: 150 }}
              >
                <span className="dash-check-dot">{readToday ? "✓" : ""}</span>
                <span className="dash-check-label">{readToday ? "Read today" : "Mark read"}</span>
              </button>
            }
          >
            {plan.theme && (
              <p className="text-[15px] text-[var(--colour-ink-soft)] italic font-display">
                “{plan.theme}”
              </p>
            )}

            <div className="mt-4">
              <div className="flex items-baseline justify-between">
                <label className="dash-label">This day&apos;s passage</label>
                {overrideActive && (
                  <button
                    className="text-[11px] eyebrow text-[var(--colour-amber-soft)] hover:text-[var(--colour-glow)]"
                    onClick={() => setPlanOverride(null)}
                  >
                    Reset to default ({planFor(planDay).passage})
                  </button>
                )}
              </div>
              <input
                className="dash-input"
                value={plan.passage}
                onChange={(e) => setPlanOverride(e.target.value)}
                placeholder={planFor(planDay).passage}
              />
              <div className="text-[11.5px] text-[var(--colour-ink-quiet)] mt-1">
                {overrideActive
                  ? "Your override for this day. The default is restored when you clear it."
                  : "Edit if your chronological plan is different — your version sticks."}
              </div>
            </div>

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
            <ReadHere passage={log.passage?.trim() || plan.passage} />
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

// ── Inline passage reader ────────────────────────────────────────
// Lazy-fetches today's passage via the existing /api/verse proxy (bible-api.com,
// World English Bible by default — no API key needed). Toggled open so we
// don't fetch on every page load.
interface Verse {
  ref: string;
  chapter: number;
  verse: number;
  text: string;
}
// Reduce a multi-chapter reference (e.g. "Numbers 23-25") to a single
// chapter ("Numbers 23"), because the free bible-api.com only serves one
// chapter per request.
function firstChapter(ref: string): string {
  // Match "Book Chapter" allowing a leading number on the book ("1 Peter").
  const m = ref.match(/^([\d ]*[A-Za-z][A-Za-z. ]*?)\s+(\d+)/);
  if (m) return `${m[1].trim()} ${m[2]}`;
  return ref;
}

function ReadHere({ passage }: { passage: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<{ verses: Verse[]; translation: string; reference: string } | null>(null);
  const [truncated, setTruncated] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !passage) return;
    let cancelled = false;
    setLoading(true);
    setErr(null);
    setData(null);
    setTruncated(null);

    const tryFetch = async (ref: string, fallback = false) => {
      const r = await fetch(`/api/verse?ref=${encodeURIComponent(ref)}`);
      const d = await r.json();
      if (cancelled) return;
      if (d.error) {
        // If the passage spans too many chapters, retry with just the first.
        const tooMany = /too many chapters/i.test(d.error) || /one whole chapter/i.test(d.detail ?? "");
        if (tooMany && !fallback) {
          const fc = firstChapter(ref);
          if (fc !== ref) {
            setTruncated(`Showing ${fc} only — full reading spans multiple chapters.`);
            return tryFetch(fc, true);
          }
        }
        setErr(d.error);
        return;
      }
      setData(d);
    };

    tryFetch(passage)
      .catch((e) => !cancelled && setErr(e instanceof Error ? e.message : "Lookup failed"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [open, passage]);

  return (
    <div className="dash-bible-readhere">
      <button
        type="button"
        className="dash-btn"
        onClick={() => setOpen((v) => !v)}
        style={{ padding: "8px 14px", fontSize: 11 }}
      >
        {open ? "Hide passage" : "📖 Read the passage here"}
      </button>
      {open && (
        <div className="mt-3">
          {loading && (
            <div className="text-[12.5px] text-[var(--colour-ink-quiet)]">Loading…</div>
          )}
          {err && (
            <div className="text-[12.5px] text-[#f1a07d]">
              {err}. Try editing the passage above to a single chapter (e.g. &ldquo;Numbers 21&rdquo;).
            </div>
          )}
          {data && (
            <article>
              <div className="eyebrow eyebrow-amber">{data.translation}</div>
              <div className="font-display text-[18px] mt-1">{data.reference}</div>
              {truncated && (
                <div className="text-[11.5px] text-[var(--colour-ink-quiet)] mt-1">
                  {truncated}
                </div>
              )}
              <div className="dash-verse mt-3 leading-relaxed">
                {data.verses.map((v) => (
                  <p key={`${v.chapter}-${v.verse}`} className="mb-2">
                    <span className="dash-verse-num">{v.verse}</span>
                    {v.text}
                  </p>
                ))}
              </div>
            </article>
          )}
        </div>
      )}
    </div>
  );
}
