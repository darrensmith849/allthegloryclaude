"use client";

import { useState } from "react";
import { Panel } from "@/components/dashboard/panel";
import { searchStrongs, StrongsEntry, getAllStrongs } from "@/lib/dashboard/strongs";

interface StudyResult extends StrongsEntry {
  source?: "curated" | "ai";
}

interface Verse {
  ref: string;
  chapter: number;
  verse: number;
  text: string;
}

const QUICK = ["love", "grace", "faith", "hope", "glory", "peace", "spirit", "word", "holy", "chesed"];

export default function WordStudyPage() {
  // Word search
  const [query, setQuery] = useState("");
  const [useAi, setUseAi] = useState(true);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<StudyResult[] | null>(null);
  const [note, setNote] = useState<string | null>(null);

  // Verse lookup
  const [vQuery, setVQuery] = useState("");
  const [vLoading, setVLoading] = useState(false);
  const [verses, setVerses] = useState<{ ref: string; verses: Verse[]; translation: string } | null>(null);
  const [vErr, setVErr] = useState<string | null>(null);

  async function search(q: string) {
    setQuery(q);
    setLoading(true);
    setNote(null);
    // Instant local first.
    const local = searchStrongs(q).map((e) => ({ ...e, source: "curated" as const }));
    setResults(local);
    try {
      const r = await fetch("/api/word-study", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: q, useAi }),
      });
      const data = await r.json();
      if (data.results) setResults(data.results);
      if (data.note) setNote(data.note);
      if (data.aiError) setNote(data.aiError);
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Lookup failed.");
    } finally {
      setLoading(false);
    }
  }

  async function lookupVerse(ref: string) {
    if (!ref.trim()) return;
    setVLoading(true);
    setVErr(null);
    setVerses(null);
    try {
      const r = await fetch(`/api/verse?ref=${encodeURIComponent(ref)}`);
      const data = await r.json();
      if (data.error) setVErr(data.error);
      else setVerses({ ref: data.reference, verses: data.verses, translation: data.translation });
    } catch (e) {
      setVErr(e instanceof Error ? e.message : "Lookup failed.");
    } finally {
      setVLoading(false);
    }
  }

  return (
    <>
      <div className="dash-pagehead">
        <div>
          <div className="eyebrow eyebrow-amber">Greek &amp; Hebrew · live verse lookup</div>
          <h1 className="dash-title mt-1">Word Study</h1>
          <div className="dash-subtitle">
            Search any English word, any Greek/Hebrew transliteration, or any Strong&apos;s number.
          </div>
        </div>
      </div>

      <div className="dash-grid">
        <div className="dash-col-7">
          <Panel eyebrow="Greek / Hebrew study" title="Search the original languages">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                search(query);
              }}
              className="flex flex-wrap gap-2 items-end"
            >
              <div className="flex-1 min-w-[240px]">
                <label className="dash-label">Word or Strong&apos;s number</label>
                <input
                  className="dash-input"
                  placeholder="e.g. love, chesed, G26, H2617"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <label
                className="flex items-center gap-2 text-[12.5px] text-[var(--colour-ink-soft)] cursor-pointer pb-2.5"
                title="When ANTHROPIC_API_KEY is set, deepen the search with Claude."
              >
                <input
                  type="checkbox"
                  checked={useAi}
                  onChange={(e) => setUseAi(e.target.checked)}
                />
                Use AI
              </label>
              <button className="dash-btn dash-btn-primary" type="submit" disabled={loading}>
                {loading ? "Searching…" : "Search"}
              </button>
            </form>

            <div className="flex flex-wrap gap-1.5 mt-3">
              <span className="eyebrow opacity-70 mr-1">Try</span>
              {QUICK.map((q) => (
                <button key={q} className="chip" onClick={() => search(q)}>
                  {q}
                </button>
              ))}
            </div>

            {note && (
              <div className="mt-4 text-[12.5px] text-[var(--colour-ink-quiet)] border border-white/8 rounded-md p-3">
                {note}
              </div>
            )}

            <div className="dash-divider" />

            {!results && (
              <div className="dash-empty">
                Start with a word like <em>love</em> or <em>grace</em> — or browse the lexicon below.
              </div>
            )}

            {results && results.length === 0 && (
              <div className="dash-empty">
                No matches yet. Try a different spelling or a Strong&apos;s number.
              </div>
            )}

            {results && results.length > 0 && (
              <div className="flex flex-col gap-3">
                {results.map((e, idx) => (
                  <article key={`${e.number}-${idx}`} className="dash-strong-card">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="dash-strong-original">{e.original}</div>
                        <div className="dash-strong-translit">{e.translit}</div>
                      </div>
                      <div className="text-right">
                        <div className="dash-strong-meta">
                          {e.language === "greek" ? "Greek" : "Hebrew"} · {e.number}
                        </div>
                        {e.source === "ai" && (
                          <div className="text-[10.5px] mt-1 text-[var(--colour-amber-soft)]">
                            via Claude
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 text-[14.5px] text-[var(--colour-ink-strong)] italic font-display">
                      {e.gloss}
                    </div>
                    <p className="mt-3 text-[13.5px] text-[var(--colour-ink-soft)] leading-relaxed">
                      {e.usage}
                    </p>
                    {e.english?.length > 0 && (
                      <div className="mt-3 text-[12px] text-[var(--colour-ink-quiet)]">
                        <span className="eyebrow mr-2">Translates as</span>
                        {e.english.join(" · ")}
                      </div>
                    )}
                    {e.examples?.length > 0 && (
                      <div className="mt-3 flex flex-col gap-1">
                        {e.examples.map((ex, i) => (
                          <button
                            key={i}
                            className="text-left text-[13px] text-[var(--colour-amber-soft)] hover:text-[var(--colour-glow)] transition"
                            onClick={() => {
                              setVQuery(ex.ref);
                              lookupVerse(ex.ref);
                            }}
                          >
                            ↗ {ex.ref}
                            {ex.quote && (
                              <span className="text-[var(--colour-ink-soft)] italic"> — “{ex.quote}”</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </Panel>
        </div>

        <div className="dash-col-5">
          <Panel eyebrow="Verse lookup" title="Read any passage">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                lookupVerse(vQuery);
              }}
              className="flex gap-2 items-end"
            >
              <div className="flex-1">
                <label className="dash-label">Reference</label>
                <input
                  className="dash-input"
                  placeholder="e.g. Numbers 21:8, John 3:16-21"
                  value={vQuery}
                  onChange={(e) => setVQuery(e.target.value)}
                />
              </div>
              <button className="dash-btn dash-btn-primary" disabled={vLoading}>
                {vLoading ? "…" : "Read"}
              </button>
            </form>
            {vErr && (
              <div className="mt-3 text-[12.5px] text-[#f1a07d]">{vErr}</div>
            )}
            {verses && (
              <div className="mt-4">
                <div className="eyebrow eyebrow-amber">{verses.translation}</div>
                <div className="font-display text-[18px] mt-1">{verses.ref}</div>
                <div className="dash-divider" />
                <div className="dash-verse leading-relaxed">
                  {verses.verses.map((v) => (
                    <p key={`${v.chapter}-${v.verse}`} className="mb-2">
                      <span className="dash-verse-num">{v.verse}</span>
                      {v.text}
                    </p>
                  ))}
                </div>
              </div>
            )}
            {!verses && !vErr && (
              <div className="mt-3 text-[12.5px] text-[var(--colour-ink-quiet)]">
                Powered by bible-api.com. Defaults to the World English Bible.
              </div>
            )}
          </Panel>

          <div className="h-4" />

          <Panel eyebrow="Browse" title="Curated lexicon">
            <div className="max-h-[420px] overflow-y-auto pr-2">
              {getAllStrongs().map((e) => (
                <button
                  key={e.number}
                  className="w-full text-left p-2.5 border-b border-white/5 hover:bg-white/5 transition"
                  onClick={() => search(e.translit)}
                >
                  <div className="flex items-baseline justify-between">
                    <span className="font-display text-[15px] text-[var(--colour-glow)]">
                      {e.original}
                    </span>
                    <span className="eyebrow text-[10px]">{e.number}</span>
                  </div>
                  <div className="text-[13px] mt-0.5">{e.translit}</div>
                  <div className="text-[11.5px] text-[var(--colour-ink-quiet)] mt-0.5">{e.gloss}</div>
                </button>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
