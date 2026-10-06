"use client";

// Catch up: the plan's days a member has missed lately (since they joined,
// at most the last 14), each with the Bible App and their journal one tap
// away - or tick them off together. Grace, not guilt: it hides once they're
// all read, and "Just carry on from today" hides it for the week. It can
// also be folded down to its title.

import Link from "next/link";
import { useState } from "react";
import { dayLabel, planDay, shiftDay, type StudyDay } from "@/lib/dashboard/notes";
import { bibleAppDay } from "@/lib/study/plan";
import { FoldToggle, useFolded } from "./fold-toggle";

const WINDOW = 14;

export function missedDays(today: string, joined: string, done: Set<string>): string[] {
  const out: string[] = [];
  const start = [shiftDay(today, -WINDOW), joined, `${today.slice(0, 4)}-01-01`].sort().pop() as string;
  for (let d = shiftDay(today, -1); d >= start; d = shiftDay(d, -1)) if (!done.has(d)) out.push(d);
  return out.reverse();
}

export function CatchUp({
  missed,
  hideKey,
  onRead,
}: {
  missed: string[];
  hideKey: string;
  onRead: (days: StudyDay[]) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [folded, toggleFold] = useFolded(`${hideKey}:folded`);
  const [hidden, setHidden] = useState(() => {
    try {
      const until = Number(window.localStorage.getItem(hideKey) ?? 0);
      return until > Date.now();
    } catch {
      return false;
    }
  });
  if (hidden || !missed.length) return null;

  async function mark(days: string[]) {
    setBusy(true);
    const made: StudyDay[] = [];
    for (const day of days) {
      const r = await fetch("/api/study/days", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ day, read: true }),
      }).catch(() => null);
      const data = r?.ok ? ((await r.json().catch(() => null)) as { day?: StudyDay } | null) : null;
      if (data?.day) made.push(data.day);
    }
    onRead(made);
    setBusy(false);
  }
  function carryOn() {
    try {
      window.localStorage.setItem(hideKey, String(Date.now() + 7 * 86_400_000));
    } catch {
      // private window
    }
    setHidden(true);
  }

  const shown = missed.slice(-7);
  return (
    <section className={`study-catchup study-foldable ${folded ? "is-folded" : ""}`}>
      <FoldToggle folded={folded} onToggle={toggleFold} what="catch up" />
      <span className="eyebrow eyebrow-amber">Catch up</span>
      <h2 className="study-catchup-title">
        {missed.length === 1 ? "One day to catch up on" : `${missed.length} days to catch up on`}
      </h2>
      {!folded && (
        <>
          <p className="study-catchup-text">
            No pressure - read them when you can, or tick the ones you&apos;ve read. Grace, not guilt.
          </p>
          <div className="study-catchup-list">
            {missed.length > shown.length && (
              <div className="study-catchup-more">and {missed.length - shown.length} earlier</div>
            )}
            {shown.map((d) => (
              <div key={d} className="study-catchup-row">
                <span className="study-catchup-day">
                  <strong>Day {planDay(d).n}</strong> · {dayLabel(d)}
                </span>
                <a href={bibleAppDay(planDay(d).n)} target="_blank" rel="noreferrer" className="dash-word-link">
                  Read ↗
                </a>
                <Link href={`/study/journal?day=${d}`} className="dash-word-link">
                  Journal
                </Link>
                <button type="button" className="dash-word-link" disabled={busy} onClick={() => mark([d])}>
                  ✓ Read
                </button>
              </div>
            ))}
          </div>
          <div className="study-catchup-actions">
            <button type="button" className="dash-btn dash-btn-primary dash-note-nav" disabled={busy} onClick={() => mark(missed)}>
              {busy ? "Saving…" : missed.length === 1 ? "I've read it" : `I've read all ${missed.length}`}
            </button>
            <button type="button" className="dash-btn dash-btn-ghost dash-note-nav" onClick={carryOn}>
              Just carry on from today
            </button>
          </div>
        </>
      )}
    </section>
  );
}
