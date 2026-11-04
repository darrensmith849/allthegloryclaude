// The week's memory verse: a verse or a passage in one chapter, written the
// same way everywhere ("John 4:14", "Hebrews 12:1-13").

import { formatPassage, parsePassage } from "@/lib/dashboard/notes";

export const MAX_MEMORY_VERSES = 40;

export function cleanVerseRef(input: unknown): string | null {
  const p = parsePassage(String(input ?? "").trim().slice(0, 60));
  if (!p || p.verse == null) return null;
  if (p.verseEnd != null && (p.verseEnd < p.verse || p.verseEnd - p.verse >= MAX_MEMORY_VERSES)) return null;
  return formatPassage(p);
}
