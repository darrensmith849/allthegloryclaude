"use client";

// The owner's study, one reading day at a time, as readers see it: the
// day's title and takeaway, notes in order, and the words studied. Data
// comes from /api/study/read, which already leaves out private notes,
// unshared days and personal word comments - so the owner's preview
// (/dashboard/notes/read) shows exactly what members read (/study/read).
// Laid out like the journal: a calendar of the study's days beside the day.

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FoldNotes, FoldWords } from "@/components/study/fold-notes";
import { ShareDay } from "@/components/study/share-day";
import { isSameMonth, monthGrid, shiftMonth, startOfMonth } from "@/lib/dashboard/dates";
import { dayLabel, formatPassage, passageOf, planDay, todayDay, type StudyDay } from "@/lib/dashboard/notes";
import { bibleAppDay, STUDY_HEART } from "@/lib/study/plan";
import type { ReaderData } from "@/lib/study/types";

const WEEK = ["M", "T", "W", "T", "F", "S", "S"];
const SIZE_KEY = "atg:reader:size";
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface Props {
  basePath: string; // where this reader lives, e.g. "/study/read"
  preview?: boolean; // owner preview: shows unshared days, hidden counts
  back?: { href: (day: string | null) => string; label: string };
  badge?: string;
  member?: boolean; // a signed-in member: can tick the day read in their own plan
}

export function Reader(props: Props) {
  return (
    <Suspense fallback={null}>
      <ReaderInner {...props} />
    </Suspense>
  );
}

