// Bible study notes - reading days, passage parsing, ordering, search, and
// the plain-text format the owner already writes in a Google Doc:
//
//   27 September
//   1257 - Matt 2 vs 7 - Herod says he wants to go worship Jesus...
//   Vs 12 - Magi warned in a dream not to go to Herod...
//   • Do I listen and stay and go when I am told?
//
// The day is the reading-plan day (a date); the leading number is the page
// in a chronological Bible; "Vs 12" carries on in the same book and chapter.

import { BOOKS, bookId } from "./bible-books";
import { foldText } from "./words";

export interface StudyNote {
  id: string;
  day: string | null; // reading-plan day, YYYY-MM-DD
  page: number | null; // chronological Bible page
  seq: number; // order written
  position: number; // order within its day / page - movable
  deletedAt: number | null; // in Recently deleted since (epoch ms); never removed
  private: boolean; // never included when the study is shared
  book: number | null; // 1-66
  chapter: number | null;
  verse: number | null;
  verseEnd: number | null;
  text: string;
  createdAt: number; // epoch ms
  updatedAt: number;
}

export type NoteInput = Pick<StudyNote, "day" | "page" | "book" | "chapter" | "verse" | "verseEnd" | "text">;

export interface Passage {
  book: number;
  chapter: number;
  verse: number | null;
  verseEnd: number | null;
}

// ── Days ─────────────────────────────────────────────────────────

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const pad = (n: number) => String(n).padStart(2, "0");
const isoOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dateOf = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const isDay = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);

export function todayDay(): string {
  return isoOf(new Date());
}

export function shiftDay(iso: string, days: number): string {
  const d = dateOf(iso);
  d.setDate(d.getDate() + days);
  return isoOf(d);
}

// "Sat 27 September" (with the year only when it isn't this year).
export function dayLabel(iso: string | null, opts: { weekday?: boolean } = {}): string {
  if (!iso) return "";
  const d = dateOf(iso);
  const year = d.getFullYear() !== new Date().getFullYear() ? ` ${d.getFullYear()}` : "";
  return `${opts.weekday === false ? "" : `${WEEKDAYS[d.getDay()]} `}${d.getDate()} ${MONTHS[d.getMonth()]}${year}`;
}

// A line that is only a date: "27 September", "Sept 27", "Sat 27 Sep 2026".
export function parseDayLine(line: string, year = new Date().getFullYear()): string | null {
  const m = line
    .trim()
    .replace(/[.,]/g, " ")
    .match(
      /^(?:(?:mon|tue|wed|thu|fri|sat|sun)[a-z]*\s+)?(?:(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]{3,9})|([a-z]{3,9})\s+(\d{1,2})(?:st|nd|rd|th)?)(?:\s+(\d{4}))?\s*$/i,
    );
  if (!m) return null;
  const monthName = (m[2] ?? m[3]).toLowerCase();
  // The word must be a month or its abbreviation ("sep", "sept"), so a
  // passage heading like "Mark 3" is never read as a date.
  const month = MONTHS.findIndex((x) => x.toLowerCase().startsWith(monthName));
  const date = Number(m[1] ?? m[4]);
  if (month < 0 || date < 1 || date > 31) return null;
  return `${m[5] ?? year}-${pad(month + 1)}-${pad(date)}`;
}

// ── Passages ─────────────────────────────────────────────────────

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

export function chapterLabel(p: Passage): string {
  return `${bookName(p.book)} ${p.chapter}`;
}

// ── Order ────────────────────────────────────────────────────────

// Reading order: by day, then the order the user has set within the day
// (position starts as the order written). Notes without a day come last,
// ordered by page.
export function readingOrder(notes: StudyNote[]): StudyNote[] {
  return [...notes].sort(
    (a, b) =>
      (a.day ?? "9999").localeCompare(b.day ?? "9999") ||
      (a.day ? 0 : (a.page ?? 1e9) - (b.page ?? 1e9)) ||
      a.position - b.position ||
      a.seq - b.seq,
  );
}

// The latest written note - its day, page and passage seed the next one.
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
      n.day ? `${dayLabel(n.day)} ${n.day}` : "",
    ].join(" \n "),
  );
}

// A passage query ("Matt 2", "Matthew 2:7") filters by passage; anything
// else - words, a page, a date like "27 sep" - must appear in the note.
export function matchesNote(n: StudyNote, query: string): boolean {
  const q = query.trim();
  if (!q) return true;
  const asPassage = /[a-z]/i.test(q) && /\d/.test(q) && !parseDayLine(q) ? parsePassage(q) : null;
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

// A reference written inside a sentence: "...confess - Matt 3 vs 6." or
// "Genesis 8 vs 8". Needs a verse, so "Matthew 5" in passing isn't taken.
function passageInText(text: string): Passage | null {
  const re = /\b((?:[1-3]\s*)?[A-Z][a-z]+)\.?\s+(\d{1,3})\s*(?:vs\.?|v\.?|verses?|:)\s*(\d{1,3})(?:\s*[-–]\s*(\d{1,3}))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const book = bookId(m[1]);
    if (book) {
      return {
        book,
        chapter: Number(m[2]),
        verse: Number(m[3]),
        verseEnd: m[4] ? Number(m[4]) : null,
      };
    }
  }
  return null;
}

