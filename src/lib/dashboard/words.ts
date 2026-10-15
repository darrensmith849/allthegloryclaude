// Helpers for the word journal - search, the daily word, and dating entries.

import { BibleWord, ISODate, KeyVerse, WordLanguage } from "./types";
import { diffDays, todayISO } from "./dates";

// A Strong's entry offered as the original word behind an English word.
export interface WordCandidate {
  number: string;
  language: WordLanguage;
  translit: string;
  original: string;
  gloss: string;
}

// The best original word in one language: its meaning (from a Bible
// lexicon), verses that use it, a reflection drawn from both, and the
// other candidates in that language ("Not the right word? Try ...").
export interface LanguageFill {
  entry: WordCandidate;
  meaning: string;
  meaningSource: string; // "Thayer's Greek Lexicon", "Brown-Driver-Briggs", ...
  keyVerses: KeyVerse[];
  application: string; // "" when no AI could write it
  alternatives: WordCandidate[];
}

// What /api/word-fill returns: the best Hebrew and the best Greek word
// (either can be missing), which one to show first, and the shared
// English meaning.
export interface WordFill {
  primary: WordLanguage;
  hebrew: LanguageFill | null;
  greek: LanguageFill | null;
  englishMeaning: string;
  ai: boolean; // true = an AI wrote the reflections
  note?: string;
  repeated?: string; // why the word is said twice (or more) in the verse
}

export interface Repeat {
  word: string; // the word to look up, e.g. "Lord" (or "God" for "my God, my God")
  times: number;
  phrase: string; // as it reads, e.g. "Lord, Lord"
}

const FILLER = new Set(["my", "o", "oh", "the", "a", "an", "our", "thy", "your"]);

// A word typed twice or more - "Lord, Lord", "Holy, holy, holy",
// "my God, my God" - is looked up once, and why it's repeated explained.
export function repeatedWord(input: string): Repeat | null {
  const parts = input.trim().split(/[^\p{L}\p{N}']+/u).filter(Boolean);
  for (let len = 1; len <= parts.length / 2; len++) {
    if (parts.length % len) continue;
    const unit = parts.slice(0, len).map(foldText);
    if (!parts.every((p, i) => foldText(p) === unit[i % len])) continue;
    const main = parts.slice(0, len).filter((p) => !FILLER.has(p.toLowerCase()));
    return { word: (main.length ? main : parts.slice(0, len)).join(" "), times: parts.length / len, phrase: input.trim() };
  }
  return null;
}

// The same, found in the verse itself ("Not everyone who says to Me,
// 'Lord, Lord,' ...") when only the word was typed.
export function repeatedIn(text: string, word: string): Repeat | null {
  const w = word.trim();
  if (!text || !w || /\s/.test(w)) return null;
  const esc = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = text.match(new RegExp(`\\b${esc}\\b(?:[\\s,;:!’'"“”‘—–-]+${esc}\\b)+`, "i"));
  if (!m) return null;
  return { word: w, times: m[0].match(new RegExp(`\\b${esc}\\b`, "gi"))?.length ?? 2, phrase: m[0] };
}

// What repetition does, before (or without) the AI's note on this verse.
export const repeatedNote = (times: number) =>
  times >= 3
    ? "Saying a word three times is the strongest way the Bible has of underlining something - it means the very most there is, as in “holy, holy, holy”."
    : "Saying a word twice is one of the ways the Bible underlines something. It makes the word stronger - more urgent, more heartfelt or more certain than saying it once.";

// Lower-case and strip accents, breathing marks and Hebrew vowel points so
// "chesed" finds "chésed" and "חסד" finds "חֶסֶד".
export function foldText(s: string): string {
  return s.toLowerCase().normalize("NFKD").replace(/\p{M}/gu, "");
}

// The plan's day number for a date (as planDay in notes.ts - 29 Feb shares Day 59).
function dayOfYear(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  const n = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 1)) / 86_400_000) + 1;
  const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  return leap && n >= 60 ? n - 1 : n;
}

function haystack(w: BibleWord): string {
  return foldText(
    [
      w.word,
      w.translit,
      w.original,
      w.strongs,
      w.originalMeaning,
      w.englishMeaning,
      w.repeated,
      w.application,
      w.reference,
      w.day ? `day ${dayOfYear(w.day)} ${w.day} ${new Date(`${w.day}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" })}` : "",
      w.comment,
      ...(w.keyVerses ?? []).map((v) => `${v.ref} ${v.text}`),
    ]
      .filter(Boolean)
      .join(" \n "),
  );
}

// Every space-separated term must appear somewhere in the entry.
export function matchesWord(w: BibleWord, query: string): boolean {
  const terms = foldText(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return true;
  const text = haystack(w);
  return terms.every((t) => text.includes(t));
}

// Ranking for search: the headword itself beats a hit buried in a meaning.
export function wordRank(w: BibleWord, query: string): number {
  const q = foldText(query.trim());
  const word = foldText(w.word);
  const translit = foldText(w.translit ?? "");
  if (word === q || translit === q) return 0;
  if (word.startsWith(q) || translit.startsWith(q)) return 1;
  if (word.includes(q) || translit.includes(q)) return 2;
  return 3;
}

// Local calendar day an entry was saved on.
export function wordDate(w: BibleWord): ISODate {
  return todayISO(new Date(w.createdAt));
}

// One saved word per day, stable for the whole day, cycling through the
// journal oldest-first so every word comes round again.
export function wordForDate(words: BibleWord[], iso: ISODate): BibleWord | null {
  if (!words.length) return null;
  const ordered = [...words].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const n = diffDays("2024-01-01", iso);
  return ordered[((n % ordered.length) + ordered.length) % ordered.length];
}

export function languageLabel(w: Pick<BibleWord, "language">): string {
  return w.language === "greek" ? "Greek" : "Hebrew";
}
