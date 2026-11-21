// Builds src/lib/dashboard/data/strongs-usage.json from the KJV with
// Strong's numbers (public domain; bolls.life static download).
//
//   node scripts/build-strongs-usage.mjs [path/to/KJV.json]
//
// Output (kept compact - it ships inside the Worker):
//   words: English word -> [[strongs, times the KJV renders it so], ...]
//          (top matches first) - how the word-fill route ranks candidates.
//   refs:  strongs -> "book.chapter.verse:english book.chapter.verse:english ..."
//          verses where the word occurs, used as key-verse candidates.
//
// Books 1-39 are the Old Testament (Hebrew numbers), 40-66 the New
// (Greek); the Apocrypha (67+) is skipped.

import { readFileSync, writeFileSync } from "node:fs";

const SRC = process.argv[2];
const OUT = new URL("../src/lib/dashboard/data/strongs-usage.json", import.meta.url);
const WORDS_PER_ENGLISH = 6;
const REFS_PER_NUMBER = 6;

const verses = SRC
  ? JSON.parse(readFileSync(SRC, "utf8"))
  : await (await fetch("https://bolls.life/static/translations/KJV.json")).json();

const rendered = {}; // english -> strongs -> times
const seen = {}; // strongs -> english -> [[b,c,v], ...]

for (const { book, chapter, verse, text } of verses) {
  if (book > 66) continue;
  const prefix = book <= 39 ? "H" : "G";
  // "rich<S>4145</S> in<S>1722</S> mercy<S>1656</S>," -> segments ending in a tag
  const re = /([^<]*)<S>(\d+)<\/S>/g;
  let m;
  while ((m = re.exec(text))) {
    const num = `${prefix}${Number(m[2])}`;
    // The English head word is the last word before the tag.
    const head = m[1]
      .toLowerCase()
      .replace(/[^a-z' -]/g, " ")
      .trim()
      .split(/\s+/)
      .pop()
      ?.replace(/^'+|'+$/g, "");
    if (!head || head.length < 2) continue;
    (rendered[head] ??= {})[num] = (rendered[head]?.[num] ?? 0) + 1;
    ((seen[num] ??= {})[head] ??= []).push([book, chapter, verse]);
  }
}

const words = {};
for (const [english, nums] of Object.entries(rendered)) {
  words[english] = Object.entries(nums)
    .sort((a, b) => b[1] - a[1])
    .slice(0, WORDS_PER_ENGLISH);
}

// Key-verse candidates per number: up to two verses for each of its three
// most common English renderings, preferring the books people most often
// read devotionally (Psalms, Isaiah, the Gospels, the letters) over
// genealogies and law codes.
const FAVOURED = new Set([19, 20, 23, 40, 41, 42, 43, 45, 49, 50, 58, 60, 62]);
const COMMON = new Set([1, 2, 5, 24, 25, 28, 33, 35, 46, 47, 48, 51, 52, 54, 55, 59, 66]);
const tier = (book) => (FAVOURED.has(book) ? 0 : COMMON.has(book) ? 1 : 2);

const refs = {};
for (const [num, byEnglish] of Object.entries(seen)) {
  const groups = Object.entries(byEnglish)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 3);
  const picked = [];
  for (const [english, list] of groups) {
    const best = [...list]
      .map((r, i) => ({ r, i }))
      .sort((a, b) => tier(a.r[0]) - tier(b.r[0]) || a.i - b.i);
    // Two verses from different books where possible.
    const chosen = [best[0], best.find((x) => x.r[0] !== best[0]?.r[0]) ?? best[1]].filter(Boolean);
    for (const { r } of chosen) {
      const ref = `${r[0]}.${r[1]}.${r[2]}:${english}`;
      if (!picked.includes(ref) && picked.length < REFS_PER_NUMBER) picked.push(ref);
    }
  }
  refs[num] = picked.join(" ");
}

const json = JSON.stringify({ words, refs });
writeFileSync(OUT, json);
console.log(
  `strongs-usage.json: ${Object.keys(words).length} English words, ${Object.keys(refs).length} Strong's numbers,`,
  `${Math.round(Buffer.byteLength(json) / 1024)} KB`,
);
