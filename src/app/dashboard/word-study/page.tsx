"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Panel } from "@/components/dashboard/panel";
import { useDashboard } from "@/lib/dashboard/storage";
import { BibleWord, WordLanguage } from "@/lib/dashboard/types";
import { StrongsEntry } from "@/lib/dashboard/strongs";
import { formatShort } from "@/lib/dashboard/dates";
import { languageLabel, matchesWord, wordDate, wordRank } from "@/lib/dashboard/words";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

interface Draft {
  word: string;
  language: WordLanguage;
  original: string;
  translit: string;
  strongs: string;
  originalMeaning: string;
  englishMeaning: string;
  application: string;
  reference: string;
}

const EMPTY_DRAFT: Draft = {
  word: "",
  language: "hebrew",
  original: "",
  translit: "",
  strongs: "",
  originalMeaning: "",
  englishMeaning: "",
  application: "",
  reference: "",
};

function toDraft(w: BibleWord): Draft {
  return {
    word: w.word,
    language: w.language,
    original: w.original ?? "",
    translit: w.translit ?? "",
    strongs: w.strongs ?? "",
    originalMeaning: w.originalMeaning ?? "",
    englishMeaning: w.englishMeaning ?? "",
    application: w.application ?? "",
    reference: w.reference ?? "",
  };
}

type LangFilter = "all" | WordLanguage;
type SortMode = "newest" | "az";

interface Verse {
  chapter: number;
  verse: number;
  text: string;
}
interface VerseView {
  loading: boolean;
  label?: string;
  verses?: Verse[];
  error?: string;
}

// useSearchParams needs a Suspense boundary so the page can still prerender.
export default function WordJournalPage() {
  return (
    <Suspense fallback={null}>
      <WordJournal />
    </Suspense>
  );
}

