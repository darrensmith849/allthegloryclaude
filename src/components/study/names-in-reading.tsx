"use client";

// "Names of God in this reading": which name of God (or of Jesus) is behind
// the English in the day's chapters - "God" in Genesis 17:1 is El Shaddai,
// "God" in 17:3 is Elohim - each with its meaning, said aloud, and a link to
// the full entry on the Names of God page. Found by /api/bible/names.

import { useEffect, useState } from "react";
import { nameById } from "@/lib/study/names-of-god";
import { SayIt, speakable } from "./say-it";

interface Found {
  id: string;
  count: number;
  verses: number[];
}
interface Chapter {
  label: string;
  book: number;
  names: Found[];
  error?: string;
}

const seen = new Map<string, Promise<Chapter[] | null>>();
function load(chapters: string[]): Promise<Chapter[] | null> {
  const key = chapters.join(",");
  let p = seen.get(key);
  if (!p) {
    p = fetch(`/api/bible/names?ref=${encodeURIComponent(key)}`)
      .then((r) => r.json())
      .then((d: { chapters?: Chapter[] }) => d.chapters ?? null)
      .catch(() => {
        seen.delete(key);
        return null;
      });
    seen.set(key, p);
  }
  return p;
}

// "רוּחַ הַקֹּדֶשׁ · Πνεῦμα Ἅγιον": the Greek in a New Testament chapter.
const GREEK = /[\u0370-\u03ff\u1f00-\u1fff]/;
const originalFor = (original: string, book: number) => {
  const parts = original.split(" · ");
  return (book >= 40 ? parts.find((p) => GREEK.test(p)) : parts.find((p) => !GREEK.test(p))) ?? parts[0];
};

const verseList = (label: string, vs: number[]) => {
  const shown = vs.slice(0, 5).join(", ");
  return `${label}:${shown}${vs.length > 5 ? ` +${vs.length - 5} more` : ""}`;
};

export function NamesInReading({ chapters, namesUrl }: { chapters: string[]; namesUrl: string }) {
  const [data, setData] = useState<Chapter[] | null | undefined>(undefined);
  const [open, setOpen] = useState<string | null>(null);
  const key = chapters.slice(0, 8).join(",");

  useEffect(() => {
    if (!key) return;
    let live = true;
    setData(undefined);
    void load(key.split(",")).then((d) => live && setData(d));
    return () => {
      live = false;
    };
  }, [key]);

  if (!key) {
    return (
      <p className="dash-word-hint">
        Write a note with its passage (or pick this day&apos;s chapter in Start a note) and the names of God in it show here.
      </p>
    );
  }
  if (data === undefined) return <p className="dash-word-hint">Looking through {chapters.slice(0, 8).join(", ")}…</p>;
  if (data === null) return <p className="dash-word-hint">Couldn&apos;t look just now - check your connection.</p>;

  return (
    <div className="names-reading">
      {data.map((c) => (
        <section key={c.label} className="names-reading-ch">
          <div className="names-reading-chhead">{c.label}</div>
          {c.error && <p className="dash-word-hint">{c.error}</p>}
          {!c.error && !c.names.length && <p className="dash-word-hint">No name of God in this chapter.</p>}
          {c.names.map((f) => {
            const n = nameById(f.id);
            if (!n) return null;
            const id = `${c.label}-${f.id}`;
            const isOpen = open === id;
            return (
              <div key={id} className={`names-reading-row ${isOpen ? "is-open" : ""}`}>
                <button type="button" className="names-reading-main" onClick={() => setOpen(isOpen ? null : id)} aria-expanded={isOpen}>
                  <span className="names-reading-line">
                    <span className="names-reading-reads">{n.reads.split(",")[0].split(" (")[0]}</span>
                    <span className="names-reading-arrow" aria-hidden>
                      →
                    </span>
                    <strong className="names-reading-name">{n.name}</strong>
                    {n.original && (
                      <span className="names-reading-orig" dir="auto">
                        {originalFor(n.original, c.book)}
                      </span>
                    )}
                  </span>
                  <span className="names-reading-meaning">{n.meaning}</span>
                  <span className="names-reading-where">
                    {verseList(c.label, f.verses)}
                    {f.count > 1 ? ` · ${f.count} times` : ""}
                  </span>
                </button>
                {n.say && <SayIt text={speakable(n.say)} label={`Say ${n.name}`} />}
                {isOpen && (
                  <div className="names-reading-more">
                    <p>{n.about[0]}</p>
                    <a className="dash-word-link" href={`${namesUrl}#${n.id}`}>
                      More on {n.name} →
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </section>
      ))}
      <p className="dash-word-source">Found from the Hebrew and Greek words behind the English text.</p>
    </div>
  );
}
