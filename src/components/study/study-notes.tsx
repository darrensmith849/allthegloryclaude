"use client";

// Study Notes: notes by reading day of the One Year Chronological Bible,
// with a calendar, the day's words and a writing box. Used for the owner's
// study (/dashboard/notes) and each member's journal (/study/journal) -
// which one comes from useStudyClient().

import { useEffect, useMemo, useRef, useState } from "react";
import { Panel } from "@/components/dashboard/panel";
import { GrowingTextarea } from "@/components/dashboard/growing-textarea";
import { NoteText } from "@/components/dashboard/note-text";
import { QuickWord } from "@/components/dashboard/quick-word";
import { WordRow } from "@/components/dashboard/word-entry";
import { useWords } from "@/lib/dashboard/words-store";
import { useStudyClient, type StudyClient } from "@/lib/study/client";
import { bibleAppDay, PLAN } from "@/lib/study/plan";
import { isSameMonth, monthGrid, shiftMonth, startOfMonth } from "@/lib/dashboard/dates";
import {
  chapterLabel,
  dayLabel,
  exportText,
  formatPassage,
  isDay,
  latestNote,
  matchesNote,
  mergeNotes,
  planDay,
  parseImport,
  parsePassage,
  passageOf,
  readingOrder,
  shiftDay,
  todayDay,
  type NoteInput,
  type Passage,
  type StudyDay,
  type StudyNote,
} from "@/lib/dashboard/notes";

const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const UNDATED = "undated";
const TRASH = "deleted"; // the Recently deleted view
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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