function ReaderInner({ basePath, preview, back, badge, member }: Props) {
  const params = useSearchParams();
  const router = useRouter();
  const [data, setData] = useState<ReaderData | null>(null);
  const [error, setError] = useState<{ message: string; login?: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  const query = params.toString();
  useEffect(() => {
    let live = true;
    setLoading(true);
    const qs = new URLSearchParams(query);
    if (preview) qs.set("preview", "1");
    fetch(`/api/study/read?${qs}`, { cache: "no-store" })
      .then(async (r) => {
        const body = (await r.json().catch(() => ({}))) as ReaderData & { error?: string; login?: boolean };
        if (!live) return;
        if (!r.ok) {
          setError({ message: body.error ?? "Couldn't open the study.", login: body.login });
          return;
        }
        setError(null);
        setData(body);
      })
      .catch(() => live && setError({ message: "Couldn't reach the study - check your connection." }))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [query, preview]);

  const day = data?.day ?? null;
  const days = useMemo(() => data?.contents.map((c) => c.day) ?? [], [data]);
  const prev = day ? days.filter((d) => d < day).pop() : undefined;
  const next = day ? days.find((d) => d > day) : undefined;
  const titleOf = (d: string) => {
    const c = data?.contents.find((x) => x.day === d);
    return c?.title || c?.chapters.join(" · ") || dayLabel(d);
  };

  const go = useCallback(
    (d: string) => {
      router.replace(`${basePath}?day=${d}`, { scroll: false });
      window.scrollTo({ top: 0 });
    },
    [router, basePath],
  );

  // ← → move between days.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowLeft" && prev) go(prev);
      if (e.key === "ArrowRight" && next) go(next);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next, go]);

  // Contents, grouped by month.
  const contents = useMemo(() => {
    const groups: { label: string; days: string[] }[] = [];
    for (const d of days) {
      const [y, m] = d.split("-").map(Number);
      const label = `${MONTHS[m - 1]} ${y}`;
      const last = groups[groups.length - 1];
      if (last?.label === label) last.days.push(d);
      else groups.push({ label, days: [d] });
    }
    return groups;
  }, [days]);

  // The calendar shows the month of the open day.
  const today = todayDay();
  const dayset = useMemo(() => new Set(days), [days]);
  const [month, setMonth] = useState<string | null>(null);
  useEffect(() => {
    if (day) setMonth(startOfMonth(day));
    else if (days.length) setMonth((m) => m ?? startOfMonth(days[days.length - 1]));
  }, [day, days]);
  const goToday = () => {
    const hit = [...days].reverse().find((d) => d.slice(5) === today.slice(5));
    if (hit) go(hit);
    else setMonth(startOfMonth(today));
  };

  // Comfortable reading size, remembered on this device.
  const [size, setSize] = useState(1);
  useEffect(() => {
    try {
      const v = Number(window.localStorage.getItem(SIZE_KEY));
      if (v === 0 || v === 1 || v === 2) setSize(v);
    } catch {
      // private window
    }
  }, []);
  const resize = (v: number) => {
    setSize(v);
    try {
      window.localStorage.setItem(SIZE_KEY, String(v));
    } catch {
      // private window
    }
  };

  // Members tick the same date in their own reading year.
  const [myRead, setMyRead] = useState<Set<string>>(() => new Set());
  useEffect(() => {
    if (!member) return;
    fetch("/api/study/days", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { days?: StudyDay[] } | null) =>
        setMyRead(new Set((d?.days ?? []).filter((x) => x.readAt).map((x) => x.day))),
      )
      .catch(() => {});
  }, [member]);
  const myDay = day ? `${today.slice(0, 4)}-${day.slice(5)}` : null;
  async function toggleMyRead() {
    if (!myDay) return;
    const on = !myRead.has(myDay);
    const r = await fetch("/api/study/days", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ day: myDay, read: on }),
    }).catch(() => null);
    if (r?.ok)
      setMyRead((set) => {
        const next = new Set(set);
        if (on) next.add(myDay);
        else next.delete(myDay);
        return next;
      });
  }

  const badgeText =
    badge ??
    (preview && data
      ? {
          off: "Preview · only you can see this",
          members: "Preview · members can read this",
          public: "Preview · anyone can read this",
        }[data.study.reading]
      : undefined);

  const bar = (
    <div className="dash-reader-bar">
      {back ? (
        <a className="dash-word-link" href={back.href(day)}>
          {back.label}
        </a>
      ) : (
        <span />
      )}
      <span className="dash-reader-bar-tools">
        <span className="dash-reader-size" role="group" aria-label="Text size">
          <button type="button" onClick={() => resize(Math.max(0, size - 1))} disabled={size === 0} aria-label="Smaller text">
            A−
          </button>
          <button type="button" onClick={() => resize(Math.min(2, size + 1))} disabled={size === 2} aria-label="Bigger text">
            A+
          </button>
        </span>
        {badgeText && <span className="dash-reader-badge">{badgeText}</span>}
      </span>
    </div>
  );

  const studyTitle =
    data?.study.author && data.study.author !== "All The Glory" ? `${data.study.author}'s study` : "The study";

  if (error) {
    return (
      <div className="dash-reader">
        {bar}
        <div className="dash-reader-page">
          <p className="dash-reader-empty">{error.message}</p>
          {error.login && (
            <a className="dash-btn dash-btn-primary mt-4 inline-flex" href={`/the-study?login=1&next=${encodeURIComponent(basePath)}`}>
              Log in
            </a>
          )}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="dash-reader">
        {bar}
        <p className="dash-reader-empty">{loading ? "Opening the study…" : ""}</p>
      </div>
    );
  }

  const asked = params.get("on") ?? params.get("day");

  const calendar = month && (
    <div className="dash-reader-cal">
      <div className="eyebrow eyebrow-amber">{studyTitle}</div>
      <div className="dash-reader-cal-title">
        {new Date(`${month}T00:00:00`).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
      </div>
      <div className="dash-note-calnav dash-reader-cal-nav">
        <button type="button" className="dash-btn dash-btn-ghost dash-note-nav" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Previous month">
          ‹
        </button>
        <button type="button" className="dash-btn dash-btn-ghost dash-note-nav" onClick={goToday}>
          Today
        </button>
        <button type="button" className="dash-btn dash-btn-ghost dash-note-nav" onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Next month">
          ›
        </button>
      </div>
      <div className="dash-reader-cal-grid">
        {WEEK.map((w, i) => (
          <span key={i} className="dash-reader-cal-head">
            {w}
          </span>
        ))}
        {monthGrid(month).map((d) => {
          const has = dayset.has(d);
          return (
            <button
              key={d}
              type="button"
              disabled={!has}
              onClick={() => go(d)}
              className={`dash-reader-cal-day ${isSameMonth(d, month) ? "" : "is-other"} ${has ? "has-study" : ""} ${
                d === day ? "is-selected" : ""
              } ${d === today ? "is-today" : ""}`}
              aria-label={`${dayLabel(d)}${has ? `, ${titleOf(d)}` : ", no notes"}`}
              title={has ? titleOf(d) : undefined}
            >
              {Number(d.slice(8))}
            </button>
          );
        })}
      </div>
      <p className="dash-reader-cal-key">
        <span className="dash-reader-cal-dot" /> {days.length} {days.length === 1 ? "day" : "days"} with notes - tap one to read it
      </p>
    </div>
  );

  return (
    <div className={`dash-reader-layout ${loading ? "is-loading" : ""}`}>
      {bar}

      <aside className="dash-reader-side">
        {calendar}
        <p className="dash-reader-heart">{data.study.intro || STUDY_HEART}</p>
        {days.length > 0 && (
          <details className="dash-reader-contents">
            <summary>
              All days · {days.length}
            </summary>
            {contents.map((g) => (
              <div key={g.label} className="dash-reader-month">
                <div className="dash-reader-month-label">{g.label}</div>
                {g.days.map((d) => {
                  const c = data.contents.find((x) => x.day === d);
                  return (
                    <button
                      key={d}
                      type="button"
                      className={`dash-reader-toc ${d === day ? "is-on" : ""}`}
                      onClick={() => go(d)}
                    >
                      <span className="dash-reader-toc-day">Day {planDay(d).n}</span>
                      <span className="dash-reader-toc-title">{titleOf(d)}</span>
                      {preview && c && !c.shared && <span title="Not included when shared">🔒</span>}
                    </button>
                  );
                })}
              </div>
            ))}
          </details>
        )}
      </aside>

      <div className="dash-reader-main">

        {!day ? (
          <div className="dash-reader-page">
            <p className="dash-reader-empty">
              {asked
                ? "There are no notes in the study for that day yet - pick a gold day on the calendar."
                : "Nothing to read yet."}
            </p>
          </div>
        ) : (
          <>
            {preview && data.info && !data.info.shared && (
              <div className="dash-reader-warn">🔒 This day is set to stay out when you share your study.</div>
            )}

            <article className={`dash-reader-page size-${size}`}>
              <div className="dash-reader-eyebrow">
                Day {planDay(day).n} · {dayLabel(day)}
                {data.study.author ? ` · ${data.study.author}` : ""}
              </div>
              <h1 className="dash-reader-title">{data.info?.title || titleOf(day)}</h1>
              {data.info?.title && (data.contents.find((c) => c.day === day)?.chapters.length ?? 0) > 0 && (
                <div className="dash-reader-chapters">{data.contents.find((c) => c.day === day)?.chapters.join(" · ")}</div>
              )}
              <div className="dash-day-tools mt-3">
                <a className="dash-plan-link" href={bibleAppDay(planDay(day).n)} target="_blank" rel="noreferrer">
                  📖 Read Day {planDay(day).n}&apos;s passages in the Bible App (NIV) ↗
                </a>
                {member && myDay && (
                  <button
                    type="button"
                    className={`dash-btn dash-btn-ghost dash-note-nav dash-read-btn ${myRead.has(myDay) ? "is-read" : ""}`}
                    onClick={toggleMyRead}
                    title="Ticks this day in your own reading plan"
                  >
                    {myRead.has(myDay) ? `✓ Day ${planDay(myDay).n} read` : `Mark Day ${planDay(myDay).n} as read`}
                  </button>
                )}
                {data.study.reading !== "off" && data.info?.shared !== false && (
                  <ShareDay
                    day={day}
                    title={data.info?.title || titleOf(day)}
                    takeaway={data.info?.takeaway || undefined}
                    author={data.study.author}
                  />
                )}
              </div>
              {data.info?.takeaway && <blockquote className="dash-reader-takeaway">{data.info.takeaway}</blockquote>}

              <FoldNotes notes={data.notes} />
              {!data.notes.length && (
                <p className="dash-reader-empty">
                  {data.hidden ? "Every note on this day is private." : "No notes on this day - just the words below."}
                </p>
              )}
              {preview && (data.hidden ?? 0) > 0 && (
                <p className="dash-reader-hidden">
                  🔒 {data.hidden} private note{data.hidden === 1 ? "" : "s"} not shown.
                </p>
              )}
              <FoldWords words={data.words} />
            </article>

            <nav className="dash-reader-nav" aria-label="Days">
              {prev ? (
                <button type="button" className="dash-reader-step" onClick={() => go(prev)}>
                  <span>← Previous day</span>
                  {titleOf(prev)}
                </button>
              ) : (
                <span />
              )}
              {next ? (
                <button type="button" className="dash-reader-step is-next" onClick={() => go(next)}>
                  <span>Next day →</span>
                  {titleOf(next)}
                </button>
              ) : (
                <span />
              )}
            </nav>
          </>
        )}
      </div>
    </div>
  );
}
