// Fills in a word-journal entry for an English word from the Bible.
// Used by /api/word-fill (owner) and /api/study/word-fill (members).
//
//   POST { word, reference?, pick?, only? }  →  WordFill
//
// 1. Choose the original words. Each Hebrew / Greek candidate is ranked by
//    how often the KJV actually renders it as this English word (counted
//    from the KJV with Strong's numbers - data/strongs-usage.json), after a
//    short hand-checked table of main words (primary-words.ts).
// 2. Research each chosen word from public-domain sources:
//      - Thayer's Greek Lexicon / Brown-Driver-Briggs (via bolls.life)
//      - verses that use the word, in the Berean Standard Bible (bolls.life)
//      - the English word's dictionary senses (Wiktionary)
// 3. Write it up. Claude (ANTHROPIC_API_KEY) if set, otherwise Cloudflare
//    Workers AI (the AI binding): a plain-English meaning drawn from the
//    lexicon, the key verses that best show it, and a short reflection that
//    applies that exact meaning and cites one of those verses. Every piece
//    is checked before use; anything that fails falls back to the lexicon
//    text and the first verses, and the reflection is left for the user.

import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getAllStrongs, searchStrongs, StrongsEntry } from "@/lib/dashboard/strongs";
import {
  kjvRenderings,
  lexiconDefinition,
  searchFullLexicon,
} from "@/lib/dashboard/full-strongs";
import { primaryWordsFor } from "@/lib/dashboard/primary-words";
import { formatRef, isOldTestament, parseRef, type VerseRef } from "@/lib/dashboard/bible-books";
import usageData from "@/lib/dashboard/data/strongs-usage.json";
import type { KeyVerse, WordLanguage } from "@/lib/dashboard/types";
import {
  foldText,
  type LanguageFill,
  type WordCandidate,
  type WordFill,
} from "@/lib/dashboard/words";

const CLAUDE_MODEL = "claude-opus-5-5";
const WORKERS_AI_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const BOLLS = "https://bolls.life";
const PER_LANGUAGE = 6;
const VERSE_CANDIDATES = 4;
const LANGS: WordLanguage[] = ["hebrew", "greek"];
const LANG_KEY: Record<WordLanguage, string> = { hebrew: "HEBREW", greek: "GREEK" };

const USAGE = usageData as unknown as {
  words: Record<string, [string, number][]>;
  refs: Record<string, string>;
};

const CURATED = getAllStrongs();
const isCurated = (e: StrongsEntry) => CURATED.includes(e);

function toCandidate(e: StrongsEntry): WordCandidate {
  return {
    number: e.number,
    language: e.language,
    translit: e.translit,
    original: e.original,
    gloss: e.gloss,
  };
}

function wordForms(word: string): string[] {
  const w = word.trim().toLowerCase();
  const forms = new Set([w]);
  if (w.endsWith("ies")) forms.add(`${w.slice(0, -3)}y`);
  else if (w.endsWith("y")) forms.add(`${w.slice(0, -1)}ies`);
  if (w.endsWith("s")) forms.add(w.slice(0, -1));
  else forms.add(`${w}s`);
  return [...forms];
}

// Strong's number -> times the KJV renders it as this word (or its plural).
function kjvUsage(word: string): Map<string, number> {
  const out = new Map<string, number>();
  for (const f of wordForms(word)) {
    for (const [num, times] of USAGE.words[f] ?? []) out.set(num, (out.get(num) ?? 0) + times);
  }
  return out;
}

// ── 1. Choosing the original words ───────────────────────────────

interface Ranked {
  hebrew: StrongsEntry[];
  greek: StrongsEntry[];
  usage: Map<string, number>;
}

