"use client";

// The owner's study for a date, shown right inside a member's journal day,
// so they can read his side and write their own without leaving the page.
// Laid out like the reader: the day, its title, the Bible App link, the
// takeaway, then the notes and words as folded rows. With no `on` (the
// owner hasn't written for that date) it shows his latest day instead.
// Same data and privacy as the reader (/api/study/read).

import { useEffect, useState } from "react";
import { FoldNotes, FoldWords } from "@/components/study/fold-notes";
import { ShareDay } from "@/components/study/share-day";
import { dayLabel, planDay } from "@/lib/dashboard/notes";
import { bibleAppDay } from "@/lib/study/plan";
import type { ReaderData } from "@/lib/study/types";

const cache = new Map<string, ReaderData>();

export function StudyPeek({ on, studyUrl, author }: { on?: string; studyUrl: string; author?: string }) {
  // ‹ › step through the owner's other days here, without leaving the journal
  // (arrows by the day, like the member's own; dated buttons at the bottom).
  const [pick, setPick] = useState<string | null>(null);
  useEffect(() => setPick(null), [on]);
  const key = pick ? `day:${pick}` : (on ?? "latest");
  const [data, setData] = useState<ReaderData | null>(cache.get(key) ?? null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    setError(null);
    setData(cache.get(key) ?? null);
    fetch(pick ? `/api/study/read?day=${pick}` : on ? `/api/study/read?on=${on}` : "/api/study/read", { cache: "no-store" })
      .then(async (r) => {
        const body = (await r.json().catch(() => ({}))) as ReaderData & { error?: string };
        if (!live) return;
        if (!r.ok) {
          setError(body.error ?? "Couldn't open the notes.");
          return;
        }
        cache.set(key, body);
        setData(body);
      })
      .catch(() => live && setError("Couldn't reach the study - check your connection."));
    return () => {
      live = false;
    };
  }, [key, on, pick]);

  const name = author ?? "the study";
  if (error) return <div className="dash-daniel-body dash-word-hint">{error}</div>;
  if (!data) return <div className="dash-daniel-body dash-word-hint">Opening {author ? `${author}'s` : "the"} notes…</div>;
  if (!data.day) return <div className="dash-daniel-body dash-word-hint">Nothing to read yet.</div>;

  const day = data.day;
  const chapters = data.contents.find((c) => c.day === day)?.chapters ?? [];
  const days = data.contents.map((c) => c.day);
  const prev = days.filter((d) => d < day).pop();
  const next = days.find((d) => d > day);
  const step = (d: string | undefined, fromBottom = false) => {
    if (!d) return;
    setPick(d);
    if (fromBottom) {
      const top = document.getElementById("daniel-study");
      if (top && top.getBoundingClientRect().top < 0) top.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };
  const arrows = (
    <div className="flex gap-1 flex-none">
      <button
        type="button"
        className="dash-btn dash-btn-ghost dash-note-nav"
        disabled={!prev}
        onClick={() => step(prev)}
        aria-label={prev ? `${name}'s previous day - ${dayLabel(prev, { weekday: false })}` : "No earlier day"}
        title={prev ? dayLabel(prev, { weekday: false }) : undefined}
      >
        ‹
      </button>
      <button
        type="button"
        className="dash-btn dash-btn-ghost dash-note-nav"
        disabled={!next}
        onClick={() => step(next)}
        aria-label={next ? `${name}'s next day - ${dayLabel(next, { weekday: false })}` : "No later day"}
        title={next ? dayLabel(next, { weekday: false }) : undefined}
      >
        ›
      </button>
    </div>
  );
  return (
    <div className="dash-daniel-body">
      {!on && !pick && (
        <p className="dash-daniel-note">
          {author ?? "The study"} hasn&apos;t written for this day yet - here&apos;s {author ? "his" : "the"} latest.
        </p>
      )}
      <div className="dash-daniel-top">
        <div className="dash-reader-eyebrow">
          Day {planDay(day).n} · {dayLabel(day)}
          {author ? ` · ${author}` : ""}
        </div>
        {arrows}
      </div>
      {pick && (
        <button type="button" className="dash-word-link dash-daniel-back" onClick={() => setPick(null)}>
          ← Back to {on ? "this day" : "the latest"}
        </button>
      )}
      <h3 className="dash-daniel-title">{data.info?.title || chapters.join(" · ") || dayLabel(day)}</h3>
      {data.info?.title && chapters.length > 0 && <div className="dash-reader-chapters">{chapters.join(" · ")}</div>}
      <div className="dash-day-tools mt-2">
        <a className="dash-plan-link" href={bibleAppDay(planDay(day).n)} target="_blank" rel="noreferrer">
          📖 Read Day {planDay(day).n}&apos;s passages in the Bible App (NIV) ↗
        </a>
        {data.study.reading !== "off" && data.info?.shared !== false && (
          <ShareDay
            day={day}
            title={data.info?.title || chapters.join(" · ") || dayLabel(day)}
            takeaway={data.info?.takeaway || undefined}
            author={author}
          />
        )}
      </div>
      {data.info?.takeaway && <blockquote className="dash-reader-takeaway">{data.info.takeaway}</blockquote>}
      <FoldNotes notes={data.notes} />
      <FoldWords words={data.words} title={author ? `Words ${author} studied` : "Words studied"} />
      <div className="dash-daniel-steps">
        <button type="button" className="dash-btn dash-btn-ghost dash-note-nav" disabled={!prev} onClick={() => step(prev, true)}>
          ‹ {prev ? dayLabel(prev, { weekday: false }) : "Previous"}
        </button>
        <button type="button" className="dash-btn dash-btn-ghost dash-note-nav" disabled={!next} onClick={() => step(next, true)}>
          {next ? dayLabel(next, { weekday: false }) : "Next"} ›
        </button>
      </div>
      <a className="dash-word-link dash-daniel-all" href={`${studyUrl}?day=${day}`}>
        All of {author ? `${name}'s` : "the study's"} days, on a calendar →
      </a>
    </div>
  );
}
