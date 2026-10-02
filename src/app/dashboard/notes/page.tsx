"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Panel } from "@/components/dashboard/panel";
import { GrowingTextarea } from "@/components/dashboard/growing-textarea";
import { BOOKS } from "@/lib/dashboard/bible-books";
import {
  exportText,
  formatPassage,
  latestNote,
  matchesNote,
  parseImport,
  parsePassage,
  passageOf,
  readingOrder,
  type NoteInput,
  type Passage,
  type StudyNote,
} from "@/lib/dashboard/notes";

const API = "/api/study-notes";
const CACHE_KEY = "atg:notes:v1"; // last copy from the server, for instant load
const DRAFT_KEY = "atg:notes:draft"; // the note being written, survives reloads
const PAGE_SIZE = 120;

type Order = "latest" | "start";

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

function readStore<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeStore(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // private window / storage full - the server copy is what counts
  }
}

function toInput(page: string, passage: Passage | null, text: string): NoteInput {
  const p = page.trim() ? Number(page) : null;
  return {
    page: p != null && Number.isFinite(p) ? p : null,
    book: passage?.book ?? null,
    chapter: passage?.chapter ?? null,
    verse: passage?.verse ?? null,
    verseEnd: passage?.verseEnd ?? null,
    text: text.trim(),
  };
}

