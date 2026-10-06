"use client";

// "Read here" - the day's chapters right inside the journal, so nobody has
// to leave the page to read and come back to write. The text is the Berean
// Standard Bible (public domain - the NIV can't be shown on other sites);
// the NIV plan stays one tap away, and on a computer it opens in a window
// beside the dashboard instead of replacing it. Tap a verse number to start
// a note on that verse.

import { useEffect, useState } from "react";
import { parsePassage } from "@/lib/dashboard/notes";

interface Verse {
  chapter: number;
  verse: number;
  text: string;
}
interface Block {
  label: string; // "Genesis 1"
  verses: Verse[];
}

const OPEN_KEY = "atg:study:readHere";
const strip = (s: string) => s.replace(/<\/?mark>/g, "");

async function fetchPassage(ref: string): Promise<Block> {
  const r = await fetch(`/api/bible?q=${encodeURIComponent(ref)}`);
  const d = (await r.json().catch(() => ({}))) as { label?: string; results?: Verse[]; error?: string; kind?: string };
  if (!r.ok || d.kind !== "passage" || !d.results?.length) throw new Error(d.error ?? `Couldn't find ${ref}.`);
  return { label: d.label ?? ref, verses: d.results.map((v) => ({ ...v, text: strip(v.text) })) };
}

// "Genesis 1-3" (whole chapters) -> each chapter; anything else as written.
async function load(passage: string): Promise<Block[]> {
  const m = passage.trim().match(/^(.+?)\s+(\d{1,3})\s*[-–]\s*(\d{1,3})$/);
  if (m && !passage.includes(":")) {
    const from = Number(m[2]);
    const to = Math.min(Number(m[3]), from + 4);
    if (to > from) return Promise.all(Array.from({ length: to - from + 1 }, (_, i) => fetchPassage(`${m[1]} ${from + i}`)));
  }
  return [await fetchPassage(passage)];
}

export function ReadHere({
  chapters,
  bibleAppUrl,
  dayN,
  onVerse,
}: {
  chapters: string[]; // this day's chapters, e.g. ["Genesis 1", "Genesis 2"]
  bibleAppUrl: string;
  dayN: number;
  onVerse: (line: string) => void; // start a note: "Genesis 1 vs 3 - "
}) {
  const [open, setOpen] = useState(false);
  const [passage, setPassage] = useState("");
  const [typed, setTyped] = useState("");
  const [blocks, setBlocks] = useState<Block[] | null>(null);
  const [state, setState] = useState<{ loading?: boolean; error?: string }>({});
  const firstChapter = chapters[0] ?? "";

  useEffect(() => {
    try {
      setOpen(window.localStorage.getItem(OPEN_KEY) === "1");
    } catch {
      // private window
    }
  }, []);
  // A new day: start on its first chapter.
  useEffect(() => {
    setPassage(firstChapter);
    setBlocks(null);
  }, [firstChapter]);
  useEffect(() => {
    if (!open || !passage) return;
    let live = true;
    setState({ loading: true });
    load(passage)
      .then((b) => live && (setBlocks(b), setState({})))
      .catch((e: Error) => live && (setBlocks(null), setState({ error: e.message })));
    return () => {
      live = false;
    };
  }, [open, passage]);

  function toggle() {
    setOpen((o) => {
      try {
        window.localStorage.setItem(OPEN_KEY, o ? "0" : "1");
      } catch {
        // private window
      }
      return !o;
    });
  }

  // On a computer, the Bible App opens in a window beside the dashboard.
  function openBeside(e: React.MouseEvent) {
    if (!window.matchMedia("(min-width: 1100px) and (pointer: fine)").matches) return;
    e.preventDefault();
    const w = Math.min(560, Math.round(window.screen.availWidth / 2.4));
    window.open(bibleAppUrl, "atg-bible", `width=${w},height=${window.screen.availHeight},left=${window.screen.availWidth - w},top=0`);
  }

  return (
    <div className={`read-here ${open ? "is-open" : ""}`}>
      <div className="read-here-bar">
        <button type="button" className={`dash-btn dash-note-nav ${open ? "dash-btn-primary" : "dash-btn-ghost"} read-here-toggle`} onClick={toggle}>
          📖 {open ? "Hide the reading" : "Read here"}
        </button>
        <a className="dash-plan-link" href={bibleAppUrl} target="_blank" rel="noreferrer" onClick={openBeside}>
          Day {dayN} in the Bible App (NIV) ↗
        </a>
      </div>

      {open && (
        <div className="read-here-panel">
          <div className="read-here-picks">
            {chapters.map((c) => (
              <button
                key={c}
                type="button"
                className={`dash-starter-chip ${passage === c ? "is-on" : ""}`}
                onClick={() => setPassage(c)}
              >
                {c}
              </button>
            ))}
            <form
              className="read-here-find"
              onSubmit={(e) => {
                e.preventDefault();
                const p = typed.trim();
                if (!p) return;
                if (!parsePassage(p) && !/^(.+?)\s+\d{1,3}\s*[-–]\s*\d{1,3}$/.test(p)) {
                  return setState({ error: "Type a book and chapter, like Genesis 3 or Job 1-2." });
                }
                setPassage(p);
              }}
            >
              <input
                className="dash-input"
                placeholder={chapters.length ? "Another passage" : "A passage, e.g. Genesis 1-2"}
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                aria-label="A passage to read"
              />
              <button type="submit" className="dash-btn dash-btn-ghost dash-note-nav">
                Read
              </button>
            </form>
          </div>
          {!chapters.length && !passage && (
            <p className="dash-word-hint mt-2">
              Type the day&apos;s passage above (it&apos;s listed in the Bible App plan) and read it right here.
            </p>
          )}
          {state.loading && <p className="dash-word-hint mt-3">Opening {passage}…</p>}
          {state.error && <p className="dash-starter-error">{state.error}</p>}
          {blocks && !state.loading && (
            <div className="read-here-text">
              {blocks.map((b) => (
                <section key={b.label}>
                  <h3 className="read-here-title">{b.label}</h3>
                  <p>
                    {b.verses.map((v) => (
                      <span key={`${v.chapter}:${v.verse}`} className="read-here-verse">
                        <button
                          type="button"
                          className="read-here-num"
                          title={`Start a note on verse ${v.verse}`}
                          onClick={() => onVerse(`${b.label.replace(/:.*$/, "")} vs ${v.verse} - `)}
                        >
                          {v.verse}
                        </button>{" "}
                        {v.text}{" "}
                      </span>
                    ))}
                  </p>
                </section>
              ))}
            </div>
          )}
          <p className="read-here-source">
            Berean Standard Bible - free to read here. Tap a verse number to start a note on it.
          </p>
        </div>
      )}
    </div>
  );
}
