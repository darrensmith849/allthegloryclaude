"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Panel } from "@/components/dashboard/panel";
import { GrowingTextarea } from "@/components/dashboard/growing-textarea";
import { KeyVerses, WordRow } from "@/components/dashboard/word-entry";
import { useWords } from "@/lib/dashboard/words-store";
import { BibleWord, KeyVerse, WordLanguage } from "@/lib/dashboard/types";
import { formatShort } from "@/lib/dashboard/dates";
import {
  languageLabel,
  matchesWord,
  wordDate,
  wordRank,
  LanguageFill,
  WordCandidate,
  WordFill,
} from "@/lib/dashboard/words";

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
  meaningSource: string;
  englishMeaning: string;
  keyVerses: KeyVerse[];
  application: string;
  reference: string;
  comment: string;
}

const EMPTY_DRAFT: Draft = {
  word: "",
  language: "hebrew",
  original: "",
  translit: "",
  strongs: "",
  originalMeaning: "",
  meaningSource: "",
  englishMeaning: "",
  keyVerses: [],
  application: "",
  reference: "",
  comment: "",
};

function toDraft(w: BibleWord): Draft {
  return {
    word: w.word,
    language: w.language,
    original: w.original ?? "",
    translit: w.translit ?? "",
    strongs: w.strongs ?? "",
    originalMeaning: w.originalMeaning ?? "",
    meaningSource: w.meaningSource ?? "",
    englishMeaning: w.englishMeaning ?? "",
    keyVerses: w.keyVerses ?? [],
    application: w.application ?? "",
    reference: w.reference ?? "",
    comment: w.comment ?? "",
  };
}

// Everything that belongs to one language's word, kept so the Hebrew /
// Greek switch can swap between them without losing edits. null = looked
// up but nothing found in that language; missing = not looked up yet.
interface LangSlot {
  original: string;
  translit: string;
  strongs: string;
  meaning: string;
  meaningSource: string;
  keyVerses: KeyVerse[];
  application: string;
  alternatives: WordCandidate[];
}
type Slots = Partial<Record<WordLanguage, LangSlot | null>>;

function slotFrom(f: LanguageFill | null): LangSlot | null {
  return f
    ? {
        original: f.entry.original,
        translit: f.entry.translit,
        strongs: f.entry.number,
        meaning: f.meaning,
        meaningSource: f.meaningSource,
        keyVerses: f.keyVerses,
        application: f.application,
        alternatives: f.alternatives,
      }
    : null;
}

// The visible language-specific fields for a slot.
function fieldsFrom(language: WordLanguage, slot: LangSlot | null | undefined) {
  return {
    language,
    original: slot?.original ?? "",
    translit: slot?.translit ?? "",
    strongs: slot?.strongs ?? "",
    originalMeaning: slot?.meaning ?? "",
    meaningSource: slot?.meaningSource ?? "",
    keyVerses: slot?.keyVerses ?? [],
    application: slot?.application ?? "",
  };
}

// Keep whatever is showing (including edits) in the current language's slot.
function stash(d: Draft, slots: Slots): Slots {
  const current = slots[d.language];
  const hasText =
    d.original || d.translit || d.strongs || d.originalMeaning || d.application || d.keyVerses.length;
  if (!current && !hasText) return slots;
  return {
    ...slots,
    [d.language]: {
      original: d.original,
      translit: d.translit,
      strongs: d.strongs,
      meaning: d.originalMeaning,
      meaningSource: d.meaningSource,
      keyVerses: d.keyVerses,
      application: d.application,
      alternatives: current?.alternatives ?? [],
    },
  };
}

const LANG_NAME: Record<WordLanguage, string> = { hebrew: "Hebrew", greek: "Greek" };
const PAGE = 40;

type LangFilter = "all" | WordLanguage;
type SortMode = "newest" | "az";

