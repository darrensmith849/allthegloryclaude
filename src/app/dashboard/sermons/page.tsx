"use client";

// Sermons - Daniel's own sermon notes (owner only: not the team, never
// members). Each sermon keeps its YouTube link (played right here), its name,
// who preached it and when he listened, his notes, and the verses and words
// he looked up and saved while listening. Notes are saved one by one like
// Study Notes (not tied to reading days); details save to D1 as he types
// (/api/sermons); nothing is ever removed - a deleted sermon waits in
// "Recently deleted" and earlier versions are kept.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FoldPanel } from "@/components/dashboard/fold-panel";
import { GrowingTextarea } from "@/components/dashboard/growing-textarea";
import { Panel } from "@/components/dashboard/panel";
import { BibleLookup } from "@/components/study/bible-lookup";
import { DayVideo } from "@/components/study/day-video";
import { DictionaryMeaning } from "@/components/study/dictionary-meaning";
import type { Sermon, SermonItem, SermonNote } from "@/lib/dashboard/sermons";
import { parseYouTube, watchUrl } from "@/lib/study/youtube";
import type { LanguageFill, WordFill } from "@/lib/dashboard/words";

type Draft = Pick<Sermon, "title" | "preacher" | "url" | "listenedOn">;
type SaveState = "idle" | "saving" | "saved" | "error";

const uid = () => `i_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const niceDate = (d: string | null) =>
  d ? new Date(`${d}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";

