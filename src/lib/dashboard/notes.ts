// Bible study notes - passage parsing, ordering, search, and the plain-text
// format the owner already writes in a Google Doc:
//
//   1257 - Matt 2 vs 7 - Herod says he wants to go worship Jesus...
//   Vs 12 - Magi warned in a dream not to go to Herod...
//   • Do I listen and stay and go when I am told?
//
// The leading number is the page in a chronological Bible; "Vs 12" carries
// on in the same book and chapter.

import { BOOKS, bookId } from "./bible-books";
import { foldText } from "./words";

export interface StudyNote {
  id: string;
  page: number | null; // chronological Bible page
  seq: number; // order written
  book: number | null; // 1-66
  chapter: number | null;
  verse: number | null;
  verseEnd: number | null;
  text: string;
  createdAt: number; // epoch ms
  updatedAt: number;
}

export type NoteInput = Pick<StudyNote, "page" | "book" | "chapter" | "verse" | "verseEnd" | "text">;

export interface Passage {
  book: number;
  chapter: number;
  verse: number | null;
  verseEnd: number | null;
}

const bookName = (book: number) => (BOOKS[book - 1] === "Psalms" ? "Psalm" : BOOKS[book - 1]);

// "Matt 2 vs 7", "Matthew 2:7-9", "Matt 2", "vs 12" / "12" (same book and
// chapter as `prev`), "3:1" (same book as `prev`).
export function parsePassage(input: string, prev?: Passage | null): Passage | null {
  const s = input
    .trim()
    .replace(/\b(?:vss?|vv?|verses?)\.?\s*(?=\d)/gi, ":")
    .replace(/\s*:\s*/g, ":")
    .replace(/:+/g, ":")
    .replace(/\s*[-–]\s*/g, "-");
  if (!s) return null;

  const verseOnly = s.match(/^:?(\d+)(?:-(\d+))?$/);
  if (verseOnly) {
    if (!prev) return null;
    return {
      book: prev.book,
      chapter: prev.chapter,
      verse: Number(verseOnly[1]),
      verseEnd: verseOnly[2] ? Number(verseOnly[2]) : null,
    };
  }
  const chapterVerse = s.match(/^(\d+):(\d+)(?:-(\d+))?$/);
  if (chapterVerse) {
    if (!prev) return null;
    return {
      book: prev.book,
      chapter: Number(chapterVerse[1]),
      verse: Number(chapterVerse[2]),
      verseEnd: chapterVerse[3] ? Number(chapterVerse[3]) : null,
    };
  }
  const full = s.match(/^((?:[1-3]\s*)?[A-Za-z][A-Za-z .]*?)\s*(\d+)(?::(\d+)(?:-(\d+))?)?$/);
  if (!full) return null;
  const book = bookId(full[1]);
  if (!book) return null;
  return {
    book,
    chapter: Number(full[2]),
    verse: full[3] ? Number(full[3]) : null,
    verseEnd: full[4] ? Number(full[4]) : null,
  };
}

export function passageOf(n: Pick<StudyNote, "book" | "chapter" | "verse" | "verseEnd">): Passage | null {
  return n.book && n.chapter
    ? { book: n.book, chapter: n.chapter, verse: n.verse, verseEnd: n.verseEnd }
    : null;
}

export function formatPassage(p: Passage | null): string {
  if (!p) return "";
  const verses = p.verse ? `:${p.verse}${p.verseEnd && p.verseEnd !== p.verse ? `-${p.verseEnd}` : ""}` : "";
  return `${bookName(p.book)} ${p.chapter}${verses}`;
}

// Reading order: page, then the order written. Notes without a page keep
// their place after the notes written before them.
export function readingOrder(notes: StudyNote[]): StudyNote[] {
  const bySeq = [...notes].sort((a, b) => a.seq - b.seq);
  let lastPage = -1;
  const key = new Map<string, number>();
  for (const n of bySeq) {
    if (n.page != null) lastPage = n.page;
    key.set(n.id, n.page ?? lastPage);
  }
  return bySeq.sort((a, b) => key.get(a.id)! - key.get(b.id)! || a.seq - b.seq);
}

// The latest written note - its page and passage seed the next one.
export function latestNote(notes: StudyNote[]): StudyNote | null {
  return notes.reduce<StudyNote | null>((best, n) => (!best || n.seq > best.seq ? n : best), null);
}

// ── Search ───────────────────────────────────────────────────────

