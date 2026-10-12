"use client";

// The owner's study for a date, shown right inside a member's journal day,
// so they can read his side and write their own on one page. The day, its
// Bible App link and the arrows are the journal's own - this shows only what
// he wrote: the passages, his takeaway, his notes and words. With no `on`
// (he hasn't written for that date) it says so, with a way to his latest.
// Same data and privacy as the reader (/api/study/read).

import { useEffect, useState } from "react";
import { FoldNotes, FoldWords } from "@/components/study/fold-notes";
import { ShareDay } from "@/components/study/share-day";
import { dayLabel, planDay } from "@/lib/dashboard/notes";
import type { ReaderData } from "@/lib/study/types";

const cache = new Map<string, ReaderData>();

export function StudyPeek({ on, author, onOpenDay }: { on?: string; author?: string; onOpenDay: (day: string) => void }) {
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

  if (error) return <div className="dash-daniel-body dash-word-hint">{error}</div>;
  if (!data) return <div className="dash-daniel-body dash-word-hint">Opening {author ? `${author}'s` : "the"} notes…</div>;

  // (The card's title already says nothing's written for this day.)
  if (!on) {
    const latest = data.day;
    if (!latest) return null;
    return (
      <div className="dash-daniel-body">
        <button type="button" className="dash-btn dash-btn-ghost dash-note-nav" onClick={() => onOpenDay(latest)}>
          Go to {author ? "his" : "the"} latest · Day {planDay(latest).n}
        </button>
      </div>
    );
  }
  if (!data.day) return <div className="dash-daniel-body dash-word-hint">Nothing to read yet.</div>;

  const day = data.day;
  const chapters = data.contents.find((c) => c.day === day)?.chapters ?? [];
  const title = data.info?.title || chapters.join(" · ") || dayLabel(day);
  return (
    <div className="dash-daniel-body">
      {data.info?.title && chapters.length > 0 && <div className="dash-reader-chapters">{chapters.join(" · ")}</div>}
      {data.info?.takeaway && <blockquote className="dash-reader-takeaway">{data.info.takeaway}</blockquote>}
      <FoldNotes notes={data.notes} />
      <FoldWords words={data.words} title={author ? `Words ${author} studied` : "Words studied"} />
      {data.study.reading !== "off" && data.info?.shared !== false && (
        <div className="dash-day-tools mt-3">
          <ShareDay day={day} title={title} takeaway={data.info?.takeaway || undefined} author={author} />
        </div>
      )}
    </div>
  );
}
