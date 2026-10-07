"use client";

// A month or a year of the journal laid out as a book - each day's title and
// takeaway, its notes under their page and passage, and the words studied -
// for printing or "Save as PDF". Uses the open study's own APIs, so it's the
// same page for the owner and for members.

import { useEffect, useMemo, useState } from "react";
import { NoteText } from "@/components/dashboard/note-text";
import type { BibleWord } from "@/lib/dashboard/types";
import { dayLabel, formatPassage, passageOf, planDay, readingOrder, todayDay, type StudyDay, type StudyNote } from "@/lib/dashboard/notes";
import { useStudyClient } from "@/lib/study/client";
import { bookDate, inPlan } from "@/lib/study/plan";

type Range = "month" | "year";

async function getJson<T>(url: string): Promise<T | null> {
  const r = await fetch(url, { cache: "no-store" }).catch(() => null);
  return r?.ok ? ((await r.json().catch(() => null)) as T | null) : null;
}

export function JournalPrint({ name }: { name?: string }) {
  const client = useStudyClient();
  const [notes, setNotes] = useState<StudyNote[] | null>(null);
  const [days, setDays] = useState<StudyDay[]>([]);
  const [words, setWords] = useState<BibleWord[]>([]);
  const [range, setRange] = useState<Range>("month");
  // Set in the browser (the owner's page is pre-rendered, so not at build time).
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  useEffect(() => {
    const asked = new URLSearchParams(window.location.search).get("month");
    setMonth(asked && /^\d{4}-\d{2}$/.test(asked) ? asked : todayDay().slice(0, 7));
    setYear(todayDay().slice(0, 4));
  }, []);
  const [starredOnly, setStarredOnly] = useState(false);
  const [withWords, setWithWords] = useState(true);

  useEffect(() => {
    void Promise.all([
      getJson<{ notes?: StudyNote[] }>(client.notesApi),
      getJson<{ days?: StudyDay[] }>(client.daysApi),
      getJson<{ words?: BibleWord[] }>(client.wordsApi),
    ]).then(([n, d, w]) => {
      setNotes((n?.notes ?? []).filter((x) => !x.deletedAt));
      setDays(d?.days ?? []);
      setWords((w?.words ?? []).filter((x) => !x.deletedAt));
    });
  }, [client.notesApi, client.daysApi, client.wordsApi]);

  const prefix = range === "month" ? month : year;
  const years = useMemo(() => {
    const all = new Set<string>(year ? [year] : []);
    for (const n of notes ?? []) if (n.day) all.add(n.day.slice(0, 4));
    return [...all].sort().reverse();
  }, [notes, year]);

  // Every day in the range with something written on it, oldest first.
  const book = useMemo(() => {
    if (!notes || !prefix) return [];
    const inRange = (d?: string | null) => Boolean(d && d.startsWith(prefix));
    const dayInfo = new Map(days.map((d) => [d.day, d]));
    const byDay = new Map<string, { notes: StudyNote[]; words: BibleWord[] }>();
    for (const n of readingOrder(notes)) {
      if (!inRange(n.day) || (starredOnly && !n.starredAt && !dayInfo.get(n.day as string)?.starredAt)) continue;
      const e = byDay.get(n.day as string) ?? { notes: [], words: [] };
      e.notes.push(n);
      byDay.set(n.day as string, e);
    }
    if (withWords && !starredOnly) {
      for (const w of words) {
        if (!inRange(w.day)) continue;
        const e = byDay.get(w.day as string) ?? { notes: [], words: [] };
        e.words.push(w);
        byDay.set(w.day as string, e);
      }
    }
    return [...byDay.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([day, e]) => ({ day, info: dayInfo.get(day), ...e }));
  }, [notes, days, words, prefix, starredOnly, withWords]);

  const rangeLabel = !prefix
    ? ""
    : range === "month"
      ? new Date(`${month}-01T12:00:00`).toLocaleDateString("en-GB", client.kind === "member" ? { month: "long" } : { month: "long", year: "numeric" })
      : year;
  const noteCount = book.reduce((a, d) => a + d.notes.length, 0);

  return (
    <div className="dash-print">
      <div className="dash-pagehead no-print">
        <div>
          <div className="eyebrow eyebrow-amber">Keep it on paper</div>
          <h1 className="dash-title mt-1">Print my journal</h1>
          <div className="dash-subtitle">A month or a year of your notes, laid out like a book - print it, or save it as a PDF.</div>
        </div>
      </div>
      <div className="dash-print-tools no-print">
        <div className="dash-toggle">
          <button type="button" className={range === "month" ? "is-on" : ""} onClick={() => setRange("month")}>
            A month
          </button>
          <button type="button" className={range === "year" ? "is-on" : ""} onClick={() => setRange("year")}>
            A year
          </button>
        </div>
        {range === "month" ? (
          <input type="month" className="dash-input dash-print-pick" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} aria-label="Month" />
        ) : (
          <select className="dash-select dash-print-pick" value={year} onChange={(e) => setYear(e.target.value)} aria-label="Year">
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        )}
        <label className="dash-print-check">
          <input type="checkbox" checked={starredOnly} onChange={(e) => setStarredOnly(e.target.checked)} /> Starred days and notes only
        </label>
        {!starredOnly && (
          <label className="dash-print-check">
            <input type="checkbox" checked={withWords} onChange={(e) => setWithWords(e.target.checked)} /> Include word studies
          </label>
        )}
        <span className="flex-1" />
        <button type="button" className="dash-btn dash-btn-primary" onClick={() => window.print()} disabled={!book.length}>
          Print or save as PDF
        </button>
      </div>
      <p className="dash-word-hint no-print mb-6">
        Tip: in the print window choose &ldquo;Save as PDF&rdquo; to keep a copy, or print it for your Bible.
      </p>

      <article className="dash-print-page">
        <header className="dash-print-cover">
          <div className="dash-print-eyebrow">All The Glory · The Study</div>
          <h1>{starredOnly ? "My starred days and notes" : "My Bible study journal"}</h1>
          <p className="dash-print-range">{rangeLabel}</p>
          {name && <p className="dash-print-name">{name}</p>}
          {notes && (
            <p className="dash-print-count">
              {book.length} {book.length === 1 ? "day" : "days"} · {noteCount} {noteCount === 1 ? "note" : "notes"}
            </p>
          )}
        </header>

        {notes === null && <p className="dash-word-hint">Gathering your journal…</p>}
        {notes && !book.length && (
          <p className="dash-word-hint">
            Nothing written in {rangeLabel} yet{starredOnly ? " that you've starred" : ""} - pick another {range}.
          </p>
        )}

        {book.map(({ day, info, notes: dayNotes, words: dayWords }) => {
          let lastPage: number | null = null;
          return (
            <section key={day} className="dash-print-day">
              <div className="dash-print-dayhead">
                {info?.starredAt ? "★ " : ""}Day {planDay(day).n} · {client.kind === "member" && inPlan(day) ? bookDate(day) : dayLabel(day)}
              </div>
              {info?.title && <h2>{info.title}</h2>}
              {info?.takeaway && <blockquote>{info.takeaway}</blockquote>}
              {dayNotes.map((n) => {
                const showPage = n.page != null && n.page !== lastPage;
                lastPage = n.page ?? lastPage;
                const p = passageOf(n);
                return (
                  <div key={n.id} className="dash-print-note">
                    {showPage && <div className="dash-print-pagenum">Page {n.page}</div>}
                    <div className="dash-print-ref">
                      {p ? formatPassage(p) : "Note"}
                      {n.starredAt ? " ★" : ""}
                    </div>
                    <NoteText text={n.text} />
                  </div>
                );
              })}
              {dayWords.length > 0 && (
                <div className="dash-print-words">
                  <div className="dash-print-pagenum">Words studied</div>
                  {dayWords.map((w) => (
                    <div key={w.id} className="dash-print-word">
                      <strong>{w.word}</strong>
                      {w.original ? ` · ${w.original}` : ""}
                      {w.translit ? ` (${w.translit})` : ""}
                      {w.strongs ? ` · ${w.strongs}` : ""}
                      {w.englishMeaning && <p>{w.englishMeaning}</p>}
                      {w.application && <p className="dash-print-apply">{w.application}</p>}
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </article>
    </div>
  );
}