function haystack(n: StudyNote): string {
  const p = passageOf(n);
  return foldText(
    [
      n.text,
      formatPassage(p),
      p ? `${BOOKS[p.book - 1]} ${p.chapter}` : "",
      n.page != null ? `page ${n.page} p${n.page} ${n.page}` : "",
    ].join(" \n "),
  );
}

// A passage query ("Matt 2", "Matthew 2:7") filters by passage; anything
// else must appear in the note, its passage or its page.
export function matchesNote(n: StudyNote, query: string): boolean {
  const q = query.trim();
  if (!q) return true;
  const asPassage = /[a-z]/i.test(q) && /\d/.test(q) ? parsePassage(q) : null;
  if (asPassage) {
    if (n.book !== asPassage.book || n.chapter !== asPassage.chapter) return false;
    if (asPassage.verse == null) return true;
    const end = n.verseEnd ?? n.verse;
    return n.verse != null && n.verse <= (asPassage.verseEnd ?? asPassage.verse) && (end ?? 0) >= asPassage.verse;
  }
  const bookOnly = /^[1-3]?\s*[a-z]+$/i.test(q) ? bookId(q) : null;
  const text = haystack(n);
  const terms = foldText(q).split(/\s+/).filter(Boolean);
  return (bookOnly != null && n.book === bookOnly) || terms.every((t) => text.includes(t));
}

// ── Import / export in the Google Doc format ─────────────────────

const BULLET = /^\s*(?:[•●▪◦*]|-(?=\s))\s*/;

// Turns pasted notes into note inputs, in order. Recognises
//   "1257 - Matt 2 vs 7 - text"   (page, passage, text)
//   "Matt 2 vs 7 - text"          (passage, text; same page)
//   "Vs 12 - text"                (verse in the same book and chapter)
//   "• question" / "- question"   (a bullet in the previous note)
// Any other line continues the previous note.
export function parseImport(raw: string): NoteInput[] {
  const out: NoteInput[] = [];
  let page: number | null = null;
  let prev: Passage | null = null;

  const start = (passage: Passage | null, text: string) => {
    out.push({
      page,
      book: passage?.book ?? null,
      chapter: passage?.chapter ?? null,
      verse: passage?.verse ?? null,
      verseEnd: passage?.verseEnd ?? null,
      text: text.trim(),
    });
    if (passage) prev = passage;
  };
  const append = (line: string) => {
    const last = out[out.length - 1];
    if (last) last.text = `${last.text}\n${line}`.trim();
    else start(null, line);
  };

  for (const rawLine of raw.replace(/\r/g, "").split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    if (BULLET.test(rawLine)) {
      append(`• ${line.replace(BULLET, "")}`);
      continue;
    }
    // Split "head - text" on the last " - " that still leaves a passage head.
    const parts = line.split(/\s+[-–—]\s+/);
    let consumed = false;
    for (let cut = Math.min(parts.length - 1, 2); cut >= 1 && !consumed; cut--) {
      const head = parts.slice(0, cut);
      const text = parts.slice(cut).join(" - ");
      let headPage: number | null = null;
      let passageText = head.join(" ");
      if (head.length === 2 && /^\d{1,5}$/.test(head[0])) {
        headPage = Number(head[0]);
        passageText = head[1];
      }
      const passage = parsePassage(passageText, prev);
      if (passage) {
        if (headPage != null) page = headPage;
        start(passage, text);
        consumed = true;
      } else if (head.length === 1 && /^\d{1,5}$/.test(head[0]) && Number(head[0]) > 150) {
        // "1260 - text" with no passage: a new page.
        page = Number(head[0]);
        start(null, text);
        consumed = true;
      }
    }
    if (!consumed) append(line);
  }
  return out.filter((n) => n.text);
}

// Back to the Google Doc format, in reading order, for download.
export function exportText(notes: StudyNote[]): string {
  const lines: string[] = [];
  let lastPage: number | null | undefined;
  let prev: Passage | null = null;
  for (const n of readingOrder(notes)) {
    const p = passageOf(n);
    const sameChapter = p && prev && p.book === prev.book && p.chapter === prev.chapter;
    const where = p
      ? sameChapter && p.verse
        ? `Vs ${p.verse}${p.verseEnd ? `-${p.verseEnd}` : ""}`
        : formatPassage(p)
      : "";
    const head = [n.page != null && n.page !== lastPage ? String(n.page) : "", where].filter(Boolean).join(" - ");
    if (lines.length) lines.push("");
    lines.push(head ? `${head} - ${n.text}` : n.text);
    lastPage = n.page;
    if (p) prev = p;
  }
  return `${lines.join("\n")}\n`;
}