async function api<T>(method: string, body?: unknown, query = ""): Promise<T> {
  const r = await fetch(`/api/sermons${query}`, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const data = (await r.json().catch(() => ({}))) as T & { error?: string };
  if (!r.ok) throw new Error(data.error ?? "Something went wrong.");
  return data;
}

export default function SermonsPage() {
  const [sermons, setSermons] = useState<Sermon[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    api<{ sermons: Sermon[] }>("GET")
      .then((d) => {
        setSermons(d.sermons);
        // Reopen the sermon you were on (?s= in the address, or last time on this device).
        let want: string | null = null;
        try {
          want = new URLSearchParams(window.location.search).get("s") ?? localStorage.getItem("atg:sermon-open");
        } catch {
          /* storage blocked */
        }
        const pick = d.sermons.find((s) => s.id === want && !s.deletedAt) ?? d.sermons.find((s) => !s.deletedAt);
        if (pick) setOpenId(pick.id);
      })
      .catch((e: Error) => setLoadError(e.message));
  }, []);

  // Remember the open sermon, so a refresh comes back to it.
  useEffect(() => {
    if (!openId) return;
    try {
      localStorage.setItem("atg:sermon-open", openId);
      const url = new URL(window.location.href);
      url.searchParams.set("s", openId);
      window.history.replaceState(window.history.state, "", url);
    } catch {
      /* storage blocked */
    }
  }, [openId]);

  const replace = useCallback((s: Sermon) => setSermons((list) => (list ?? []).map((x) => (x.id === s.id ? s : x))), []);

  async function addSermon() {
    setAdding(true);
    try {
      const { sermon } = await api<{ sermon: Sermon }>("POST", {});
      setSermons((list) => [sermon, ...(list ?? [])]);
      setOpenId(sermon.id);
      setQuery("");
      window.setTimeout(() => document.getElementById("sermon-title")?.focus(), 60);
    } catch (e) {
      alertLater(e);
    } finally {
      setAdding(false);
    }
  }

  const live = useMemo(() => (sermons ?? []).filter((s) => !s.deletedAt), [sermons]);
  const deleted = useMemo(() => (sermons ?? []).filter((s) => s.deletedAt), [sermons]);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return live;
    return live.filter((s) =>
      [
        s.title,
        s.preacher,
        ...s.noteList.filter((n) => !n.deletedAt).map((n) => n.text),
        ...s.items.map((i) => `${i.ref ?? ""} ${i.word ?? ""} ${i.text ?? ""}`),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [live, query]);
  const open = (sermons ?? []).find((s) => s.id === openId) ?? null;

  return (
    <div>
      <div className="dash-pagehead">
        <div>
          <div className="eyebrow eyebrow-amber">Just for you</div>
          <h1 className="dash-title mt-1">Sermons</h1>
          <div className="dash-subtitle">
            The sermons you listen to - the video, your notes, and the verses and words that stood out.
          </div>
        </div>
        <button type="button" className="dash-btn dash-btn-primary" onClick={addSermon} disabled={adding || !sermons}>
          {adding ? "Adding…" : "+ New sermon"}
        </button>
      </div>

      {loadError && <p className="dash-word-hint">{loadError}</p>}

      <div className="flex flex-col gap-[18px]">
        <div>
          <FoldPanel id="sermon-list" title="Your sermons" eyebrow={sermons ? `${live.length} saved` : "Loading"}>
            <input
              className="dash-input sermon-search"
              type="search"
              placeholder="Search names, notes, verses…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search your sermons"
            />
            <div className="sermon-list">
              {sermons && live.length === 0 && (
                <p className="dash-word-hint mt-3">No sermons yet. Tap “+ New sermon” and paste a YouTube link to start.</p>
              )}
              {sermons && live.length > 0 && shown.length === 0 && <p className="dash-word-hint mt-3">Nothing matches that.</p>}
              {shown.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`sermon-row ${s.id === openId ? "is-open" : ""}`}
                  onClick={() => setOpenId(s.id)}
                >
                  <span className="sermon-row-title">{s.title || "Untitled sermon"}</span>
                  <span className="sermon-row-meta">
                    {[s.preacher, niceDate(s.listenedOn)].filter(Boolean).join(" · ")}
                    {(() => {
                      const n = s.noteList.filter((x) => !x.deletedAt).length;
                      return n ? ` · ${n} ${n === 1 ? "note" : "notes"}` : "";
                    })()}
                    {s.items.length > 0 && ` · ${s.items.length} saved`}
                  </span>
                </button>
              ))}
            </div>
            {deleted.length > 0 && (
              <div className="mt-4">
                <button type="button" className="dash-word-link" onClick={() => setShowDeleted((v) => !v)}>
                  {showDeleted ? "Hide" : "Show"} recently deleted · {deleted.length}
                </button>
                {showDeleted &&
                  deleted.map((s) => (
                    <div key={s.id} className="sermon-deleted">
                      <span>{s.title || "Untitled sermon"}</span>
                      <button
                        type="button"
                        className="dash-word-link"
                        onClick={async () => {
                          try {
                            const { sermon } = await api<{ sermon: Sermon }>("PATCH", { id: s.id, restore: true });
                            replace(sermon);
                            setOpenId(sermon.id);
                          } catch (e) {
                            alertLater(e);
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
        </div>

        <div>
          {open && !open.deletedAt ? (
            <SermonEditor
              key={open.id}
              sermon={open}
              onSaved={replace}
              onDeleted={(s) => {
                replace(s);
                setOpenId(live.find((x) => x.id !== s.id)?.id ?? null);
              }}
            />
          ) : (
            <Panel>
              <p className="dash-word-hint">
                {sermons ? "Pick a sermon above, or add a new one." : "Loading your sermons…"}
              </p>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

function alertLater(e: unknown) {
  window.setTimeout(() => window.alert(e instanceof Error ? e.message : "Something went wrong."), 0);
}

/* ───────── One sermon: details, video, notes, saved verses and words ───────── */
function SermonEditor({
  sermon,
  onSaved,
  onDeleted,
}: {
  sermon: Sermon;
  onSaved: (s: Sermon) => void;
  onDeleted: (s: Sermon) => void;
}) {
  const [draft, setDraft] = useState<Draft>({
    title: sermon.title,
    preacher: sermon.preacher,
    url: sermon.url,
    listenedOn: sermon.listenedOn,
  });
  const [items, setItems] = useState<SermonItem[]>(sermon.items);
  const [state, setState] = useState<SaveState>("idle");
  const pending = useRef<Partial<Draft>>({});
  const timer = useRef<number | null>(null);
  const latest = useRef(sermon);
  latest.current = sermon;

  const flush = useCallback(async () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
    const changes = pending.current;
    if (!Object.keys(changes).length) return;
    pending.current = {};
    setState("saving");
    try {
      const { sermon: s } = await api<{ sermon: Sermon }>("PATCH", { id: sermon.id, ...changes });
      onSaved(s);
      setState(Object.keys(pending.current).length ? "saving" : "saved");
    } catch {
      pending.current = { ...changes, ...pending.current }; // try again with the next change
      setState("error");
    }
  }, [sermon.id, onSaved]);

  // Save whatever's waiting when leaving this sermon or the page.
  useEffect(() => {
    const before = () => void flush();
    window.addEventListener("beforeunload", before);
    return () => {
      window.removeEventListener("beforeunload", before);
      void flush();
    };
  }, [flush]);

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
    pending.current = { ...pending.current, [key]: value };
    setState("saving");
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void flush(), 900);
  }

  async function saveItems(next: SermonItem[]) {
    setItems(next);
    setState("saving");
    try {
      const { sermon: s } = await api<{ sermon: Sermon }>("PATCH", { id: sermon.id, items: next });
      onSaved(s);
      setState("saved");
    } catch {
      setState("error");
    }
  }
  const addItem = (item: Omit<SermonItem, "id" | "addedAt">) =>
    saveItems([...items, { ...item, id: uid(), addedAt: Date.now() }]);

  const video = parseYouTube(draft.url);
  const verses = items.filter((i) => i.kind === "verse");
  const words = items.filter((i) => i.kind === "word");

  return (
    <div className="sermon-layout">
      {/* Left: the sermon and its video, staying put while the notes on the right scroll. */}
      <div className="sermon-left">
        <Panel
          eyebrow={state === "saving" ? "Saving…" : state === "saved" ? "Saved" : state === "error" ? "Not saved - retrying on your next change" : "Sermon"}
          action={
            <button
              type="button"
              className="dash-word-link is-danger"
              onClick={async () => {
                await flush();
                try {
                  const { sermon: s } = await api<{ sermon: Sermon }>("DELETE", undefined, `?id=${encodeURIComponent(sermon.id)}`);
                  onDeleted(s);
                } catch (e) {
                  alertLater(e);
                }
              }}
            >
              Move to recently deleted
            </button>
          }
        >
          <input
            id="sermon-title"
            className="sermon-title-input"
            placeholder="Sermon name"
            value={draft.title}
            onChange={(e) => set("title", e.target.value)}
            aria-label="Sermon name"
          />
          {video && (
            <div className="sermon-video-wrap">
              <DayVideo url={draft.url} label="Play the sermon" links={false} resumeKey={`sermon:${sermon.id}`} />
              <div className="sermon-dock-tools">
                <a className="dash-word-link" href={watchUrl(video)} target="_blank" rel="noreferrer">
                  Open in YouTube ↗
                </a>
              </div>
            </div>
          )}
          <div className="sermon-fields">
            <label className="sermon-field">
              <span className="dash-label">Preacher</span>
              <input className="dash-input" placeholder="Who preached it" value={draft.preacher} onChange={(e) => set("preacher", e.target.value)} />
            </label>
            <label className="sermon-field">
              <span className="dash-label">Listened on</span>
              <input
                className="dash-input"
                type="date"
                value={draft.listenedOn ?? ""}
                onChange={(e) => set("listenedOn", e.target.value || null)}
              />
            </label>
          </div>
          <label className="sermon-field mt-3">
            <span className="dash-label">YouTube link</span>
            <input
              className="dash-input"
              type="url"
              inputMode="url"
              placeholder="https://www.youtube.com/watch?v=…"
              value={draft.url}
              onChange={(e) => set("url", e.target.value.trim())}
            />
          </label>
          {draft.url && !video && <p className="dash-word-hint mt-2">That doesn&apos;t look like a YouTube link yet.</p>}
        </Panel>
      </div>

      {/* Right: notes, what's been saved, and the lookups - these scroll. */}
      <div className="sermon-right">
          <SermonNotes
            sermonId={sermon.id}
            initial={sermon.noteList}
            onChange={(noteList) => onSaved({ ...latest.current, noteList })}
          />

          <FoldPanel
            id="sermon-saved"
            title="Saved from this sermon"
            eyebrow={`${verses.length} ${verses.length === 1 ? "verse" : "verses"} · ${words.length} ${words.length === 1 ? "word" : "words"}`}
          >
            {items.length === 0 && (
              <p className="dash-word-hint">Verses and words you save below show up here, kept with this sermon.</p>
            )}
            {verses.length > 0 && (
              <div className="sermon-items">
                {verses.map((v) => (
                  <div key={v.id} className="sermon-item">
                    <div>
                      <strong>{v.ref}</strong>
                      {v.text && <p>{v.text}</p>}
                    </div>
                    <button type="button" className="dash-word-link is-danger" onClick={() => saveItems(items.filter((x) => x.id !== v.id))} aria-label={`Remove ${v.ref}`}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
            {words.length > 0 && (
              <div className="sermon-items">
                {words.map((w) => (
                  <div key={w.id} className="sermon-item">
                    <div>
                      <strong>{w.word}</strong>
                      {(w.original || w.strongs) && (
                        <span className="sermon-item-meta">
                          {" "}
                          · {[w.original, w.strongs].filter(Boolean).join(" · ")}
                        </span>
                      )}
                      {w.text && <p>{w.text}</p>}
                    </div>
                    <button type="button" className="dash-word-link is-danger" onClick={() => saveItems(items.filter((x) => x.id !== w.id))} aria-label={`Remove ${w.word}`}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </FoldPanel>

          <FoldPanel id="sermon-verse" title="Look up a verse" eyebrow="Bible">
                <BibleLookup addLabel="this sermon" planNote={false} onAdd={(ref, text) => void addItem({ kind: "verse", ref, text })} />
          </FoldPanel>
          <FoldPanel id="sermon-word" title="Look up a word" eyebrow="Hebrew · Greek · English">
                <WordLookup onSave={(w) => void addItem({ kind: "word", ...w })} />
          </FoldPanel>
      </div>
    </div>
  );
}

/* ───────── A sermon's notes: saved one by one, like Study Notes ───────── */
function SermonNotes({
  sermonId,
  initial,
  onChange,
}: {
  sermonId: string;
  initial: SermonNote[];
  onChange: (notes: SermonNote[]) => void;
}) {
  const draftKey = `atg:sermon-draft:${sermonId}`;
  const [notes, setNotes] = useState<SermonNote[]>(initial);
  const [draft, setDraftText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [closed, setClosed] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const writeBox = useRef<HTMLTextAreaElement>(null);

  // A half-written note survives a reload or switching sermons (this device).
  useEffect(() => {
    try {
      setDraftText(localStorage.getItem(draftKey) ?? "");
    } catch {
      /* storage blocked */
    }
  }, [draftKey]);
  function setDraft(text: string) {
    setDraftText(text);
    if (error) setError(null);
    try {
      if (text) localStorage.setItem(draftKey, text);
      else localStorage.removeItem(draftKey);
    } catch {
      /* storage blocked */
    }
  }

  function update(next: SermonNote[]) {
    setNotes(next);
    onChange(next);
  }
  const put = (n: SermonNote) => update(notes.some((x) => x.id === n.id) ? notes.map((x) => (x.id === n.id ? n : x)) : [...notes, n]);

  async function call(method: string, body?: unknown, query = ""): Promise<SermonNote> {
    const r = await fetch(`/api/sermon-notes${query}`, {
      method,
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = (await r.json().catch(() => ({}))) as { note?: SermonNote; error?: string };
    if (!r.ok || !data.note) throw new Error(data.error ?? "Couldn't save that.");
    return data.note;
  }

  async function saveNew() {
    const text = draft.trim();
    if (!text || busy) return;
    setBusy(true);
    setError(null);
    try {
      const note = await call("POST", { sermonId, text });
      put(note);
      setDraft("");
      setFlash(note.id);
      window.setTimeout(() => setFlash(null), 2500);
      writeBox.current?.focus();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save that note.");
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit() {
    if (!editing) return;
    try {
      put(await call("PATCH", { id: editing.id, text: editing.text }));
      setEditing(null);
    } catch (e) {
      alertLater(e);
    }
  }

  const live = notes.filter((n) => !n.deletedAt);
  const deleted = notes.filter((n) => n.deletedAt);
  const time = (ms: number) =>
    new Date(ms).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <FoldPanel id="sermon-notes" title="My notes" eyebrow={`${live.length} ${live.length === 1 ? "note" : "notes"}`} forceOpen={Boolean(editing)}>
      {live.length > 0 && (
        <div className="dash-note-list">
          {live.map((n, i) => {
            const open = editing?.id === n.id || !closed.has(n.id);
            const preview = n.text.replace(/\s+/g, " ").trim();
            return (
              <article key={n.id} className={`dash-note ${open ? "is-open" : ""} ${flash === n.id ? "is-new" : ""}`}>
                <button
                  type="button"
                  className="dash-note-head"
                  aria-expanded={open}
                  onClick={() =>
                    editing?.id !== n.id &&
                    setClosed((c) => {
                      const next = new Set(c);
                      if (next.has(n.id)) next.delete(n.id);
                      else next.add(n.id);
                      return next;
                    })
                  }
                >
                  <span className="dash-note-head-ref">Note {i + 1}</span>
                  <span className="dash-note-head-text">{open ? time(n.createdAt) : preview}</span>
                  <span className="dash-note-chev" aria-hidden>
                    ›
                  </span>
                </button>
                {open && (
                  <div className="dash-note-open">
                    {editing?.id === n.id ? (
                      <div className="flex flex-col gap-2">
                        <GrowingTextarea
                          className="dash-textarea dash-word-field"
                          minRows={4}
                          value={editing.text}
                          autoFocus
                          onChange={(e) => setEditing({ id: n.id, text: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void saveEdit();
                            if (e.key === "Escape") setEditing(null);
                          }}
                          aria-label={`Edit note ${i + 1}`}
                        />
                        <div className="flex items-center gap-3">
                          <button type="button" className="dash-btn dash-btn-primary" onClick={() => void saveEdit()} disabled={!editing.text.trim()}>
                            Save
                          </button>
                          <button type="button" className="dash-word-link" onClick={() => setEditing(null)}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="sermon-note-text">{n.text}</div>
                        <div className="dash-note-actions">
                          <button type="button" className="dash-word-link" onClick={() => setEditing({ id: n.id, text: n.text })}>
                            Edit
                          </button>
                          <button
                            type="button"
                            className="dash-word-link is-danger"
                            onClick={async () => {
                              try {
                                put(await call("DELETE", undefined, `?id=${encodeURIComponent(n.id)}`));
                              } catch (e) {
                                alertLater(e);
                              }
                            }}
                          >
                            Delete
                          </button>
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

      <div className={`dash-note-write ${live.length ? "mt-4" : ""}`}>
        <label className="dash-label" htmlFor={`sermon-write-${sermonId}`}>
          {live.length ? "New note" : "Write your first note"}
        </label>
        <GrowingTextarea
          id={`sermon-write-${sermonId}`}
          ref={writeBox}
          className="dash-textarea dash-word-field"
          minRows={5}
          placeholder="What stood out, what God spoke to you, what to do about it…"
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
        {error && <p className="dash-word-hint mt-2">{error}</p>}
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
                      put(await call("PATCH", { id: n.id, restore: true }));
                    } catch (e) {
                      alertLater(e);
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

/* ───────── A word: its Hebrew / Greek meaning (Strong's) and everyday English ───────── */
function WordLookup({ onSave }: { onSave: (w: { word: string; original?: string; strongs?: string; text?: string }) => void }) {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [word, setWord] = useState("");
  const [fill, setFill] = useState<WordFill | null>(null);
  const [lang, setLang] = useState<"hebrew" | "greek">("greek");
  const [saved, setSaved] = useState(false);

  async function look(e: React.FormEvent) {
    e.preventDefault();
    const w = q.trim();
    if (!w || busy) return;
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const r = await fetch("/api/word-fill", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ word: w, quick: true }),
      });
      const data = (await r.json().catch(() => ({}))) as WordFill & { error?: string };
      if (!r.ok) throw new Error(data.error ?? "Couldn't look that up just now.");
      setFill(data);
      setWord(w);
      setLang(data[data.primary] ? data.primary : data.hebrew ? "hebrew" : "greek");
    } catch (err) {
      setFill(null);
      setWord(w);
      setError(err instanceof Error ? err.message : "Couldn't look that up just now.");
    } finally {
      setBusy(false);
    }
  }

  const pick: LanguageFill | null = fill ? fill[lang] : null;
  const other = lang === "hebrew" ? "greek" : "hebrew";

  return (
    <div>
      <form onSubmit={look} className="dash-bible-form">
        <input
          className="dash-input"
          type="search"
          placeholder="grace · faith · shalom"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Look up a word"
        />
        <button type="submit" className="dash-btn dash-btn-primary" disabled={busy || !q.trim()}>
          {busy ? "…" : "Look up"}
        </button>
      </form>
      {error && <p className="dash-word-hint mt-2">{error}</p>}
      {word && !busy && (
        <div className="sermon-word">
          {pick ? (
            <>
              <div className="sermon-word-head">
                <span className="sermon-word-original">{pick.entry.original}</span>
                <span className="sermon-item-meta">
                  {pick.entry.translit} · {pick.entry.language === "hebrew" ? "Hebrew" : "Greek"} · Strong&apos;s {pick.entry.number}
                </span>
              </div>
              <dl className="dash-word-defs">
                <dt>Meaning{pick.meaningSource ? ` · ${pick.meaningSource}` : ""}</dt>
                <dd>{pick.meaning || pick.entry.gloss}</dd>
                <DictionaryMeaning word={word} />
              </dl>
              {fill?.[other] && (
                <button type="button" className="dash-word-link" onClick={() => setLang(other)}>
                  See the {other === "hebrew" ? "Hebrew (Old Testament)" : "Greek (New Testament)"} word instead
                </button>
              )}
            </>
          ) : (
            <dl className="dash-word-defs">
              <dt>Original language</dt>
              <dd>No Hebrew or Greek word found for “{word}”.</dd>
              <DictionaryMeaning word={word} />
            </dl>
          )}
          <button
            type="button"
            className="dash-btn mt-3"
            disabled={saved}
            onClick={() => {
              onSave({
                word,
                original: pick ? `${pick.entry.original} (${pick.entry.translit})` : undefined,
                strongs: pick?.entry.number,
                text: pick ? pick.meaning || pick.entry.gloss : fill?.englishMeaning || undefined,
              });
              setSaved(true);
            }}
          >
            {saved ? "✓ Saved to this sermon" : "+ Save to this sermon"}
          </button>
        </div>
      )}
    </div>
  );
}
