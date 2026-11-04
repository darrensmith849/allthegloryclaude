"use client";

// The search bar at the top of the journal: a word, a verse or a date finds
// it in your own notes and words straight away, then in the owner's shared
// study (members, from /api/study/read?search=) and in the Bible
// (/api/bible) - each with a way in: open the day, or add the verse to a note.

import { useEffect, useState } from "react";
import { Marked } from "@/components/study/bible-lookup";
import type { BibleWord } from "@/lib/dashboard/types";
import { dayLabel, formatPassage, passageOf, type StudyNote } from "@/lib/dashboard/notes";

interface StudyHit {
  id: string;
  day: string;
  page: number | null;
  book: number | null;
  chapter: number | null;
  verse: number | null;
  verseEnd: number | null;
  text: string;
}
interface BibleHit {
  ref: string;
  text: string;
}
type Remote<T> = { q: string; list: T[]; error?: string } | null;

const NOTES_SHOWN = 30;

export function JournalSearch({
  query,
  setQuery,
  notes,
  words,
  onOpenNote,
  onOpenWord,
  studyName,
  onOpenStudyDay,
  onAddVerse,
}: {
  query: string;
  setQuery: (q: string) => void;
  notes: StudyNote[]; // own notes that match
  words: BibleWord[]; // own words that match
  onOpenNote: (n: StudyNote) => void;
  onOpenWord: (w: BibleWord) => void;
  studyName?: string; // members: "Daniel's study" - searched too
  onOpenStudyDay: (day: string) => void;
  onAddVerse: (ref: string) => void;
}) {
  const q = query.trim();
  const [study, setStudy] = useState<Remote<StudyHit>>(null);
  const [bible, setBible] = useState<Remote<BibleHit>>(null);
  const [moreStudy, setMoreStudy] = useState(false);

  // The shared study and the Bible, once typing pauses.
  useEffect(() => {
    setMoreStudy(false);
    if (q.length < 2) {
      setStudy(null);
      setBible(null);
      return;
    }
    const ctrl = new AbortController();
    const t = window.setTimeout(() => {
      if (studyName) {
        fetch(`/api/study/read?search=${encodeURIComponent(q)}`, { signal: ctrl.signal, cache: "no-store" })
          .then((r) => r.json())
          .then((d: { results?: StudyHit[]; error?: string }) => setStudy({ q, list: d.results ?? [], error: d.results ? undefined : d.error }))
          .catch(() => {});
      }
      const bibleOk = /\d/.test(q) || q.replace(/[^a-z]/gi, "").length >= 3;
      if (!bibleOk) return setBible({ q, list: [] });
      fetch(`/api/bible?q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((d: { results?: BibleHit[]; error?: string }) => setBible({ q, list: (d.results ?? []).slice(0, 8), error: d.results ? undefined : d.error }))
        .catch(() => {});
    }, 350);
    return () => {
      window.clearTimeout(t);
      ctrl.abort();
    };
  }, [q, studyName]);

  const studyNow = study?.q === q ? study : null;
  const bibleNow = bible?.q === q ? bible : null;
  const studyList = studyNow?.list ?? [];
  const shownStudy = moreStudy ? studyList : studyList.slice(0, 5);
  const nothing =
    !notes.length && !words.length && studyNow && (!studyName || !studyList.length) && bibleNow && !bibleNow.list.length;

  return (
    <div className="journal-search">
      <div className="journal-search-bar">
        <span className="journal-search-icon" aria-hidden>
          ⌕
        </span>
        <input
          type="search"
          className="dash-input"
          placeholder={
            studyName
              ? `Search my notes, ${studyName} and the Bible - “grace”, “John 3:16”, “27 sep”`
              : "Search your notes, words and the Bible - “grace”, “John 3:16”, “27 sep”"
          }
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setQuery("");
          }}
          aria-label="Search notes, the study and the Bible"
        />
      </div>

      {q && (
        <div className="journal-search-results">
          {nothing && <div className="dash-word-hint">Nothing matches “{q}”.</div>}

          {words.length > 0 && <div className="dash-note-results-head">My words</div>}
          {words.slice(0, 10).map((w) => (
            <button key={w.id} type="button" className="dash-note-result" onClick={() => onOpenWord(w)}>
              <span className="dash-note-result-meta">
                {w.day ? dayLabel(w.day, { weekday: false }) : "Word Journal"} · {w.original ?? ""} {w.translit ?? ""}
              </span>
              <span className="dash-note-result-text">
                <strong>{w.word}</strong> - {w.originalMeaning || w.englishMeaning}
              </span>
            </button>
          ))}

          {notes.length > 0 && <div className="dash-note-results-head">{studyName ? "My notes" : "Notes"} · {notes.length}</div>}
          {notes.slice(0, NOTES_SHOWN).map((n) => (
            <button key={n.id} type="button" className="dash-note-result" onClick={() => onOpenNote(n)}>
              <span className="dash-note-result-meta">
                {n.day ? dayLabel(n.day, { weekday: false }) : "No day"}
                {passageOf(n) ? ` · ${formatPassage(passageOf(n))}` : ""}
              </span>
              <span className="dash-note-result-text">{n.text.replace(/\n/g, " ")}</span>
            </button>
          ))}
          {notes.length > NOTES_SHOWN && <div className="dash-word-hint">{notes.length - NOTES_SHOWN} more - narrow the search.</div>}

          {studyName && (
            <>
              <div className="dash-note-results-head">
                {studyName}
                {studyList.length ? ` · ${studyList.length}${studyList.length >= 40 ? "+" : ""}` : ""}
              </div>
              {!studyNow && <div className="dash-word-hint">Searching…</div>}
              {studyNow && !studyList.length && (
                <div className="dash-word-hint">{studyNow.error ?? `Nothing in ${studyName} for “${q}”.`}</div>
              )}
              {shownStudy.map((h) => {
                const p = passageOf({ book: h.book, chapter: h.chapter, verse: h.verse, verseEnd: h.verseEnd });
                return (
                  <button key={h.id} type="button" className="dash-note-result is-study" onClick={() => onOpenStudyDay(h.day)}>
                    <span className="dash-note-result-meta">
                      {dayLabel(h.day, { weekday: false })}
                      {p ? ` · ${formatPassage(p)}` : ""}
                    </span>
                    <span className="dash-note-result-text">{h.text.replace(/\n/g, " ")}</span>
                  </button>
                );
              })}
              {studyList.length > 5 && (
                <button type="button" className="dash-word-link journal-search-more" onClick={() => setMoreStudy((v) => !v)}>
                  {moreStudy ? "Show fewer" : `Show all ${studyList.length}`}
                </button>
              )}
            </>
          )}

          {(bibleNow?.list.length || !bibleNow) && (
            <div className="dash-note-results-head">The Bible{bibleNow?.list.length ? " · BSB" : ""}</div>
          )}
          {!bibleNow && <div className="dash-word-hint">Searching…</div>}
          {bibleNow?.list.map((b) => (
            <div key={b.ref} className="dash-note-result is-bible">
              <span className="dash-note-result-meta">
                {b.ref}
                <button type="button" className="dash-word-link journal-search-add" onClick={() => onAddVerse(b.ref)}>
                  + Add to my note
                </button>
              </span>
              <span className="dash-note-result-text">
                <Marked text={b.text} />
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
