// Builds public/study/dict/<letter>.json - Bible names and terms for The
// Study's name lookup: what a name means (Hitchcock's Bible Names, 1869)
// and who / what it is (Easton's Bible Dictionary, 1897). Both public
// domain; parsed by NEUU's bible-dictionary-dataset (CC BY 4.0), credited
// on the Names page.
//
//   node scripts/build-bible-dict.mjs
//
// Each file is an array of [name, meaning, background] - loaded by the
// browser only for the letter someone searches.

import { mkdir, writeFile } from "node:fs/promises";

const BASE = "https://raw.githubusercontent.com/neuu-org/bible-dictionary-dataset/main/data/02_sources";
const LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");

async function load(source, letter) {
  const r = await fetch(`${BASE}/${source}/${letter}.json`);
  if (!r.ok) return {};
  return r.json();
}

const text = (entry) =>
  (entry?.definitions ?? [])
    .map((d) => String(d.text ?? "").replace(/\s+/g, " ").trim())
    .filter(Boolean);

await mkdir("public/study/dict", { recursive: true });
let total = 0;
for (const letter of LETTERS) {
  const [easton, hitchcock] = await Promise.all([load("easton", letter), load("hitchcock", letter)]);
  const keys = new Set([...Object.keys(easton), ...Object.keys(hitchcock)]);
  const rows = [];
  for (const key of [...keys].sort()) {
    const e = easton[key];
    const h = hitchcock[key];
    const name = e?.name ?? h?.name ?? key;
    const meaning = text(h).join("; ");
    const background = text(e).join("\n\n");
    if (!meaning && !background) continue;
    rows.push([name, meaning, background]);
  }
  if (!rows.length) continue;
  await writeFile(`public/study/dict/${letter}.json`, JSON.stringify(rows));
  total += rows.length;
  console.log(letter, rows.length);
}
console.log("entries:", total);
