// Fills in a word-journal entry for an English word from the Bible: the best
// Hebrew word and the best Greek word behind it (each with its meaning), the
// English meaning, and one line applying it to life.
//
//   POST { word, reference?, pick? }  →  WordFill
//
// Candidates come from a table of the main words behind common Bible words
// (primary-words.ts), then Strong's (curated entries, then the full
// lexicon) ranked by how the KJV renders each word - so "mercy" finds
// chesed and eleos, not words only occasionally translated that way. The
// English meaning comes from Wiktionary.
//
// With ANTHROPIC_API_KEY set (a Worker secret in production), Claude picks
// the best candidate in each language for the verse and writes all the
// text in plain English. Without it - or if the call fails - meanings come
// from Strong's and the life line is left for the user.

import { NextResponse } from "next/server";
import { getAllStrongs, searchStrongs, StrongsEntry } from "@/lib/dashboard/strongs";
import {
  kjvRenderings,
  lexiconDefinition,
  searchFullLexicon,
} from "@/lib/dashboard/full-strongs";
import { primaryWordsFor } from "@/lib/dashboard/primary-words";
import type { WordLanguage } from "@/lib/dashboard/types";
import {
  foldText,
  type LanguageFill,
  type WordCandidate,
  type WordFill,
} from "@/lib/dashboard/words";

export const dynamic = "force-dynamic";

const MODEL = "claude-opus-5-5";
const PER_LANGUAGE = 6;

function toCandidate(e: StrongsEntry): WordCandidate {
  return {
    number: e.number,
    language: e.language,
    translit: e.translit,
    original: e.original,
    gloss: e.gloss,
  };
}

// ── Finding and ranking the original words ───────────────────────

interface Ranked {
  hebrew: StrongsEntry[];
  greek: StrongsEntry[];
  curated: Set<string>;
  best: StrongsEntry | null;
}

function rankCandidates(word: string): Ranked {
  const q = foldText(word).trim();
  const curatedHits = searchStrongs(word);
  const primary = primaryWordsFor(word);
  // Prefer the curated entry (it has a hand-written note) when there is one.
  const primaryHits = primary.flatMap(
    (n) =>
      getAllStrongs().find((e) => e.number === n) ??
      searchFullLexicon(n, 1).filter((e) => e.number === n),
  );
  const curated = new Set(
    [...curatedHits, ...primaryHits]
      .filter((e) => getAllStrongs().includes(e))
      .map((e) => e.number),
  );
  const pool = new Map<string, StrongsEntry>();
  for (const e of [...primaryHits, ...curatedHits, ...searchFullLexicon(word, 150)]) {
    if (e.number && !pool.has(e.number)) pool.set(e.number, e);
  }

  // Lower is better. Known main words first; then a word the KJV renders
  // as exactly this English word, early in its list.
  const score = (e: StrongsEntry): number => {
    if (e.number.toLowerCase() === q) return -3; // typed a Strong's number
    if (foldText(e.translit) === q) return -2; // typed the transliteration
    const main = primary.indexOf(e.number);
    if (main >= 0) return -1 + main * 0.01;
    const isCurated = curated.has(e.number);
    const renderings = (isCurated ? e.english : kjvRenderings(e.number)).map(foldText);
    const stem = q.length > 4 ? q.slice(0, -1) : q;
    const exact = renderings.indexOf(q);
    const near = renderings.findIndex((r) =>
      r.split(/[\s-]+/).some((t) => t === q || t.startsWith(stem)),
    );
    // Tie-break: fuller Strong's entries tend to be the more significant words.
    const depth = Math.min(lexiconDefinition(e.number).length, 200) / 1000;
    if (exact >= 0) return isCurated ? 1 + exact * 0.1 : 10 + exact - depth;
    if (near >= 0) return (isCurated ? 20 : 30) + near - depth;
    return 60 - depth;
  };

  const scored = [...pool.values()]
    .map((e, i) => ({ e, s: score(e) + i * 1e-6 }))
    .sort((a, b) => a.s - b.s);
  const pick = (lang: WordLanguage) =>
    scored.filter((x) => x.e.language === lang).slice(0, PER_LANGUAGE).map((x) => x.e);
  return {
    hebrew: pick("hebrew"),
    greek: pick("greek"),
    curated,
    best: scored[0]?.e ?? null,
  };
}

// Plain meaning of an original word: the hand-written note for curated
// words, otherwise the tidied Strong's definition and its KJV renderings.
function lexiconMeaning(e: StrongsEntry, curated: Set<string>): string {
  if (curated.has(e.number)) {
    return [e.gloss?.replace(/[.;\s]+$/, ""), e.usage?.trim()].filter(Boolean).join(". ");
  }
  const def = lexiconDefinition(e.number) || (e.gloss ? `${e.gloss}.` : "");
  const kjv = kjvRenderings(e.number).slice(0, 6);
  return [def, kjv.length ? `In the KJV it's translated: ${kjv.join(", ")}.` : ""]
    .filter(Boolean)
    .join(" ");
}

