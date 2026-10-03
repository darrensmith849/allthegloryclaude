"use client";

// The Study's front door, in the album flyer's style: today's reading,
// the owner's notes for today, the member's progress, the reading plan and
// the album.

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { canRead, studyName, useMe } from "@/components/study/shell";
import { ShareLink } from "@/components/study/share-link";
import { dayLabel, planDay, shiftDay, todayDay, type StudyDay } from "@/lib/dashboard/notes";
import { useRouter } from "next/navigation";
import { bibleAppDay, PLAN, STUDY_HEART } from "@/lib/study/plan";

export default function StudyHome() {
  const me = useMe();
  const router = useRouter();
  // Visitors see The Study on the main site; this page is members' home.
  useEffect(() => {
    if (me.loaded && !me.member) router.replace("/the-study");
  }, [me.loaded, me.member, router]);
  const readable = canRead(me);
  const today = todayDay();
  const n = planDay(today).n;
  const author = me.study?.author && me.study.author !== "All The Glory" ? me.study.author : null;

  // The owner's study: is there a day for today's date (any year)?
  const [studyToday, setStudyToday] = useState<{ title: string } | null | undefined>(undefined);
  useEffect(() => {
    if (!readable) return;
    fetch("/api/study/read?only=contents", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { contents?: { day: string; title: string; chapters: string[] }[] } | null) => {
        const hit = [...(d?.contents ?? [])].reverse().find((c) => c.day.slice(5) === today.slice(5));
        setStudyToday(hit ? { title: hit.title || hit.chapters.join(" · ") } : null);
      })
      .catch(() => setStudyToday(null));
  }, [readable, today]);

  // This week's reflection from the owner (members).
  const [weekly, setWeekly] = useState<{ title: string; body: string; question: string | null } | null>(null);
  useEffect(() => {
    if (!me.member) return;
    fetch("/api/study/weekly", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { reflection?: { title: string; body: string; question: string | null } | null } | null) =>
        setWeekly(d?.reflection ?? null),
      )
      .catch(() => {});
  }, [me.member]);

  // A friend's invite link of their own.
  const [invite, setInvite] = useState<string | null>(null);
  useEffect(() => {
    if (!me.member) return;
    fetch("/api/study/invite", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { code?: string } | null) => d?.code && setInvite(`${window.location.origin}/the-study?invite=${d.code}`))
      .catch(() => {});
  }, [me.member]);

  // Answers to their questions they haven't seen yet.
  const [answered, setAnswered] = useState(0);
  useEffect(() => {
    if (!me.member) return;
    let seen: string[] = [];
    try {
      seen = JSON.parse(window.localStorage.getItem(`atg:study:${me.member.id}:seenAnswers`) ?? "[]") as string[];
    } catch {
      // private window
    }
    fetch("/api/study/questions", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { mine?: { id: string; status: string }[] } | null) =>
        setAnswered((d?.mine ?? []).filter((q) => q.status === "answered" && !seen.includes(q.id)).length),
      )
      .catch(() => {});
  }, [me.member]);

  // Where they left off: the latest day they wrote in or ticked as read.
  const [lastDay, setLastDay] = useState<string | null>(null);
  useEffect(() => {
    if (!me.member) return;
    try {
      const notes = JSON.parse(window.localStorage.getItem(`atg:study:${me.member.id}:notes`) ?? "[]") as {
        day: string | null;
        deletedAt: number | null;
      }[];
      const latest = notes
        .filter((n) => n.day && !n.deletedAt)
        .map((n) => n.day as string)
        .sort()
        .pop();
      if (latest) setLastDay((d) => (d && d > latest ? d : latest));
    } catch {
      // private window
    }
  }, [me.member]);

  // The member's reading progress.
  const [days, setDays] = useState<StudyDay[]>([]);
  useEffect(() => {
    if (!me.member) return;
    fetch("/api/study/days", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { days?: StudyDay[] } | null) => {
        setDays(d?.days ?? []);
        const lastRead = (d?.days ?? []).filter((x) => x.readAt).map((x) => x.day).sort().pop();
        if (lastRead) setLastDay((cur) => (cur && cur > lastRead ? cur : lastRead));
      })
      .catch(() => {});
  }, [me.member]);
  const read = useMemo(() => new Set(days.filter((d) => d.readAt).map((d) => d.day)), [days]);
  const readThisYear = [...read].filter((d) => d.startsWith(today.slice(0, 4))).length;
  const streak = useMemo(() => {
    let d = read.has(today) ? today : shiftDay(today, -1);
    let count = 0;
    while (read.has(d)) {
      count++;
      d = shiftDay(d, -1);
    }
    return count;
  }, [read, today]);
  async function toggleToday() {
    const r = await fetch("/api/study/days", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ day: today, read: !read.has(today) }),
    }).catch(() => null);
    const data = r?.ok ? ((await r.json()) as { day?: StudyDay }) : null;
    if (data?.day) setDays((list) => [...list.filter((x) => x.day !== today), data.day!]);
  }

  // Ask members once (per device) if they'd like email updates.
  const askKey = me.member ? `atg:study:${me.member.id}:emailAsk` : "";
  const [asked, setAsked] = useState(true);
  const [thanks, setThanks] = useState(false);
  useEffect(() => {
    if (!askKey) return;
    try {
      setAsked(window.localStorage.getItem(askKey) === "1");
    } catch {
      setAsked(false);
    }
  }, [askKey]);
  const answer = async (yes: boolean) => {
    try {
      window.localStorage.setItem(askKey, "1");
    } catch {
      // private window - they'll just be asked again
    }
    if (yes) {
      await fetch("/api/study/me", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ emailUpdates: true }),
      }).catch(() => {});
      setThanks(true);
      void me.refresh();
    }
    setAsked(true);
  };

  return (
    <div className="study-home">
      <header className="study-hero">
        <Image src="/media/dove-mark.png" alt="" width={64} height={64} className="study-hero-dove" priority />
        <div className="study-hero-mark">All The Glory</div>
        <div className="study-hero-sub">The Study · {PLAN.name} · NIV</div>
        <h1 className="study-home-title">Read through the Bible in the order it happened.</h1>
        <p className="study-home-lead">
          {me.study?.intro ||
            "One day at a time - with notes on what each passage says, the Hebrew and Greek behind its key words, and room to write your own."}
        </p>
        {me.member && <p className="study-home-hello">Welcome back, {me.member.name.split(" ")[0]}.</p>}
      </header>

      {me.member && !me.member.emailUpdates && !asked && (
        <div className="study-ask">
          <span>Would you like the occasional email when new studies, music or videos go up?</span>
          <span className="flex gap-2">
            <button type="button" className="dash-btn dash-btn-primary" onClick={() => answer(true)}>
              Yes, email me
            </button>
            <button type="button" className="dash-btn dash-btn-ghost" onClick={() => answer(false)}>
              No thanks
            </button>
          </span>
        </div>
      )}
      {thanks && <p className="dash-word-saved mt-4">✓ You&apos;re on the list - change it any time on your Account page.</p>}

      {answered > 0 && (
        <Link href="/study/community#questions" className="study-weekly study-answered">
          <span className="eyebrow eyebrow-amber">Your question</span>
          <span className="study-weekly-title">
            {author ?? "The study"} answered {answered === 1 ? "your question" : `${answered} of your questions`}
          </span>
          <span className="study-weekly-go">Read the answer →</span>
        </Link>
      )}

      {lastDay && lastDay !== today && (
        <Link href={`/study/journal?day=${lastDay}`} className="study-resume">
          <span>
            Pick up where you left off · <strong>Day {planDay(lastDay).n}</strong>, {dayLabel(lastDay, { weekday: false })}
          </span>
          <span aria-hidden>→</span>
        </Link>
      )}

      {weekly && (
        <Link href="/study/community" className="study-weekly">
          <span className="eyebrow eyebrow-amber">This week from {author ?? "the study"}</span>
          <span className="study-weekly-title">{weekly.title}</span>
          <span className="study-weekly-text">{weekly.body.replace(/\s+/g, " ").slice(0, 220)}{weekly.body.length > 220 ? "…" : ""}</span>
          <span className="study-weekly-go">{weekly.question ? "Read it and check in →" : "Read it →"}</span>
        </Link>
      )}

      {/* ── Today ───────────────────────────────────────────── */}
      <section className="study-today">
        <div className="eyebrow eyebrow-amber">
          Today · Day {n} of 365 · {dayLabel(today)}
        </div>
        <h2 className="study-today-title">Today&apos;s reading</h2>
        <div className="study-today-actions">
          <a className="study-today-step" href={bibleAppDay(n)} target="_blank" rel="noreferrer">
            <span className="study-today-num">1</span>
            <span>
              <strong>Read the passages</strong>
              <em>Day {n} in the Bible App · NIV ↗</em>
            </span>
          </a>
          {readable && (
            <Link className="study-today-step" href={me.member ? `/study/journal?day=${today}&daniel=1` : "/study/read"}>
              <span className="study-today-num">2</span>
              <span>
                <strong>{author ? `Read ${author}'s notes` : "Read the study notes"}</strong>
                <em>
                  {studyToday === undefined
                    ? "…"
                    : studyToday
                      ? studyToday.title || "For today's reading"
                      : "Not written for today yet - see the latest"}
                </em>
              </span>
            </Link>
          )}
          {me.member ? (
            <Link className="study-today-step" href={`/study/journal?day=${today}`}>
              <span className="study-today-num">{readable ? 3 : 2}</span>
              <span>
                <strong>Write your own notes</strong>
                <em>And study a word from today</em>
              </span>
            </Link>
          ) : (
            me.loaded && (
              <Link className="study-today-step" href="/study/login">
                <span className="study-today-num">{readable ? 3 : 2}</span>
                <span>
                  <strong>Keep your own journal</strong>
                  <em>{me.study?.signup === "open" ? "Log in or make an account" : "Log in - joining is by invite for now"}</em>
                </span>
              </Link>
            )
          )}
        </div>

        {me.member && (
          <div className="study-progress">
            <div className="study-progress-row">
              <span>
                <strong>{readThisYear}</strong> of 365 days read in {today.slice(0, 4)}
                {streak > 1 && <span className="dash-read-streak ml-2">{streak}-day streak</span>}
              </span>
              <button
                type="button"
                className={`dash-btn dash-btn-ghost dash-note-nav dash-read-btn ${read.has(today) ? "is-read" : ""}`}
                onClick={toggleToday}
              >
                {read.has(today) ? "✓ Read today" : "Mark today as read"}
              </button>
            </div>
            <span className="dash-read-bar" aria-hidden>
              <span style={{ width: `${Math.min(100, (readThisYear / 365) * 100)}%` }} />
            </span>
          </div>
        )}
      </section>

      <div className="study-cards">
        {readable && (
          <Link href={me.member ? "/study/journal?daniel=1" : "/study/read"} className="study-card">
            <span className="eyebrow eyebrow-amber">Follow along</span>
            <span className="study-card-title">{studyName(me.study)}</span>
            <span className="study-card-text">{me.study?.intro || STUDY_HEART}</span>
          </Link>
        )}
        {me.member && (
          <Link href="/study/journal" className="study-card">
            <span className="eyebrow eyebrow-amber">Your journal</span>
            <span className="study-card-title">My journal</span>
            <span className="study-card-text">
              Your notes and word studies on a calendar - private to you, kept for good.
            </span>
          </Link>
        )}
        <div className="study-card is-static">
          <span className="eyebrow eyebrow-amber">The reading plan</span>
          <span className="study-card-title">{PLAN.name}</span>
          <span className="study-card-text">
            {PLAN.edition} - the whole Bible in 365 readings, in the order events happened. Free in the{" "}
            <a className="study-link" href={PLAN.bibleApp} target="_blank" rel="noreferrer">
              Bible App
            </a>
            , or get the NIV book:{" "}
            <a className="study-link" href={PLAN.takealot} target="_blank" rel="noreferrer">
              Takealot
            </a>{" "}
            ·{" "}
            <a className="study-link" href={PLAN.amazon} target="_blank" rel="noreferrer">
              Amazon
            </a>{" "}
            ·{" "}
            <a className="study-link" href={PLAN.kindle} target="_blank" rel="noreferrer">
              Kindle
            </a>
          </span>
          <span className="study-card-hint">
            In the Bible App, if you see another translation, tap its name at the top and choose NIV - it remembers.
          </span>
        </div>
      </div>

      {invite && (
        <section className="study-invite" id="invite">
          <div className="eyebrow eyebrow-amber">Invite a friend</div>
          <h2 className="study-today-title">Read through the Bible together</h2>
          <p className="study-card-text mb-4">
            Know someone who&apos;d love to read along? Send them your link - they&apos;ll have their own private journal,
            and you&apos;ll both be on the same day of the plan.
          </p>
          <ShareLink
            url={invite}
            subject="Read through the Bible with me"
            message="I'm reading through the Bible in the order it happened with The Study from All The Glory - join me:"
          />
        </section>
      )}

    </div>
  );
}
