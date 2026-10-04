"use client";

// "Start a note" - simple boxes above the writing space for the page in the
// book, the passage and the verse. It writes the line the journal already
// understands ("1257 - Matthew 2 vs 7 - ") into the writing box and puts
// the cursor after it, so nobody has to learn the shorthand. Shared by the
// owner's journal and members'.

import { useState, type KeyboardEvent } from "react";
import { BOOKS } from "@/lib/dashboard/bible-books";
import { parsePassage, type Passage } from "@/lib/dashboard/notes";

export function NoteStarter({
  dayText,
  chapters,
  page: startPage,
  passage: startPassage,
  prev,
  onStart,
}: {
  dayText: string; // "Day 269 · Sat 26 September"
  chapters: string[]; // quick picks: this day's chapters
  page: number | null; // the page this day's notes were last on
  passage: string; // the chapter this day's notes were last on
  prev: Passage | null; // what "Vs 12" would carry on from
  onStart: (line: string) => void;
}) {
  const [page, setPage] = useState(startPage != null ? String(startPage) : "");
  const [passage, setPassage] = useState(startPassage);
  const [verse, setVerse] = useState("");
  const [error, setError] = useState<string | null>(null);

  function start() {
    const p = page.trim();
    const book = passage.trim();
    const v = verse.trim().replace(/\s*[-–]\s*/g, "-");
    if (p && !/^\d{1,5}$/.test(p)) return setError("The page is a number, like 1257.");
    if (v && !/^\d{1,3}(-\d{1,3})?$/.test(v)) return setError("The verse is a number, like 7 or 7-9.");
    let ref = "";
    if (book) {
      ref = v ? `${book} vs ${v}` : book;
      if (!parsePassage(ref)) return setError("Type the book and chapter, like John 4.");
    } else if (v) {
      if (!prev) return setError("Add the book and chapter too, like John 4.");
      ref = `Vs ${v}`;
    } else if (!p) {
      return setError("Fill in the page, the passage or the verse.");
    } else if (Number(p) <= 150) {
      return setError("Add the passage too, like John 4.");
    }
    setError(null);
    onStart(`${[p, ref].filter(Boolean).join(" - ")} - `);
    setVerse("");
  }

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      start();
    }
  };

  return (
    <div className="dash-starter">
      <div className="dash-starter-head">
        <span className="eyebrow eyebrow-amber">Start a note</span>
        <span className="dash-starter-day">{dayText}</span>
      </div>
      <div className="dash-starter-fields">
        <label className="dash-starter-field is-page">
          <span>Page</span>
          <input
            className="dash-input"
            inputMode="numeric"
            placeholder="1257"
            value={page}
            onChange={(e) => setPage(e.target.value)}
            onKeyDown={onKey}
            aria-label="Page in the book"
          />
        </label>
        <label className="dash-starter-field is-passage">
          <span>Passage</span>
          <input
            className="dash-input"
            list="dash-starter-books"
            placeholder="Matthew 2"
            value={passage}
            onChange={(e) => setPassage(e.target.value)}
            onKeyDown={onKey}
            aria-label="Book and chapter"
          />
        </label>
        <label className="dash-starter-field is-verse">
          <span>Verse</span>
          <input
            className="dash-input"
            inputMode="numeric"
            placeholder="7"
            value={verse}
            onChange={(e) => setVerse(e.target.value)}
            onKeyDown={onKey}
            aria-label="Verse"
          />
        </label>
        <button type="button" className="dash-btn dash-btn-primary dash-starter-go" onClick={start}>
          Start note
        </button>
      </div>
      {chapters.length > 0 && (
        <div className="dash-starter-chips" aria-label="This day's chapters">
          {chapters.map((c) => (
            <button
              key={c}
              type="button"
              className={`dash-starter-chip ${passage.trim() === c ? "is-on" : ""}`}
              onClick={() => {
                setPassage(c);
                setError(null);
              }}
            >
              {c}
            </button>
          ))}
        </div>
      )}
      {error && <p className="dash-starter-error">{error}</p>}
      <datalist id="dash-starter-books">
        {BOOKS.map((b) => (
          <option key={b} value={`${b} `} />
        ))}
      </datalist>
    </div>
  );
}
