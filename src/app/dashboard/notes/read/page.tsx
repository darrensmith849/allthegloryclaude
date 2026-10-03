"use client";

// Reader view: one reading day of the study the way someone reading it
// would see it - title, takeaway, notes in order and the words studied,
// without private notes or personal word comments. Only the owner can see
// it for now (it sits behind the dashboard login); it's the shape a public
// chronological study would take later.

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { NoteText } from "@/components/dashboard/note-text";
import { useWords } from "@/lib/dashboard/words-store";
import { languageLabel } from "@/lib/dashboard/words";
import {
  chapterLabel,
  dayLabel,
  formatPassage,
  isDay,
  passageOf,
  planDay,
  readingOrder,
  type Passage,
  type StudyDay,
  type StudyNote,
} from "@/lib/dashboard/notes";

const NOTES_CACHE = "atg:notes:v1";
const DAYS_CACHE = "atg:notes:days";
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function readStore<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

const chaptersOf = (list: StudyNote[]) => [
  ...new Set(list.map(passageOf).filter((p): p is Passage => Boolean(p)).map(chapterLabel)),
];

// useSearchParams needs a Suspense boundary so the page can still prerender.
export default function ReaderPage() {
  return (
    <Suspense fallback={null}>
      <Reader />
    </Suspense>
  );
}

