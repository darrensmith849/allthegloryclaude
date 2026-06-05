// Full Strong's lexicon search. The curated lexicon in strongs.ts gives
// rich, pastoral results for ~40 of the most-studied words. This file is
// the fallback that ensures EVERY word lookup returns at least something —
// it searches 5,523 Greek + 8,674 Hebrew entries from the openscriptures
// Strong's dictionary (CC-BY-SA, derived from public-domain 1890 text).
//
// The JSON is 1.7 MB and is imported once at module-load on the server.
// It is never shipped to the browser — the /api/word-study route reads
// it server-side and returns only the matches.

import { StrongsEntry } from "./strongs";
import lex from "./data/strongs-lex.json";

interface LexEntry {
  l: string; // lemma — the original script
  t: string; // transliteration
  d: string; // Strong's definition
  k: string; // KJV translation glosses
}

const greek = (lex as { greek: Record<string, LexEntry> }).greek;
const hebrew = (lex as { hebrew: Record<string, LexEntry> }).hebrew;

function toEntry(num: string, e: LexEntry, lang: "greek" | "hebrew"): StrongsEntry {
  // The Strong's def often starts with " " and uses ";" between senses.
  const def = (e.d ?? "").trim();
  const firstPhrase = def.split(/[;.]/)[0].trim();
  const english = (e.k ?? "")
    .split(/[,;()[\]/]/)
    .map((s) => s.trim())
    .filter((s) => s && !/^\W+$/.test(s))
    .slice(0, 8);
  return {
    number: num,
    language: lang,
    translit: e.t,
    original: e.l,
    gloss: firstPhrase || def.slice(0, 70),
    usage: def || "(no expanded definition in source)",
    english,
    examples: [],
  };
}

const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");

export function searchFullLexicon(query: string, limit = 16): StrongsEntry[] {
  const raw = (query ?? "").trim();
  if (!raw) return [];
  const q = norm(raw);
  const QU = raw.toUpperCase().replace(/\s+/g, "");

  // Direct hit on Strong's number — G26, H2617, etc.
  if (/^G\d+$/.test(QU) && greek[QU]) return [toEntry(QU, greek[QU], "greek")];
  if (/^H\d+$/.test(QU) && hebrew[QU]) return [toEntry(QU, hebrew[QU], "hebrew")];
  if (/^\d+$/.test(QU)) {
    const both: StrongsEntry[] = [];
    if (greek["G" + QU]) both.push(toEntry("G" + QU, greek["G" + QU], "greek"));
    if (hebrew["H" + QU]) both.push(toEntry("H" + QU, hebrew["H" + QU], "hebrew"));
    if (both.length) return both;
  }

  // Substring scan across translit, lemma, kjv glosses, and definition.
  // Exact translit/gloss hits float to the top.
  const exact: StrongsEntry[] = [];
  const partial: StrongsEntry[] = [];
  const scan = (
    dict: Record<string, LexEntry>,
    prefix: "G" | "H",
    lang: "greek" | "hebrew",
  ) => {
    for (const num in dict) {
      const e = dict[num];
      const tr = norm(e.t || "");
      const ks = norm(e.k || "");
      const lm = norm(e.l || "");
      const df = norm(e.d || "");

      // Skip the literal alphabet entry (G1 = "Alpha", H1 doesn't apply).
      if (prefix === "G" && num === "G1") continue;

      const isExact =
        tr === q ||
        ks.split(/[,;]/).map((s) => s.trim()).includes(q) ||
        lm === q;
      const isPartial =
        tr.includes(q) || ks.includes(q) || lm.includes(q) || df.includes(q);

      if (isExact) exact.push(toEntry(num, e, lang));
      else if (isPartial) partial.push(toEntry(num, e, lang));
    }
  };
  scan(greek, "G", "greek");
  scan(hebrew, "H", "hebrew");

  // De-prioritise overly noisy partial matches: prefer translit-matches first,
  // then gloss-matches, then anywhere-matches.
  partial.sort((a, b) => {
    const tA = norm(a.translit).startsWith(q) ? 0 : 1;
    const tB = norm(b.translit).startsWith(q) ? 0 : 1;
    return tA - tB;
  });

  return [...exact, ...partial].slice(0, limit);
}
