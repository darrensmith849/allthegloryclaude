"use client";

// Sermons - Daniel's own sermon notes (owner only: not the team, never
// members). Each sermon keeps its YouTube link (played right here), its name,
// who preached it and when he listened, his notes, and the verses and words
// he looked up and saved while listening. Saved to D1 as he types
// (/api/sermons); nothing is ever removed - a deleted sermon waits in
// "Recently deleted" and earlier versions are kept.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Panel } from "@/components/dashboard/panel";
import { BibleLookup } from "@/components/study/bible-lookup";
import { DictionaryMeaning } from "@/components/study/dictionary-meaning";
import { youtubeId, youtubeStart, type Sermon, type SermonItem } from "@/lib/dashboard/sermons";
import type { LanguageFill, WordFill } from "@/lib/dashboard/words";

type Draft = Pick<Sermon, "title" | "preacher" | "url" | "listenedOn" | "notes">;
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
        const first = d.sermons.find((s) => !s.deletedAt);
        if (first) setOpenId(first.id);
      })
      .catch((e: Error) => setLoadError(e.message));
  }, []);

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
      [s.title, s.preacher, s.notes, ...s.items.map((i) => `${i.ref ?? ""} ${i.word ?? ""} ${i.text ?? ""}`)]
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

      <div className="dash-grid">
        <div className="dash-col-4">
          <Panel title="Your sermons" eyebrow={sermons ? `${live.length} saved` : "Loading"}>
            <input
              className="dash-input"
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
          </Panel>
        </div>

        <div className="dash-col-8">
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
                {sermons ? "Pick a sermon on the left, or add a new one." : "Loading your sermons…"}
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
    notes: sermon.notes,
  });
  const [items, setItems] = useState<SermonItem[]>(sermon.items);
  const [state, setState] = useState<SaveState>("idle");
  const pending = useRef<Partial<Draft>>({});
  const timer = useRef<number | null>(null);

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

  const vid = youtubeId(draft.url);
  const start = youtubeStart(draft.url);
  const verses = items.filter((i) => i.kind === "verse");
  const words = items.filter((i) => i.kind === "word");

  return (
    <div className="flex flex-col gap-[18px]">
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
        {draft.url && !vid && <p className="dash-word-hint mt-2">That doesn&apos;t look like a YouTube link yet.</p>}
        {vid && (
          <div className="sermon-video">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${vid}${start ? `?start=${start}` : ""}`}
              title={draft.title || "Sermon video"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </div>
        )}
      </Panel>

      <Panel title="My notes" eyebrow="Saved as you type">
        <textarea
          className="dash-textarea sermon-notes"
          placeholder="What stood out, what God spoke to you, what to do about it…"
          value={draft.notes}
          onChange={(e) => set("notes", e.target.value)}
          onBlur={() => void flush()}
          aria-label="Your notes on this sermon"
        />
      </Panel>

      <Panel title="Saved from this sermon" eyebrow={`${verses.length} ${verses.length === 1 ? "verse" : "verses"} · ${words.length} ${words.length === 1 ? "word" : "words"}`}>
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
      </Panel>

      <div className="dash-grid">
        <div className="dash-col-6">
          <Panel title="Look up a verse" eyebrow="Bible">
            <BibleLookup addLabel="this sermon" onAdd={(ref, text) => void addItem({ kind: "verse", ref, text })} />
          </Panel>
        </div>
        <div className="dash-col-6">
          <Panel title="Look up a word" eyebrow="Hebrew · Greek · English">
            <WordLookup onSave={(w) => void addItem({ kind: "word", ...w })} />
          </Panel>
        </div>
      </div>
    </div>
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
