// The week's memory verse: a single verse or a short range, written the
// same way everywhere ("John 4:14", "Psalm 23:1-3").

import { formatPassage, parsePassage } from "@/lib/dashboard/notes";

export function cleanVerseRef(input: unknown): string | null {
  const p = parsePassage(String(input ?? "").trim().slice(0, 60));
  if (!p || p.verse == null) return null;
  if (p.verseEnd != null && p.verseEnd - p.verse > 5) return null; // keep it to a few verses
  return formatPassage(p);
}