// Turns pasted notes into note inputs, in order. Recognises
//   "27 September" / "Sept 27"    (a date line: the day for what follows)
//   "1257 - Matt 2 vs 7 - text"   (page, passage, text)
//   "Matt 2 vs 7 - text"          (passage, text; same page)
//   "Vs 12 - text"                (verse in the same book and chapter)
//   "• question" / "* question"   (a bullet in the note above)
// A paragraph after a blank line starts a new note (taking a reference
// written inside it, if any); a line straight after another - or after a
// line ending in ":" - continues it. Plain numbers ("1 - Tell these
// stones...") are list items, not verses. `from` carries on from what was
// written before: the day, the page, and the passage "Vs 12" continues.
export function parseImport(
  raw: string,
  from: { day?: string | null; page?: number | null; prev?: Passage | null } = {},
): NoteInput[] {
  const out: NoteInput[] = [];
  let page: number | null = from.page ?? null;
  let prev: Passage | null = from.prev ?? null;
  let currentDay = from.day ?? null;
  let afterBlank = true;

  const start = (passage: Passage | null, text: string) => {
    out.push({
      day: currentDay,
      page,
      book: passage?.book ?? null,
      chapter: passage?.chapter ?? null,
      verse: passage?.verse ?? null,
      verseEnd: passage?.verseEnd ?? null,
      text: text.trim(),
    });
    if (passage) prev = passage;
  };
  const last = () => out[out.length - 1];

  for (const rawLine of raw.replace(/\r/g, "").split("\n")) {
    const line = rawLine.trim();
    if (!line) {
      afterBlank = true;
      continue;
    }
    const blank = afterBlank;
    afterBlank = false;

    const dateLine = parseDayLine(line);
    if (dateLine) {
      currentDay = dateLine;
      page = null; // a new day's reading starts on a page of its own
      afterBlank = true;
      continue;
    }
    if (BULLET.test(rawLine)) {
      const bullet = `• ${line.replace(BULLET, "")}`;
      if (last()) last().text = `${last().text}\n${bullet}`;
      else start(null, bullet);
      continue;
    }

    // "head - text": a page and/or passage before the first one or two " - ".
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
      const bareNumber = /^\d+(?:\s*[-–]\s*\d+)?$/.test(passageText.trim());
      const passage = bareNumber ? null : parsePassage(passageText, prev);
      if (passage) {
        if (headPage != null) page = headPage;
        start(passage, text);
        consumed = true;
      } else if (head.length === 1 && /^\d{3,5}$/.test(head[0]) && Number(head[0]) > 150) {
        // "1260 - text" with no passage: a new page.
        page = Number(head[0]);
        start(null, text);
        consumed = true;
      }
    }
    if (consumed) continue;

    const prevNote = last();
    if (prevNote && (!blank || /:\s*$/.test(prevNote.text))) {
      prevNote.text = `${prevNote.text}\n${line}`;
      // A reference inside the continuation names the passage of a note
      // that didn't have one ("Forgiveness ... - Matt 3 vs 6").
      if (!prevNote.book) {
        const found = passageInText(line);
        if (found) {
          Object.assign(prevNote, { book: found.book, chapter: found.chapter, verse: found.verse, verseEnd: found.verseEnd });
          prev = found;
        }
      }
    } else {
      start(passageInText(line), line);
    }
  }
  return out.filter((n) => n.text);
}

// Back to the Google Doc format, in reading order, for download - with a
// date line at the start of each day.
export function exportText(notes: StudyNote[]): string {
  const lines: string[] = [];
  let lastDay: string | null | undefined;
  let lastPage: number | null | undefined;
  let prev: Passage | null = null;
  for (const n of readingOrder(notes)) {
    if (n.day !== lastDay && n.day) {
      if (lines.length) lines.push("");
      lines.push(dayLabel(n.day, { weekday: false }));
      prev = null;
      lastPage = undefined;
    }
    lastDay = n.day;
    const p = passageOf(n);
    const sameChapter = p && prev && p.book === prev.book && p.chapter === prev.chapter;
    const where = p
      ? sameChapter && p.verse
        ? `Vs ${p.verse}${p.verseEnd ? `-${p.verseEnd}` : ""}`
        : formatPassage(p)
      : "";
    const head = [n.page != null && n.page !== lastPage ? String(n.page) : "", where].filter(Boolean).join(" - ");
    lines.push("");
    lines.push(head ? `${head} - ${n.text}` : n.text);
    lastPage = n.page;
    if (p) prev = p;
  }
  return `${lines.join("\n").replace(/^\n+/, "")}\n`;
}

// ── Days ─────────────────────────────────────────────────────────

// A reading day's own details (table study_days).
export interface StudyDay {
  day: string; // YYYY-MM-DD
  title: string;
  takeaway: string;
  shared: boolean; // included when the study is shared
  updatedAt: number;
  readAt?: number | null; // ticked as read
}

// Day of the reading plan: 1 January is day 1, 31 December day 365. The
// One Year Bible has 365 readings, so in a leap year 29 February repeats
// 28 February's (day 59) and the days after keep the book's numbering.
export function planDay(iso: string): { n: number; of: number } {
  const [y, m, d] = iso.split("-").map(Number);
  const n = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 1)) / 86_400_000) + 1;
  const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  return { n: leap && n >= 60 ? n - 1 : n, of: 365 };
}

// Merge a set of changed notes into a cached list (by id).
export function mergeNotes(list: StudyNote[], changed: StudyNote[]): StudyNote[] {
  if (!changed.length) return list;
  const byId = new Map(list.map((n) => [n.id, n]));
  for (const n of changed) byId.set(n.id, n);
  return [...byId.values()];
}