function rankCandidates(word: string): Ranked {
  const q = foldText(word).trim();
  const primary = primaryWordsFor(word);
  const usage = kjvUsage(word);
  const byNumber = (n: string) =>
    CURATED.find((e) => e.number === n) ?? searchFullLexicon(n, 1).find((e) => e.number === n);

  const pool = new Map<string, StrongsEntry>();
  const add = (e: StrongsEntry | undefined) => {
    if (e?.number && !pool.has(e.number)) pool.set(e.number, e);
  };
  primary.forEach((n) => add(byNumber(n)));
  [...usage.keys()].forEach((n) => add(byNumber(n)));
  searchStrongs(word).forEach(add);
  searchFullLexicon(word, 60).forEach(add);

  // Lower is better.
  const score = (e: StrongsEntry): number => {
    if (e.number.toLowerCase() === q || foldText(e.translit) === q) return -100_000;
    const main = primary.indexOf(e.number);
    if (main >= 0) return -50_000 + main;
    const times = usage.get(e.number) ?? 0;
    if (times > 0) return -times;
    const renderings = (isCurated(e) ? e.english : kjvRenderings(e.number)).map(foldText);
    const exact = renderings.indexOf(q);
    if (exact >= 0) return (isCurated(e) ? 1 : 10) + exact;
    return 60;
  };

  const sorted = [...pool.values()]
    .map((e, i) => ({ e, s: score(e) + i * 1e-6 }))
    .sort((a, b) => a.s - b.s)
    .map((x) => x.e);
  return {
    hebrew: sorted.filter((e) => e.language === "hebrew").slice(0, PER_LANGUAGE),
    greek: sorted.filter((e) => e.language === "greek").slice(0, PER_LANGUAGE),
    usage,
  };
}

// ── 2. Research ──────────────────────────────────────────────────

const STEM_MARKER =
  /^\((?:qal|niphal|piel|pual|hiphil|hophal|hithpael|polel|pilpel|pilel|poel|poal|hithpalel|hishtaphel|aphel|peal|pael|ithpeel)\)$/i;

// Thayer's / Brown-Driver-Briggs entry, flattened to its senses:
// "mercy: kindness or good will towards the miserable...; of men towards
// men: ...; of God towards men: ..."
function parseLexiconHtml(html: string): string {
  const start = html.search(/Definition\s*(?:<\/b>)?\s*:/i);
  const end = html.search(/(?:<p[^>]*class="origin"|Origin\s*:)/i);
  if (start < 0) return "";
  const body = html
    .slice(start, end > start ? end : undefined)
    .replace(/^[\s\S]*?Definition\s*(?:<\/b>)?\s*:\s*(?:<\/p>)?/i, "");
  const senses = body
    .replace(/<(?:li|p)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/g, " ")
    .split("\n")
    .map((s) => s.replace(/\s+/g, " ").replace(/^\s*[0-9a-z]{1,3}\.\s+/i, "").trim())
    .filter((s) => s && !STEM_MARKER.test(s));
  const text = senses.join("; ").replace(/\s+;/g, ";");
  return text.length > 700 ? `${text.slice(0, 700).replace(/[;,]?\s+\S*$/, "")}…` : text;
}

async function bibleLexicon(number: string): Promise<string> {
  try {
    const r = await fetch(`${BOLLS}/dictionary-definition/BDBT/${number}/`, {
      signal: AbortSignal.timeout(6000),
    });
    if (!r.ok) return "";
    const list = (await r.json()) as { topic?: string; definition?: string }[];
    const hit = list.find((d) => d.topic === number);
    return hit?.definition ? parseLexiconHtml(hit.definition) : "";
  } catch {
    return "";
  }
}

const lexiconName = (number: string) =>
  number.startsWith("G") ? "Thayer's Greek Lexicon" : "Brown-Driver-Briggs";

// Verses to choose key verses from: the user's own verse, the curated
// examples, then KJV occurrences - preferring ones where the KJV shows
// this English word - all in the testament of the language.
function verseCandidates(
  lang: WordLanguage,
  entry: StrongsEntry,
  word: string,
  userRef: VerseRef | null,
): VerseRef[] {
  const out: VerseRef[] = [];
  const push = (r: VerseRef | null) => {
    if (!r || isOldTestament(r.book) !== (lang === "hebrew")) return;
    if (out.some((o) => o.book === r.book && o.chapter === r.chapter && o.verses[0] === r.verses[0])) return;
    out.push(r);
  };
  push(userRef);
  if (isCurated(entry)) entry.examples.forEach((ex) => push(parseRef(ex.ref)));
  const forms = wordForms(word);
  const occurrences = (USAGE.refs[entry.number] ?? "")
    .split(" ")
    .filter(Boolean)
    .map((s) => {
      const [loc, english] = s.split(":");
      const [book, chapter, verse] = loc.split(".").map(Number);
      return { ref: { book, chapter, verses: [verse] }, matches: forms.includes(english) };
    })
    .sort((a, b) => Number(b.matches) - Number(a.matches));
  occurrences.forEach((o) => push(o.ref));
  return out.slice(0, VERSE_CANDIDATES);
}