function WordJournal() {
  const { state, update, ready } = useDashboard();
  const router = useRouter();
  const params = useSearchParams();
  const words = state.words;

  // ── Entry form ────────────────────────────────────────────────
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const wordInput = useRef<HTMLInputElement>(null);
  const formTop = useRef<HTMLDivElement>(null);

  // ── Strong's lookup (fills the original-language fields) ─────
  const [hits, setHits] = useState<StrongsEntry[] | null>(null);
  const [lookupBusy, setLookupBusy] = useState(false);
  const [lookupNote, setLookupNote] = useState<string | null>(null);
  // The meaning text a lookup last filled in - lets a second pick replace
  // it without clobbering anything the user typed themselves.
  const autoMeaning = useRef("");

  // ── Library ───────────────────────────────────────────────────
  const [query, setQuery] = useState("");
  const [lang, setLang] = useState<LangFilter>("all");
  const [sort, setSort] = useState<SortMode>("newest");
  const [verses, setVerses] = useState<Record<string, VerseView>>({});

  // Deep links from ⌘K and Today: ?q=grace opens a search, ?new=1 jumps to
  // the form. Consumed once, then cleared so the same link works again.
  useEffect(() => {
    if (!ready) return;
    const q = params.get("q");
    const isNew = params.get("new");
    if (q === null && !isNew) return;
    if (q !== null) {
      setQuery(q);
      setLang("all");
    }
    if (isNew) wordInput.current?.focus();
    router.replace("/dashboard/word-study", { scroll: false });
  }, [ready, params, router]);

  useEffect(() => {
    if (!flash) return;
    const t = window.setTimeout(() => setFlash(null), 2600);
    return () => window.clearTimeout(t);
  }, [flash]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  function resetForm() {
    setDraft(EMPTY_DRAFT);
    setEditingId(null);
    setHits(null);
    setLookupNote(null);
    autoMeaning.current = "";
  }

  function save(e?: React.FormEvent) {
    e?.preventDefault();
    const word = draft.word.trim();
    if (!word) {
      wordInput.current?.focus();
      return;
    }
    const fields = {
      word,
      language: draft.language,
      original: draft.original.trim() || undefined,
      translit: draft.translit.trim() || undefined,
      strongs: draft.strongs.trim().toUpperCase() || undefined,
      originalMeaning: draft.originalMeaning.trim(),
      englishMeaning: draft.englishMeaning.trim(),
      application: draft.application.trim(),
      reference: draft.reference.trim() || undefined,
    };
    const now = new Date().toISOString();
    update((d) => {
      if (!Array.isArray(d.words)) d.words = [];
      if (editingId) {
        d.words = d.words.map((w) =>
          w.id === editingId ? { ...w, ...fields, updatedAt: now } : w,
        );
      } else {
        d.words.unshift({ id: uid(), createdAt: now, ...fields });
      }
    });
    setFlash(editingId ? `Updated “${word}”` : `Saved “${word}”`);
    resetForm();
  }

  function startEdit(w: BibleWord) {
    setEditingId(w.id);
    setDraft(toDraft(w));
    setHits(null);
    setLookupNote(null);
    autoMeaning.current = "";
    formTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    wordInput.current?.focus({ preventScroll: true });
  }

  function remove(w: BibleWord) {
    if (!confirm(`Delete “${w.word}” from your word journal?`)) return;
    update((d) => {
      d.words = (d.words ?? []).filter((x) => x.id !== w.id);
    });
    if (editingId === w.id) resetForm();
  }

  function startNewFromSearch() {
    resetForm();
    setDraft({ ...EMPTY_DRAFT, word: query.trim() });
    formTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    wordInput.current?.focus({ preventScroll: true });
  }

  async function lookup() {
    const q = draft.strongs.trim() || draft.word.trim();
    if (!q) {
      wordInput.current?.focus();
      return;
    }
    setLookupBusy(true);
    setLookupNote(null);
    try {
      const r = await fetch("/api/word-study", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: q, useAi: false }),
      });
      const data = (await r.json()) as { results?: StrongsEntry[] };
      const results = (data.results ?? []).slice(0, 6);
      setHits(results);
      if (!results.length) {
        setLookupNote(
          `No Strong's match for “${q}”. Fill it in by hand, or try a Strong's number like H2617.`,
        );
      }
    } catch {
      setHits(null);
      setLookupNote("Lookup failed - check your connection and try again.");
    } finally {
      setLookupBusy(false);
    }
  }

  function pick(h: StrongsEntry) {
    const meaning = [h.gloss?.replace(/[.;\s]+$/, ""), h.usage?.trim()]
      .filter(Boolean)
      .join(". ");
    const replaceMeaning =
      !draft.originalMeaning.trim() || draft.originalMeaning === autoMeaning.current;
    setDraft({
      ...draft,
      language: h.language,
      original: h.original ?? "",
      translit: h.translit ?? "",
      strongs: h.number ?? "",
      originalMeaning: replaceMeaning ? meaning : draft.originalMeaning,
    });
    if (replaceMeaning) autoMeaning.current = meaning;
    setHits(null);
  }

  async function toggleVerse(w: BibleWord) {
    if (!w.reference) return;
    if (verses[w.id]) {
      setVerses((v) => {
        const next = { ...v };
        delete next[w.id];
        return next;
      });
      return;
    }
    setVerses((v) => ({ ...v, [w.id]: { loading: true } }));
    try {
      const r = await fetch(`/api/verse?ref=${encodeURIComponent(w.reference)}`);
      const data = await r.json();
      setVerses((v) => ({
        ...v,
        [w.id]: data.error
          ? { loading: false, error: data.error }
          : {
              loading: false,
              label: `${data.reference} · ${data.translation}`,
              verses: data.verses,
            },
      }));
    } catch {
      setVerses((v) => ({ ...v, [w.id]: { loading: false, error: "Couldn't load that passage." } }));
    }
  }

  const counts = useMemo(
    () => ({
      all: words.length,
      hebrew: words.filter((w) => w.language === "hebrew").length,
      greek: words.filter((w) => w.language === "greek").length,
    }),
    [words],
  );

  const shown = useMemo(() => {
    const q = query.trim();
    return words
      .filter((w) => (lang === "all" || w.language === lang) && matchesWord(w, q))
      .sort((a, b) => {
        if (q) {
          const rank = wordRank(a, q) - wordRank(b, q);
          if (rank) return rank;
        }
        return sort === "az"
          ? a.word.localeCompare(b.word, undefined, { sensitivity: "base" })
          : b.createdAt.localeCompare(a.createdAt);
      });
  }, [words, lang, query, sort]);

  if (!ready) return null;

  const langName = draft.language === "greek" ? "Greek" : "Hebrew";

  return (
    <>
      <div className="dash-pagehead">
        <div>
          <div className="eyebrow eyebrow-amber">Hebrew &amp; Greek · in your own words</div>
          <h1 className="dash-title mt-1">Word Journal</h1>
          <div className="dash-subtitle">
            Words from the Bible you want to understand deeper - what the original means,
            what it means in English, and what it means for your life.
          </div>
        </div>
      </div>

      <div className="dash-grid">
        {/* ── Add / edit a word ─────────────────────────────── */}
        <div className="dash-col-5" ref={formTop} style={{ scrollMarginTop: 24 }}>
          <Panel
            eyebrow={editingId ? "Editing" : "New entry"}
            title={editingId ? "Edit word" : "Add a word"}
            action={
              editingId ? (
                <button type="button" className="dash-btn dash-btn-ghost" onClick={resetForm}>
                  Cancel
                </button>
              ) : null
            }
          >
            <form onSubmit={save} className="flex flex-col gap-4">
              <div>
                <label className="dash-label" htmlFor="wj-word">
                  The word
                </label>
                <div className="flex gap-2">
                  <input
                    id="wj-word"
                    ref={wordInput}
                    className="dash-input"
                    placeholder="e.g. Mercy, Grace, Shalom"
                    value={draft.word}
                    onChange={(e) => set("word", e.target.value)}
                    autoComplete="off"
                    required
                  />
                  <button
                    type="button"
                    className="dash-btn shrink-0"
                    onClick={lookup}
                    disabled={lookupBusy}
                    title="Find the Hebrew or Greek behind this word in Strong's"
                  >
                    {lookupBusy ? "Looking…" : "Look up"}
                  </button>
                </div>
                <div className="dash-word-hint">
                  Look up pulls the original word from Strong&apos;s. Keep what helps and
                  rewrite the rest in your own words.
                </div>
              </div>

              {hits && hits.length > 0 && (
                <div className="dash-word-hits">
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="eyebrow">Pick the original word</span>
                    <button
                      type="button"
                      className="dash-word-link"
                      onClick={() => setHits(null)}
                    >
                      None of these
                    </button>
                  </div>
                  {hits.map((h, i) => (
                    <button
                      key={`${h.number}-${i}`}
                      type="button"
                      className="dash-word-hit"
                      onClick={() => pick(h)}
                    >
                      <span className="dash-word-hit-orig" dir="auto">
                        {h.original}
                      </span>
                      <span className="dash-word-hit-body">
                        <span className="dash-word-hit-top">
                          <span className="dash-word-hit-translit">{h.translit}</span>
                          <span className="dash-word-hit-num">
                            {h.language === "greek" ? "Greek" : "Hebrew"} · {h.number}
                          </span>
                        </span>
                        <span className="dash-word-hit-gloss">{h.gloss}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {lookupNote && <div className="dash-word-note">{lookupNote}</div>}

              <div>
                <span className="dash-label">Original language</span>
                <div className="dash-toggle" role="group" aria-label="Original language">
                  <button
                    type="button"
                    className={draft.language === "hebrew" ? "is-on" : ""}
                    aria-pressed={draft.language === "hebrew"}
                    onClick={() => set("language", "hebrew")}
                  >
                    Hebrew
                  </button>
                  <button
                    type="button"
                    className={draft.language === "greek" ? "is-on" : ""}
                    aria-pressed={draft.language === "greek"}
                    onClick={() => set("language", "greek")}
                  >
                    Greek
                  </button>
                </div>
              </div>

              <div className="dash-word-orig-row">
                <div>
                  <label className="dash-label" htmlFor="wj-original">
                    {langName} word
                  </label>
                  <input
                    id="wj-original"
                    className="dash-input dash-word-script-input"
                    placeholder={draft.language === "greek" ? "χάρις" : "חֶסֶד"}
                    value={draft.original}
                    onChange={(e) => set("original", e.target.value)}
                    dir="auto"
                  />
                </div>
                <div>
                  <label className="dash-label" htmlFor="wj-translit">
                    Sounds like
                  </label>
                  <input
                    id="wj-translit"
                    className="dash-input"
                    placeholder={draft.language === "greek" ? "charis" : "chesed"}
                    value={draft.translit}
                    onChange={(e) => set("translit", e.target.value)}
                  />
                </div>
                <div>
                  <label className="dash-label" htmlFor="wj-strongs">
                    Strong&apos;s
                  </label>
                  <input
                    id="wj-strongs"
                    className="dash-input"
                    placeholder={draft.language === "greek" ? "G5485" : "H2617"}
                    value={draft.strongs}
                    onChange={(e) => set("strongs", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="dash-label" htmlFor="wj-orig-meaning">
                  {langName} meaning
                </label>
                <textarea
                  id="wj-orig-meaning"
                  className="dash-textarea"
                  style={{ minHeight: 88 }}
                  placeholder="What the original word carries - its root, its picture, its weight."
                  value={draft.originalMeaning}
                  onChange={(e) => set("originalMeaning", e.target.value)}
                />
              </div>

              <div>
                <label className="dash-label" htmlFor="wj-en-meaning">
                  English meaning
                </label>
                <textarea
                  id="wj-en-meaning"
                  className="dash-textarea"
                  style={{ minHeight: 64 }}
                  placeholder="What the word means in plain English."
                  value={draft.englishMeaning}
                  onChange={(e) => set("englishMeaning", e.target.value)}
                />
              </div>

              <div>
                <label className="dash-label" htmlFor="wj-apply">
                  For my life
                </label>
                <textarea
                  id="wj-apply"
                  className="dash-textarea"
                  style={{ minHeight: 60 }}
                  placeholder="One short sentence - how this changes the way I live today."
                  value={draft.application}
                  onChange={(e) => set("application", e.target.value)}
                />
              </div>

              <div>
                <label className="dash-label" htmlFor="wj-ref">
                  Found in · optional
                </label>
                <input
                  id="wj-ref"
                  className="dash-input"
                  placeholder="e.g. Psalm 136:1"
                  value={draft.reference}
                  onChange={(e) => set("reference", e.target.value)}
                />
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <button type="submit" className="dash-btn dash-btn-primary">
                  {editingId ? "Save changes" : "Save word"}
                </button>
                {flash && (
                  <span className="text-[12.5px] text-[var(--colour-amber-soft)]" role="status">
                    ✓ {flash}
                  </span>
                )}
              </div>
            </form>
          </Panel>
        </div>

        {/* ── The journal ─────────────────────────────────────── */}
        <div className="dash-col-7">
          <Panel
            eyebrow="Your journal"
            title={`${words.length} ${words.length === 1 ? "word" : "words"}`}
            action={
              words.length > 1 ? (
                <div className="dash-toggle" role="group" aria-label="Sort">
                  <button
                    type="button"
                    className={sort === "newest" ? "is-on" : ""}
                    onClick={() => setSort("newest")}
                  >
                    Newest
                  </button>
                  <button
                    type="button"
                    className={sort === "az" ? "is-on" : ""}
                    onClick={() => setSort("az")}
                  >
                    A–Z
                  </button>
                </div>
              ) : null
            }
          >
            {words.length > 0 && (
              <div className="dash-word-tools">
                <input
                  type="search"
                  className="dash-input"
                  placeholder="Search words, meanings, verses…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Search your word journal"
                />
                <div className="dash-toggle" role="group" aria-label="Filter by language">
                  {(["all", "hebrew", "greek"] as const).map((l) => (
                    <button
                      key={l}
                      type="button"
                      className={lang === l ? "is-on" : ""}
                      onClick={() => setLang(l)}
                    >
                      {l === "all" ? "All" : l === "hebrew" ? "Hebrew" : "Greek"}{" "}
                      <span className="opacity-60">{counts[l]}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {words.length === 0 && (
              <div className="dash-empty">
                Your journal is empty. Add the first word you want to understand deeper -
                it&apos;ll live here, ready to search.
              </div>
            )}

            {words.length > 0 && shown.length === 0 && (
              <div className="dash-empty">
                {query.trim()
                  ? `Nothing matches “${query.trim()}”.`
                  : `No ${lang === "greek" ? "Greek" : "Hebrew"} words yet.`}
                <div className="flex justify-center gap-2 mt-3 flex-wrap">
                  {query.trim() && (
                    <button type="button" className="dash-btn" onClick={startNewFromSearch}>
                      + Add “{query.trim()}”
                    </button>
                  )}
                  <button
                    type="button"
                    className="dash-btn dash-btn-ghost"
                    onClick={() => {
                      setQuery("");
                      setLang("all");
                    }}
                  >
                    Clear search
                  </button>
                </div>
              </div>
            )}

            {shown.length > 0 && (
              <div className="flex flex-col gap-3">
                {shown.map((w) => {
                  const v = verses[w.id];
                  return (
                    <article
                      key={w.id}
                      className={`dash-word-card ${editingId === w.id ? "is-editing" : ""}`}
                    >
                      <div className="dash-word-head">
                        <div className="min-w-0">
                          <h3 className="dash-word-title">{w.word}</h3>
                          {(w.original || w.translit) && (
                            <div className="dash-word-orig">
                              {w.original && (
                                <span
                                  className="dash-word-script"
                                  lang={w.language === "greek" ? "grc" : "he"}
                                  dir="auto"
                                >
                                  {w.original}
                                </span>
                              )}
                              {w.translit && (
                                <span className="dash-word-translit">{w.translit}</span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="dash-word-meta">
                          <span className={`dash-word-lang is-${w.language}`}>
                            {languageLabel(w)}
                          </span>
                          {w.strongs && <span>{w.strongs}</span>}
                        </div>
                      </div>

                      {(w.originalMeaning || w.englishMeaning) && (
                        <dl className="dash-word-defs">
                          {w.originalMeaning && (
                            <div>
                              <dt>{languageLabel(w)} meaning</dt>
                              <dd>{w.originalMeaning}</dd>
                            </div>
                          )}
                          {w.englishMeaning && (
                            <div>
                              <dt>English meaning</dt>
                              <dd>{w.englishMeaning}</dd>
                            </div>
                          )}
                        </dl>
                      )}

                      {w.application && (
                        <div className="dash-word-apply">
                          <span className="eyebrow eyebrow-amber">For my life</span>
                          <p>{w.application}</p>
                        </div>
                      )}

                      <div className="dash-word-foot">
                        {w.reference ? (
                          <button
                            type="button"
                            className="dash-word-ref"
                            onClick={() => toggleVerse(w)}
                            aria-expanded={Boolean(v)}
                            title={v ? "Hide the passage" : "Read the passage"}
                          >
                            ↗ {w.reference}
                          </button>
                        ) : (
                          <span />
                        )}
                        <span className="dash-word-date">{formatShort(wordDate(w))}</span>
                        <button
                          type="button"
                          className="dash-word-link"
                          onClick={() => startEdit(w)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="dash-word-link is-danger"
                          onClick={() => remove(w)}
                        >
                          Delete
                        </button>
                      </div>

                      {v && (
                        <div className="dash-word-verse">
                          {v.loading && <span className="dash-word-hint">Opening the passage…</span>}
                          {v.error && <span className="text-[12.5px] text-[#f1a07d]">{v.error}</span>}
                          {v.verses && (
                            <>
                              <div className="eyebrow eyebrow-amber mb-1.5">{v.label}</div>
                              <div className="dash-verse">
                                {v.verses.map((x) => (
                                  <p key={`${x.chapter}-${x.verse}`} className="mb-1.5">
                                    <span className="dash-verse-num">{x.verse}</span>
                                    {x.text}
                                  </p>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
