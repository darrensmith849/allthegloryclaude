"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Panel } from "@/components/dashboard/panel";
import { GrowingTextarea } from "@/components/dashboard/growing-textarea";
import { isSameMonth, monthGrid, shiftMonth, startOfMonth } from "@/lib/dashboard/dates";
import {
  chapterLabel,
  dayLabel,
  exportText,
  formatPassage,
  isDay,
  latestNote,
  matchesNote,
  parseImport,
  parsePassage,
  passageOf,
  readingOrder,
  shiftDay,
  todayDay,
  type NoteInput,
  type Passage,
  type StudyNote,
} from "@/lib/dashboard/notes";

const API = "/api/study-notes";
const CACHE_KEY = "atg:notes:v1"; // last copy from the server, for instant load
const DRAFT_KEY = "atg:notes:drafts"; // unsaved writing, per day
const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const UNDATED = "undated";

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
interface Editing {
  id: string;
  day: string;
  page: string;
  passage: string;
  text: string;
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

async function send<T>(method: string, body?: unknown, query = ""): Promise<T> {
  const r = await fetch(`${API}${query}`, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (r.status === 401) {
    window.location.assign(`/dashboard/login?next=${encodeURIComponent("/dashboard/notes")}`);
    throw new Error("Please log in again.");
  }
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

  const [day, setDay] = useState<string>(() => todayDay());
  const [month, setMonth] = useState<string>(() => startOfMonth(todayDay()));
  const [query, setQuery] = useState("");
  const [flash, setFlash] = useState<string | null>(null);

  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [verses, setVerses] = useState<Record<string, VerseView>>({});

  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);
  const writeBox = useRef<HTMLTextAreaElement>(null);

  // Instant load from the last copy, then the server. Opens on the day
  // of the latest note written.
  useEffect(() => {
    const open = (list: StudyNote[]) => {
      const last = latestNote(list);
      if (last?.day) {
        setDay(last.day);
        setMonth(startOfMonth(last.day));
      }
    };
    const cachedNotes = readStore<StudyNote[]>(CACHE_KEY, []);
    setNotes(cachedNotes);
    open(cachedNotes);
    setDrafts(readStore<Record<string, string>>(DRAFT_KEY, {}));
    send<{ notes: StudyNote[] }>("GET")
      .then(({ notes: fresh }) => {
        setNotes(fresh);
        writeStore(CACHE_KEY, fresh);
        setOffline(null);
        if (!cachedNotes.length) open(fresh);
      })
      .catch((e: Error) => setOffline(`${e.message} Showing the copy saved on this device.`))
      .finally(() => setLoaded(true));
  }, []);

  const commit = (next: StudyNote[]) => {
    setNotes(next);
    writeStore(CACHE_KEY, next);
  };
  const setDraft = (d: string, text: string) => {
    setDrafts((all) => {
      const next = { ...all };
      if (text) next[d] = text;
      else delete next[d];
      writeStore(DRAFT_KEY, next);
      return next;
    });
  };

  function openDay(d: string) {
    setDay(d);
    if (isDay(d)) setMonth(startOfMonth(d));
    setEditing(null);
    setError(null);
  }

  // ── The open day ──────────────────────────────────────────────
  const ordered = useMemo(() => readingOrder(notes), [notes]);
  const dayNotes = useMemo(
    () => ordered.filter((n) => (day === UNDATED ? !n.day : n.day === day)),
    [ordered, day],
  );
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const n of notes) if (n.day) m.set(n.day, (m.get(n.day) ?? 0) + 1);
    return m;
  }, [notes]);
  const undatedCount = notes.length - [...counts.values()].reduce((a, b) => a + b, 0);
  const dayChapters = [...new Set(dayNotes.map(passageOf).filter((p): p is Passage => Boolean(p)).map(chapterLabel))];
  const dayPages = [...new Set(dayNotes.map((n) => n.page).filter((p): p is number => p != null))];

  // What new writing carries on from: this day's last note, or the last
  // note before this day.
  const context = useMemo(() => {
    const before = day === UNDATED ? ordered : ordered.filter((n) => n.day && n.day <= day);
    const last = before[before.length - 1];
    const lastPassage = [...before].reverse().map(passageOf).find(Boolean) ?? null;
    return { page: last?.day === day ? (last?.page ?? null) : null, prev: lastPassage };
  }, [ordered, day]);

  const draft = drafts[day] ?? "";
  const preview = useMemo(
    () => parseImport(draft, { day: day === UNDATED ? null : day, page: context.page, prev: context.prev }),
    [draft, day, context],
  );

  async function saveWriting() {
    if (!preview.length || saving) return;
    setSaving(true);
    setError(null);
    try {
      const { notes: made } = await send<{ notes: StudyNote[] }>("POST", { import: preview });
      commit([...notes, ...made]);
      setDraft(day, "");
      const lastMade = made[made.length - 1];
      if (lastMade?.day && lastMade.day !== day) openDay(lastMade.day);
      if (lastMade) {
        setFlash(lastMade.id);
        window.setTimeout(() => {
          document.getElementById(`note-${lastMade.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 60);
        window.setTimeout(() => setFlash((id) => (id === lastMade.id ? null : id)), 4000);
      }
    } catch (err) {
      setError(`${err instanceof Error ? err.message : "Couldn't save."} Your writing is still here - try again.`);
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit() {
    if (!editing) return;
    const original = notes.find((n) => n.id === editing.id);
    const passage = editing.passage.trim()
      ? parsePassage(editing.passage, original ? passageOf(original) : null)
      : null;
    const input: NoteInput & { id: string } = {
      id: editing.id,
      day: isDay(editing.day) ? editing.day : null,
      page: editing.page.trim() ? Number(editing.page) : null,
      book: passage?.book ?? null,
      chapter: passage?.chapter ?? null,
      verse: passage?.verse ?? null,
      verseEnd: passage?.verseEnd ?? null,
      text: editing.text,
    };
    try {
      const { note } = await send<{ note: StudyNote }>("PATCH", input);
      commit(notes.map((n) => (n.id === note.id ? note : n)));
      setEditing(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Couldn't save that note.");
    }
  }

  // Swap a note with its neighbour, then renumber the day so the order sticks.
  async function move(n: StudyNote, dir: -1 | 1) {
    const i = dayNotes.findIndex((x) => x.id === n.id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= dayNotes.length) return;
    const order = [...dayNotes];
    [order[i], order[j]] = [order[j], order[i]];
    const moves = order.map((x, k) => ({ id: x.id, position: k + 1 }));
    const pos = new Map(moves.map((m) => [m.id, m.position]));
    commit(notes.map((x) => (pos.has(x.id) ? { ...x, position: pos.get(x.id)! } : x)));
    try {
      await send("PATCH", { moves });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Couldn't move that note.");
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

  // ── Paste in many days ────────────────────────────────────────
  const importPreview = useMemo(
    () => parseImport(importText, { day: day === UNDATED ? null : day }),
    [importText, day],
  );
  const importDays = [...new Set(importPreview.map((n) => n.day))];
  async function runImport() {
    if (!importPreview.length) return;
    setImporting(true);
    try {
      const { notes: made } = await send<{ notes: StudyNote[] }>("POST", { import: importPreview });
      commit([...notes, ...made]);
      setImportText("");
      setImportOpen(false);
      const first = made.find((n) => n.day);
      if (first?.day) openDay(first.day);
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
    a.download = `study-notes-${todayDay()}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // ── Search ────────────────────────────────────────────────────
  const results = useMemo(
    () => (query.trim() ? ordered.filter((n) => matchesNote(n, query)) : []),
    [ordered, query],
  );
  function openResult(n: StudyNote) {
    openDay(n.day ?? UNDATED);
    setQuery("");
    setFlash(n.id);
    window.setTimeout(() => {
      document.getElementById(`note-${n.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
    window.setTimeout(() => setFlash((id) => (id === n.id ? null : id)), 4000);
  }

  const grid = useMemo(() => monthGrid(month), [month]);
  const today = todayDay();
  const monthName = new Date(`${month}T00:00:00`).toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  return (
    <>
      <div className="dash-pagehead">
        <div>
          <div className="eyebrow eyebrow-amber">The One Year Chronological Bible · NIV</div>
          <h1 className="dash-title mt-1">Study Notes</h1>
          <div className="dash-subtitle">
            {notes.length
              ? `${notes.length} ${notes.length === 1 ? "note" : "notes"} across ${counts.size} ${counts.size === 1 ? "day" : "days"}. Tap a day to read or add to it.`
              : "Pick the day you're reading and write your notes the way you always do."}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button type="button" className="dash-btn dash-btn-ghost" onClick={() => setImportOpen((v) => !v)}>
            {importOpen ? "Close" : "Paste many days"}
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
            <Panel eyebrow="Bring notes across" title="Paste many days at once">
              <p className="text-[13px] text-[var(--colour-ink-soft)] leading-relaxed mb-3">
                Paste straight from your Google Doc. A line like <code>Sept 26</code> starts that day;
                anything before the first date goes on {day === UNDATED ? "no day" : dayLabel(day)}.
              </p>
              <GrowingTextarea
                className="dash-textarea dash-word-field"
                minRows={8}
                placeholder={"Sept 26\n1257 - Matt 2 vs 7 - Herod says...\nVs 12 - Magi warned in a dream...\n\nSept 27\nMatt 4 vs 1-11 - ..."}
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
                  {importing
                    ? "Saving…"
                    : `Save ${importPreview.length || ""} ${importPreview.length === 1 ? "note" : "notes"}`}
                </button>
                {importPreview.length > 0 && (
                  <span className="text-[12.5px] text-[var(--colour-ink-quiet)]">
                    {importDays.map((d) => (d ? dayLabel(d, { weekday: false }) : "No day")).join(" · ")}
                  </span>
                )}
              </div>
            </Panel>
          </div>
        )}

        {/* ── Calendar + search ───────────────────────────────────── */}
        <div className="dash-col-5">
          <Panel
            eyebrow="Reading plan"
            title={monthName}
            action={
              <div className="flex gap-1">
                <button type="button" className="dash-btn dash-btn-ghost dash-note-nav" onClick={() => setMonth((m) => shiftMonth(m, -1))} aria-label="Previous month">
                  ‹
                </button>
                <button type="button" className="dash-btn dash-btn-ghost dash-note-nav" onClick={() => openDay(today)}>
                  Today
                </button>
                <button type="button" className="dash-btn dash-btn-ghost dash-note-nav" onClick={() => setMonth((m) => shiftMonth(m, 1))} aria-label="Next month">
                  ›
                </button>
              </div>
            }
          >
            <div className="dash-note-cal">
              {WEEK.map((w) => (
                <div key={w} className="dash-note-cal-head">
                  {w}
                </div>
              ))}
              {grid.map((d) => {
                const count = counts.get(d) ?? 0;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => openDay(d)}
                    className={`dash-note-cal-day ${isSameMonth(d, month) ? "" : "is-other"} ${d === today ? "is-today" : ""} ${
                      d === day ? "is-selected" : ""
                    } ${count ? "has-notes" : ""}`}
                    aria-label={`${dayLabel(d)}${count ? `, ${count} notes` : ""}`}
                  >
                    <span>{Number(d.slice(8))}</span>
                    {count > 0 && <em>{count}</em>}
                  </button>
                );
              })}
            </div>
            {undatedCount > 0 && (
              <button type="button" className="dash-word-link mt-3" onClick={() => openDay(UNDATED)}>
                {undatedCount} {undatedCount === 1 ? "note" : "notes"} without a day →
              </button>
            )}

            <div className="dash-divider" />
            <input
              type="search"
              className="dash-input"
              placeholder="Search all notes - a word, “Matt 4”, “27 sep”"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search your notes"
            />
            {query.trim() && (
              <div className="dash-note-results">
                {results.length === 0 && <div className="dash-word-hint">Nothing matches “{query.trim()}”.</div>}
                {results.slice(0, 60).map((n) => (
                  <button key={n.id} type="button" className="dash-note-result" onClick={() => openResult(n)}>
                    <span className="dash-note-result-meta">
                      {n.day ? dayLabel(n.day, { weekday: false }) : "No day"}
                      {passageOf(n) ? ` · ${formatPassage(passageOf(n))}` : ""}
                    </span>
                    <span className="dash-note-result-text">{n.text.replace(/\n/g, " ")}</span>
                  </button>
                ))}
                {results.length > 60 && <div className="dash-word-hint">{results.length - 60} more - narrow the search.</div>}
              </div>
            )}
          </Panel>
        </div>

        {/* ── The open day ────────────────────────────────────────── */}
        <div className="dash-col-7">
          <Panel
            eyebrow={
              day === UNDATED
                ? "Notes without a day"
                : [dayPages.length ? `Page ${dayPages.join(", ")}` : "", dayChapters.join(" · ")].filter(Boolean).join(" · ") ||
                  "Reading"
            }
            title={day === UNDATED ? "No day set" : dayLabel(day)}
            action={
              day !== UNDATED ? (
                <div className="flex gap-1">
                  <button type="button" className="dash-btn dash-btn-ghost dash-note-nav" onClick={() => openDay(shiftDay(day, -1))} aria-label="Previous day">
                    ‹
                  </button>
                  <button type="button" className="dash-btn dash-btn-ghost dash-note-nav" onClick={() => openDay(shiftDay(day, 1))} aria-label="Next day">
                    ›
                  </button>
                </div>
              ) : null
            }
          >
            {loaded && dayNotes.length === 0 && (
              <div className="dash-word-hint mb-4">No notes on this day yet - write them below.</div>
            )}

            <div className="dash-note-list">
              {dayNotes.map((n, i) => {
                const p = passageOf(n);
                const v = verses[n.id];
                const isEditing = editing?.id === n.id;
                const showPage = n.page != null && n.page !== dayNotes[i - 1]?.page;
                return (
                  <div key={n.id}>
                    {showPage && <div className="dash-note-pagebreak">Page {n.page}</div>}
                    <article id={`note-${n.id}`} className={`dash-note ${flash === n.id ? "is-new" : ""}`}>
                      <div className="dash-note-ref">
                        {p ? (
                          <button type="button" onClick={() => toggleVerse(n)} title="Read the passage">
                            {formatPassage(p)}
                          </button>
                        ) : (
                          <span className="opacity-40">·</span>
                        )}
                      </div>
                      <div className="dash-note-body">
                        {isEditing ? (
                          <div className="flex flex-col gap-2">
                            <div className="dash-note-edit-row">
                              <input
                                type="date"
                                className="dash-input"
                                aria-label="Day"
                                value={editing.day}
                                onChange={(e) => setEditing({ ...editing, day: e.target.value })}
                              />
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
                                placeholder="Passage, e.g. Matt 4 vs 1"
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
                            <div className="flex gap-2 flex-wrap">
                              <button type="button" className="dash-btn dash-btn-primary" onClick={saveEdit}>
                                Save
                              </button>
                              <button type="button" className="dash-btn dash-btn-ghost" onClick={() => setEditing(null)}>
                                Cancel
                              </button>
                              <button type="button" className="dash-btn dash-btn-danger ml-auto" onClick={() => remove(n)}>
                                Delete
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
                            className="dash-note-move"
                            onClick={() => move(n, -1)}
                            disabled={i === 0}
                            aria-label="Move up"
                            title="Move up"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            className="dash-note-move"
                            onClick={() => move(n, 1)}
                            disabled={i === dayNotes.length - 1}
                            aria-label="Move down"
                            title="Move down"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            className="dash-word-link"
                            onClick={() =>
                              setEditing({
                                id: n.id,
                                day: n.day ?? "",
                                page: n.page != null ? String(n.page) : "",
                                passage: formatPassage(p),
                                text: n.text,
                              })
                            }
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </article>
                  </div>
                );
              })}
            </div>

            {/* ── Write for this day ─────────────────────────────── */}
            <div className="dash-note-write">
              <label className="dash-label" htmlFor="sn-write">
                {day === UNDATED ? "Write notes" : `Write for ${dayLabel(day, { weekday: false })}`}
              </label>
              <GrowingTextarea
                id="sn-write"
                ref={writeBox}
                className="dash-textarea dash-word-field"
                minRows={5}
                placeholder={
                  context.prev
                    ? `Write the way you do in your doc:\nVs 14 - …  (carries on in ${chapterLabel(context.prev)})\nLuke 2 vs 41 - …\n* a question or point`
                    : "Write the way you do in your doc:\n1257 - Matt 2 vs 7 - …\nVs 12 - …\n* a question or point"
                }
                value={draft}
                onChange={(e) => setDraft(day, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) saveWriting();
                }}
              />
              {preview.length > 0 && (
                <div className="dash-note-preview">
                  <span className="eyebrow">Will save as {preview.length} {preview.length === 1 ? "note" : "notes"}</span>
                  {preview.map((n, k) => (
                    <div key={k} className="dash-note-preview-row">
                      <span>{formatPassage(passageOf(n)) || "·"}</span>
                      <span>{n.text.replace(/\n/g, " ").slice(0, 90)}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-3 flex-wrap mt-3">
                <button
                  type="button"
                  className="dash-btn dash-btn-primary"
                  onClick={saveWriting}
                  disabled={saving || !preview.length}
                >
                  {saving ? "Saving…" : preview.length > 1 ? `Save ${preview.length} notes` : "Save note"}
                </button>
                <span className="text-[11.5px] text-[var(--colour-ink-faint)]">⌘ / Ctrl + Enter · drafts are kept on this device</span>
                {error && <span className="text-[12.5px] text-[#f1a07d]">{error}</span>}
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