// Old Testament → Hebrew, New Testament → Greek.
const NT_BOOK =
  /^(?:[123]\s*)?(mat|mt|mar|mk|luk|lk|joh|jn|act|rom|cor|gal|eph|phil|php|phm|col|thes|thess|tim|tit|heb|jam|jas|pet|jude|rev)/i;
function testamentLanguage(reference: string): WordLanguage | null {
  const ref = reference.trim();
  if (!ref) return null;
  return NT_BOOK.test(ref) ? "greek" : "hebrew";
}

// ── English meaning ──────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\(\s*\)/g, "")
    .replace(/\s*\[[^\]]*\]/g, "") // grammar notes like "[with that (+ clause)]"
    .replace(/\s+([.,;])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

const FAITH_SENSE = /\b(God|divine|Christian|Christianity|theology|religion|religious|Bible|biblical|spiritual|Jesus|Christ|sin|church)\b/i;

// The word's main current sense from Wiktionary (free, no key), plus its
// Christian / biblical sense when there is one - "grace" should give
// "free and undeserved favour of God", not just "charm".
async function englishDefinition(word: string, followed = false): Promise<string> {
  try {
    const r = await fetch(
      `https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word.trim().toLowerCase())}`,
      {
        headers: {
          accept: "application/json",
          "user-agent": "AllTheGloryDashboard/1.0 (https://alltheglory.co.za)",
        },
        signal: AbortSignal.timeout(6000),
      },
    );
    if (!r.ok) return "";
    const data = (await r.json()) as {
      en?: { partOfSpeech?: string; definitions?: { definition?: string }[] }[];
    };
    // Nouns first - "hope" the noun before "hope" the verb.
    const entries = data.en ?? [];
    const isNoun = (e: (typeof entries)[number]) => /noun/i.test(e.partOfSpeech ?? "");
    const current: string[] = [];
    for (const entry of [...entries.filter(isNoun), ...entries.filter((e) => !isNoun(e))]) {
      for (const d of entry.definitions ?? []) {
        const text = stripHtml(d.definition ?? "");
        if (!text || /^\((obsolete|archaic|dated|rare|dialectal|historical)/i.test(text)) continue;
        current.push(/[.!?]$/.test(text) ? text : `${text}.`);
      }
      if (current.length) break; // first part of speech only (noun, verb...)
    }
    if (!current.length) return "";
    // "Mercies" -> "plural of mercy": define the base word instead.
    const base = current[0].match(
      /^(?:plural|third-person singular|simple past|past participle|present participle|alternative (?:form|spelling)|comparative|superlative)(?: form)? of ([a-z][a-z' -]*?)[.;]?$/i,
    );
    if (base && !followed) return englishDefinition(base[1], true);
    const faith = current.slice(1, 10).find((t) => FAITH_SENSE.test(t));
    return [current[0], faith ?? current[1]].filter(Boolean).join(" ");
  } catch {
    return "";
  }
}

// ── Claude ───────────────────────────────────────────────────────

interface Written {
  primary: WordLanguage;
  hebrew: { strongs: string; meaning: string };
  greek: { strongs: string; meaning: string };
  englishMeaning: string;
  application: string;
}

const SYSTEM = `You help someone keep a personal Bible word journal. They give you an English word from the Bible (and sometimes the verse it came from). From the Strong's candidates provided, choose the main Hebrew word and the main Greek word behind that English word, and explain them clearly, the way a warm, careful Bible teacher would explain them to a friend.

Use plain, modern English. Stay faithful to the lexicon entries provided and to mainstream scholarship - never invent a root, a word picture or a Strong's number. If a verse is given, the word used in that verse is the main word for its language.`;

function languageSchema(numbers: string[], lang: string) {
  return {
    type: "object",
    properties: {
      strongs: {
        type: "string",
        enum: [...numbers, ""],
        description: `Strong's number of the main ${lang} word for this English word. Empty string only if none of the ${lang} candidates fit.`,
      },
      meaning: {
        type: "string",
        description: `Two or three short sentences on what the chosen ${lang} word means: its core idea or word picture, and how Scripture uses it. Empty string if strongs is empty.`,
      },
    },
    required: ["strongs", "meaning"],
    additionalProperties: false,
  };
}

async function writeWithClaude(
  key: string,
  word: string,
  reference: string,
  hebrew: StrongsEntry[],
  greek: StrongsEntry[],
  dictionary: string,
): Promise<Written | null> {
  const schema = {
    type: "object",
    properties: {
      primary: {
        type: "string",
        enum: ["hebrew", "greek"],
        description:
          "Which language to show first: the verse's testament if a verse is given, otherwise the language where this word matters most.",
      },
      hebrew: languageSchema(hebrew.map((e) => e.number), "Hebrew"),
      greek: languageSchema(greek.map((e) => e.number), "Greek"),
      englishMeaning: {
        type: "string",
        description:
          "One or two plain sentences: what the English word means in everyday English, as a dictionary would define it.",
      },
      application: {
        type: "string",
        description:
          "One short sentence (under 20 words), written in the first person, applying this word to everyday life today.",
      },
    },
    required: ["primary", "hebrew", "greek", "englishMeaning", "application"],
    additionalProperties: false,
  };

  const describe = (list: StrongsEntry[]) =>
    list.map((e) => ({
      strongs: e.number,
      original: e.original,
      translit: e.translit,
      definition: lexiconDefinition(e.number) || e.gloss,
      kjvRenderings: kjvRenderings(e.number).slice(0, 8),
    }));

  const prompt = [
    `Word: ${word}`,
    `Verse: ${reference || "(not given)"}`,
    dictionary ? `Dictionary definition: ${dictionary}` : "",
    "",
    "Hebrew candidates, best match first:",
    hebrew.length ? JSON.stringify(describe(hebrew), null, 2) : "(none found)",
    "",
    "Greek candidates, best match first:",
    greek.length ? JSON.stringify(describe(greek), null, 2) : "(none found)",
  ]
    .filter((line, i, all) => line !== "" || all[i - 1] !== "")
    .join("\n");

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "server-side-fallback-2026-07-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 16000,
      fallbacks: "default",
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema },
      },
      system: SYSTEM,
      messages: [{ role: "user", content: prompt }],
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!r.ok) {
    const detail = await r.text().catch(() => "");
    throw new Error(`Claude ${r.status}: ${detail.slice(0, 300)}`);
  }
  const data = (await r.json()) as {
    stop_reason?: string;
    content?: { type: string; text?: string }[];
  };
  if (data.stop_reason === "refusal") return null;
  const text = data.content?.find((b) => b.type === "text")?.text;
  return text ? (JSON.parse(text) as Written) : null;
}

// ── Route ────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    word?: unknown;
    reference?: unknown;
    pick?: unknown;
  };
  const word = String(body.word ?? "").trim().slice(0, 80);
  const reference = String(body.reference ?? "").trim().slice(0, 80);
  const pick = String(body.pick ?? "").trim().toUpperCase();
  if (!word) return NextResponse.json({ error: "word is required" }, { status: 400 });

  const ranked = rankCandidates(word);
  const lists: Record<WordLanguage, StrongsEntry[]> = {
    hebrew: ranked.hebrew,
    greek: ranked.greek,
  };

  // A picked Strong's number pins that language's word; the user chose it
  // from "Not the right word? Try ...".
  const picked = pick
    ? (lists.hebrew.find((e) => e.number === pick) ??
      lists.greek.find((e) => e.number === pick) ??
      searchFullLexicon(pick, 1).find((e) => e.number === pick))
    : undefined;
  const pinned: Partial<Record<WordLanguage, StrongsEntry>> = picked
    ? { [picked.language]: picked }
    : {};

  const dictionaryPromise = englishDefinition(word);

  const key = process.env.ANTHROPIC_API_KEY;
  let written: Written | null = null;
  let note: string | undefined;
  if (key) {
    try {
      written = await writeWithClaude(
        key,
        word,
        reference,
        pinned.hebrew ? [pinned.hebrew] : lists.hebrew,
        pinned.greek ? [pinned.greek] : lists.greek,
        await dictionaryPromise,
      );
      if (!written) note = "Couldn't write this one automatically - filled in from Strong's instead.";
    } catch (e) {
      console.error("word-fill:", e instanceof Error ? e.message : e);
      note = "The writing service didn't answer - filled in from Strong's instead.";
    }
  }

  const fillFor = (lang: WordLanguage): LanguageFill | null => {
    const list = lists[lang];
    let chosen: StrongsEntry | undefined = pinned[lang];
    if (!chosen) {
      chosen = written
        ? list.find((e) => e.number === written![lang].strongs)
        : list[0];
    }
    if (!chosen) return null;
    const aiMeaning = written && written[lang].strongs === chosen.number ? written[lang].meaning.trim() : "";
    return {
      entry: toCandidate(chosen),
      meaning: aiMeaning || lexiconMeaning(chosen, ranked.curated),
      alternatives: list
        .filter((e) => e.number !== chosen!.number)
        .slice(0, 5)
        .map(toCandidate),
    };
  };
  const hebrew = fillFor("hebrew");
  const greek = fillFor("greek");

  let primary: WordLanguage =
    (picked?.language as WordLanguage | undefined) ??
    written?.primary ??
    testamentLanguage(reference) ??
    ranked.best?.language ??
    "hebrew";
  if (!(primary === "hebrew" ? hebrew : greek)) primary = primary === "hebrew" ? "greek" : "hebrew";

  const dictionary = await dictionaryPromise;
  const result: WordFill = {
    primary,
    hebrew,
    greek,
    englishMeaning: written?.englishMeaning.trim() || dictionary,
    application: written?.application.trim() ?? "",
    ai: Boolean(written),
    note:
      note ??
      (!hebrew && !greek
        ? `Couldn't find “${word}” in Strong's. Try the singular form, or a Strong's number like H2617.`
        : written
          ? undefined
          : "Hebrew and Greek from Strong's, English meaning from the dictionary. The “For my life” line needs the AI key - write your own for now."),
  };
  return NextResponse.json(result);
}
