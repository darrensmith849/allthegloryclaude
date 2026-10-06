/**
 * Look up the Bible from The Study and the dashboard.
 *
 *   GET ?q=John 3:16   -> that passage (a verse range is capped at 60; a whole chapter comes in full)
 *   GET ?q=living water -> verses that use those words
 *   -> { kind: "passage" | "words", label, total, results: [{ ref, book, chapter, verse, text }] }
 *
 * Text is the Berean Standard Bible (public domain) via bolls.life, so it
 * can be shown in full; each result also links to the NIV in the Bible App.
 * Word matches come back wrapped in <mark>…</mark>; no other markup.
 */
import { BOOKS } from "@/lib/dashboard/bible-books";
import { parsePassage } from "@/lib/dashboard/notes";

const MAX_PASSAGE = 60; // a verse range; a whole chapter comes back in full

interface Hit {
  ref: string;
  book: number;
  chapter: number;
  verse: number;
  text: string;
}

// Keep <mark>, drop every other tag and Strong's numbers, tidy spaces.
const clean = (s: string) =>
  s
    .replace(/<S>\d+<\/S>/g, "")
    .replace(/<(?!\/?mark>)[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const label = (book: number, chapter: number, verse?: number) =>
  `${BOOKS[book - 1]} ${chapter}${verse ? `:${verse}` : ""}`;

const cacheFor = { "cache-control": "public, max-age=3600, s-maxage=86400" };

export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 80);
  if (q.length < 2) return Response.json({ error: "Type a verse or a few words." }, { status: 400 });

  try {
    const p = /\d/.test(q) ? parsePassage(q) : null;
    if (p) {
      const r = await fetch(`https://bolls.life/get-text/BSB/${p.book}/${p.chapter}/`);
      if (!r.ok) throw new Error(`bolls ${r.status}`);
      const verses = (await r.json()) as { verse: number; text: string }[];
      const from = p.verse ?? 1;
      const to = p.verse ? (p.verseEnd ?? p.verse) : verses.length;
      const results: Hit[] = verses
        .filter((v) => v.verse >= from && v.verse <= to)
        .slice(0, p.verse ? MAX_PASSAGE : 200)
        .map((v) => ({ ref: label(p.book, p.chapter, v.verse), book: p.book, chapter: p.chapter, verse: v.verse, text: clean(v.text) }));
      if (!results.length) return Response.json({ error: `Couldn't find ${q}.` }, { status: 404 });
      const range = p.verse ? `${label(p.book, p.chapter, from)}${to > from ? `-${to}` : ""}` : label(p.book, p.chapter);
      return Response.json({ kind: "passage", label: range, total: results.length, results }, { headers: cacheFor });
    }

    if (q.length < 3) return Response.json({ error: "Type at least three letters." }, { status: 400 });
    const r = await fetch(
      `https://bolls.life/v2/find/BSB?search=${encodeURIComponent(q)}&match_case=false&match_whole=false&limit=30&page=1`,
    );
    if (!r.ok) throw new Error(`bolls ${r.status}`);
    const data = (await r.json()) as {
      results?: { book: number; chapter: number; verse: number; text: string }[];
      total?: number;
    };
    const results: Hit[] = (data.results ?? [])
      .filter((v) => v.book >= 1 && v.book <= 66)
      .map((v) => ({ ref: label(v.book, v.chapter, v.verse), book: v.book, chapter: v.chapter, verse: v.verse, text: clean(v.text) }));
    return Response.json(
      { kind: "words", label: `“${q}”`, total: data.total ?? results.length, results },
      { headers: cacheFor },
    );
  } catch (e) {
    console.error("bible search:", e);
    return Response.json({ error: "Couldn't reach the Bible just now - try again." }, { status: 502 });
  }
}