async function send<T>(method: string, body?: unknown, query = ""): Promise<T> {
  const r = await fetch(`${API}${query}`, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (r.status === 204) return undefined as T;
  const data = (await r.json().catch(() => ({}))) as T & { error?: string };
  if (!r.ok) throw new Error(data.error ?? `Request failed (${r.status})`);
  return data;
}

// Note text: "•", "-" or "*" lines become bullets; everything else keeps
// its line breaks.
function NoteText({ text }: { text: string }) {
  const blocks: { bullet: boolean; lines: string[] }[] = [];
  for (const line of text.split("\n")) {
    const bullet = /^\s*(?:[•●▪◦*]|-(?=\s))\s*/.test(line);
    const clean = line.replace(/^\s*(?:[•●▪◦*]|-(?=\s))\s*/, "");
    const last = blocks[blocks.length - 1];
    if (last && last.bullet === bullet) last.lines.push(clean);
    else blocks.push({ bullet, lines: [clean] });
  }
  return (
    <div className="dash-note-text">
      {blocks.map((b, i) =>
        b.bullet ? (
          <ul key={i}>
            {b.lines.map((l, j) => (
              <li key={j}>{l}</li>
            ))}
          </ul>
        ) : (
          <p key={i}>{b.lines.join("\n")}</p>
        ),
      )}
    </div>
  );
}

export default function StudyNotesPage() {
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [offline, setOffline] = useState<string | null>(null);

  // ── Composer ──────────────────────────────────────────────────
  const [page, setPage] = useState("");
  const [passageText, setPassageText] = useState("");
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState<string | null>(null);
  const passageInput = useRef<HTMLInputElement>(null);
  const textInput = useRef<HTMLTextAreaElement>(null);

  // ── List ──────────────────────────────────────────────────────
  const [query, setQuery] = useState("");
  const [book, setBook] = useState(0); // 0 = all books
  const [order, setOrder] = useState<Order>("latest");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [editing, setEditing] = useState<{ id: string; page: string; passage: string; text: string } | null>(null);
  const [verses, setVerses] = useState<Record<string, VerseView>>({});

  // ── Import ────────────────────────────────────────────────────
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);

  // Instant load from the last copy, then the server.
  useEffect(() => {
    setNotes(readStore<StudyNote[]>(CACHE_KEY, []));
    const draft = readStore<{ page?: string; passage?: string; text?: string }>(DRAFT_KEY, {});
    setPassageText(draft.passage ?? "");
    setText(draft.text ?? "");
    if (draft.page) setPage(draft.page);
    send<{ notes: StudyNote[] }>("GET")
      .then(({ notes: fresh }) => {
        setNotes(fresh);
        writeStore(CACHE_KEY, fresh);
        setOffline(null);
        if (!draft.page) {
          const last = latestNote(fresh);
          if (last?.page != null) setPage(String(last.page));
        }
      })
      .catch((e: Error) => setOffline(`${e.message} Showing the copy saved on this device.`))
      .finally(() => setLoaded(true));
  }, []);

  // Keep the half-written note safe across reloads.
  useEffect(() => {
    if (loaded) writeStore(DRAFT_KEY, { page, passage: passageText, text });
  }, [loaded, page, passageText, text]);

  const commit = (next: StudyNote[]) => {
    setNotes(next);
    writeStore(CACHE_KEY, next);
  };

  const last = useMemo(() => latestNote(notes), [notes]);
  const lastPassage = last ? passageOf(last) : null;
  const parsed = parsePassage(passageText, lastPassage);

  async function save(e?: React.FormEvent) {
    e?.preventDefault();
    if (!text.trim()) {
      textInput.current?.focus();
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { note } = await send<{ note: StudyNote }>("POST", { note: toInput(page, parsed, text) });
      commit([...notes, note]);
      setText("");
      setPassageText("");
      setJustSaved(note.id);
      setQuery("");
      setBook(0);
      passageInput.current?.focus();
      window.setTimeout(() => {
        document.getElementById(`note-${note.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 60);
      window.setTimeout(() => setJustSaved((id) => (id === note.id ? null : id)), 4000);
    } catch (err) {
      setError(`${err instanceof Error ? err.message : "Couldn't save."} Your note is still here - try again.`);
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit() {
    if (!editing) return;
    const original = notes.find((n) => n.id === editing.id);
    const passage = parsePassage(editing.passage, original ? passageOf(original) : null);
    try {
      const { note } = await send<{ note: StudyNote }>("PATCH", {
        id: editing.id,
        ...toInput(editing.page, passage, editing.text),
      });
      commit(notes.map((n) => (n.id === note.id ? note : n)));
      setEditing(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Couldn't save that note.");
    }
  }

  async function remove(n: StudyNote) {
    if (!confirm(`Delete this note${n.book ? ` on ${formatPassage(passageOf(n))}` : ""}? This can't be undone.`)) return;
    try {
      await send("DELETE", undefined, `?id=${encodeURIComponent(n.id)}`);
      commit(notes.filter((x) => x.id !== n.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Couldn't delete that note.");
    }
  }

  async function toggleVerse(n: StudyNote) {
    const ref = formatPassage(passageOf(n));
    if (!ref) return;
    if (verses[n.id]) {
      setVerses((v) => {
        const next = { ...v };
        delete next[n.id];
        return next;
      });
      return;
    }
    setVerses((v) => ({ ...v, [n.id]: { loading: true } }));
    try {
      const r = await fetch(`/api/verse?ref=${encodeURIComponent(ref)}`);
      const data = await r.json();
      setVerses((v) => ({
        ...v,
        [n.id]: data.error
          ? { loading: false, error: data.error }
          : { loading: false, label: `${data.reference} · ${data.translation}`, verses: data.verses },
      }));
    } catch {
      setVerses((v) => ({ ...v, [n.id]: { loading: false, error: "Couldn't load that passage." } }));
    }
  }

  const importPreview = useMemo(() => parseImport(importText), [importText]);
  async function runImport() {
    if (!importPreview.length) return;
    setImporting(true);
    try {
      const { notes: made } = await send<{ notes: StudyNote[] }>("POST", { import: importPreview });
      const next = [...notes, ...made];
      commit(next);
      setImportText("");
      setImportOpen(false);
      const lastMade = latestNote(made);
      if (lastMade?.page != null) setPage(String(lastMade.page));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Couldn't import those notes.");
    } finally {
      setImporting(false);
    }
  }

  function download() {
    const blob = new Blob([exportText(notes)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `study-notes-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // Books that have notes, in Bible order, for the filter.
  const bookCounts = useMemo(() => {
    const counts = new Map<number, number>();
    for (const n of notes) if (n.book) counts.set(n.book, (counts.get(n.book) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => a[0] - b[0]);
  }, [notes]);

  // Filter, then group by page. Within a page notes stay in the order
  // written; "Latest first" puts the most recent pages at the top.
  const filtered = useMemo(
    () => readingOrder(notes).filter((n) => (!book || n.book === book) && matchesNote(n, query)),
    [notes, book, query],
  );
  const groups = useMemo(() => {
    const out: { key: string; page: number | null; items: StudyNote[] }[] = [];
    for (const n of filtered) {
      const key = n.page != null ? `p${n.page}` : "none";
      const lastGroup = out[out.length - 1];
      if (lastGroup && lastGroup.key === key) lastGroup.items.push(n);
      else out.push({ key, page: n.page, items: [n] });
    }
    if (order === "latest") out.reverse();
    // Show at most `limit` notes, whole pages at a time.
    const shown: typeof out = [];
    let count = 0;
    for (const g of out) {
      if (count >= limit) break;
      shown.push(g);
      count += g.items.length;
    }
    return { shown, hidden: Math.max(0, filtered.length - count) };
  }, [filtered, order, limit]);

  useEffect(() => setLimit(PAGE_SIZE), [query, book, order]);

  const pageRange = (items: StudyNote[]) => {
    const passages = items.map(passageOf).filter((p): p is Passage => Boolean(p));
    if (!passages.length) return "";
    const first = passages[0];
    const lastP = passages[passages.length - 1];
    const name = (p: Passage) => `${BOOKS[p.book - 1] === "Psalms" ? "Psalm" : BOOKS[p.book - 1]} ${p.chapter}`;
    return name(first) === name(lastP) ? name(first) : `${name(first)} – ${name(lastP)}`;
  };

  return (
    <>
      <div className="dash-pagehead">
        <div>
          <div className="eyebrow eyebrow-amber">Chronological Bible · in reading order</div>
          <h1 className="dash-title mt-1">Study Notes</h1>
          <div className="dash-subtitle">
            {notes.length
              ? `${notes.length} ${notes.length === 1 ? "note" : "notes"}${
                  last ? ` · latest: ${last.page != null ? `page ${last.page}, ` : ""}${formatPassage(lastPassage) || "no passage"}` : ""
                }`
              : "Write as you read. Every note is kept in order by page, and you can search them all."}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button type="button" className="dash-btn dash-btn-ghost" onClick={() => setImportOpen((v) => !v)}>
            {importOpen ? "Close import" : "Paste in notes"}
          </button>
          {notes.length > 0 && (
            <button type="button" className="dash-btn dash-btn-ghost" onClick={download}>
              Download
            </button>
          )}
        </div>
      </div>

      {offline && <div className="dash-word-note mb-4">{offline}</div>}

      <div className="dash-grid">
        {importOpen && (
          <div className="dash-col-12">
            <Panel eyebrow="Bring your notes across" title="Paste in notes">
              <p className="text-[13px] text-[var(--colour-ink-soft)] leading-relaxed mb-3">
                Paste straight from your Google Doc. Lines like{" "}
                <code>1257 - Matt 2 vs 7 - …</code> start a note on that page and verse,{" "}
                <code>Vs 12 - …</code> carries on in the same chapter, and bullet points join the
                note above them.
              </p>
              <GrowingTextarea
                className="dash-textarea dash-word-field"
                minRows={8}
                placeholder={"1257 - Matt 2 vs 7 - Herod says he wants to go worship Jesus...\nVs 12 - Magi warned in a dream...\n• Do I listen and go when I am told?"}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
              />
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                <button
                  type="button"
                  className="dash-btn dash-btn-primary"
                  onClick={runImport}
                  disabled={!importPreview.length || importing}
                >
                  {importing ? "Importing…" : `Import ${importPreview.length || ""} ${importPreview.length === 1 ? "note" : "notes"}`}
                </button>
                {importPreview.length > 0 && (
                  <span className="text-[12.5px] text-[var(--colour-ink-quiet)]">
                    First: {importPreview[0].page != null ? `page ${importPreview[0].page}, ` : ""}
                    {formatPassage(passageOf(importPreview[0])) || "no passage"} · Last:{" "}
                    {importPreview[importPreview.length - 1].page != null
                      ? `page ${importPreview[importPreview.length - 1].page}, `
                      : ""}
                    {formatPassage(passageOf(importPreview[importPreview.length - 1])) || "no passage"}
                  </span>
                )}
              </div>
            </Panel>
          </div>
        )}

        {/* ── Write a note ───────────────────────────────────────── */}
        <div className="dash-col-12">
          <Panel eyebrow="New note" title="Write as you read">
            <form onSubmit={save} className="flex flex-col gap-3">
              <div className="dash-note-where">
                <div>
                  <label className="dash-label" htmlFor="sn-page">
                    Page
                  </label>
                  <input
                    id="sn-page"
                    className="dash-input"
                    inputMode="numeric"
                    placeholder="1257"
                    value={page}
                    onChange={(e) => setPage(e.target.value.replace(/[^\d]/g, ""))}
                  />
                </div>
                <div>
                  <label className="dash-label" htmlFor="sn-passage">
                    Passage
                  </label>
                  <input
                    id="sn-passage"
                    ref={passageInput}
                    className="dash-input"
                    placeholder={lastPassage ? `vs 14 - or e.g. Luke 2:1` : "e.g. Matt 2 vs 7"}
                    value={passageText}
                    onChange={(e) => setPassageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        textInput.current?.focus();
                      }
                    }}
                    autoComplete="off"
                  />
                </div>
                <div className="dash-note-parsed">
                  {passageText.trim()
                    ? parsed
                      ? `→ ${formatPassage(parsed)}`
                      : "Couldn't read that passage - it'll save without one."
                    : lastPassage
                      ? `Type a verse number to carry on in ${formatPassage({ ...lastPassage, verse: null, verseEnd: null })}.`
                      : ""}
                </div>
              </div>
              <GrowingTextarea
                ref={textInput}
                id="sn-text"
                className="dash-textarea dash-word-field"
                minRows={3}
                placeholder={"What did you see? Start a line with \"-\" or \"•\" for a question or point."}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save();
                }}
                aria-label="Note"
              />
              <div className="flex items-center gap-3 flex-wrap">
                <button type="submit" className="dash-btn dash-btn-primary" disabled={saving || !text.trim()}>
                  {saving ? "Saving…" : "Save note"}
                </button>
                <span className="text-[11.5px] text-[var(--colour-ink-faint)]">⌘ / Ctrl + Enter to save</span>
                {error && <span className="text-[12.5px] text-[#f1a07d]">{error}</span>}
              </div>
            </form>
          </Panel>
        </div>

        {/* ── All notes ──────────────────────────────────────────── */}
        <div className="dash-col-12">
          <Panel
            eyebrow="Your notes"
            title={query || book ? `${filtered.length} of ${notes.length}` : `${notes.length} ${notes.length === 1 ? "note" : "notes"}`}
            action={
              notes.length > 1 ? (
                <div className="dash-toggle" role="group" aria-label="Order">
                  <button type="button" className={order === "latest" ? "is-on" : ""} onClick={() => setOrder("latest")}>
                    Latest first
                  </button>
                  <button type="button" className={order === "start" ? "is-on" : ""} onClick={() => setOrder("start")}>
                    From the start
                  </button>
                </div>
              ) : null
            }
          >
            {notes.length > 0 && (
              <div className="dash-word-tools">
                <input
                  type="search"
                  className="dash-input"
                  placeholder="Search - a word, a page, or a passage like Matt 2"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Search your notes"
                />
                {bookCounts.length > 1 && (
                  <select
                    className="dash-select dash-note-book"
                    value={book}
                    onChange={(e) => setBook(Number(e.target.value))}
                    aria-label="Filter by book"
                  >
                    <option value={0}>All books</option>
                    {bookCounts.map(([b, c]) => (
                      <option key={b} value={b}>
                        {BOOKS[b - 1]} · {c}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {loaded && notes.length === 0 && (
              <div className="dash-empty">
                No notes yet. Write your first one above, or paste in the notes you already have.
              </div>
            )}
            {notes.length > 0 && filtered.length === 0 && (
              <div className="dash-empty">Nothing matches “{query.trim() || BOOKS[book - 1]}”.</div>
            )}

            <div className="dash-note-list">
              {groups.shown.map((g) => (
                <section key={g.key} className="dash-note-page">
                  <header className="dash-note-page-head">
                    <span className="dash-note-page-num">{g.page != null ? `Page ${g.page}` : "No page"}</span>
                    <span className="dash-note-page-range">{pageRange(g.items)}</span>
                  </header>
                  {g.items.map((n) => {
                    const p = passageOf(n);
                    const v = verses[n.id];
                    const isEditing = editing?.id === n.id;
                    return (
                      <article
                        key={n.id}
                        id={`note-${n.id}`}
                        className={`dash-note ${justSaved === n.id ? "is-new" : ""}`}
                      >
                        <div className="dash-note-ref">
                          {p ? (
                            <button type="button" onClick={() => toggleVerse(n)} title="Read the passage">
                              {formatPassage(p)}
                            </button>
                          ) : (
                            <span className="opacity-50">-</span>
                          )}
                        </div>
                        <div className="dash-note-body">
                          {isEditing ? (
                            <div className="flex flex-col gap-2">
                              <div className="dash-note-where">
                                <input
                                  className="dash-input"
                                  inputMode="numeric"
                                  aria-label="Page"
                                  placeholder="Page"
                                  value={editing.page}
                                  onChange={(e) => setEditing({ ...editing, page: e.target.value.replace(/[^\d]/g, "") })}
                                />
                                <input
                                  className="dash-input"
                                  aria-label="Passage"
                                  placeholder="Passage"
                                  value={editing.passage}
                                  onChange={(e) => setEditing({ ...editing, passage: e.target.value })}
                                />
                              </div>
                              <GrowingTextarea
                                className="dash-textarea dash-word-field"
                                value={editing.text}
                                onChange={(e) => setEditing({ ...editing, text: e.target.value })}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) saveEdit();
                                  if (e.key === "Escape") setEditing(null);
                                }}
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <button type="button" className="dash-btn dash-btn-primary" onClick={saveEdit}>
                                  Save
                                </button>
                                <button type="button" className="dash-btn dash-btn-ghost" onClick={() => setEditing(null)}>
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <NoteText text={n.text} />
                          )}
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
                        </div>
                        {!isEditing && (
                          <div className="dash-note-actions">
                            <button
                              type="button"
                              className="dash-word-link"
                              onClick={() =>
                                setEditing({
                                  id: n.id,
                                  page: n.page != null ? String(n.page) : "",
                                  passage: formatPassage(p),
                                  text: n.text,
                                })
                              }
                            >
                              Edit
                            </button>
                            <button type="button" className="dash-word-link is-danger" onClick={() => remove(n)}>
                              Delete
                            </button>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </section>
              ))}
            </div>

            {groups.hidden > 0 && (
              <button
                type="button"
                className="dash-btn dash-btn-ghost dash-word-more"
                onClick={() => setLimit((l) => l + PAGE_SIZE)}
              >
                Show more · {groups.hidden} {order === "latest" ? "earlier" : "later"} notes
              </button>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