function monthLabel(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "long", year: "numeric" });
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
  const { words, deleted, ready, save: saveWord, remove: removeWord, restore } = useWords();
  const [showDeleted, setShowDeleted] = useState(false);
  const router = useRouter();
  const params = useSearchParams();

  // ── Entry form ────────────────────────────────────────────────
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [saved, setSaved] = useState<{ id: string; word: string; updated: boolean } | null>(null);
  const wordInput = useRef<HTMLInputElement>(null);
  const formTop = useRef<HTMLDivElement>(null);

  // ── Auto-fill ─────────────────────────────────────────────────
  const [filling, setFilling] = useState(false);
  const [fillNote, setFillNote] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slots>({});

  // ── Journal list ──────────────────────────────────────────────
  const [query, setQuery] = useState("");
  const [lang, setLang] = useState<LangFilter>("all");
  const [sort, setSort] = useState<SortMode>("newest");
  const [openId, setOpenId] = useState<string | null>(null);
  const [visible, setVisible] = useState(PAGE);

  // Deep links: ?q=grace opens a search (⌘K, Today), ?new=1 jumps to the
  // form, ?edit=<id> opens a word to edit (Study Notes). Consumed once, then
  // cleared so the same link works again.
  useEffect(() => {
    if (!ready) return;
    const q = params.get("q");
    const isNew = params.get("new");
    const editId = params.get("edit");
    if (q === null && !isNew && !editId) return;
    const toEdit = editId ? words.find((w) => w.id === editId) : undefined;
    if (toEdit) {
      startEdit(toEdit);
      setOpenId(toEdit.id);
    }
    if (q !== null) {
      setQuery(q);
      setLang("all");
    }
    if (isNew) wordInput.current?.focus();
    router.replace("/dashboard/word-study", { scroll: false });
  }, [ready, params, router]);

  // After a save, open the saved word, bring it into view and let it glow.
  useEffect(() => {
    if (!saved) return;
    setOpenId(saved.id);
    const t1 = window.setTimeout(() => {
      document.getElementById(`word-${saved.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
    const t2 = window.setTimeout(() => setSaved(null), 6000);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [saved]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  function resetForm() {
    setDraft(EMPTY_DRAFT);
    setEditingId(null);
    setShowDetails(false);
    setFillNote(null);
    setSlots({});
  }

  const noneFound = (language: WordLanguage) =>
    `No ${LANG_NAME[language]} word found for “${draft.word.trim()}” in Strong's. Type one in, or switch back.`;

  // fresh  - "Fill it in" button: replace everything with the new lookup.
  // pick   - a "Try ..." option: look up just that language's word again.
  // switch - Hebrew / Greek switch before that language was looked up (e.g.
  //          when editing an older entry): fetch it, keep what's showing.
  async function fill(
    mode: "fresh" | "pick" | "switch",
    opts: { pick?: string; want?: WordLanguage } = {},
  ) {
    const word = draft.word.trim();
    if (!word) {
      wordInput.current?.focus();
      return;
    }
    setFilling(true);
    setFillNote(null);
    try {
      const r = await fetch("/api/word-fill", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          word,
          reference: draft.reference,
          pick: opts.pick,
          only: mode === "switch" ? opts.want : undefined,
        }),
      });
      if (!r.ok) throw new Error(String(r.status));
      const data = (await r.json()) as WordFill;
      const fetched: Slots = { hebrew: slotFrom(data.hebrew), greek: slotFrom(data.greek) };

      let next: Slots;
      let target: WordLanguage;
      if (mode === "pick") {
        target = data.hebrew ? "hebrew" : "greek";
        next = { ...stash(draft, slots), [target]: fetched[target] };
      } else if (mode === "switch") {
        target = opts.want ?? data.primary;
        next = stash(draft, { ...slots, [target]: fetched[target] });
      } else {
        target = data.primary;
        next = fetched;
        if (!next[target]) target = target === "hebrew" ? "greek" : "hebrew";
      }

      setSlots(next);
      setDraft((d) => ({
        ...d,
        ...fieldsFrom(target, next[target]),
        englishMeaning:
          mode !== "fresh" && d.englishMeaning ? d.englishMeaning : data.englishMeaning || d.englishMeaning,
      }));
      setFillNote(next[target] ? (data.note ?? null) : noneFound(target));
      setShowDetails(true);
    } catch {
      setFillNote("Couldn't fill it in just now - check your connection and try again.");
    } finally {
      setFilling(false);
    }
  }

  // The Hebrew / Greek switch swaps in that language's word, meaning, key
  // verses and reflection.
  function switchLanguage(to: WordLanguage) {
    if (to === draft.language || filling) return;
    const kept = stash(draft, slots);
    if (to in kept) {
      setSlots(kept);
      setDraft((d) => ({ ...d, ...fieldsFrom(to, kept[to]) }));
      setFillNote(kept[to] ? null : noneFound(to));
      return;
    }
    if (draft.word.trim()) {
      setSlots(kept);
      fill("switch", { want: to });
    } else {
      setDraft((d) => ({ ...d, language: to }));
    }
  }

  const alternatives = slots[draft.language]?.alternatives ?? [];

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
      meaningSource: draft.originalMeaning.trim() ? draft.meaningSource || undefined : undefined,
      englishMeaning: draft.englishMeaning.trim(),
      keyVerses: draft.keyVerses.length ? draft.keyVerses : undefined,
      application: draft.application.trim(),
      reference: draft.reference.trim() || undefined,
      comment: draft.comment.trim() || undefined,
    };
    const now = new Date().toISOString();
    const id = editingId ?? uid();
    const existing = editingId ? words.find((w) => w.id === editingId) : undefined;
    saveWord(existing ? { ...existing, ...fields, updatedAt: now } : { id, createdAt: now, ...fields });
    // Make sure the saved word is on screen, whatever was being searched.
    setQuery("");
    setLang("all");
    setSaved({ id, word, updated: Boolean(editingId) });
    resetForm();
  }

  function startEdit(w: BibleWord) {
    setEditingId(w.id);
    setDraft(toDraft(w));
    setShowDetails(true);
    setFillNote(null);
    setSlots({});
    formTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function remove(w: BibleWord) {
    if (!confirm(`Move “${w.word}” to Recently deleted? You can restore it any time.`)) return;
    removeWord(w.id);
    if (editingId === w.id) resetForm();
  }

  function startNewFromSearch() {
    resetForm();
    setDraft({ ...EMPTY_DRAFT, word: query.trim() });
    formTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    wordInput.current?.focus({ preventScroll: true });
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

  // A new search or filter starts from the top of the list; a search that
  // finds exactly one word opens it.
  useEffect(() => {
    setVisible(PAGE);
  }, [query, lang, sort]);
  useEffect(() => {
    if (query.trim() && shown.length === 1) setOpenId(shown[0].id);
  }, [query, shown]);

  // Month headings when newest-first, letter headings when A-Z.
  const groups = useMemo(() => {
    const out: { label: string; items: BibleWord[] }[] = [];
    for (const w of shown.slice(0, visible)) {
      const label = query.trim()
        ? ""
        : sort === "az"
          ? (w.word.trim()[0] ?? "#").toUpperCase()
          : monthLabel(w.createdAt);
      const last = out[out.length - 1];
      if (last && last.label === label) last.items.push(w);
      else out.push({ label, items: [w] });
    }
    return out;
  }, [shown, visible, sort, query]);

  if (!ready) return null;

  const langName = LANG_NAME[draft.language];

  return (
    <>
      <div className="dash-pagehead">
        <div>
          <div className="eyebrow eyebrow-amber">Hebrew &amp; Greek · filled in for you</div>
          <h1 className="dash-title mt-1">Word Journal</h1>
          <div className="dash-subtitle">
            Type a word from the Bible and tap Fill it in. You get the Hebrew and Greek, what
            the lexicons say they mean, verses that use them, and a reflection for your life.
          </div>
        </div>
      </div>

      <div className="dash-grid">
        {/* ── Add / edit a word ─────────────────────────────── */}
        <div className="dash-col-5" ref={formTop} style={{ scrollMarginTop: 24 }}>
          <Panel
            eyebrow={editingId ? "Editing" : "New word"}
            title={editingId ? "Edit word" : "Add a word"}
            action={
              editingId ? (
                <button type="button" className="dash-btn dash-btn-ghost" onClick={resetForm}>
                  Cancel
                </button>
              ) : null
            }
          >
            {saved && (
              <div className="dash-word-saved" role="status">
                ✓ {saved.updated ? "Updated" : "Saved"} “{saved.word}” in your journal
              </div>
            )}

            <form onSubmit={save} className="flex flex-col gap-4">
              <div>
                <label className="dash-label" htmlFor="wj-word">
                  The word
                </label>
                <input
                  id="wj-word"
                  ref={wordInput}
                  className="dash-input dash-word-input"
                  placeholder="Type a word, e.g. Mercy"
                  value={draft.word}
                  onChange={(e) => {
                    set("word", e.target.value);
                    setSlots({}); // a different word needs a fresh lookup
                  }}
                  onKeyDown={(e) => {
                    // Enter fills it in rather than saving a half-empty entry.
                    if (e.key === "Enter" && !showDetails) {
                      e.preventDefault();
                      fill("fresh");
                    }
                  }}
                  autoComplete="off"
                  required
                />
              </div>

              <div>
                <label className="dash-label" htmlFor="wj-ref">
                  Verse · optional
                </label>
                <input
                  id="wj-ref"
                  className="dash-input"
                  placeholder="e.g. Psalm 136:1 - helps pick the right original word"
                  value={draft.reference}
                  onChange={(e) => set("reference", e.target.value)}
                />
              </div>

              <button
                type="button"
                className="dash-btn dash-btn-primary dash-word-fill-btn"
                onClick={() => fill("fresh")}
                disabled={filling || !draft.word.trim()}
              >
                {filling
                  ? "Studying the word…"
                  : showDetails
                    ? "✦ Fill it in again"
                    : "✦ Fill it in for me"}
              </button>

              {fillNote && <div className="dash-word-note">{fillNote}</div>}

              {!showDetails && !filling && (
                <div className="dash-word-hint text-center">
                  Or{" "}
                  <button
                    type="button"
                    className="underline underline-offset-2 hover:text-[var(--colour-glow)]"
                    onClick={() => setShowDetails(true)}
                  >
                    write it in yourself
                  </button>
                  .
                </div>
              )}

              {showDetails && (
                <div className="dash-word-details">
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <span className="dash-label" style={{ marginBottom: 0 }}>
                        Original word
                      </span>
                      <div className="dash-toggle" role="group" aria-label="Original language">
                        {(["hebrew", "greek"] as const).map((l) => (
                          <button
                            key={l}
                            type="button"
                            className={draft.language === l ? "is-on" : ""}
                            aria-pressed={draft.language === l}
                            onClick={() => switchLanguage(l)}
                          >
                            {LANG_NAME[l]}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="dash-word-orig-row">
                      <input
                        className="dash-input dash-word-script-input"
                        aria-label={`${langName} word`}
                        placeholder={`${langName} word`}
                        value={draft.original}
                        onChange={(e) => set("original", e.target.value)}
                        dir="auto"
                      />
                      <input
                        className="dash-input"
                        aria-label="Sounds like"
                        placeholder="Sounds like"
                        value={draft.translit}
                        onChange={(e) => set("translit", e.target.value)}
                      />
                      <input
                        className="dash-input"
                        aria-label="Strong's number"
                        placeholder="Strong's"
                        value={draft.strongs}
                        onChange={(e) => set("strongs", e.target.value)}
                      />
                    </div>
                    {alternatives.length > 0 && (
                      <div className="dash-word-alts">
                        <span>Not the right word? Try</span>
                        {alternatives.map((a) => (
                          <button
                            key={a.number}
                            type="button"
                            className="dash-word-alt"
                            onClick={() => fill("pick", { pick: a.number })}
                            disabled={filling}
                            title={a.gloss}
                          >
                            <span dir="auto">{a.original}</span> {a.translit}
                            <span className="opacity-60"> · {a.number}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="dash-label" htmlFor="wj-orig-meaning">
                      {langName} meaning
                    </label>
                    <GrowingTextarea
                      id="wj-orig-meaning"
                      className="dash-textarea dash-word-field"
                      minRows={3}
                      placeholder="Fills in when you tap Fill it in for me."
                      value={draft.originalMeaning}
                      onChange={(e) => set("originalMeaning", e.target.value)}
                    />
                    {draft.meaningSource && draft.originalMeaning && (
                      <div className="dash-word-source">Source: {draft.meaningSource}</div>
                    )}
                  </div>

                  <div>
                    <label className="dash-label" htmlFor="wj-en-meaning">
                      English meaning
                    </label>
                    <GrowingTextarea
                      id="wj-en-meaning"
                      className="dash-textarea dash-word-field"
                      placeholder="Fills in when you tap Fill it in for me."
                      value={draft.englishMeaning}
                      onChange={(e) => set("englishMeaning", e.target.value)}
                    />
                  </div>

                  {draft.keyVerses.length > 0 && (
                    <div>
                      <span className="dash-label">Key verses</span>
                      <KeyVerses
                        verses={draft.keyVerses}
                        onRemove={(i) =>
                          set(
                            "keyVerses",
                            draft.keyVerses.filter((_, j) => j !== i),
                          )
                        }
                      />
                    </div>
                  )}

                  <div>
                    <label className="dash-label" htmlFor="wj-apply">
                      For my life
                    </label>
                    <GrowingTextarea
                      id="wj-apply"
                      className="dash-textarea dash-word-field"
                      placeholder="Fills in when you tap Fill it in for me - or write your own."
                      value={draft.application}
                      onChange={(e) => set("application", e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="dash-label" htmlFor="wj-comment">
                  My comment · optional
                </label>
                <GrowingTextarea
                  id="wj-comment"
                  className="dash-textarea dash-word-field"
                  minRows={3}
                  placeholder="Your own thoughts - what struck you, a prayer, a question."
                  value={draft.comment}
                  onChange={(e) => set("comment", e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="dash-btn dash-btn-primary dash-word-fill-btn"
                disabled={!draft.word.trim() || filling}
              >
                {editingId ? "Save changes" : "Save to my journal"}
              </button>
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
                      {l === "all" ? "All" : LANG_NAME[l]}{" "}
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
              <div className="dash-word-list">
                {groups.map((g, gi) => (
                  <div key={`${g.label}-${gi}`}>
                    {g.label && <div className="dash-word-group">{g.label}</div>}
                    {g.items.map((w) => (
                      <WordRow
                        key={w.id}
                        w={w}
                        open={openId === w.id}
                        isNew={saved?.id === w.id}
                        editing={editingId === w.id}
                        onToggle={() => setOpenId((id) => (id === w.id ? null : w.id))}
                        onEdit={() => startEdit(w)}
                        onDelete={() => remove(w)}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )}

            {shown.length > visible && (
              <button
                type="button"
                className="dash-btn dash-btn-ghost dash-word-more"
                onClick={() => setVisible((v) => v + PAGE)}
              >
                Show more · {shown.length - visible} left
              </button>
            )}

            {deleted.length > 0 && (
              <div className="dash-trash">
                <button type="button" className="dash-word-link" onClick={() => setShowDeleted((v) => !v)}>
                  {showDeleted ? "Hide" : "Show"} recently deleted · {deleted.length}
                </button>
                {showDeleted &&
                  deleted.map((w) => (
                    <div key={w.id} className="dash-trash-row">
                      <span>
                        <strong>{w.word}</strong>
                        {w.translit ? ` · ${w.translit}` : ""}
                      </span>
                      <button type="button" className="dash-word-link" onClick={() => restore(w.id)}>
                        Restore
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
