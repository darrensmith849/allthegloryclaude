"use client";

// The owner's notes for a date, shown right inside a member's journal day
// (opened from "Daniel's notes for 28 September"), so they can read his side
// and write their own without leaving the page. Same data and privacy as the
// reader (/api/study/read): no private notes or personal word comments.

import { useEffect, useState } from "react";
import { NoteText } from "@/components/dashboard/note-text";
import { formatPassage, passageOf } from "@/lib/dashboard/notes";
import { languageLabel } from "@/lib/dashboard/words";
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
      {data.notes.map((n) => {
        const p = passageOf(n);
        return (
          <section key={n.id} className="dash-study-peek-note">
            {p && <div className="dash-reader-ref">{formatPassage(p)}</div>}
            <NoteText text={n.text} />
          </section>
        );
      })}
      {data.words.length > 0 && (
        <div className="dash-study-peek-words">
          <div className="dash-reader-section">Words {author ?? "the study"} studied</div>
          {data.words.map((w) => (
            <div key={w.id} className="dash-study-peek-word">
              <span className="dash-reader-word-name">{w.word}</span>
              {w.original && (
                <span className="dash-word-script" dir="auto">
                  {w.original}
                </span>
              )}
              {w.translit && <span className="dash-word-translit">{w.translit}</span>}
              <p>
                <span className="dash-reader-label">{languageLabel(w)}</span> {w.originalMeaning || w.englishMeaning}
              </p>
            </div>
          ))}
        </div>
      )}
      <a className="dash-word-link dash-study-peek-open" href={`${studyUrl}?day=${data.day}`}>
        Open in {author ? `${author}'s study` : "the study"} →
      </a>
    </div>
  );
}
