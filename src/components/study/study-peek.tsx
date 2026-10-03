"use client";

// The owner's study for a date, shown right inside a member's journal day,
// so they can read his side and write their own without leaving the page.
// Laid out like the reader: the day, its title, the Bible App link, the
// takeaway, then the notes and words as folded rows. With no `on` (the
// owner hasn't written for that date) it shows his latest day instead.
// Same data and privacy as the reader (/api/study/read).

import { useEffect, useState } from "react";
import { FoldNotes, FoldWords } from "@/components/study/fold-notes";
import { dayLabel, planDay } from "@/lib/dashboard/notes";
import { bibleAppDay } from "@/lib/study/plan";
import type { ReaderData } from "@/lib/study/types";

const cache = new Map<string, ReaderData>();

export function StudyPeek({ on, studyUrl, author }: { on?: string; studyUrl: string; author?: string }) {
  const key = on ?? "latest";
  const [data, setData] = useState<ReaderData | null>(cache.get(key) ?? null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    setError(null);
    setData(cache.get(key) ?? null);
    fetch(on ? `/api/study/read?on=${on}` : "/api/study/read", { cache: "no-store" })
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
  }, [key, on]);

  const name = author ?? "the study";
  if (error) return <div className="dash-daniel-body dash-word-hint">{error}</div>;
  if (!data) return <div className="dash-daniel-body dash-word-hint">Opening {author ? `${author}'s` : "the"} notes…</div>;
  if (!data.day) return <div className="dash-daniel-body dash-word-hint">Nothing to read yet.</div>;

  const day = data.day;
  const chapters = data.contents.find((c) => c.day === day)?.chapters ?? [];
  return (
    <div className="dash-daniel-body">
      {!on && (
        <p className="dash-daniel-note">
          {author ?? "The study"} hasn&apos;t written for this day yet - here&apos;s {author ? "his" : "the"} latest.
        </p>
      )}
      <div className="dash-reader-eyebrow">
        Day {planDay(day).n} · {dayLabel(day)}
        {author ? ` · ${author}` : ""}
      </div>
      <h3 className="dash-daniel-title">{data.info?.title || chapters.join(" · ") || dayLabel(day)}</h3>
      {data.info?.title && chapters.length > 0 && <div className="dash-reader-chapters">{chapters.join(" · ")}</div>}
      <a className="dash-plan-link mt-2" href={bibleAppDay(planDay(day).n)} target="_blank" rel="noreferrer">
        📖 Read Day {planDay(day).n}&apos;s passages in the Bible App (NIV) ↗
      </a>
      {data.info?.takeaway && <blockquote className="dash-reader-takeaway">{data.info.takeaway}</blockquote>}
      <FoldNotes notes={data.notes} />
      <FoldWords words={data.words} title={author ? `Words ${author} studied` : "Words studied"} />
      <a className="dash-word-link dash-daniel-all" href={`${studyUrl}?day=${day}`}>
        All of {author ? `${name}'s` : "the study's"} days, on a calendar →
      </a>
    </div>
  );
}
