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
// Writing, in order of preference:
//   - ANTHROPIC_API_KEY set (Worker secret): Claude picks the best word in
//     each language for the verse and writes all the text.
//   - Otherwise Cloudflare Workers AI (the AI binding, free daily allowance)
//     writes the life line and puts dry Strong's definitions into plain
//     English. Hand-written notes and the dictionary meaning are kept.
//   - If neither answers, meanings come from Strong's and the life line is
//     left for the user.

import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
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
const WORKERS_AI_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
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

// Current senses of the word from Wiktionary (free, no key), nouns first,
// following "plural of ..." to the base word.
async function englishSenses(word: string, followed = false): Promise<string[]> {
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
    if (!r.ok) return [];
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
    if (!current.length) return [];
    // "Mercies" -> "plural of mercy": define the base word instead.
    const base = current[0].match(
      /^(?:plural|third-person singular|simple past|past participle|present participle|alternative (?:form|spelling)|comparative|superlative)(?: form)? of ([a-z][a-z' -]*?)[.;]?$/i,
    );
    if (base && !followed) return englishSenses(base[1], true);
    return current.slice(0, 8);
  } catch {
    return [];
  }
}

// The main sense plus the Christian / biblical one when there is one -
// "grace" should give "free and undeserved favour of God", not just
// "charm". Used when no AI picks the sense.
function dictionaryText(senses: string[]): string {
  if (!senses.length) return "";
  const faith = senses.slice(1).find((t) => FAITH_SENSE.test(t));
  return [senses[0], faith ?? senses[1]].filter(Boolean).join(" ");
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

// ── Cloudflare Workers AI ────────────────────────────────────────

interface WorkersAI {
  run(model: string, input: Record<string, unknown>): Promise<unknown>;
}

async function workersAI(): Promise<WorkersAI | null> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return (env as unknown as { AI?: WorkersAI }).AI ?? null;
  } catch {
    return null; // not running on Cloudflare (e.g. next dev)
  }
}

interface Plain {
  hebrewMeaning?: string;
  greekMeaning?: string;
  englishMeaning?: string;
  application?: string;
}

const PLAIN_SYSTEM = `You write short, accurate entries for a personal Bible word journal, in plain modern English - warm, never preachy. Use only the information you are given. Never invent roots, word pictures, Bible verses or Strong's numbers. Reply with the requested labelled lines only.`;

const words = (s: string) => s.split(/\s+/).filter(Boolean).length;

// A life line we'll show: one complete first-person sentence, short.
function goodApplication(s: string): string {
  const t = s.replace(/^["'“]+|["'”]+$/g, "").trim();
  const n = words(t);
  if (n < 6 || n > 28 || !/^I\b/.test(t)) return "";
  if (/[.!?]\s+\S/.test(t)) return ""; // more than one sentence
  return /[.!?]$/.test(t) ? t : `${t}.`;
}

// A meaning we'll show instead of the Strong's text: a real explanation.
function goodMeaning(s: string): string {
  const t = s.trim();
  return words(t) >= 10 && /[.!?]$/.test(t) ? t : "";
}

function parseLabelled(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  let key = "";
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*\**\s*(LIFE|HEBREW|GREEK|ENGLISH)\s*\**\s*:\s*(.*)$/i);
    if (m) {
      key = m[1].toUpperCase();
      out[key] = m[2].trim();
    } else if (key && line.trim()) {
      out[key] = `${out[key]} ${line.trim()}`.trim();
    }
  }
  return out;
}

