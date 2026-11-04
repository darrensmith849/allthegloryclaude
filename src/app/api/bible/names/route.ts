/**
 * Which names of God (and of Jesus) are in a chapter - found by the Hebrew /
 * Greek word behind the English, so "God" in Genesis 17:1 shows as El
 * Shaddai and "God" in 17:3 as Elohim.
 *
 *   GET ?ref=Genesis 17,Genesis 18   (up to 8 chapters)
 *   -> { chapters: [{ label, names: [{ id, count, verses }] }] }
 *
 * The King James text on bolls.life carries Strong's numbers on each word
 * (word<S>430</S>); the names themselves are in src/lib/study/names-of-god.ts.
 */
import { BOOKS } from "@/lib/dashboard/bible-books";
import { parsePassage } from "@/lib/dashboard/notes";

const MAX_CHAPTERS = 8;

interface Tok {
  n: number;
  cap: boolean; // the English word is capitalised ("God", not "gods")
  used: boolean;
}
interface Found {
  id: string;
  count: number;
  verses: number[];
}

// Names a verse is known for, beyond the numbers ("book:chapter:verse").
const VERSE_NAMES: Record<string, string[]> = {
  "1:16:13": ["el-roi"],
  "1:48:15": ["raah"],
  "2:3:14": ["i-am"],
  "2:15:26": ["rapha"],
  "2:31:13": ["mekoddishkem"],
  "3:20:8": ["mekoddishkem"],
  "3:21:8": ["mekoddishkem"],
  "3:22:32": ["mekoddishkem"],
  "19:23:1": ["raah"],
  "19:51:11": ["holy-spirit"],
  "19:80:1": ["raah"],
  "23:9:6": ["isaiah-9-6"],
  "23:63:10": ["holy-spirit"],
  "43:6:35": ["bread"],
  "43:6:48": ["bread"],
  "43:6:51": ["bread"],
  "43:8:12": ["light"],
  "43:9:5": ["light"],
  "43:8:58": ["i-am"],
  "43:10:7": ["gate"],
  "43:10:9": ["gate"],
  "43:10:11": ["shepherd"],
  "43:10:14": ["shepherd"],
  "43:11:25": ["resurrection"],
  "43:14:6": ["way"],
  "43:15:1": ["vine"],
  "43:15:5": ["vine"],
  "58:13:20": ["shepherd"],
  "60:2:25": ["shepherd"],
  "60:5:4": ["shepherd"],
  "66:5:5": ["lion"],
};
// Verses where a word that is usually a name of Jesus is about someone else.
const NOT_HIM = new Set(["44:7:45", "58:4:8", "43:3:26", "40:23:7", "40:23:8", "43:2:9", "66:18:23"]);

// Hebrew single words -> name.
const OT_SINGLE: Record<number, { id: string; cap?: boolean }> = {
  3068: { id: "yahweh" },
  3069: { id: "yahweh" },
  3050: { id: "yah" },
  136: { id: "adonai" },
  113: { id: "adonai", cap: true },
  430: { id: "elohim", cap: true },
  410: { id: "el", cap: true },
  433: { id: "eloah", cap: true },
  426: { id: "elah", cap: true },
  7706: { id: "el-shaddai" },
  3070: { id: "yireh" },
  3071: { id: "nissi" },
  3072: { id: "tsidkenu" },
  3073: { id: "shalom" },
  3074: { id: "shammah" },
  6268: { id: "ancient-of-days" },
  4899: { id: "christ", cap: true },
  6005: { id: "immanuel" },
  7307: { id: "holy-spirit", cap: true },
};
// Greek single words -> name.
const NT_SINGLE: Record<number, { id: string; cap?: boolean }> = {
  2424: { id: "jesus" },
  5547: { id: "christ" },
  3323: { id: "christ" },
  1694: { id: "immanuel" },
  5: { id: "abba" },
  3962: { id: "father", cap: true },
  3056: { id: "word", cap: true },
  2316: { id: "theos", cap: true },
  2962: { id: "kyrios", cap: true },
  5310: { id: "el-elyon", cap: true },
  3841: { id: "el-shaddai" },
  4990: { id: "saviour" },
  204: { id: "cornerstone" },
  4461: { id: "rabbi" },
  4462: { id: "rabbi" },
  3566: { id: "bridegroom" },
  286: { id: "lamb", cap: true },
  721: { id: "lamb", cap: true },
  4151: { id: "holy-spirit", cap: true },
};

// word<S>430</S> -> tokens, with whether the English word is capitalised.
function tokens(text: string): Tok[] {
  const clean = text.replace(/<sup>.*?<\/sup>/g, " ").replace(/<(?!\/?S>)[^>]*>/g, "");
  const out: Tok[] = [];
  for (const m of clean.matchAll(/([^<]*)<S>(\d+)<\/S>/g)) {
    const word = m[1].trim().split(/\s+/).pop() ?? "";
    out.push({ n: Number(m[2]), cap: /^[A-Z]/.test(word.replace(/^[^A-Za-z]+/, "")), used: false });
  }
  return out;
}

// Finds the n-th token after / before i within `span`.
const near = (t: Tok[], i: number, nums: number[], span: number, dir: 1 | -1 | 0 = 0) => {
  for (let d = 1; d <= span; d++) {
    for (const j of dir === 0 ? [i + d, i - d] : [i + d * dir]) {
      if (j >= 0 && j < t.length && !t[j].used && nums.includes(t[j].n)) return j;
    }
  }
  return -1;
};

