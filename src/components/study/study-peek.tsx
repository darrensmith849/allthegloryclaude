"use client";

// The owner's notes for a date, shown right inside a member's journal day
// (opened from "Daniel's notes for 28 September"), so they can read his side
// and write their own without leaving the page. Same data and privacy as the
// reader (/api/study/read): no private notes or personal word comments.

import { useEffect, useState } from "react";
import { FoldNotes, FoldWords } from "@/components/study/fold-notes";
import type { ReaderData } from "@/lib/study/types";

const cache = new Map<string, ReaderData>();

export function StudyPeek({ on, studyUrl, author }: { on: string; studyUrl: string; author?: string }) {
  const [data, setData] = useState<ReaderData | null>(cache.get(on) ?? null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    setError(null);
    setData(cache.get(on) ?? null);
    fetch(`/api/study/read?on=${on}`, { cache: "no-store" })
      .then(async (r) => {
        const body = (await r.json().catch(() => ({}))) as ReaderData & { error?: string };
        if (!live) return;
        if (!r.ok) {
          setError(body.error ?? "Couldn't open the notes.");
          return;
        }
        cache.set(on, body);
        setData(body);
      })
      .catch(() => live && setError("Couldn't reach the study - check your connection."));
    return () => {
      live = false;
    };
  }, [on]);

  if (error) return <div className="dash-study-peek-body dash-word-hint">{error}</div>;
  if (!data) return <div className="dash-study-peek-body dash-word-hint">Opening {author ? `${author}'s` : "the"} notes…</div>;
  if (!data.day) return <div className="dash-study-peek-body dash-word-hint">No notes for this day yet.</div>;

  return (
    <div className="dash-study-peek-body">
      {data.info?.takeaway && <blockquote className="dash-reader-takeaway">{data.info.takeaway}</blockquote>}
      <FoldNotes notes={data.notes} title={author ? `${author}'s notes` : "Notes"} />
      <FoldWords words={data.words} title={author ? `Words ${author} studied` : "Words studied"} />
      <a className="dash-word-link dash-study-peek-open" href={`${studyUrl}?day=${data.day}`}>
        Open in {author ? `${author}'s study` : "the study"} →
      </a>
    </div>
  );
}