async function request<T>(client: StudyClient, method: string, body?: unknown, query = ""): Promise<T> {
  const r = await fetch(`${client.notesApi}${query}`, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (r.status === 401) {
    window.location.assign(`${client.loginUrl}?next=${encodeURIComponent(client.notesUrl)}`);
    throw new Error("Please log in again.");
  }
  if (r.status === 204) return undefined as T;
  const data = (await r.json().catch(() => ({}))) as T & { error?: string };
  if (!r.ok) throw new Error(data.error ?? `Request failed (${r.status})`);
  return data;
}

export function StudyNotes() {
  const client = useStudyClient();
  const CACHE_KEY = client.key("notes"); // last copy from the server, for instant load
  const SYNCED_KEY = client.key("notesSynced"); // server time of the last fetch
  const DAYS_KEY = client.key("days"); // day titles / takeaways
  const DRAFT_KEY = client.key("drafts"); // unsaved writing, per day
  const SECTIONS_KEY = client.key("sections"); // which day sections are open
  const send = <T,>(method: string, body?: unknown, query = "") => request<T>(client, method, body, query);
  const { words: allWords, remove: removeWordById } = useWords();
  const [openWord, setOpenWord] = useState<string | null>(null);
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [offline, setOffline] = useState<string | null>(null);

  const [day, setDay] = useState<string>(() => todayDay());
  const [month, setMonth] = useState<string>(() => startOfMonth(todayDay()));
  const [calView, setCalView] = useState<"month" | "year">("month");
  const [sections, setSections] = useState<{ notes: boolean; words: boolean }>({ notes: true, words: true });
  const [openNotes, setOpenNotes] = useState<Set<string>>(() => new Set());
  const [days, setDays] = useState<Record<string, StudyDay>>({});
  const [dayEdit, setDayEdit] = useState<{ title: string; takeaway: string; shared: boolean } | null>(null);
  // Members: the dates (MM-DD) the owner's study has notes for, with a label.
  const [studyOn, setStudyOn] = useState<Map<string, string>>(() => new Map());
  const toggleNote = (id: string) =>
    setOpenNotes((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const openNote = (...ids: string[]) => setOpenNotes((s) => new Set([...s, ...ids]));
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

  // Instant load from the last copy, then the server. Opens on ?day= when
  // given (e.g. back from the reader view), else the latest note's day.
  useEffect(() => {
    const asked = new URLSearchParams(window.location.search).get("day");
    const open = (list: StudyNote[]) => {
      const d = isDay(asked) ? asked : latestNote(list)?.day;
      if (d) {
        setDay(d);
        setMonth(startOfMonth(d));
      }
    };
    const cachedNotes = readStore<StudyNote[]>(CACHE_KEY, []);
    setNotes(cachedNotes);
    open(cachedNotes);
    setDrafts(readStore<Record<string, string>>(DRAFT_KEY, {}));
    setSections(readStore(SECTIONS_KEY, { notes: true, words: true }));
    // After the first load only what changed is fetched (with a minute of
    // overlap) and merged into the copy on this device.
    const since = cachedNotes.length ? readStore<number>(SYNCED_KEY, 0) : 0;
    send<{ notes: StudyNote[]; syncedAt?: number }>("GET", undefined, since ? `?since=${since - 60_000}` : "")
      .then(({ notes: fresh, syncedAt }) => {
        const next = since ? mergeNotes(cachedNotes, fresh) : fresh;
        setNotes(next);
        writeStore(CACHE_KEY, next);
        if (syncedAt) writeStore(SYNCED_KEY, syncedAt);
        setOffline(null);
        if (!cachedNotes.length) open(next);
      })
      .catch((e: Error) => setOffline(`${e.message} Showing the copy saved on this device.`))
      .finally(() => setLoaded(true));

    const cachedDays = readStore<Record<string, StudyDay>>(DAYS_KEY, {});
    setDays(cachedDays);
    fetch(client.daysApi, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { days?: StudyDay[] } | null) => {
        if (!data?.days) return;
        const map = Object.fromEntries(data.days.map((d) => [d.day, d]));
        setDays(map);
        writeStore(DAYS_KEY, map);
      })
      .catch(() => {});
  }, []);

  // Members: which dates the shared study covers, to link each day to it.
  useEffect(() => {
    if (!client.studyUrl) return;
    fetch("/api/study/read?only=contents", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { contents?: { day: string; title: string; chapters: string[] }[] } | null) => {
        if (!data?.contents) return;
        setStudyOn(new Map(data.contents.map((c) => [c.day.slice(5), c.title || c.chapters.join(" · ")])));
      })
      .catch(() => {});
  }, [client.studyUrl]);

  // ← → step through the days when not typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        setDay((d) => {
          if (!isDay(d)) return d;
          const next = shiftDay(d, e.key === "ArrowLeft" ? -1 : 1);
          setMonth(startOfMonth(next));
          return next;
        });
        setEditing(null);
        setDayEdit(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
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

  function toggleSection(key: "notes" | "words") {
    setSections((s) => {
      const next = { ...s, [key]: !s[key] };
      writeStore(SECTIONS_KEY, next);
      return next;
    });
  }

  function openDay(d: string) {
    setDay(d);
    setDayEdit(null);
    if (isDay(d)) setMonth(startOfMonth(d));
    setEditing(null);
    setError(null);
  }

  // ── The open day ──────────────────────────────────────────────
  const liveNotes = useMemo(() => notes.filter((n) => !n.deletedAt), [notes]);
  const trash = useMemo(
    () => notes.filter((n) => n.deletedAt).sort((a, b) => (b.deletedAt ?? 0) - (a.deletedAt ?? 0)),
    [notes],
  );
  const ordered = useMemo(() => readingOrder(liveNotes), [liveNotes]);
  const dayNotes = useMemo(
    () => ordered.filter((n) => (day === UNDATED ? !n.day : n.day === day)),
    [ordered, day],
  );
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const n of liveNotes) if (n.day) m.set(n.day, (m.get(n.day) ?? 0) + 1);
    return m;
  }, [liveNotes]);
  const dayWords = useMemo(
    () =>
      day === UNDATED || day === TRASH
        ? []
        : allWords.filter((w) => w.day === day).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [allWords, day],
  );
  const wordDays = useMemo(() => new Set(allWords.map((w) => w.day).filter(Boolean)), [allWords]);
  const undatedCount = liveNotes.length - [...counts.values()].reduce((a, b) => a + b, 0);

  // The same calendar day in other years - the One Year Bible comes round
  // again each year, so this is what you saw on this reading before.
  const otherYears = useMemo(() => {
    if (!isDay(day)) return [];
    const md = day.slice(5);
    const byYear = new Map<string, { notes: number; words: number }>();
    for (const n of liveNotes) {
      if (n.day && n.day !== day && n.day.slice(5) === md) {
        const e = byYear.get(n.day) ?? { notes: 0, words: 0 };
        e.notes++;
        byYear.set(n.day, e);
      }
    }
    for (const w of allWords) {
      if (w.day && w.day !== day && w.day.slice(5) === md) {
        const e = byYear.get(w.day) ?? { notes: 0, words: 0 };
        e.words++;
        byYear.set(w.day, e);
      }
    }
    return [...byYear.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [liveNotes, allWords, day]);
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

  const verseHint = useMemo(() => {
    const own = [...dayNotes].reverse().map(passageOf).find(Boolean);
    return formatPassage(own ?? context.prev ?? null);
  }, [dayNotes, context]);

  function removeWord(id: string, name: string) {
    if (!confirm(`Move “${name}” to Recently deleted? You can restore it from the Word Journal.`)) return;
    removeWordById(id);
  }

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
      openNote(...made.map((n) => n.id));
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
    if (!confirm("Move this note to Recently deleted? You can restore it any time.")) return;
    try {
      await send("DELETE", undefined, `?id=${encodeURIComponent(n.id)}`);
      commit(notes.map((x) => (x.id === n.id ? { ...x, deletedAt: Date.now() } : x)));
      setEditing(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Couldn't delete that note.");
    }
  }

  async function togglePrivate(n: StudyNote) {
    try {
      const { note } = await send<{ note: StudyNote }>("PATCH", { id: n.id, private: !n.private });
      commit(notes.map((x) => (x.id === note.id ? note : x)));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Couldn't change that.");
    }
  }

  async function saveDayDetails() {
    if (!dayEdit || !isDay(day)) return;
    try {
      const r = await fetch(client.daysApi, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ day, ...dayEdit }),
      });
      const data = (await r.json().catch(() => ({}))) as { day?: StudyDay; error?: string };
      if (!r.ok || !data.day) throw new Error(data.error ?? "Couldn't save that.");
      const next = { ...days, [day]: data.day };
      setDays(next);
      writeStore(DAYS_KEY, next);
      setDayEdit(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Couldn't save that.");
    }
  }

  async function restore(n: StudyNote) {
    try {
      const { note } = await send<{ note: StudyNote }>("PATCH", { id: n.id, restore: true });
      commit(notes.map((x) => (x.id === note.id ? note : x)));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Couldn't restore that note.");
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
    const blob = new Blob([exportText(liveNotes)], { type: "text/plain;charset=utf-8" });
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
    openNote(n.id);
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
          <h1 className="dash-title mt-1">{client.kind === "member" ? "My journal" : "Study Notes"}</h1>
          <div className="dash-subtitle">
            {liveNotes.length
              ? `${liveNotes.length} ${liveNotes.length === 1 ? "note" : "notes"} across ${counts.size} ${counts.size === 1 ? "day" : "days"}. Every note is kept - tap a day to read or add to it.`
              : "Pick the day you're reading and write your notes the way you always do."}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button type="button" className="dash-btn dash-btn-ghost" onClick={() => setImportOpen((v) => !v)}>
            {importOpen ? "Close" : "Paste many days"}
          </button>
          {liveNotes.length > 0 && (
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
        <div className="dash-col-5 dash-note-side">
          <Panel
            eyebrow="Reading plan"
            title={calView === "year" ? month.slice(0, 4) : monthName}
          >
            <div className="dash-note-calbar">
              <div className="dash-toggle" role="group" aria-label="Calendar view">
                <button type="button" className={calView === "month" ? "is-on" : ""} onClick={() => setCalView("month")}>
                  Month
                </button>
                <button type="button" className={calView === "year" ? "is-on" : ""} onClick={() => setCalView("year")}>
                  Year
                </button>
              </div>
              <div className="dash-note-calnav">
                <button
                  type="button"
                  className="dash-btn dash-btn-ghost dash-note-nav"
                  onClick={() => setMonth((m) => shiftMonth(m, calView === "year" ? -12 : -1))}
                  aria-label={calView === "year" ? "Previous year" : "Previous month"}
                >
                  ‹
                </button>
                <button type="button" className="dash-btn dash-btn-ghost dash-note-nav" onClick={() => openDay(today)}>
                  Today
                </button>
                <button
                  type="button"
                  className="dash-btn dash-btn-ghost dash-note-nav"
                  onClick={() => setMonth((m) => shiftMonth(m, calView === "year" ? 12 : 1))}
                  aria-label={calView === "year" ? "Next year" : "Next month"}
                >
                  ›
                </button>
              </div>
            </div>
            {calView === "year" && (
              <div className="dash-note-year">
                {Array.from({ length: 12 }, (_, i) => `${month.slice(0, 4)}-${String(i + 1).padStart(2, "0")}-01`).map((m) => (
                  <div key={m} className="dash-note-mini">
                    <button
                      type="button"
                      className="dash-note-mini-name"
                      onClick={() => {
                        setMonth(m);
                        setCalView("month");
                      }}
                    >
                      {MONTH_SHORT[Number(m.slice(5, 7)) - 1]}
                    </button>
                    <div className="dash-note-mini-grid">
                      {monthGrid(m).map((d) =>
                        isSameMonth(d, m) ? (
                          <button
                            key={d}
                            type="button"
                            onClick={() => openDay(d)}
                            title={`${dayLabel(d)}${counts.get(d) ? ` · ${counts.get(d)} notes` : ""}`}
                            className={`${counts.has(d) || wordDays.has(d) ? "has-notes" : ""} ${d === day ? "is-selected" : ""} ${
                              d === today ? "is-today" : ""
                            }`}
                          />
                        ) : (
                          <span key={d} />
                        ),
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {calView === "month" && (
            <div className="dash-note-cal">
              {WEEK.map((w) => (
                <div key={w} className="dash-note-cal-head">
                  {w}
                </div>
              ))}
              {grid.map((d) => {
                const count = counts.get(d) ?? 0;
                const hasWords = wordDays.has(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => openDay(d)}
                    className={`dash-note-cal-day ${isSameMonth(d, month) ? "" : "is-other"} ${d === today ? "is-today" : ""} ${
                      d === day ? "is-selected" : ""
                    } ${count || hasWords ? "has-notes" : ""}`}
                    aria-label={`${dayLabel(d)}${count ? `, ${count} notes` : ""}${hasWords ? ", words studied" : ""}`}
                  >
                    <span>{Number(d.slice(8))}</span>
                    {(count > 0 || hasWords) && (
                      <em>
                        {count > 0 ? count : ""}
                        {hasWords ? " α" : ""}
                      </em>
                    )}
                  </button>
                );
              })}
            </div>
            )}
            {undatedCount > 0 && (
              <button type="button" className="dash-word-link mt-3" onClick={() => openDay(UNDATED)}>
                {undatedCount} {undatedCount === 1 ? "note" : "notes"} without a day →
              </button>
            )}
            {trash.length > 0 && (
              <button type="button" className="dash-word-link mt-3 block" onClick={() => openDay(TRASH)}>
                Recently deleted · {trash.length} →
              </button>
            )}

            <p className="dash-plan-foot">
              Following <em>{PLAN.name}</em> ({PLAN.edition}) ·{" "}
              <a href={PLAN.bibleApp} target="_blank" rel="noreferrer">
                free in the Bible App
              </a>{" "}
              · the NIV book:{" "}
              <a href={PLAN.takealot} target="_blank" rel="noreferrer">
                Takealot
              </a>{" "}
              ·{" "}
              <a href={PLAN.amazon} target="_blank" rel="noreferrer">
                Amazon
              </a>{" "}
              ·{" "}
              <a href={PLAN.kindle} target="_blank" rel="noreferrer">
                Kindle eBook
              </a>
            </p>

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

          {isDay(day) && (
            <div className="mt-[18px]">
              <Panel eyebrow={`Word study · ${dayLabel(day, { weekday: false })}`} title="Study a word">
                <QuickWord
                  day={day}
                  verseHint={verseHint}
                  onSaved={(w) => {
                    setOpenWord(w.id);
                    window.setTimeout(() => {
                      document.getElementById(`word-${w.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }, 80);
                  }}
                />
              </Panel>
            </div>
          )}
        </div>

        {/* ── The open day ────────────────────────────────────────── */}
        <div className="dash-col-7">
          <Panel
            eyebrow={
              day === TRASH
                ? "Nothing is ever lost"
                : day === UNDATED
                ? "Notes without a day"
                : [
                    `Day ${planDay(day).n} of ${planDay(day).of}`,
                    dayPages.length ? `Page ${dayPages.join(", ")}` : "",
                    dayChapters.join(" · "),
                  ]
                    .filter(Boolean)
                    .join(" · ")
            }
            title={day === TRASH ? "Recently deleted" : day === UNDATED ? "No day set" : dayLabel(day)}
            action={
              isDay(day) ? (
                <div className="flex gap-1">
                  {client.readerUrl && (
                    <a
                      className="dash-btn dash-btn-ghost dash-note-nav"
                      href={`${client.readerUrl}?day=${day}`}
                      title="See this day the way a reader would"
                    >
                      Reader view
                    </a>
                  )}
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
            {day === TRASH && (
              <div className="dash-note-list">
                {trash.length === 0 && <div className="dash-word-hint">Nothing here.</div>}
                {trash.map((n) => (
                  <article key={n.id} className="dash-note-trash">
                    <div className="dash-note-ref">
                      <span className="text-[12px] text-[var(--colour-amber-soft)]">
                        {n.day ? dayLabel(n.day, { weekday: false }) : "No day"}
                        {passageOf(n) ? ` · ${formatPassage(passageOf(n))}` : ""}
                      </span>
                    </div>
                    <div className="dash-note-body">
                      <NoteText text={n.text} />
                    </div>
                    <div className="dash-note-actions" style={{ opacity: 1 }}>
                      <button type="button" className="dash-word-link" onClick={() => restore(n)}>
                        Restore
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {isDay(day) && (
              <a className="dash-plan-link" href={bibleAppDay(planDay(day).n)} target="_blank" rel="noreferrer">
                📖 Day {planDay(day).n}&apos;s reading in the Bible App (NIV) ↗
              </a>
            )}

            {isDay(day) &&
              (dayEdit ? (
                <div className="dash-day-edit">
                  <input
                    className="dash-input dash-day-title-input"
                    placeholder="A title for this day, e.g. Jesus and the woman at the well"
                    value={dayEdit.title}
                    onChange={(e) => setDayEdit({ ...dayEdit, title: e.target.value })}
                    autoFocus
                  />
                  <GrowingTextarea
                    className="dash-textarea dash-word-field"
                    placeholder="Key takeaway - the one thing to remember from today's reading."
                    value={dayEdit.takeaway}
                    onChange={(e) => setDayEdit({ ...dayEdit, takeaway: e.target.value })}
                  />
                  {client.sharing && (
                    <label className="dash-day-share">
                      <input
                        type="checkbox"
                        checked={dayEdit.shared}
                        onChange={(e) => setDayEdit({ ...dayEdit, shared: e.target.checked })}
                      />
                      Include this day when I share my study
                    </label>
                  )}
                  <div className="flex gap-2">
                    <button type="button" className="dash-btn dash-btn-primary" onClick={saveDayDetails}>
                      Save
                    </button>
                    <button type="button" className="dash-btn dash-btn-ghost" onClick={() => setDayEdit(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : days[day]?.title || days[day]?.takeaway ? (
                <button
                  type="button"
                  className="dash-day-head"
                  onClick={() =>
                    setDayEdit({ title: days[day].title, takeaway: days[day].takeaway, shared: days[day].shared })
                  }
                  title="Edit the title and takeaway"
                >
                  {days[day].title && <span className="dash-day-title">{days[day].title}</span>}
                  {days[day].takeaway && <span className="dash-day-takeaway">{days[day].takeaway}</span>}
                  {client.sharing && !days[day].shared && (
                    <span className="dash-day-private">🔒 Not included when shared</span>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  className="dash-word-link mb-3"
                  onClick={() => setDayEdit({ title: "", takeaway: "", shared: true })}
                >
                  + Add a title and key takeaway for this day
                </button>
              ))}

            {client.studyUrl && isDay(day) && studyOn.has(day.slice(5)) && (
              <a className="dash-study-link" href={`${client.studyUrl}?on=${day.slice(5)}`}>
                <span className="eyebrow eyebrow-amber">The study for {dayLabel(day, { weekday: false })}</span>
                <span className="dash-study-link-title">{studyOn.get(day.slice(5)) || "Read the notes"}</span>
                <span className="dash-study-link-go">Read →</span>
              </a>
            )}

            {otherYears.length > 0 && (
              <div className="dash-note-years">
                <span className="eyebrow">This day in other years</span>
                {otherYears.map(([d, c]) => (
                  <button key={d} type="button" className="dash-word-alt" onClick={() => openDay(d)}>
                    {d.slice(0, 4)} · {c.notes ? `${c.notes} ${c.notes === 1 ? "note" : "notes"}` : ""}
                    {c.notes && c.words ? ", " : ""}
                    {c.words ? `${c.words} ${c.words === 1 ? "word" : "words"}` : ""}
                  </button>
                ))}
              </div>
            )}

            {day !== TRASH && loaded && dayNotes.length === 0 && (
              <div className="dash-word-hint mb-4">No notes on this day yet - write them below.</div>
            )}

            {day !== TRASH && dayNotes.length > 0 && (
              <div className="dash-note-section-row">
                <button type="button" className="dash-note-section" onClick={() => toggleSection("notes")} aria-expanded={sections.notes}>
                  <span className="eyebrow eyebrow-amber">Notes · {dayNotes.length}</span>
                  <span className="dash-note-section-chev" aria-hidden>
                    {sections.notes ? "▾" : "▸"}
                  </span>
                </button>
                {sections.notes && (
                  <button
                    type="button"
                    className="dash-word-link"
                    onClick={() =>
                      setOpenNotes(
                        dayNotes.every((n) => openNotes.has(n.id)) ? new Set() : new Set(dayNotes.map((n) => n.id)),
                      )
                    }
                  >
                    {dayNotes.every((n) => openNotes.has(n.id)) ? "Close all" : "Open all"}
                  </button>
                )}
              </div>
            )}

            {day !== TRASH && sections.notes && (
            <div className="dash-note-list">
              {dayNotes.map((n, i) => {
                const p = passageOf(n);
                const v = verses[n.id];
                const isEditing = editing?.id === n.id;
                const open = isEditing || openNotes.has(n.id);
                const showPage = n.page != null && n.page !== dayNotes[i - 1]?.page;
                const preview = n.text
                  .replace(/^\s*(?:[•●▪◦*]|-(?=\s))\s*/gm, "")
                  .replace(/\s+/g, " ")
                  .trim();
                return (
                  <div key={n.id}>
                    {showPage && <div className="dash-note-pagebreak">Page {n.page}</div>}
                    <article
                      id={`note-${n.id}`}
                      className={`dash-note ${open ? "is-open" : ""} ${flash === n.id ? "is-new" : ""}`}
                    >
                      <button
                        type="button"
                        className="dash-note-head"
                        onClick={() => !isEditing && toggleNote(n.id)}
                        aria-expanded={open}
                      >
                        <span className="dash-note-head-ref">
                          {p ? formatPassage(p) : "Note"}
                          {client.sharing && n.private ? " 🔒" : ""}
                        </span>
                        <span className="dash-note-head-text">{open ? "" : preview}</span>
                        <span className="dash-note-chev" aria-hidden>
                          ›
                        </span>
                      </button>

                      {open && (
                        <div className="dash-note-open">
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

                          {!isEditing && (
                            <div className="dash-note-actions">
                              {p && (
                                <button type="button" className="dash-word-link" onClick={() => toggleVerse(n)}>
                                  {v ? "Hide verse" : "Read verse"}
                                </button>
                              )}
                              {client.sharing && (
                                <button
                                  type="button"
                                  className="dash-word-link"
                                  onClick={() => togglePrivate(n)}
                                  title={
                                    n.private
                                      ? "Include this note when you share your study"
                                      : "Never include this note when you share your study"
                                  }
                                >
                                  {n.private ? "🔒 Private" : "Make private"}
                                </button>
                              )}
                              <span className="flex-1" />
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
                        </div>
                      )}
                    </article>
                  </div>
                );
              })}
            </div>
            )}

            {dayWords.length > 0 && (
              <div className="dash-note-words">
                <button type="button" className="dash-note-section" onClick={() => toggleSection("words")} aria-expanded={sections.words}>
                  <span className="eyebrow eyebrow-amber">Words studied · {dayWords.length}</span>
                  <span className="dash-note-section-chev" aria-hidden>
                    {sections.words ? "▾" : "▸"}
                  </span>
                </button>
                {sections.words && dayWords.map((w) => (
                  <WordRow
                    key={w.id}
                    w={w}
                    open={openWord === w.id}
                    onToggle={() => setOpenWord((id) => (id === w.id ? null : w.id))}
                    onEdit={() => window.location.assign(`${client.wordsUrl}?edit=${encodeURIComponent(w.id)}`)}
                    onDelete={() => removeWord(w.id, w.word)}
                  />
                ))}
              </div>
            )}

            {/* ── Write for this day ─────────────────────────────── */}
            {day !== TRASH && (
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
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