// Berean Standard Bible text for each ref, in one request.
async function verseTexts(refs: VerseRef[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (!refs.length) return out;
  try {
    const r = await fetch(`${BOLLS}/get-verses/`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(
        refs.map((ref) => ({ translation: "BSB", book: ref.book, chapter: ref.chapter, verses: ref.verses })),
      ),
      signal: AbortSignal.timeout(6000),
    });
    if (!r.ok) return out;
    const data = (await r.json()) as { text?: string }[][];
    refs.forEach((ref, i) => {
      const text = (data[i] ?? [])
        .map((v) => (v.text ?? "").replace(/<[^>]+>/g, " "))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      if (text) out.set(formatRef(ref.book, ref.chapter, ref.verses), text);
    });
  } catch {
    // no verse text - key verses are simply left out
  }
  return out;
}

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
    .replace(/\s*\[[^\]]*\]/g, "")
    .replace(/\s+([.,;])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

const FAITH_SENSE =
  /\b(God|divine|Christian|Christianity|theology|religion|religious|Bible|biblical|spiritual|Jesus|Christ|sin|church)\b/i;

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
    const entries = data.en ?? [];
    const isNoun = (e: (typeof entries)[number]) => /noun/i.test(e.partOfSpeech ?? "");
    const senses: string[] = [];
    for (const entry of [...entries.filter(isNoun), ...entries.filter((e) => !isNoun(e))]) {
      for (const d of entry.definitions ?? []) {
        const text = stripHtml(d.definition ?? "");
        if (!text || /^\((obsolete|archaic|dated|rare|dialectal|historical)/i.test(text)) continue;
        senses.push(/[.!?]$/.test(text) ? text : `${text}.`);
      }
      if (senses.length) break; // first part of speech only
    }
    const base = senses[0]?.match(
      /^(?:plural|third-person singular|simple past|past participle|present participle|alternative (?:form|spelling)|comparative|superlative)(?: form)? of ([a-z][a-z' -]*?)[.;]?$/i,
    );
    if (base && !followed) return englishSenses(base[1], true);
    return senses.slice(0, 8);
  } catch {
    return [];
  }
}

// Without an AI to choose: the main sense plus the biblical one if any.
function dictionaryText(senses: string[]): string {
  if (!senses.length) return "";
  const faith = senses.slice(1).find((t) => FAITH_SENSE.test(t));
  return [senses[0], faith ?? senses[1]].filter(Boolean).join(" ");
}

// ── 3. Writing ───────────────────────────────────────────────────

interface LangResearch {
  lang: WordLanguage;
  entry: StrongsEntry;
  lexicon: string; // Thayer's / BDB senses ("" if unavailable)
  verses: (KeyVerse & { label: string })[]; // H1, H2... / G1, G2...
  needsMeaning: boolean; // false for curated words with a hand-written note
}

interface Written {
  english: string;
  per: Partial<Record<WordLanguage, { meaning: string; verses: string[]; life: string }>>;
}

const WRITER_SYSTEM = `You help someone keep a personal Bible word journal. You explain Hebrew and Greek words faithfully, in plain modern English - warm, never preachy - and you apply them to everyday life the way a careful Bible teacher would.

Use only the lexicon entries and verses you are given. Never invent roots, word pictures, Bible verses or Strong's numbers.`;

function researchPrompt(word: string, reference: string, senses: string[], langs: LangResearch[]): string {
  const blocks = langs.map((l) =>
    [
      `== ${LANG_KEY[l.lang]} word: ${l.entry.original} ${l.entry.translit} (${l.entry.number})`,
      l.lexicon ? `${lexiconName(l.entry.number)}: ${l.lexicon}` : "",
      `Strong's: ${lexiconDefinition(l.entry.number) || l.entry.gloss} KJV renders it: ${kjvRenderings(l.entry.number).slice(0, 8).join(", ")}.`,
      isCurated(l.entry) ? `Study note: ${l.entry.gloss}. ${l.entry.usage}` : "",
      l.verses.length
        ? `Verses that use this word (Berean Standard Bible):\n${l.verses.map((v) => `${v.label}. ${v.ref} - "${v.text}"`).join("\n")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n"),
  );
  return [
    `English word: ${word}`,
    reference ? `The verse the user is studying: ${reference}` : "",
    senses.length ? `Dictionary senses:\n${senses.map((s, i) => `${i + 1}. ${s}`).join("\n")}` : "",
    ...blocks,
  ]
    .filter(Boolean)
    .join("\n\n");
}

const LIFE_RULE =
  'a reflection of 20 to 45 words, in the first person ("I"), that applies the exact meaning in the lexicon entry above to everyday life today, and cites the one verse it draws on, e.g. "(Ephesians 2:4)".';

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

function parseLabelled(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  let key = "";
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*\**\s*(ENGLISH|(?:HEBREW|GREEK)_(?:MEANING|VERSES|LIFE))\s*\**\s*:\s*(.*)$/i);
    if (m) {
      key = m[1].toUpperCase();
      out[key] = m[2].trim();
    } else if (key && line.trim()) {
      out[key] = `${out[key]} ${line.trim()}`.trim();
    }
  }
  return out;
}

// Cloudflare Workers AI: labelled lines (more reliable than its JSON mode).
async function writeWithWorkersAI(ai: WorkersAI, prompt: string, langs: LangResearch[]): Promise<Written> {
  const asks = [
    "ENGLISH: one or two plain sentences defining the English word in the sense the Bible uses it, chosen from the dictionary senses.",
  ];
  for (const l of langs) {
    const k = LANG_KEY[l.lang];
    if (l.needsMeaning) {
      asks.push(
        `${k}_MEANING: two or three plain sentences on what ${l.entry.translit} means, faithful to the lexicon entry - include how it is used of God and of people if the lexicon says so.`,
      );
    }
    if (l.verses.length) {
      asks.push(
        `${k}_VERSES: the labels of the one or two verses above that best show what ${l.entry.translit} means, e.g. ${l.verses[0].label}`,
      );
    }
    asks.push(`${k}_LIFE: ${LIFE_RULE}`);
  }
  const full = `${prompt}\n\nWrite exactly these lines and nothing else:\n${asks.join("\n")}\n\nExample of a good LIFE line (for the Greek word elpis, "hope"): Biblical hope is a confident expectation of good from God, not wishful thinking, so today I will face what worries me expecting His faithfulness (Romans 5:5).`;

  const once = async () => {
    const out = (await ai.run(WORKERS_AI_MODEL, {
      messages: [
        { role: "system", content: `${WRITER_SYSTEM} Reply with the requested labelled lines only.` },
        { role: "user", content: full },
      ],
      max_tokens: 900,
      temperature: 0.3,
    })) as { response?: unknown };
    return parseLabelled(typeof out?.response === "string" ? out.response : "");
  };

  const lines = await once();
  // One retry if a reflection didn't pass - keep the best of both attempts.
  if (langs.some((l) => !goodLife(lines[`${LANG_KEY[l.lang]}_LIFE`] ?? "").cited)) {
    const again = await once();
    for (const [k, v] of Object.entries(again)) {
      const better = k.endsWith("_LIFE")
        ? goodLife(v).cited && !goodLife(lines[k] ?? "").cited
        : !lines[k];
      if (better) lines[k] = v;
    }
  }
  const per: Written["per"] = {};
  for (const l of langs) {
    const k = LANG_KEY[l.lang];
    per[l.lang] = {
      meaning: lines[`${k}_MEANING`] ?? "",
      verses: (lines[`${k}_VERSES`] ?? "").toUpperCase().match(/[HG]\d/g) ?? [],
      life: lines[`${k}_LIFE`] ?? "",
    };
  }
  return { english: lines.ENGLISH ?? "", per };
}

// Claude, with the same research, as structured JSON.
async function writeWithClaude(key: string, prompt: string, langs: LangResearch[]): Promise<Written> {
  const langSchema = (l: LangResearch) => ({
    type: "object",
    properties: {
      meaning: {
        type: "string",
        description: l.needsMeaning
          ? `Two or three plain sentences on what ${l.entry.translit} means, faithful to the lexicon entry.`
          : "Empty string - this word already has a study note.",
      },
      verses: {
        type: "array",
        items: { type: "string", enum: l.verses.length ? l.verses.map((v) => v.label) : [""] },
        description: "Labels of the one or two verses that best show what the word means.",
      },
      life: { type: "string", description: `A ${LIFE_RULE}` },
    },
    required: ["meaning", "verses", "life"],
    additionalProperties: false,
  });
  const schema = {
    type: "object",
    properties: {
      english: {
        type: "string",
        description: "One or two plain sentences defining the English word in the sense the Bible uses it.",
      },
      ...Object.fromEntries(langs.map((l) => [l.lang, langSchema(l)])),
    },
    required: ["english", ...langs.map((l) => l.lang)],
    additionalProperties: false,
  };
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "server-side-fallback-2026-07-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 16000,
      fallbacks: "default",
      output_config: { effort: "low", format: { type: "json_schema", schema } },
      system: WRITER_SYSTEM,
      messages: [{ role: "user", content: prompt }],
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!r.ok) throw new Error(`Claude ${r.status}: ${(await r.text().catch(() => "")).slice(0, 300)}`);
  const data = (await r.json()) as { stop_reason?: string; content?: { type: string; text?: string }[] };
  const text = data.stop_reason === "refusal" ? "" : data.content?.find((b) => b.type === "text")?.text;
  if (!text) throw new Error("Claude returned no text");
  const json = JSON.parse(text) as { english?: string } & Partial<
    Record<WordLanguage, { meaning: string; verses: string[]; life: string }>
  >;
  return { english: json.english ?? "", per: { hebrew: json.hebrew, greek: json.greek } };
}

// ── Checks ───────────────────────────────────────────────────────

const wordCount = (s: string) => s.split(/\s+/).filter(Boolean).length;

function goodMeaning(s: string): string {
  const t = s.trim();
  return wordCount(t) >= 10 && /[.!?]$/.test(t) ? t : "";
}

function goodEnglish(s: string): string {
  const t = s.trim();
  return wordCount(t) >= 6 && /[.!?]$/.test(t) ? t : "";
}

function goodLife(s: string): { text: string; cited: boolean } {
  const t = s.replace(/^["'“]+|["'”]+$/g, "").trim();
  const n = wordCount(t);
  if (n < 12 || n > 60 || !/\b(I|my|me)\b/.test(t)) return { text: "", cited: false };
  const text = /[.!?)]$/.test(t) ? t : `${t}.`;
  return { text, cited: /\d+:\d+/.test(text) };
}

// ── Route ────────────────────────────────────────────────────────

// opts.ai false skips the AI writing (e.g. a member's daily allowance is
// used up): the lexicon meaning and verses still come back, with aiNote.
export async function fillWord(req: Request, opts: { ai?: boolean; aiNote?: string } = {}) {
  const body = (await req.json().catch(() => ({}))) as {
    word?: unknown;
    reference?: unknown;
    pick?: unknown;
    only?: unknown;
  };
  const word = String(body.word ?? "").trim().slice(0, 80);
  const reference = String(body.reference ?? "").trim().slice(0, 80);
  const pick = String(body.pick ?? "").trim().toUpperCase();
  const onlyArg = String(body.only ?? "");
  if (!word) return NextResponse.json({ error: "word is required" }, { status: 400 });

  const ranked = rankCandidates(word);
  const lists: Record<WordLanguage, StrongsEntry[]> = { hebrew: ranked.hebrew, greek: ranked.greek };

  // "Not the right word? Try ..." pins that language's word and only that
  // language is looked up again; so does the switch on an older entry.
  const picked = pick
    ? (lists.hebrew.find((e) => e.number === pick) ??
      lists.greek.find((e) => e.number === pick) ??
      searchFullLexicon(pick, 1).find((e) => e.number === pick))
    : undefined;
  const only: WordLanguage | null = picked
    ? picked.language
    : onlyArg === "hebrew" || onlyArg === "greek"
      ? onlyArg
      : null;
  const chosen: Partial<Record<WordLanguage, StrongsEntry>> = {};
  for (const lang of LANGS) {
    if (only && lang !== only) continue;
    const e = picked?.language === lang ? picked : lists[lang][0];
    if (e) chosen[lang] = e;
  }
  const langs = LANGS.filter((l) => chosen[l]);
  const userRef = parseRef(reference);

  // Research, all at once.
  const candidates = Object.fromEntries(
    langs.map((l) => [l, verseCandidates(l, chosen[l]!, word, userRef)]),
  ) as Record<WordLanguage, VerseRef[]>;
  const [senses, texts, ...lexicons] = await Promise.all([
    englishSenses(word),
    verseTexts(langs.flatMap((l) => candidates[l])),
    ...langs.map((l) => bibleLexicon(chosen[l]!.number)),
  ]);
  const research: LangResearch[] = langs.map((lang, i) => ({
    lang,
    entry: chosen[lang]!,
    lexicon: lexicons[i],
    needsMeaning: !isCurated(chosen[lang]!),
    verses: candidates[lang]
      .map((r) => {
        const ref = formatRef(r.book, r.chapter, r.verses);
        return { ref, text: texts.get(ref) ?? "" };
      })
      .filter((v) => v.text)
      .map((v, j) => ({ ...v, label: `${LANG_KEY[lang][0]}${j + 1}` })),
  }));

  // Writing.
  let written: Written | null = null;
  let note: string | undefined;
  if (research.length && opts.ai === false) note = opts.aiNote;
  else if (research.length) {
    const prompt = researchPrompt(word, reference, senses, research);
    const key = process.env.ANTHROPIC_API_KEY;
    try {
      if (key) written = await writeWithClaude(key, prompt, research);
      else {
        const ai = await workersAI();
        if (ai) written = await writeWithWorkersAI(ai, prompt, research);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("word-fill:", msg);
      note = /4006|neuron|allocation/i.test(msg)
        ? "Today's free AI allowance is used up - the reflection will be written again tomorrow. Write your own for now."
        : "Couldn't write the reflection this time - tap Fill it in again, or write your own.";
    }
  }

  const fillFor = (lang: WordLanguage): LanguageFill | null => {
    const r = research.find((x) => x.lang === lang);
    if (!r) return null;
    const w = written?.per[lang];
    const aiMeaning = r.needsMeaning ? goodMeaning(w?.meaning ?? "") : "";
    const meaning = isCurated(r.entry)
      ? [r.entry.gloss?.replace(/[.;\s]+$/, ""), r.entry.usage?.trim()].filter(Boolean).join(". ")
      : aiMeaning || r.lexicon || lexiconDefinition(r.entry.number) || r.entry.gloss;
    const source = isCurated(r.entry)
      ? "Study note"
      : aiMeaning
        ? `${r.lexicon ? lexiconName(r.entry.number) : "Strong's"}, in plain English`
        : r.lexicon
          ? lexiconName(r.entry.number)
          : "Strong's Concordance";
    const application = goodLife(w?.life ?? "").text;
    const chosenVerses = r.verses.filter((v) => w?.verses.includes(v.label)).slice(0, 2);
    const shown = chosenVerses.length ? chosenVerses : r.verses.slice(0, 2);
    // The verse the reflection cites is always among the key verses shown.
    const cited = r.verses.find(
      (v) => !shown.includes(v) && application.includes(v.ref.replace(/-\d+$/, "")),
    );
    const keyVerses = [...shown, ...(cited ? [cited] : [])].map(({ ref, text }) => ({ ref, text }));
    return {
      entry: toCandidate(r.entry),
      meaning,
      meaningSource: source,
      keyVerses,
      application,
      alternatives: lists[lang]
        .filter((e) => e.number !== r.entry.number)
        .slice(0, 5)
        .map(toCandidate),
    };
  };
  const hebrew = fillFor("hebrew");
  const greek = fillFor("greek");

  // Show first: the picked language, the verse's testament, else the
  // language whose word the KJV uses most for this English word.
  const uses = (f: LanguageFill | null) => (f ? (ranked.usage.get(f.entry.number) ?? 0) : -1);
  let primary: WordLanguage =
    only ??
    (userRef
      ? isOldTestament(userRef.book)
        ? "hebrew"
        : "greek"
      : uses(greek) > uses(hebrew)
        ? "greek"
        : "hebrew");
  if (!(primary === "hebrew" ? hebrew : greek)) primary = primary === "hebrew" ? "greek" : "hebrew";

  const wroteLife = Boolean(hebrew?.application || greek?.application);
  const result: WordFill = {
    primary,
    hebrew,
    greek,
    englishMeaning: goodEnglish(written?.english ?? "") || dictionaryText(senses),
    ai: wroteLife,
    note:
      note ??
      (!hebrew && !greek
        ? `Couldn't find “${word}” in Strong's. Try the singular form, or a Strong's number like H2617.`
        : wroteLife
          ? undefined
          : "Couldn't write the reflection this time - tap Fill it in again, or write your own."),
  };
  return NextResponse.json(result);
}
