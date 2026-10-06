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
import { beforeStart, bibleAppDay, PLAN, startMessage, START_WHY, STUDY_HEART, STUDY_START } from "@/lib/study/plan";
import { CatchUp, missedDays } from "@/components/study/catch-up";
import { MemoryVerse } from "@/components/study/memory-verse";
import { AppCard } from "@/components/study/app-card";
import { WhyNiv } from "@/components/study/why-niv";
import { FoldToggle, useFolded } from "@/components/study/fold-toggle";

export default function StudyHome() {
  const me = useMe();
  const router = useRouter();
  // Visitors see The Study on the main site; this page is members' home.
  useEffect(() => {
    if (me.loaded && !me.member) router.replace("/the-study");
  }, [me.loaded, me.member, router]);
  const readable = canRead(me);
  const today = todayDay();
  // Until everyone starts together on Day 1, the home page points there.
  const early = beforeStart(today);
  const focus = early ? STUDY_START : today;
  const n = planDay(focus).n;
  const author = me.study?.author && me.study.author !== "All The Glory" ? me.study.author : null;
  // Effects below key on the id, not the member object (which is replaced
  // when the live check confirms the cached one) - so each loads once.
  const memberId = me.member?.id;

  // The owner's study: is there a day for today's date (any year)?
  const [studyToday, setStudyToday] = useState<{ title: string } | null | undefined>(undefined);
  useEffect(() => {
    if (!readable) return;
    fetch("/api/study/read?only=contents", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { contents?: { day: string; title: string; chapters: string[] }[] } | null) => {
        const hit = [...(d?.contents ?? [])].reverse().find((c) => c.day.slice(5) === focus.slice(5));
        setStudyToday(hit ? { title: hit.title || hit.chapters.join(" · ") } : null);
      })
      .catch(() => setStudyToday(null));
  }, [readable, focus]);

  // This week's reflection from the owner (members).
  type Weekly = { id: string; title: string; body: string; question: string | null; memoryVerse?: string | null; author?: string | null };
  const [weekly, setWeekly] = useState<Weekly | null>(null);
  const [weeklyFolded, toggleWeekly] = useFolded(`atg:study:${memberId ?? "guest"}:weeklyFolded`, weekly?.id ?? "-");
  useEffect(() => {
    if (!memberId) return;
    fetch("/api/study/weekly", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { reflection?: Weekly | null } | null) => setWeekly(d?.reflection ?? null))
      .catch(() => {});
  }, [memberId]);

  // A friend's invite link of their own.
  const [invite, setInvite] = useState<string | null>(null);
  useEffect(() => {
    if (!memberId) return;
    fetch("/api/study/invite", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { code?: string } | null) => d?.code && setInvite(`${window.location.origin}/the-study?invite=${d.code}`))
      .catch(() => {});
  }, [memberId]);

  // Answers to their questions they haven't seen yet.
  const [answered, setAnswered] = useState(0);
  useEffect(() => {
    if (!memberId) return;
    let seen: string[] = [];
    try {
      seen = JSON.parse(window.localStorage.getItem(`atg:study:${memberId}:seenAnswers`) ?? "[]") as string[];
    } catch {
      // private window
    }
    fetch("/api/study/questions", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { mine?: { id: string; status: string }[] } | null) =>
        setAnswered((d?.mine ?? []).filter((q) => q.status === "answered" && !seen.includes(q.id)).length),
      )
      .catch(() => {});
  }, [memberId]);

  // Where they left off: the latest day they wrote in or ticked as read.
  const [lastDay, setLastDay] = useState<string | null>(null);
  const [noteDays, setNoteDays] = useState<Set<string>>(() => new Set());
  useEffect(() => {
    if (!memberId) return;
    try {
      const notes = JSON.parse(window.localStorage.getItem(`atg:study:${memberId}:notes`) ?? "[]") as {
        day: string | null;
        deletedAt: number | null;
      }[];
      const written = notes.filter((n) => n.day && !n.deletedAt).map((n) => n.day as string);
      setNoteDays(new Set(written));
      const latest = written.sort().pop();
      if (latest) setLastDay((d) => (d && d > latest ? d : latest));
    } catch {
      // private window
    }
  }, [memberId]);

  // The member's reading progress.
  const [days, setDays] = useState<StudyDay[]>([]);
  const [daysLoaded, setDaysLoaded] = useState(false);
  useEffect(() => {
    if (!memberId) return;
    fetch("/api/study/days", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { days?: StudyDay[] } | null) => {
        setDays(d?.days ?? []);
        setDaysLoaded(true);
        const lastRead = (d?.days ?? []).filter((x) => x.readAt).map((x) => x.day).sort().pop();
        if (lastRead) setLastDay((cur) => (cur && cur > lastRead ? cur : lastRead));
      })
      .catch(() => {});
  }, [memberId]);
  const read = useMemo(() => new Set(days.filter((d) => d.readAt).map((d) => d.day)), [days]);
  const readThisYear = [...read].filter((d) => d.startsWith(focus.slice(0, 4))).length;
  // Days missed lately (not read and nothing written), since they joined.
  const joined = me.member ? new Date(me.member.createdAt).toLocaleDateString("en-CA") : today;
  const missed = useMemo(
    () => (memberId && daysLoaded ? missedDays(today, joined, new Set([...read, ...noteDays])) : []),
    [memberId, daysLoaded, today, joined, read, noteDays],
  );
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

      {/* ── Today ───────────────────────────────────────────── */}
      <section className="study-today">
        <div className="eyebrow eyebrow-amber">
          {early ? `Where we start · Day 1 · ${dayLabel(STUDY_START)}` : `Today · Day ${n} of 365 · ${dayLabel(today)}`}
        </div>
        <h2 className="study-today-title">{early ? "We start at the beginning - Genesis 1" : "Today's reading"}</h2>
        {early && (
          <>
            <p className="study-start-text">
              We&apos;re reading the whole Bible in the order it happened, from Day 1. {startMessage(today)}
            </p>
            <p className="study-start-why">
              <strong>Why Genesis, in October?</strong> {START_WHY}
            </p>
          </>
        )}
        <div className="study-today-actions">
          <a className="study-today-step" href={bibleAppDay(n)} target="_blank" rel="noreferrer">
            <span className="study-today-num">1</span>
            <span>
              <strong>Read the passages</strong>
              <em>Day {n} in the Bible App · NIV ↗</em>
            </span>
          </a>
          {readable && (
            <Link className="study-today-step" href={me.member ? `/study/journal?day=${focus}&daniel=1` : "/study/read"}>
              <span className="study-today-num">2</span>
              <span>
                <strong>{author ? `Read ${author}'s notes` : "Read the study notes"}</strong>
                <em>
                  {studyToday === undefined
                    ? "…"
                    : studyToday
                      ? studyToday.title || (early ? "For Day 1" : "For today's reading")
                      : early
                        ? "Day 1 - written as we go"
                        : "Not written for today yet - see the latest"}
                </em>
              </span>
            </Link>
          )}
          {me.member ? (
            <Link className="study-today-step" href={`/study/journal?day=${focus}`}>
              <span className="study-today-num">{readable ? 3 : 2}</span>
              <span>
                <strong>Write your own notes</strong>
                <em>{early ? "On Day 1 in your journal" : "And study a word from today"}</em>
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
                <strong>{readThisYear}</strong> of 365 days read{early ? " so far" : ` in ${today.slice(0, 4)}`}
                {streak > 1 && <span className="dash-read-streak ml-2">{streak}-day streak</span>}
              </span>
              {!early && (
                <button
                  type="button"
                  className={`dash-btn dash-btn-ghost dash-note-nav dash-read-btn ${read.has(today) ? "is-read" : ""}`}
                  onClick={toggleToday}
                >
                  {read.has(today) ? "✓ Read today" : "Mark today as read"}
                </button>
              )}
            </div>
            <span className="dash-read-bar" aria-hidden>
              <span style={{ width: `${Math.min(100, (readThisYear / 365) * 100)}%` }} />
            </span>
          </div>
        )}
      </section>

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
          <span className="eyebrow eyebrow-amber">{answered === 1 ? "Your question" : "Your questions"}</span>
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

      {me.member && !early && missed.length > 0 && (
        <CatchUp
          missed={missed}
          hideKey={`atg:study:${me.member.id}:catchupHidden`}
          onRead={(made) => setDays((list) => [...list.filter((x) => !made.some((m) => m.day === x.day)), ...made])}
        />
      )}

      {weekly && (
        <section className={`study-weekly study-foldable ${weeklyFolded ? "is-folded" : ""}`}>
          <FoldToggle folded={weeklyFolded} onToggle={toggleWeekly} what="this week's reflection" />
          <span className="eyebrow eyebrow-amber">This week from {weekly.author ?? author ?? "the study"}</span>
          <Link href="/study/community" className="study-weekly-title">
            {weekly.title}
          </Link>
          {!weeklyFolded && (
            <>
              <span className="study-weekly-text">
                {weekly.body.replace(/\s+/g, " ").slice(0, 220)}
                {weekly.body.length > 220 ? "…" : ""}
              </span>
              <Link href="/study/community" className="study-weekly-go">
                {weekly.question ? "Read it and check in →" : "Read it →"}
              </Link>
            </>
          )}
        </section>
      )}
      {weekly?.memoryVerse && <MemoryVerse verse={weekly.memoryVerse} reflectionId={weekly.id} author={weekly.author ?? author} />}


      {me.member && <AppCard hideKey={`atg:study:${me.member.id}:appCardHidden`} />}

      <div className="study-cards">
        <Link href="/study/names" className="study-card">
          <span className="eyebrow eyebrow-amber">Who He is</span>
          <span className="study-card-title">Names of God</span>
          <span className="study-card-text">
            El Shaddai, Yahweh Yireh, Immanuel - what each name of God and of Jesus means, where it first appears, and how
            to say it. Look up any Bible name too.
          </span>
        </Link>
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
        {me.member && (
          <Link href="/study/prayers" className="study-card">
            <span className="eyebrow eyebrow-amber">Private to you</span>
            <span className="study-card-title">Prayer list</span>
            <span className="study-card-text">
              Write down what you&apos;re praying for, with a verse to pray if you like - private to you.
            </span>
          </Link>
        )}
        {me.member && (
          <Link href="/study/journal?day=starred" className="study-card">
            <span className="eyebrow eyebrow-amber">Your highlights</span>
            <span className="study-card-title">Starred days and notes</span>
            <span className="study-card-text">
              Tap ☆ Star this day on a day you love, or ☆ Star on a single note - they&apos;re all kept here, on every device.
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
          <WhyNiv className="mt-3" />
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
