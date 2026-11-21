"use client";

// "Read it here" - a box, like the writing box, to type a verse or passage
// and read it right inside the journal, so nobody has to leave the page to
// read and come back to write. The day in the Bible App (NIV) sits above it,
// and the Context for the day's books below. The text is the Berean
// Standard Bible (public domain - the NIV can't be shown on other sites);
// the NIV plan stays one tap away, and on a computer it opens in a window
// beside the dashboard instead of replacing it. Tap a verse number to start
// a note on that verse. Under the bar, the Context for the day's books -
// who's speaking, and where the same story is told elsewhere.

import { useEffect, useRef, useState } from "react";
import { parsePassage } from "@/lib/dashboard/notes";
import { ReadAlong } from "./read-along";
import { ReadingContext, WhoIsSpeaking } from "./reading-context";

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
  const [open, setOpen] = useState(false); // the reading is showing
  const [passage, setPassage] = useState("");
  const [typed, setTyped] = useState("");
  const [blocks, setBlocks] = useState<Block[] | null>(null);
  const [state, setState] = useState<{ loading?: boolean; error?: string }>({});
  const firstChapter = chapters[0] ?? "";
  const panelRef = useRef<HTMLDivElement>(null);

  const remember = (on: boolean) => {
    try {
      window.localStorage.setItem(OPEN_KEY, on ? "1" : "0");
    } catch {
      // private window
    }
  };
  // A new day: its first chapter, already open for those who keep it open.
  useEffect(() => {
    let keepOpen = false;
    try {
      keepOpen = window.localStorage.getItem(OPEN_KEY) === "1";
    } catch {
      // private window
    }
    setPassage(firstChapter);
    setOpen(keepOpen && Boolean(firstChapter));
    setBlocks(null);
    setState({});
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

  // Open a passage here (typed, a chip, or from Context) and bring it into view.
  function readThis(ref: string, scroll = true) {
    setPassage(ref);
    setOpen(true);
    remember(true);
    if (scroll) window.setTimeout(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }
  function close() {
    setOpen(false);
    remember(false);
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
      <a className="dash-plan-link read-here-niv" href={bibleAppUrl} target="_blank" rel="noreferrer" onClick={openBeside}>
        📖 Day {dayN} in the Bible App (NIV) ↗
      </a>
      <label className="dash-label" htmlFor={`read-here-${dayN}`}>
        Type a verse to read it here
      </label>
      <form
        className="read-here-box"
        onSubmit={(e) => {
          e.preventDefault();
          const p = typed.trim();
          if (!p) return;
          if (!parsePassage(p) && !/^(.+?)\s+\d{1,3}\s*[-–]\s*\d{1,3}$/.test(p)) {
            return setState({ error: "Type a book and chapter, like Genesis 3, Luke 5 or John 3:16." });
          }
          setState({});
          readThis(p, false);
        }}
      >
        <input
          id={`read-here-${dayN}`}
          className="dash-input read-here-input"
          placeholder="e.g. Luke 5 or John 3:16"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          enterKeyHint="go"
          autoComplete="off"
        />
        <button type="submit" className="dash-btn dash-btn-primary read-here-go">
          Read
        </button>
      </form>
      {chapters.length > 0 ? (
        <div className="read-here-picks">
          <span className="read-here-picks-label">This day:</span>
          {chapters.map((c) => (
            <button
              key={c}
              type="button"
              className={`dash-starter-chip ${open && passage === c ? "is-on" : ""}`}
              onClick={() => readThis(c, false)}
            >
              {c}
            </button>
          ))}
        </div>
      ) : (
        <p className="read-here-hint">Not sure of the passage? It&apos;s at the top of Day {dayN} in the Bible App.</p>
      )}
      {state.error && <p className="dash-starter-error">{state.error}</p>}

      {open && passage && (
        <div className="read-here-panel" ref={panelRef}>
          <div className="read-here-panel-top">
            <button type="button" className="dash-word-link" onClick={close}>
              Hide the reading
            </button>
          </div>
          {state.loading && <p className="dash-word-hint mt-3">Opening {passage}…</p>}
          {blocks && !state.loading && (
            <div className="read-here-text">
              {blocks.map((b) => (
                <section key={b.label}>
                  <h3 className="read-here-title">{b.label}</h3>
                  <WhoIsSpeaking passage={b.label} />
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
          <ReadAlong className="read-here-along" />
          <p className="read-here-source">
            Berean Standard Bible - free to read here. Tap a verse number to start a note on it.
          </p>
        </div>
      )}

      <ReadingContext passages={chapters.length ? chapters : open && passage ? [passage] : []} onRead={readThis} />
    </div>
  );
}
