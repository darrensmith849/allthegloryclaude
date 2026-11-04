/**
 * The everyday English meaning of a word, to sit next to its Hebrew / Greek
 * meaning in word study.
 *
 *   GET ?word=grace -> { word, senses: [{ pos, defs }], source }
 *
 * From Wiktionary (free, no key; CC BY-SA), nouns first, following "plural
 * of ..." to the base word, leaving out obsolete and archaic senses.
 */

interface Sense {
  pos: string;
  defs: string[];
}

const strip = (s: string) =>
  s
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

const SKIP = /^\(?(obsolete|archaic|dated|rare|dialectal|historical|nonstandard|slang|vulgar|offensive|derogatory)/i;
const FORM_OF =
  /^(?:plural|third-person singular|simple past|past participle|present participle|alternative (?:form|spelling)|comparative|superlative|obsolete form|archaic form)(?: (?:form|tense))?(?: and past participle)? of ([a-z][a-z' -]*?)[.;]?$/i;

const cache = new Map<string, { word: string; senses: Sense[] }>();

async function lookup(word: string, followed = false): Promise<{ word: string; senses: Sense[] }> {
  const r = await fetch(`https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word)}`, {
    headers: { accept: "application/json", "user-agent": "AllTheGloryStudy/1.0 (https://alltheglory.co.za)" },
    signal: AbortSignal.timeout(8000),
  });
  if (r.status === 404) return { word, senses: [] };
  if (!r.ok) throw new Error(`wiktionary ${r.status}`); // a blip - not remembered as "no meaning"
  const data = (await r.json()) as { en?: { partOfSpeech?: string; definitions?: { definition?: string }[] }[] };
  const entries = data.en ?? [];
  const isNoun = (e: (typeof entries)[number]) => /noun/i.test(e.partOfSpeech ?? "");
  const senses: Sense[] = [];
  for (const e of [...entries.filter(isNoun), ...entries.filter((x) => !isNoun(x))]) {
    const defs = (e.definitions ?? [])
      .map((d) => strip(d.definition ?? ""))
      .filter((d) => d && !SKIP.test(d))
      .map((d) => (/[.!?]$/.test(d) ? d : `${d}.`))
      .slice(0, 3);
    if (!defs.length) continue;
    const base = defs[0].match(FORM_OF);
    if (base && !followed && senses.length === 0) return lookup(base[1].trim(), true);
    if (!senses.some((s) => s.pos === e.partOfSpeech)) senses.push({ pos: (e.partOfSpeech ?? "").toLowerCase(), defs });
    if (senses.length >= 2) break;
  }
  return { word, senses };
}

export async function GET(req: Request) {
  const word = (new URL(req.url).searchParams.get("word") ?? "").trim().toLowerCase().slice(0, 40);
  if (!/^[a-z][a-z' -]*$/.test(word)) return Response.json({ word, senses: [] }, { status: 400 });
  try {
    const hit = cache.get(word) ?? (await lookup(word));
    if (cache.size > 2000) cache.clear();
    if (hit.senses.length) cache.set(word, hit);
    return Response.json(
      { ...hit, source: "Wiktionary" },
      { headers: { "cache-control": hit.senses.length ? "public, max-age=604800" : "public, max-age=3600" } },
    );
  } catch {
    return Response.json({ word, senses: [], error: "Couldn't reach the dictionary." }, { status: 502 });
  }
}
