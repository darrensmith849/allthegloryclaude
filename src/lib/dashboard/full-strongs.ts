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
  // Strong's definitions arrive with quirky whitespace and a habit of starting
  // with "{ ... }" for cross-references. Strip those wrappers up front.
  const rawDef = (e.d ?? "").trim().replace(/^[{(]+|[}.)]+$/g, "").trim();

  // KJV translations clean-up: split on common separators, drop punctuation-
  // only fragments, strip stray dashes ("-uously" -> "uously"), keep at most 6.
  const english = (e.k ?? "")
    .split(/[,;()[\]/]/)
    .map((s) =>
      s
        .trim()
        .replace(/^[-\s]+|[-\s.]+$/g, "")
        .replace(/^\[?idiom\]?\s*/i, ""),
    )
    .filter((s) => s.length > 1 && /[a-zA-Z]/.test(s) && !/^\W+$/.test(s))
    .slice(0, 6);

  // First sense becomes the gloss; the rest (if substantively different)
  // becomes the pastoral usage note. If the def is one short phrase, we
  // skip the usage entirely so we don't render the same sentence twice.
  let gloss = "";
  let usage = "";
  if (rawDef) {
    const firstSep = rawDef.search(/[;.](\s|$)/);
    if (firstSep > 4 && firstSep < rawDef.length - 4) {
      gloss = rawDef.slice(0, firstSep).trim();
      usage = rawDef.slice(firstSep + 1).trim().replace(/^[,.;\s]+/, "");
    } else {
      gloss = rawDef;
    }
  } else if (english.length) {
    // No definition available (cross-reference entry like G1848). Build a
    // human-readable gloss from the KJV glosses so the card isn't empty.
    gloss = `To ${english[0]}`;
    if (english.length > 1) usage = `Also rendered: ${english.slice(1).join(", ")}.`;
  }
  if (gloss) gloss = gloss.charAt(0).toUpperCase() + gloss.slice(1);

  return {
    number: num,
    language: lang,
    translit: e.t,
    original: e.l,
    gloss,
    usage,
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
