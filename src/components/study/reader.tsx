"use client";

// The owner's study, one reading day at a time, as readers see it: the
// day's title and takeaway, notes in order, and the words studied. Data
// comes from /api/study/read, which already leaves out private notes,
// unshared days and personal word comments - so the owner's preview
// (/dashboard/notes/read) shows exactly what members read (/study/read).

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { NoteText } from "@/components/dashboard/note-text";
import { languageLabel } from "@/lib/dashboard/words";
import { dayLabel, formatPassage, passageOf, planDay } from "@/lib/dashboard/notes";
import { bibleAppDay } from "@/lib/study/plan";
import type { ReaderData } from "@/lib/study/types";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface Props {
  basePath: string; // where this reader lives, e.g. "/study/read"
  preview?: boolean; // owner preview: shows unshared days, hidden counts
  back?: { href: (day: string | null) => string; label: string };
  badge?: string;
}

export function Reader(props: Props) {
  return (
    <Suspense fallback={null}>
      <ReaderInner {...props} />
    </Suspense>
  );
}

function ReaderInner({ basePath, preview, back, badge }: Props) {
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
      {badgeText && <span className="dash-reader-badge">{badgeText}</span>}
    </div>
  );

  if (error) {
    return (
      <div className="dash-reader">
        {bar}
        <div className="dash-reader-page">
          <p className="dash-reader-empty">{error.message}</p>
          {error.login && (
            <a className="dash-btn dash-btn-primary mt-4 inline-flex" href={`/study/login?next=${encodeURIComponent(basePath)}`}>
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

  return (
    <div className={`dash-reader ${loading ? "is-loading" : ""}`}>
      {bar}

      {data.study.intro && !params.toString() && <p className="dash-reader-intro">{data.study.intro}</p>}

      {!day ? (
        <div className="dash-reader-page">
          <p className="dash-reader-empty">
            {asked
              ? "There are no notes in the study for that day yet - pick another day below."
              : "Nothing to read yet."}
          </p>
        </div>
      ) : (
        <>
          {preview && data.info && !data.info.shared && (
            <div className="dash-reader-warn">🔒 This day is set to stay out when you share your study.</div>
          )}

          <article className="dash-reader-page">
            <div className="dash-reader-eyebrow">
              Day {planDay(day).n} · {dayLabel(day)}
              {data.study.author ? ` · ${data.study.author}` : ""}
            </div>
            <h1 className="dash-reader-title">{data.info?.title || titleOf(day)}</h1>
            {data.info?.title && (data.contents.find((c) => c.day === day)?.chapters.length ?? 0) > 0 && (
              <div className="dash-reader-chapters">{data.contents.find((c) => c.day === day)?.chapters.join(" · ")}</div>
            )}
            <a className="dash-plan-link mt-3" href={bibleAppDay(planDay(day).n)} target="_blank" rel="noreferrer">
              📖 Read Day {planDay(day).n}&apos;s passages in the Bible App ↗
            </a>
            {data.info?.takeaway && <blockquote className="dash-reader-takeaway">{data.info.takeaway}</blockquote>}

            {data.notes.map((n) => {
              const p = passageOf(n);
              return (
                <section key={n.id} className="dash-reader-note">
                  {p && <h2 className="dash-reader-ref">{formatPassage(p)}</h2>}
                  <NoteText text={n.text} />
                </section>
              );
            })}
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

            {data.words.length > 0 && (
              <section className="dash-reader-words">
                <h2 className="dash-reader-section">Words studied</h2>
                {data.words.map((w) => (
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
              </section>
            )}
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

      {days.length > 0 && (
        <details className="dash-reader-contents" open={!day}>
          <summary>
            Contents · {days.length} day{days.length === 1 ? "" : "s"}
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
    </div>
  );
}
