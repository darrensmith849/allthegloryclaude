// Fills in a word-journal entry for an English word from the Bible: finds
// the Hebrew / Greek word behind it and writes both meanings plus one line
// applying it to life.
//
//   POST { word, reference?, pick? }  →  WordFill (below)
//
// Strong's (curated + full lexicon) always supplies the candidate words and
// their original-language spelling. With ANTHROPIC_API_KEY set (a Worker
// secret in production), Claude picks the candidate that fits the verse and
// writes the three fields in plain English. Without the key - or if the
// call fails - the meaning comes from Strong's, the English meaning from a
// free dictionary, and the life line is left for the user.

import { NextResponse } from "next/server";
import { searchStrongs, StrongsEntry } from "@/lib/dashboard/strongs";
import { searchFullLexicon } from "@/lib/dashboard/full-strongs";
import type { WordLanguage } from "@/lib/dashboard/types";
import type { WordCandidate as Candidate, WordFill } from "@/lib/dashboard/words";

export const dynamic = "force-dynamic";

const MODEL = "claude-opus-5-5";
const MAX_CANDIDATES = 8;

type Language = WordLanguage;

interface Written {
  strongs: string;
  language: Language;
  originalMeaning: string;
  englishMeaning: string;
  application: string;
}

function toCandidate(e: StrongsEntry): Candidate {
  return {
    number: e.number,
    language: e.language,
    translit: e.translit,
    original: e.original,
    gloss: e.gloss,
  };
}

// Curated entries first (better written), then the full lexicon, de-duped.
function findCandidates(word: string): StrongsEntry[] {
  const seen = new Set<string>();
  const out: StrongsEntry[] = [];
  for (const e of [...searchStrongs(word), ...searchFullLexicon(word, MAX_CANDIDATES * 2)]) {
    if (!e.number || seen.has(e.number)) continue;
    seen.add(e.number);
    out.push(e);
  }
  return out.slice(0, MAX_CANDIDATES);
}

function lexiconMeaning(e: StrongsEntry): string {
  return [e.gloss?.replace(/[.;\s]+$/, ""), e.usage?.trim()].filter(Boolean).join(". ");
}

function sentenceCase(s: string): string {
  const t = s.trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
}