function namesInVerse(book: number, t: Tok[]): string[] {
  const ids: string[] = [];
  const take = (id: string, ...idx: number[]) => {
    ids.push(id);
    for (const i of idx) if (i >= 0) t[i].used = true;
  };
  const ot = book <= 39;

  // Names made of two words first, so their words aren't counted twice.
  t.forEach((k, i) => {
    if (k.used) return;
    if (ot) {
      if (k.n === 7706) take("el-shaddai", i, near(t, i, [410], 2));
      else if ([5945, 5943, 5946].includes(k.n) && k.cap) take("el-elyon", i, near(t, i, [410, 426, 430], 2));
      else if (k.n === 5769 && t[i + 1] && !t[i + 1].used && [410, 430].includes(t[i + 1].n)) take("el-olam", i, i + 1);
      else if (k.n === 6635) {
        const lord = near(t, i, [3068, 430], 3, -1);
        if (lord >= 0) take("sabaoth", i, lord);
      } else if (k.n === 6918 && k.cap) {
        const israel = near(t, i, [3478], 3, 1);
        if (israel >= 0) take("holy-one", i, israel);
      }
    } else {
      if (k.n === 5207 && k.cap) {
        const man = near(t, i, [444], 3, 1);
        const god = near(t, i, [2316], 3, 1);
        if (man >= 0) take("son-of-man", i, man);
        else if (god >= 0) take("son-of-god", i, god);
      }
      if (!k.used && k.n === 5207) {
        const david = near(t, i, [1138], 3, 1);
        if (david >= 0 && near(t, i, [2501], 4, -1) < 0) take("son-of-david", i, david);
      }
      if (!k.used && [286, 721].includes(k.n) && k.cap) take("lamb", i, near(t, i, [2316], 3, 1));
      if (!k.used && (k.n === 4151 || k.n === 40)) {
        const pair = near(t, i, [k.n === 4151 ? 40 : 4151], 2);
        if (pair >= 0) take("holy-spirit", i, pair);
      }
      if (!k.used && k.n === 935 && k.cap) {
        const kings = near(t, i, [935], 3, 1);
        if (kings >= 0) {
          take("king-of-kings", i, kings);
          // ...and "Lord of lords" with it, not as two more "Lord"s.
          t.forEach((x, a) => {
            const b = !x.used && x.n === 2962 ? near(t, a, [2962], 3, 1) : -1;
            if (b >= 0) x.used = t[b].used = true;
          });
        }
      }
      if (!k.used && k.n === 1 && near(t, i, [5598], 4, 1) >= 0) take("alpha-omega", i, near(t, i, [5598], 4, 1));
      if (!k.used && k.n === 749 && book === 58) take("high-priest", i);
    }
  });

  // Then the single words.
  const single = ot ? OT_SINGLE : NT_SINGLE;
  t.forEach((k, i) => {
    if (k.used) return;
    const s = single[k.n];
    if (s && (!s.cap || k.cap)) take(s.id, i);
  });
  return ids;
}

const cache = new Map<string, Found[]>();

async function chapterNames(book: number, chapter: number): Promise<Found[]> {
  const key = `${book}:${chapter}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const r = await fetch(`https://bolls.life/get-text/KJV/${book}/${chapter}/`, { signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error(`bolls ${r.status}`);
  const verses = (await r.json()) as { verse: number; text: string }[];
  const found = new Map<string, Found>();
  for (const v of verses) {
    const where = `${book}:${chapter}:${v.verse}`;
    const ids = [...namesInVerse(book, tokens(v.text)), ...(VERSE_NAMES[where] ?? [])];
    for (const id of ids) {
      if (NOT_HIM.has(where) && ["jesus", "rabbi", "bridegroom"].includes(id)) continue;
      const f = found.get(id) ?? { id, count: 0, verses: [] };
      f.count++;
      if (!f.verses.includes(v.verse)) f.verses.push(v.verse);
      found.set(id, f);
    }
  }
  // In the order they first appear in the chapter.
  const list = [...found.values()].sort((a, b) => a.verses[0] - b.verses[0]);
  if (cache.size > 500) cache.clear();
  cache.set(key, list);
  return list;
}

export async function GET(req: Request) {
  const asked = (new URL(req.url).searchParams.get("ref") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const chapters: { book: number; chapter: number }[] = [];
  for (const ref of asked) {
    const p = parsePassage(ref);
    if (p && !chapters.some((c) => c.book === p.book && c.chapter === p.chapter)) chapters.push({ book: p.book, chapter: p.chapter });
    if (chapters.length >= MAX_CHAPTERS) break;
  }
  if (!chapters.length) return Response.json({ error: "Type a book and chapter, like Genesis 17." }, { status: 400 });

  const results = await Promise.all(
    chapters.map(async (c) => {
      const label = `${BOOKS[c.book - 1]} ${c.chapter}`;
      try {
        return { label, book: c.book, chapter: c.chapter, names: await chapterNames(c.book, c.chapter) };
      } catch {
        return { label, book: c.book, chapter: c.chapter, names: [], error: "Couldn't open this chapter just now." };
      }
    }),
  );
  const failed = results.every((r) => "error" in r);
  return Response.json(
    { chapters: results },
    { status: failed ? 502 : 200, headers: { "cache-control": failed ? "no-store" : "public, max-age=86400, s-maxage=604800" } },
  );
}
