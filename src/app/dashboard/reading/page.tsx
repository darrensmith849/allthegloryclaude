"use client";

// Reading - Daniel's private book notes (owner only: not the team, never
// members). His books along the top; for the open book, its chapters on the
// left (ticked off as he reads) and the chapter on the right: a key takeaway,
// the chapter's own headings, and notes saved one by one like Study Notes,
// each optionally tied to a heading. The Personal MBA comes ready with its
// chapters and headings (src/lib/dashboard/reading-seed.ts). Saved to D1
// (/api/reading, /api/reading-notes); nothing is ever removed.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FoldPanel } from "@/components/dashboard/fold-panel";
import { GrowingTextarea } from "@/components/dashboard/growing-textarea";
import { Panel } from "@/components/dashboard/panel";
import type { Book, BookChapter, BookNote } from "@/lib/dashboard/reading";

const WHOLE = "__whole__"; // the "whole book" notes, not tied to a chapter

async function call<T>(path: string, method: string, body?: unknown, query = ""): Promise<T> {
  const r = await fetch(`${path}${query}`, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const data = (await r.json().catch(() => ({}))) as T & { error?: string };
  if (!r.ok) throw new Error(data.error ?? "Something went wrong.");
  return data;
}
const shout = (e: unknown) => window.setTimeout(() => window.alert(e instanceof Error ? e.message : "Something went wrong."), 0);
const store = {
  get: (k: string) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k: string, v: string | null) => {
    try {
      if (v) localStorage.setItem(k, v);
      else localStorage.removeItem(k);
    } catch {
      /* storage blocked */
    }
  },
};

export default function ReadingPage() {
  const [books, setBooks] = useState<Book[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bookId, setBookId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    call<{ books: Book[] }>("/api/reading", "GET")
      .then((d) => {
        setBooks(d.books);
        const want = store.get("atg:reading-book");
        const pick = d.books.find((b) => b.id === want && !b.deletedAt) ?? d.books.find((b) => !b.deletedAt);
        if (pick) setBookId(pick.id);
      })
      .catch((e: Error) => setError(e.message));
  }, []);
  useEffect(() => {
    if (bookId) store.set("atg:reading-book", bookId);
  }, [bookId]);

  const replace = useCallback((b: Book) => setBooks((list) => (list ?? []).map((x) => (x.id === b.id ? b : x))), []);
  const live = useMemo(() => (books ?? []).filter((b) => !b.deletedAt), [books]);
  const deleted = useMemo(() => (books ?? []).filter((b) => b.deletedAt), [books]);
  const open = live.find((b) => b.id === bookId) ?? null;

  async function addBook() {
    const title = window.prompt("Book title?")?.trim();
    if (!title) return;
    const author = window.prompt("Author?")?.trim() ?? "";
    setAdding(true);
    try {
      const { book } = await call<{ book: Book }>("/api/reading", "POST", { kind: "book", title, author });
      setBooks((list) => [book, ...(list ?? [])]);
      setBookId(book.id);
    } catch (e) {
      shout(e);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div>
      <div className="dash-pagehead">
        <div>
          <div className="eyebrow eyebrow-amber">Just for you</div>
          <h1 className="dash-title mt-1">Reading</h1>
          <div className="dash-subtitle">The books you&apos;re reading - a takeaway and notes for every chapter, as you go.</div>
        </div>
        <button type="button" className="dash-btn dash-btn-primary" onClick={addBook} disabled={adding || !books}>
          {adding ? "Adding…" : "+ Add a book"}
        </button>
      </div>
      {error && <p className="dash-word-hint">{error}</p>}

      <div className="flex flex-col gap-[18px]">
        <FoldPanel id="reading-books" title="Your books" eyebrow={books ? `${live.length} ${live.length === 1 ? "book" : "books"}` : "Loading"}>
          <div className="reading-books">
            {live.map((b) => {
              const chapters = b.chapters.filter((c) => !c.deletedAt && c.kind === "chapter");
              const read = chapters.filter((c) => c.readAt).length;
              return (
                <button key={b.id} type="button" className={`reading-book ${b.id === bookId ? "is-open" : ""}`} onClick={() => setBookId(b.id)}>
                  <span className="reading-book-title">{b.title || "Untitled book"}</span>
                  <span className="reading-book-meta">{b.author}</span>
                  <span className="reading-bar"><span style={{ width: `${chapters.length ? (read / chapters.length) * 100 : 0}%` }} /></span>
                  <span className="reading-book-meta">
                    {read} of {chapters.length} chapters read · {b.notes.filter((n) => !n.deletedAt).length} notes
                  </span>
                </button>
              );
            })}
          </div>
          {deleted.length > 0 && (
            <div className="mt-3 text-[13px]">
              <span className="dash-word-hint">Recently deleted: </span>
              {deleted.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  className="dash-word-link mr-3"
                  onClick={async () => {
                    try {
                      replace((await call<{ book: Book }>("/api/reading", "PATCH", { kind: "book", id: b.id, restore: true })).book);
                    } catch (e) {
                      shout(e);
                    }
                  }}
                >
                  Restore {b.title}
                </button>
              ))}
            </div>
          )}
        </FoldPanel>

        {open ? (
          <BookView
            key={open.id}
            book={open}
            onChange={replace}
            onDeleted={(b) => {
              replace(b);
              setBookId(live.find((x) => x.id !== b.id)?.id ?? null);
            }}
          />
        ) : (
          <Panel>
            <p className="dash-word-hint">{books ? "Add a book to start." : "Loading your books…"}</p>
          </Panel>
        )}
      </div>
    </div>
  );
}

