// Helpers for the word journal - search, the daily word, and dating entries.

import { BibleWord, ISODate, WordLanguage } from "./types";
import { diffDays, todayISO } from "./dates";

// A Strong's entry offered as the original word behind an English word.
export interface WordCandidate {
  number: string;
  language: WordLanguage;
  translit: string;
  original: string;
  gloss: string;
}

// The best original word in one language, with its meaning and the other
// candidates in that language ("Not the right word? Try ...").
export interface LanguageFill {
  entry: WordCandidate;
  meaning: string;
  alternatives: WordCandidate[];
}

// What /api/word-fill returns: the best Hebrew and the best Greek word
// (either can be missing), which one to show first, and the shared
// English meaning and life line.
export interface WordFill {
  primary: WordLanguage;
  hebrew: LanguageFill | null;
  greek: LanguageFill | null;
  englishMeaning: string;
  application: string;
  ai: boolean; // true = an AI wrote the life line
  note?: string;
}

// Lower-case and strip accents, breathing marks and Hebrew vowel points so
// "chesed" finds "chésed" and "חסד" finds "חֶסֶד".
export function foldText(s: string): string {
  return s.toLowerCase().normalize("NFKD").replace(/\p{M}/gu, "");
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
      w.application,
      w.reference,
      w.comment,
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
