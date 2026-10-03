"use client";

// "Look up a verse": a reference (John 3:16) or a few words (living water),
// with each verse ready to add to today's notes or open in the NIV.

import { useState } from "react";
import { bibleAppVerse } from "@/lib/study/plan";

interface Hit {
  ref: string;
  book: number;
  chapter: number;
  verse: number;
  text: string;
}
interface Result {
  kind: "passage" | "words";
  label: string;
  total: number;
  results: Hit[];
}

// Render the search's <mark>…</mark> highlights without injecting HTML.
function Marked({ text }: { text: string }) {
  const parts = text.split(/(<mark>.*?<\/mark>)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("<mark>") ? <mark key={i}>{p.slice(6, -7)}</mark> : <span key={i}>{p}</span>,
      )}
    </>
  );
}

export function BibleLookup({ onAdd }: { onAdd?: (ref: string) => void }) {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState<string | null>(null);

  async function search(e?: React.FormEvent) {
    e?.preventDefault();
    const query = q.trim();
    if (!query || busy) return;
    setBusy(true);
    setError(null);
    setAdded(null);
    try {
      const r = await fetch(`/api/bible?q=${encodeURIComponent(query)}`);
      const data = (await r.json().catch(() => ({}))) as Result & { error?: string };
      if (!r.ok) throw new Error(data.error ?? "Couldn't search just now.");
      setRes(data);
    } catch (err) {
      setRes(null);
      setError(err instanceof Error ? err.message : "Couldn't search just now.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="dash-bible">
      <form onSubmit={search} className="dash-bible-form">
        <input
          className="dash-input"
          type="search"
          placeholder="John 3:16 · Psalm 23 · living water"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Look up a verse or words"
        />
        <button type="submit" className="dash-btn dash-btn-primary" disabled={busy || !q.trim()}>
          {busy ? "…" : "Look up"}
        </button>
      </form>
      {error && <p className="dash-word-hint mt-2">{error}</p>}
      {res && (
        <div className="dash-bible-results">
          <div className="dash-bible-head">
            <span>
              {res.label}
              {res.kind === "words" && ` · ${res.total} ${res.total === 1 ? "verse" : "verses"}`}
            </span>
            <span className="dash-bible-version">Berean Standard Bible</span>
          </div>
          {res.results.length === 0 && <p className="dash-word-hint">No verses use those words.</p>}
          {res.results.map((v) => (
            <div key={v.ref} className="dash-bible-verse">
              <p>
                <strong>{res.kind === "passage" ? v.verse : v.ref}</strong> <Marked text={v.text} />
              </p>
              <div className="dash-bible-actions">
                {onAdd && (
                  <button
                    type="button"
                    className="dash-word-link"
                    onClick={() => {
                      onAdd(v.ref);
                      setAdded(v.ref);
                    }}
                  >
                    {added === v.ref ? "✓ Added to your notes" : "+ Add to my notes"}
                  </button>
                )}
                <a className="dash-word-link" href={bibleAppVerse(v.book, v.chapter, v.verse)} target="_blank" rel="noreferrer">
                  NIV ↗
                </a>
              </div>
            </div>
          ))}
          {res.kind === "words" && res.total > res.results.length && (
            <p className="dash-word-hint">Showing the first {res.results.length} - add a word to narrow it.</p>
          )}
        </div>
      )}
    </div>
  );
}