// Plain-English definition from the free dictionary API (no key needed).
async function dictionaryMeaning(word: string): Promise<string> {
  try {
    const r = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`,
      { signal: AbortSignal.timeout(5000) },
    );
    if (!r.ok) return "";
    const data = (await r.json()) as {
      meanings?: { definitions?: { definition?: string }[] }[];
    }[];
    const def = data?.[0]?.meanings?.[0]?.definitions?.[0]?.definition ?? "";
    return sentenceCase(def);
  } catch {
    return "";
  }
}

const SYSTEM = `You help someone keep a personal Bible word journal. They give you an English word from the Bible (and sometimes the verse it came from); you identify the Hebrew or Greek word behind it and explain it clearly, the way a warm, careful Bible teacher would explain it to a friend.

Use plain, modern English. Stay faithful to the lexicon entries provided and to mainstream scholarship - never invent a root, a word picture or a Strong's number. If a verse is given, choose the original word actually used there.`;

async function writeWithClaude(
  key: string,
  word: string,
  reference: string,
  candidates: StrongsEntry[],
): Promise<Written | null> {
  const numbers = candidates.map((c) => c.number);
  const schema = {
    type: "object",
    properties: {
      strongs: {
        type: "string",
        enum: [...numbers, ""],
        description:
          "Strong's number of the candidate that best matches the word (and the verse, if given). Empty string only if none of the candidates fit.",
      },
      language: { type: "string", enum: ["hebrew", "greek"] },
      originalMeaning: {
        type: "string",
        description:
          "Two or three short sentences on what the Hebrew or Greek word means: its core idea or word picture, and how Scripture uses it.",
      },
      englishMeaning: {
        type: "string",
        description: "One plain sentence: what the English word means in everyday English.",
      },
      application: {
        type: "string",
        description:
          "One short sentence (under 20 words), written in the first person, applying this word to everyday life today.",
      },
    },
    required: ["strongs", "language", "originalMeaning", "englishMeaning", "application"],
    additionalProperties: false,
  };

  const lexicon = candidates.map((c) => ({
    strongs: c.number,
    language: c.language,
    original: c.original,
    translit: c.translit,
    definition: lexiconMeaning(c).slice(0, 400),
    translatedAs: c.english.slice(0, 6),
  }));

  const prompt = [
    `Word: ${word}`,
    reference ? `Verse: ${reference}` : "Verse: (not given)",
    "",
    candidates.length
      ? `Strong's lexicon candidates:\n${JSON.stringify(lexicon, null, 2)}`
      : "No Strong's candidates were found - use your own knowledge and leave strongs empty.",
  ].join("\n");

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
    throw new Error(`Claude ${r.status}: ${detail.slice(0, 200)}`);
  }
  const data = (await r.json()) as {
    stop_reason?: string;
    content?: { type: string; text?: string }[];
  };
  if (data.stop_reason === "refusal") return null;
  const text = data.content?.find((b) => b.type === "text")?.text;
  if (!text) return null;
  return JSON.parse(text) as Written;
}

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

  const all = findCandidates(word);
  // A picked Strong's number pins the original word; Claude then only
  // writes the meanings for that entry.
  const picked = pick ? searchFullLexicon(pick, 1).find((e) => e.number === pick) : undefined;
  const pinned = picked ? [all.find((e) => e.number === pick) ?? picked] : null;
  const candidates = pinned ?? all;

  const key = process.env.ANTHROPIC_API_KEY;
  let written: Written | null = null;
  let note: string | undefined;
  if (key) {
    try {
      written = await writeWithClaude(key, word, reference, candidates);
      if (!written) note = "Couldn't write this one automatically - filled in from Strong's instead.";
    } catch (e) {
      console.error("word-fill:", e instanceof Error ? e.message : e);
      note = "The writing service didn't answer - filled in from Strong's instead.";
    }
  }

  const chosen =
    (written && candidates.find((c) => c.number === written!.strongs)) ||
    (written ? null : candidates[0] ?? null);

  const others = [...(pinned ? all : candidates)]
    .filter((c) => c.number !== chosen?.number)
    .slice(0, 5)
    .map(toCandidate);

  if (written) {
    const result: WordFill = {
      entry: chosen ? toCandidate(chosen) : null,
      language: chosen?.language ?? written.language,
      originalMeaning: written.originalMeaning.trim(),
      englishMeaning: written.englishMeaning.trim(),
      application: written.application.trim(),
      alternatives: others,
      ai: true,
    };
    return NextResponse.json(result);
  }

  // Fallback: Strong's + dictionary, no life line. If the dictionary is
  // unreachable, list how the Bible renders the word instead.
  const englishMeaning = await dictionaryMeaning(word);
  const renderings = [
    ...new Set(
      (chosen?.english ?? [])
        .map((s) => s.replace(/^[+\s]+/, "").trim())
        .filter((s) => s.length > 2 && s.toLowerCase() !== word.toLowerCase()),
    ),
  ].slice(0, 5);
  const result: WordFill = {
    entry: chosen ? toCandidate(chosen) : null,
    language: chosen?.language ?? "hebrew",
    originalMeaning: chosen ? lexiconMeaning(chosen) : "",
    englishMeaning:
      englishMeaning ||
      (renderings.length ? sentenceCase(`Often translated: ${renderings.join(", ")}.`) : ""),
    application: "",
    alternatives: others,
    ai: false,
    note:
      note ??
      (chosen
        ? "The meanings came from Strong's and the dictionary. The \"For my life\" line fills in automatically once the AI key is added."
        : `Couldn't find “${word}” in Strong's. Try the singular form, or add a Strong's number.`),
  };
  return NextResponse.json(result);
}
