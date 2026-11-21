"use client";

// "Dictionary" - the everyday English meaning of a studied word, next to its
// Hebrew / Greek meaning (inside a .dash-word-defs list). From /api/dictionary;
// shows nothing for a word the dictionary doesn't know.

import { useEffect, useState } from "react";

interface Sense {
  pos: string;
  defs: string[];
}

const seen = new Map<string, Promise<Sense[]>>();

function senses(word: string): Promise<Sense[]> {
  const key = word.trim().toLowerCase();
  let p = seen.get(key);
  if (!p) {
    p = fetch(`/api/dictionary?word=${encodeURIComponent(key)}`)
      .then((r) => {
        if (r.ok) return r.json();
        seen.delete(key); // try again next time
        return { senses: [] };
      })
      .then((d: { senses?: Sense[] }) => d.senses ?? [])
      .catch(() => {
        seen.delete(key);
        return [];
      });
    seen.set(key, p);
  }
  return p;
}

export function DictionaryMeaning({ word }: { word: string }) {
  const [list, setList] = useState<Sense[] | null>(null);
  const [more, setMore] = useState(false);
  const clean = word.trim();
  const ok = /^[A-Za-z][A-Za-z' -]{0,39}$/.test(clean);

  useEffect(() => {
    if (!ok) return;
    let live = true;
    setList(null);
    setMore(false);
    void senses(clean).then((s) => live && setList(s));
    return () => {
      live = false;
    };
  }, [clean, ok]);

  if (!ok || (list && !list.length)) return null;
  const first = list?.[0];
  const extra = (list ?? []).flatMap((s, i) => (i === 0 ? s.defs.slice(1) : s.defs).map((d) => ({ pos: s.pos, d })));

  return (
    <div className="dash-word-dict">
      <dt>Dictionary{first?.pos ? ` · ${first.pos}` : ""}</dt>
      <dd>{first ? first.defs[0] : "Looking it up…"}</dd>
      {more && (
        <ol className="dash-word-dict-more">
          {extra.map((x, i) => (
            <li key={i}>
              {x.pos !== first?.pos && <em>{x.pos} · </em>}
              {x.d}
            </li>
          ))}
        </ol>
      )}
      {extra.length > 0 && (
        <button type="button" className="dash-word-link" onClick={() => setMore((v) => !v)}>
          {more ? "Fewer meanings" : `More meanings · ${extra.length}`}
        </button>
      )}
      <div className="dash-word-source">Everyday English · Wiktionary</div>
    </div>
  );
}