function Reader() {
  const params = useSearchParams();
  const router = useRouter();
  const { words } = useWords();
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [days, setDays] = useState<Record<string, StudyDay>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setNotes(readStore<StudyNote[]>(NOTES_CACHE, []));
    setDays(readStore<Record<string, StudyDay>>(DAYS_CACHE, {}));
    fetch("/api/study-notes", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { notes?: StudyNote[] } | null) => data?.notes && setNotes(data.notes))
      .catch(() => {})
      .finally(() => setLoaded(true));
    fetch("/api/study-days", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { days?: StudyDay[] } | null) => {
        if (data?.days) setDays(Object.fromEntries(data.days.map((d) => [d.day, d])));
      })
      .catch(() => {});
  }, []);

  const live = useMemo(() => readingOrder(notes.filter((n) => !n.deletedAt && n.day)), [notes]);
  // Every day with notes or words, oldest first - the order of the study.
  const studied = useMemo(
    () => [...new Set([...live.map((n) => n.day as string), ...words.map((w) => w.day).filter(isDay)])].sort(),
    [live, words],
  );

  const asked = params.get("day");
  const day = isDay(asked) ? asked : (studied[studied.length - 1] ?? null);
  const prev = day ? studied.filter((d) => d < day).pop() : undefined;
  const next = day ? studied.find((d) => d > day) : undefined;

  const go = (d: string) => {
    router.replace(`/dashboard/notes/read?day=${d}`, { scroll: false });
    window.scrollTo({ top: 0 });
  };

  // ← → move between studied days.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowLeft" && prev) go(prev);
      if (e.key === "ArrowRight" && next) go(next);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prev, next]);

  const dayNotes = day ? live.filter((n) => n.day === day) : [];
  const shown = dayNotes.filter((n) => !n.private);
  const hidden = dayNotes.length - shown.length;
  const dayWords = day ? words.filter((w) => w.day === day) : [];
  const info = day ? days[day] : undefined;
  const chapters = chaptersOf(shown.length ? shown : dayNotes);

  // Contents, grouped by month.
  const contents = useMemo(() => {
    const groups: { label: string; days: string[] }[] = [];
    for (const d of studied) {
      const [y, m] = d.split("-").map(Number);
      const label = `${MONTHS[m - 1]} ${y}`;
      const last = groups[groups.length - 1];
      if (last?.label === label) last.days.push(d);
      else groups.push({ label, days: [d] });
    }
    return groups;
  }, [studied]);

  if (!day) {
    return (
      <div className="dash-reader">
        <ReaderBar day={null} />
        <p className="dash-reader-empty">{loaded ? "Nothing to read yet - write your first note." : "Opening…"}</p>
      </div>
    );
  }

  const plan = planDay(day);

  return (
    <div className="dash-reader">
      <ReaderBar day={day} />

      {info && !info.shared && (
        <div className="dash-reader-warn">🔒 This day is set to stay out when you share your study.</div>
      )}

      <article className="dash-reader-page">
        <div className="dash-reader-eyebrow">
          Day {plan.n} · {dayLabel(day)}
        </div>
        <h1 className="dash-reader-title">{info?.title || chapters.join(" · ") || dayLabel(day)}</h1>
        {info?.title && chapters.length > 0 && <div className="dash-reader-chapters">{chapters.join(" · ")}</div>}
        {info?.takeaway && <blockquote className="dash-reader-takeaway">{info.takeaway}</blockquote>}

        {shown.map((n) => {
          const p = passageOf(n);
          return (
            <section key={n.id} className="dash-reader-note">
              {p && <h2 className="dash-reader-ref">{formatPassage(p)}</h2>}
              <NoteText text={n.text} />
            </section>
          );
        })}
        {!shown.length && (
          <p className="dash-reader-empty">
            {dayNotes.length ? "Every note on this day is private." : "No notes on this day."}
          </p>
        )}
        {hidden > 0 && (
          <p className="dash-reader-hidden">
            🔒 {hidden} private note{hidden === 1 ? "" : "s"} not shown.
          </p>
        )}

        {dayWords.length > 0 && (
          <section className="dash-reader-words">
            <h2 className="dash-reader-section">Words studied</h2>
            {dayWords.map((w) => (
              <div key={w.id} className="dash-reader-word">
                <div className="dash-reader-word-head">
                  <span className="dash-reader-word-name">{w.word}</span>
                  {w.original && (
                    <span className="dash-word-script" dir="auto">
                      {w.original}
                    </span>
                  )}
                  {w.translit && <span className="dash-word-translit">{w.translit}</span>}
                  {w.strongs && <span className="dash-word-source">{w.strongs}</span>}
                </div>
                {w.originalMeaning && (
                  <p>
                    <span className="dash-reader-label">{languageLabel(w)}</span> {w.originalMeaning}
                  </p>
                )}
                {w.englishMeaning && (
                  <p>
                    <span className="dash-reader-label">English</span> {w.englishMeaning}
                  </p>
                )}
                {w.application && <p className="dash-reader-word-life">{w.application}</p>}
              </div>
            ))}
            {dayWords.some((w) => w.comment) && (
              <p className="dash-reader-hidden">Your own comments on words aren&apos;t shown.</p>
            )}
          </section>
        )}
      </article>

      <nav className="dash-reader-nav" aria-label="Days">
        {prev ? (
          <button type="button" className="dash-reader-step" onClick={() => go(prev)}>
            <span>← Previous day</span>
            {days[prev]?.title || dayLabel(prev)}
          </button>
        ) : (
          <span />
        )}
        {next ? (
          <button type="button" className="dash-reader-step is-next" onClick={() => go(next)}>
            <span>Next day →</span>
            {days[next]?.title || dayLabel(next)}
          </button>
        ) : (
          <span />
        )}
      </nav>

      <details className="dash-reader-contents">
        <summary>
          Contents · {studied.length} day{studied.length === 1 ? "" : "s"}
        </summary>
        {contents.map((g) => (
          <div key={g.label} className="dash-reader-month">
            <div className="dash-reader-month-label">{g.label}</div>
            {g.days.map((d) => (
              <button
                key={d}
                type="button"
                className={`dash-reader-toc ${d === day ? "is-on" : ""}`}
                onClick={() => go(d)}
              >
                <span className="dash-reader-toc-day">Day {planDay(d).n}</span>
                <span className="dash-reader-toc-title">
                  {days[d]?.title || chaptersOf(live.filter((n) => n.day === d)).join(" · ") || dayLabel(d)}
                </span>
                {days[d] && !days[d].shared && <span title="Not included when shared">🔒</span>}
              </button>
            ))}
          </div>
        ))}
      </details>
    </div>
  );
}

function ReaderBar({ day }: { day: string | null }) {
  return (
    <div className="dash-reader-bar">
      <a className="dash-word-link" href={day ? `/dashboard/notes?day=${day}` : "/dashboard/notes"}>
        ← Back to Study Notes
      </a>
      <span className="dash-reader-badge">Preview · only you can see this</span>
    </div>
  );
}
