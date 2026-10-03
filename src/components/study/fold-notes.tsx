"use client";

// The owner's notes and words as folded rows - the same look as a member's
// own notes in their journal: the verse and a one-line preview, tap to open,
// "Open all" to read straight through. Used by the reader (/study/read) and
// the in-journal view of the owner's day (study-peek.tsx).

import { useState } from "react";
import { NoteText } from "@/components/dashboard/note-text";
import { formatPassage, passageOf } from "@/lib/dashboard/notes";
import { languageLabel } from "@/lib/dashboard/words";
import type { ReaderNote, ReaderWord } from "@/lib/study/types";

const preview = (text: string) =>
  text
    .replace(/^\s*(?:[•●▪◦*]|-(?=\s))\s*/gm, "")
    .replace(/\s+/g, " ")
    .trim();

function useFold(ids: string[]) {
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const all = ids.length > 0 && ids.every((id) => open.has(id));
  return {
    isOpen: (id: string) => open.has(id),
    toggle: (id: string) =>
      setOpen((s) => {
        const next = new Set(s);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }),
    all,
    toggleAll: () => setOpen(all ? new Set() : new Set(ids)),
  };
}

export function FoldNotes({ notes, title = "Notes" }: { notes: ReaderNote[]; title?: string }) {
  const fold = useFold(notes.map((n) => n.id));
  if (!notes.length) return null;
  return (
    <div className="dash-fold">
      <div className="dash-note-section-row">
        <span className="eyebrow eyebrow-amber">
          {title} · {notes.length}
        </span>
        <button type="button" className="dash-word-link" onClick={fold.toggleAll}>
          {fold.all ? "Close all" : "Open all"}
        </button>
      </div>
      <div className="dash-note-list">
        {notes.map((n) => {
          const p = passageOf(n);
          const open = fold.isOpen(n.id);
          return (
            <article key={n.id} className={`dash-note ${open ? "is-open" : ""}`}>
              <button type="button" className="dash-note-head" onClick={() => fold.toggle(n.id)} aria-expanded={open}>
                <span className="dash-note-head-ref">{p ? formatPassage(p) : "Note"}</span>
                <span className="dash-note-head-text">{open ? "" : preview(n.text)}</span>
                <span className="dash-note-chev" aria-hidden>
                  ›
                </span>
              </button>
              {open && (
                <div className="dash-note-open">
                  <NoteText text={n.text} />
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

export function FoldWords({ words, title = "Words studied" }: { words: ReaderWord[]; title?: string }) {
  const fold = useFold(words.map((w) => w.id));
  if (!words.length) return null;
  return (
    <div className="dash-fold dash-fold-words">
      <div className="dash-note-section-row">
        <span className="eyebrow eyebrow-amber">
          {title} · {words.length}
        </span>
        {words.length > 1 && (
          <button type="button" className="dash-word-link" onClick={fold.toggleAll}>
            {fold.all ? "Close all" : "Open all"}
          </button>
        )}
      </div>
      <div className="dash-note-list">
        {words.map((w) => {
          const open = fold.isOpen(w.id);
          return (
            <article key={w.id} className={`dash-note ${open ? "is-open" : ""}`}>
              <button type="button" className="dash-note-head" onClick={() => fold.toggle(w.id)} aria-expanded={open}>
                <span className="dash-note-head-ref dash-fold-word">{w.word}</span>
                <span className="dash-note-head-text">
                  {[w.original, w.translit].filter(Boolean).join(" · ")}
                  {!open && (w.originalMeaning || w.englishMeaning) ? ` - ${w.originalMeaning || w.englishMeaning}` : ""}
                </span>
                <span className="dash-note-chev" aria-hidden>
                  ›
                </span>
              </button>
              {open && (
                <div className="dash-note-open dash-fold-word-body">
                  {w.strongs && <div className="dash-word-source">{w.strongs}</div>}
                  {w.originalMeaning && (
                    <p>
                      <span className="dash-reader-label">{languageLabel(w)}</span> {w.originalMeaning}
                    </p>
                  )}
                  {w.englishMeaning && (
                    <p>
                      <span className="dash-reader-label">English</span> {w.englishMeaning}
                    </p>
                  )}
                  {w.application && <p className="dash-reader-word-life">{w.application}</p>}
                  {w.keyVerses && w.keyVerses.length > 0 && (
                    <div className="dash-fold-verses">
                      {w.keyVerses.slice(0, 3).map((v) => (
                        <p key={v.ref}>
                          <strong>{v.ref}</strong> {v.text}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