// Writes the life line, and plain-English meanings only where they help:
// Strong's definitions without a hand-written note, and a missing
// dictionary meaning. Anything that fails the checks above is dropped, so
// the caller falls back to the Strong's / dictionary text.
async function writeWithWorkersAI(
  ai: WorkersAI,
  word: string,
  reference: string,
  hebrew: StrongsEntry | null,
  greek: StrongsEntry | null,
  senses: string[],
  curated: Set<string>,
): Promise<Plain> {
  const context: string[] = [];
  const asks: string[] = [
    'LIFE: one sentence of 8 to 20 words, starting with "I", applying what this word means in the Bible (its Hebrew or Greek meaning above) to everyday life today.',
  ];
  for (const [e, lang] of [
    [hebrew, "Hebrew"],
    [greek, "Greek"],
  ] as const) {
    if (!e) continue;
    context.push(
      [
        `${lang} word: ${e.original} ${e.translit} (${e.number})`,
        `Strong's definition: ${lexiconDefinition(e.number) || e.gloss}`,
        `Translated in the KJV as: ${kjvRenderings(e.number).slice(0, 8).join(", ") || "-"}`,
      ].join("\n"),
    );
    if (!curated.has(e.number)) {
      asks.push(
        `${lang.toUpperCase()}: two plain-English sentences on what ${e.translit} means, based only on its Strong's definition and KJV translations.`,
      );
    }
  }
  asks.push(
    senses.length
      ? "ENGLISH: one or two plain sentences defining the English word in the sense the Bible uses it, chosen from the dictionary senses above."
      : "ENGLISH: one plain sentence defining the English word in the sense the Bible uses it.",
  );

  const prompt = [
    `English word: ${word}`,
    `Verse: ${reference || "(not given)"}`,
    senses.length
      ? `Dictionary senses:\n${senses.map((t, i) => `${i + 1}. ${t}`).join("\n")}`
      : "",
    ...context,
    `Write exactly these lines and nothing else:\n${asks.join("\n")}`,
    `Example of the format, for a different word ("Hope"):\nLIFE: I can face today's uncertainty calmly, because my hope rests on what God has promised.\nGREEK: Elpis is a confident expectation of something good. In the New Testament it is not wishful thinking but settled trust in God's promises.`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const ask = async () => {
    const out = (await ai.run(WORKERS_AI_MODEL, {
      messages: [
        { role: "system", content: PLAIN_SYSTEM },
        { role: "user", content: prompt },
      ],
      max_tokens: 500,
      temperature: 0.3,
    })) as { response?: unknown };
    return parseLabelled(typeof out?.response === "string" ? out.response : "");
  };

  let got = await ask();
  if (!goodApplication(got.LIFE ?? "")) {
    const retry = await ask();
    if (goodApplication(retry.LIFE ?? "")) got = { ...retry, ...pick(got, ["HEBREW", "GREEK", "ENGLISH"]), LIFE: retry.LIFE };
  }
  return {
    application: goodApplication(got.LIFE ?? ""),
    hebrewMeaning: goodMeaning(got.HEBREW ?? ""),
    greekMeaning: goodMeaning(got.GREEK ?? ""),
    englishMeaning: goodMeaning(got.ENGLISH ?? ""),
  };
}

// Keep the first attempt's meanings when only the life line needed a retry.
function pick(src: Record<string, string>, keys: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of keys) if (goodMeaning(src[k] ?? "")) out[k] = src[k];
  return out;
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

  const sensesPromise = englishSenses(word);
  const dictionaryPromise = sensesPromise.then(dictionaryText);

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
  const dictionary = await dictionaryPromise;

  // No Claude: let Cloudflare's AI write the life line and plain meanings.
  let plain: Plain | null = null;
  const ai = !written && (hebrew || greek) ? await workersAI() : null;
  if (ai) {
    const entryOf = (f: LanguageFill | null) =>
      f ? (lists[f.entry.language].find((e) => e.number === f.entry.number) ?? pinned[f.entry.language] ?? null) : null;
    try {
      plain = await writeWithWorkersAI(
        ai,
        word,
        reference,
        entryOf(hebrew),
        entryOf(greek),
        await sensesPromise,
        ranked.curated,
      );
      if (plain?.hebrewMeaning && hebrew) hebrew.meaning = plain.hebrewMeaning;
      if (plain?.greekMeaning && greek) greek.meaning = plain.greekMeaning;
      if (!plain?.application) note = "Couldn't write the “For my life” line this time - tap Fill it in again, or write your own.";
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("word-fill (workers ai):", msg);
      note = /4006|neuron|allocation/i.test(msg)
        ? "Today's free AI allowance is used up - the “For my life” line will fill in again tomorrow. Write your own for now."
        : "Couldn't write the “For my life” line this time - tap Fill it in again, or write your own.";
    }
  }

  let primary: WordLanguage =
    (picked?.language as WordLanguage | undefined) ??
    written?.primary ??
    testamentLanguage(reference) ??
    ranked.best?.language ??
    "hebrew";
  if (!(primary === "hebrew" ? hebrew : greek)) primary = primary === "hebrew" ? "greek" : "hebrew";

  const application = written?.application.trim() || plain?.application || "";
  const result: WordFill = {
    primary,
    hebrew,
    greek,
    englishMeaning: written?.englishMeaning.trim() || plain?.englishMeaning || dictionary,
    application,
    ai: Boolean(application),
    note:
      note ??
      (!hebrew && !greek
        ? `Couldn't find “${word}” in Strong's. Try the singular form, or a Strong's number like H2617.`
        : application
          ? undefined
          : "The “For my life” line couldn't be written automatically - write your own for now."),
  };
  return NextResponse.json(result);
}