/* ───────── One book: chapters on the left, the open chapter on the right ───────── */
function BookView({ book, onChange, onDeleted }: { book: Book; onChange: (b: Book) => void; onDeleted: (b: Book) => void }) {
  const chapters = book.chapters.filter((c) => !c.deletedAt);
  const chapterKey = `atg:reading-chapter:${book.id}`;
  const [chapterId, setChapterId] = useState<string>(() => {
    const want = typeof window === "undefined" ? null : store.get(chapterKey);
    return want && (want === WHOLE || chapters.some((c) => c.id === want)) ? want : (chapters.find((c) => c.kind === "chapter")?.id ?? WHOLE);
  });
  useEffect(() => store.set(chapterKey, chapterId), [chapterKey, chapterId]);
  const [newChapter, setNewChapter] = useState("");

  const notes = book.notes;
  const count = (id: string | null) => notes.filter((n) => !n.deletedAt && n.chapterId === id).length;
  const numbered = chapters.filter((c) => c.kind === "chapter");
  const read = numbered.filter((c) => c.readAt).length;
  const chapter = chapters.find((c) => c.id === chapterId) ?? null;
  const index = chapters.findIndex((c) => c.id === chapterId);

  const go = (id: string) => {
    setChapterId(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  async function patchBook(fields: Record<string, unknown>) {
    try {
      onChange((await call<{ book: Book }>("/api/reading", "PATCH", { kind: "book", id: book.id, ...fields })).book);
    } catch (e) {
      shout(e);
    }
  }

  return (
    <div className="reading-layout">
      <div className="reading-left">
        <Panel
          eyebrow={`${read} of ${numbered.length} chapters read`}
          action={
            <button
              type="button"
              className="dash-word-link is-danger"
              onClick={async () => {
                if (!window.confirm(`Move "${book.title}" to recently deleted? You can restore it any time.`)) return;
                try {
                  onDeleted((await call<{ book: Book }>("/api/reading", "DELETE", undefined, `?kind=book&id=${encodeURIComponent(book.id)}`)).book);
                } catch (e) {
                  shout(e);
                }
              }}
            >
              Remove
            </button>
          }
        >
          <DebouncedInput className="reading-title-input" value={book.title} placeholder="Book title" onSave={(v) => patchBook({ title: v })} />
          <DebouncedInput className="reading-author-input" value={book.author} placeholder="Author" onSave={(v) => patchBook({ author: v })} />
          <span className="reading-bar mt-3"><span style={{ width: `${numbered.length ? (read / numbered.length) * 100 : 0}%` }} /></span>

          <nav className="reading-chapters" aria-label="Chapters">
            <button type="button" className={`reading-ch ${chapterId === WHOLE ? "is-open" : ""}`} onClick={() => go(WHOLE)}>
              <span className="reading-ch-n">✦</span>
              <span className="reading-ch-t">The whole book</span>
              {count(null) > 0 && <span className="reading-ch-c">{count(null)}</span>}
            </button>
            {chapters.map((c) => {
              const n = c.kind === "chapter" ? numbered.indexOf(c) + 1 : null;
              return (
                <button key={c.id} type="button" className={`reading-ch ${c.id === chapterId ? "is-open" : ""} ${c.readAt ? "is-read" : ""}`} onClick={() => go(c.id)}>
                  <span className="reading-ch-n">{c.readAt ? "✓" : (n ?? "·")}</span>
                  <span className="reading-ch-t">{c.title}</span>
                  {count(c.id) > 0 && <span className="reading-ch-c">{count(c.id)}</span>}
                </button>
              );
            })}
          </nav>
          <form
            className="dash-bible-form mt-3"
            onSubmit={async (e) => {
              e.preventDefault();
              const title = newChapter.trim();
              if (!title) return;
              try {
                onChange((await call<{ book: Book }>("/api/reading", "POST", { kind: "chapter", bookId: book.id, title })).book);
                setNewChapter("");
              } catch (err) {
                shout(err);
              }
            }}
          >
            <input className="dash-input" placeholder="Add a chapter…" value={newChapter} onChange={(e) => setNewChapter(e.target.value)} aria-label="Add a chapter" />
            <button type="submit" className="dash-btn" disabled={!newChapter.trim()}>Add</button>
          </form>
        </Panel>
      </div>

      <div className="reading-right">
        {chapterId === WHOLE ? (
          <>
            <Panel eyebrow={book.author || "Book"} title="The whole book">
              <p className="dash-word-hint">Notes about the book as a whole - what it&apos;s about, what you want from it, what you&apos;ll do differently.</p>
            </Panel>
            <ChapterNotes key="whole" bookId={book.id} chapterId={null} headings={[]} notes={notes} onChange={(list) => onChange({ ...book, notes: list })} />
          </>
        ) : chapter ? (
          <ChapterView
            key={chapter.id}
            book={book}
            chapter={chapter}
            number={chapter.kind === "chapter" ? numbered.indexOf(chapter) + 1 : null}
            total={numbered.length}
            prev={index > 0 ? chapters[index - 1] : null}
            next={index >= 0 && index < chapters.length - 1 ? chapters[index + 1] : null}
            onGo={go}
            onChange={onChange}
          />
        ) : null}
      </div>
    </div>
  );
}

/* ───────── One chapter: takeaway, read tick, headings, notes ───────── */
function ChapterView({
  book,
  chapter,
  number,
  total,
  prev,
  next,
  onGo,
  onChange,
}: {
  book: Book;
  chapter: BookChapter;
  number: number | null;
  total: number;
  prev: BookChapter | null;
  next: BookChapter | null;
  onGo: (id: string) => void;
  onChange: (b: Book) => void;
}) {
  const [heading, setHeading] = useState<string>("");
  const [newHeading, setNewHeading] = useState("");
  const notesWith = useMemo(() => {
    const m = new Map<string, number>();
    for (const n of book.notes) if (!n.deletedAt && n.chapterId === chapter.id && n.heading) m.set(n.heading, (m.get(n.heading) ?? 0) + 1);
    return m;
  }, [book.notes, chapter.id]);

  async function patch(fields: Record<string, unknown>) {
    try {
      onChange((await call<{ book: Book }>("/api/reading", "PATCH", { kind: "chapter", id: chapter.id, ...fields })).book);
    } catch (e) {
      shout(e);
    }
  }

  return (
    <>
      <Panel
        eyebrow={number ? `Chapter ${number} of ${total}` : "Before chapter 1"}
        action={
          <label className="reading-read">
            <input type="checkbox" checked={Boolean(chapter.readAt)} onChange={(e) => patch({ read: e.target.checked })} />
            <span>{chapter.readAt ? "Read ✓" : "Mark as read"}</span>
          </label>
        }
      >
        <h2 className="reading-ch-title">{chapter.title}</h2>
        <label className="sermon-field mt-3">
          <span className="dash-label">Key takeaway</span>
          <DebouncedInput
            multiline
            className="dash-textarea reading-takeaway"
            value={chapter.takeaway}
            placeholder="The one thing to remember from this chapter…"
            onSave={(v) => patch({ takeaway: v })}
          />
        </label>
        <div className="reading-nav">
          {prev ? (
            <button type="button" className="dash-word-link" onClick={() => onGo(prev.id)}>
              ← {prev.title}
            </button>
          ) : (
            <span />
          )}
          {next && (
            <button type="button" className="dash-word-link" onClick={() => onGo(next.id)}>
              {next.title} →
            </button>
          )}
        </div>
      </Panel>

      {(chapter.headings.length > 0 || chapter.kind === "chapter") && (
        <FoldPanel id="reading-headings" title="Headings in this chapter" eyebrow={`${chapter.headings.length} headings · tap one to write about it`}>
          <div className="reading-heads">
            {chapter.headings.map((h) => (
              <button
                key={h}
                type="button"
                className={`reading-head ${heading === h ? "is-on" : ""} ${notesWith.has(h) ? "has-notes" : ""}`}
                onClick={() => {
                  setHeading(heading === h ? "" : h);
                  window.setTimeout(() => document.getElementById("reading-write")?.focus(), 30);
                }}
                title={notesWith.has(h) ? `${notesWith.get(h)} note(s)` : "Write a note about this"}
              >
                {h}
                {notesWith.has(h) && <span className="reading-head-dot" aria-hidden />}
              </button>
            ))}
          </div>
          <form
            className="dash-bible-form mt-3"
            onSubmit={(e) => {
              e.preventDefault();
              const h = newHeading.trim();
              if (!h || chapter.headings.includes(h)) return;
              void patch({ headings: [...chapter.headings, h] });
              setNewHeading("");
            }}
          >
            <input className="dash-input" placeholder="Add your own heading…" value={newHeading} onChange={(e) => setNewHeading(e.target.value)} aria-label="Add a heading" />
            <button type="submit" className="dash-btn" disabled={!newHeading.trim()}>Add</button>
          </form>
        </FoldPanel>
      )}

      <ChapterNotes
        bookId={book.id}
        chapterId={chapter.id}
        headings={chapter.headings}
        heading={heading}
        onHeading={setHeading}
        notes={book.notes}
        onChange={(list) => onChange({ ...book, notes: list })}
      />
    </>
  );
}

/* ───────── Notes, saved one by one (like Study Notes and Sermons) ───────── */
function ChapterNotes({
  bookId,
  chapterId,
  headings,
  heading = "",
  onHeading,
  notes: allNotes,
  onChange,
}: {
  bookId: string;
  chapterId: string | null;
  headings: string[];
  heading?: string;
  onHeading?: (h: string) => void;
  notes: BookNote[];
  onChange: (notes: BookNote[]) => void;
}) {
  const draftKey = `atg:reading-draft:${bookId}:${chapterId ?? WHOLE}`;
  const [draft, setDraftText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string; text: string; heading: string } | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [filter, setFilter] = useState(false);
  const box = useRef<HTMLTextAreaElement>(null);
  const all = useRef(allNotes);
  all.current = allNotes;

  useEffect(() => setDraftText(store.get(draftKey) ?? ""), [draftKey]);
  const setDraft = (t: string) => {
    setDraftText(t);
    if (err) setErr(null);
    store.set(draftKey, t || null);
  };
  const put = (n: BookNote) => {
    const list = all.current;
    onChange(list.some((x) => x.id === n.id) ? list.map((x) => (x.id === n.id ? n : x)) : [...list, n]);
  };
  const noteApi = (method: string, body?: unknown, q = "") => call<{ note: BookNote }>("/api/reading-notes", method, body, q).then((d) => d.note);

  async function saveNew() {
    const text = draft.trim();
    if (!text || busy) return;
    setBusy(true);
    setErr(null);
    try {
      const note = await noteApi("POST", { bookId, chapterId, heading: heading || null, text });
      put(note);
      setDraft("");
      setFlash(note.id);
      window.setTimeout(() => setFlash(null), 2500);
      box.current?.focus();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't save that note.");
    } finally {
      setBusy(false);
    }
  }

  const mine = allNotes.filter((n) => n.chapterId === chapterId);
  const live = mine.filter((n) => !n.deletedAt && (!filter || !heading || n.heading === heading));
  const deleted = mine.filter((n) => n.deletedAt);
  const when = (ms: number) => new Date(ms).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <FoldPanel id="reading-notes" title="My notes" eyebrow={`${mine.filter((n) => !n.deletedAt).length} notes`} forceOpen={Boolean(editing)}>
      {heading && (
        <div className="reading-filter">
          <span>
            Writing about <strong>{heading}</strong>
          </span>
          <button type="button" className="dash-word-link" onClick={() => setFilter((f) => !f)}>
            {filter ? "Show all notes" : "Only show notes on this"}
          </button>
          <button type="button" className="dash-word-link" onClick={() => onHeading?.("")}>
            Clear
          </button>
        </div>
      )}
      {live.length > 0 && (
        <div className="dash-note-list">
          {live.map((n) => (
            <article key={n.id} className={`dash-note is-open ${flash === n.id ? "is-new" : ""}`}>
              <div className="dash-note-open">
                {editing?.id === n.id ? (
                  <div className="flex flex-col gap-2">
                    {headings.length > 0 && (
                      <select className="dash-input" value={editing.heading} onChange={(e) => setEditing({ ...editing, heading: e.target.value })} aria-label="Heading">
                        <option value="">No heading</option>
                        {headings.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    )}
                    <GrowingTextarea
                      className="dash-textarea dash-word-field"
                      minRows={4}
                      autoFocus
                      value={editing.text}
                      onChange={(e) => setEditing({ ...editing, text: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setEditing(null);
                      }}
                      aria-label="Edit note"
                    />
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className="dash-btn dash-btn-primary"
                        disabled={!editing.text.trim()}
                        onClick={async () => {
                          try {
                            put(await noteApi("PATCH", { id: n.id, text: editing.text, heading: editing.heading || null }));
                            setEditing(null);
                          } catch (e) {
                            shout(e);
                          }
                        }}
                      >
                        Save
                      </button>
                      <button type="button" className="dash-word-link" onClick={() => setEditing(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    {n.heading && <div className="reading-note-head">{n.heading}</div>}
                    <div className="sermon-note-text">{n.text}</div>
                    <div className="dash-note-actions">
                      <span className="reading-note-when">{when(n.createdAt)}</span>
                      <button type="button" className="dash-word-link" onClick={() => setEditing({ id: n.id, text: n.text, heading: n.heading ?? "" })}>Edit</button>
                      <button
                        type="button"
                        className="dash-word-link is-danger"
                        onClick={async () => {
                          try {
                            put(await noteApi("DELETE", undefined, `?id=${encodeURIComponent(n.id)}`));
                          } catch (e) {
                            shout(e);
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <div className={`dash-note-write ${live.length ? "mt-4" : ""}`}>
        <div className="reading-write-head">
          <label className="dash-label" htmlFor="reading-write">{live.length ? "New note" : "Write your first note"}</label>
          {headings.length > 0 && (
            <select className="dash-input reading-write-select" value={heading} onChange={(e) => onHeading?.(e.target.value)} aria-label="Heading for this note">
              <option value="">No heading</option>
              {headings.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          )}
        </div>
        <GrowingTextarea
          id="reading-write"
          ref={box}
          className="dash-textarea dash-word-field"
          minRows={5}
          placeholder={heading ? `What stood out to you about ${heading}?` : "What stood out, what you'll use, a question…"}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void saveNew();
          }}
        />
        <div className="flex items-center gap-3 flex-wrap mt-3">
          <button type="button" className="dash-btn dash-btn-primary" onClick={() => void saveNew()} disabled={busy || !draft.trim()}>
            {busy ? "Saving…" : "Save note"}
          </button>
          <span className="dash-word-hint">⌘ + Enter saves · a fresh box opens for the next note</span>
        </div>
        {err && <p className="dash-word-hint mt-2">{err}</p>}
      </div>

      {deleted.length > 0 && (
        <div className="mt-4">
          <button type="button" className="dash-word-link" onClick={() => setShowDeleted((v) => !v)}>
            {showDeleted ? "Hide" : "Show"} recently deleted notes · {deleted.length}
          </button>
          {showDeleted &&
            deleted.map((n) => (
              <div key={n.id} className="sermon-deleted">
                <span className="truncate">{n.text.replace(/\s+/g, " ").slice(0, 90)}</span>
                <button
                  type="button"
                  className="dash-word-link"
                  onClick={async () => {
                    try {
                      put(await noteApi("PATCH", { id: n.id, restore: true }));
                    } catch (e) {
                      shout(e);
                    }
                  }}
                >
                  Restore
                </button>
              </div>
            ))}
        </div>
      )}
    </FoldPanel>
  );
}

/* An input that saves a moment after you stop typing (and when you leave it). */
function DebouncedInput({
  value,
  onSave,
  multiline = false,
  className,
  placeholder,
}: {
  value: string;
  onSave: (v: string) => void;
  multiline?: boolean;
  className?: string;
  placeholder?: string;
}) {
  const [v, setV] = useState(value);
  const t = useRef<number | null>(null);
  const saved = useRef(value);
  const flush = (next: string) => {
    if (t.current) window.clearTimeout(t.current);
    t.current = null;
    if (next !== saved.current) {
      saved.current = next;
      onSave(next);
    }
  };
  const latest = useRef(value);
  // Leaving this chapter mid-typing still saves what was typed.
  useEffect(() => () => flush(latest.current), []); // eslint-disable-line react-hooks/exhaustive-deps
  const change = (next: string) => {
    latest.current = next;
    setV(next);
    if (t.current) window.clearTimeout(t.current);
    t.current = window.setTimeout(() => flush(next), 900);
  };
  return multiline ? (
    <GrowingTextarea className={className} minRows={2} value={v} placeholder={placeholder} onChange={(e) => change(e.target.value)} onBlur={() => flush(v)} />
  ) : (
    <input className={className} value={v} placeholder={placeholder} onChange={(e) => change(e.target.value)} onBlur={() => flush(v)} />
  );
}
