"use client";

// The Study's front door, kept short: the member's next reading (they go at
// their own pace) as read / write / mark as read, then this week's word from
// the owner, and a few cards that fold away. Everything else is in the menu.

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { canRead, useMe } from "@/components/study/shell";
import { ShareLink } from "@/components/study/share-link";
import { planDay, type StudyDay } from "@/lib/dashboard/notes";
import { useRouter } from "next/navigation";
import { bibleAppDay, bookDate, inPlan, nextPage, PLAN, WHY_NIV } from "@/lib/study/plan";
import { MemoryVerse } from "@/components/study/memory-verse";
import { AppCard } from "@/components/study/app-card";
import { FoldToggle, useFolded } from "@/components/study/fold-toggle";
import { shownThisVisit, whoAmIOff } from "@/lib/study/who-am-i";

export default function StudyHome() {
  const me = useMe();
  const router = useRouter();
  // Visitors see The Study on the main site; this page is members' home.
  useEffect(() => {
    if (me.loaded && !me.member) router.replace("/the-study");
  }, [me.loaded, me.member, router]);
  // Opening The Study opens on "Who am I?" first, each visit - unless they
  // chose not to (and not when following a link to a spot on this page).
  useEffect(() => {
    if (me.member && !window.location.hash && !shownThisVisit() && !whoAmIOff(me.member.id)) router.replace("/study/who-am-i");
  }, [me.member, router]);
  const readable = canRead(me);
  const author = me.study?.author && me.study.author !== "All The Glory" ? me.study.author : null;
  // Effects below key on the id, not the member object (which is replaced
  // when the live check confirms the cached one) - so each loads once.
  const memberId = me.member?.id;

  // The member's reading progress: their next reading is the day after the
  // furthest one they've marked as read (everyone goes at their own pace).
  const [days, setDays] = useState<StudyDay[]>([]);
  const [daysLoaded, setDaysLoaded] = useState(false);
  const read = useMemo(() => new Set(days.filter((d) => d.readAt).map((d) => d.day)), [days]);
  const readCount = useMemo(() => [...read].filter(inPlan).length, [read]);
  const started = readCount > 0;
  const focus = nextPage(read);
  const n = planDay(focus).n;
  const [justRead, setJustRead] = useState<number | null>(null);

  // The owner's study: is there a day for the member's next reading?
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

  // The invite folds away (remembered on this device).
  const [inviteFolded, toggleInvite] = useFolded(`atg:study:${memberId ?? "guest"}:inviteFolded`);

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
  useEffect(() => {
    if (!memberId) return;
    try {
      const notes = JSON.parse(window.localStorage.getItem(`atg:study:${memberId}:notes`) ?? "[]") as {
        day: string | null;
        deletedAt: number | null;
      }[];
      const written = notes.filter((n) => n.day && !n.deletedAt).map((n) => n.day as string);
      const latest = written.sort().pop();
      if (latest) setLastDay((d) => (d && d > latest ? d : latest));
    } catch {
      // private window
    }
  }, [memberId]);

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
  // Done with the next reading: tick it, and the next day comes up.
  async function markRead() {
    const day = focus;
    const r = await fetch("/api/study/days", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ day, read: true }),
    }).catch(() => null);
    const data = r?.ok ? ((await r.json()) as { day?: StudyDay }) : null;
    if (data?.day) {
      setDays((list) => [...list.filter((x) => x.day !== day), data.day!]);
      setJustRead(planDay(day).n);
    }
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
        <div className="study-hero-mark">The Study</div>
        <h1 className="study-home-title">{me.member ? `Welcome back, ${me.member.name.split(" ")[0]}.` : "The Study"}</h1>
        <p className="study-home-lead">
          Read the Bible in the order it happened - one day at a time, at your own pace.
        </p>
      </header>

      {/* ── Your next reading: read, write, tick ─────────────── */}
      <section className="study-today">
        <div className="eyebrow eyebrow-amber">{started ? `Your next reading · Day ${n} of 365` : "Start here · Day 1 of 365"}</div>
        <h2 className="study-today-title">{started ? `Day ${n}` : "Day 1 - Genesis 1"}</h2>
        <div className="study-today-actions">
          <a className="study-today-step" href={bibleAppDay(n)} target="_blank" rel="noreferrer">
            <span className="study-today-num">1</span>
            <span>
              <strong>Read the passage</strong>
              <em>Day {n} in the Bible App (NIV) ↗ - or your book: {bookDate(focus)}</em>
            </span>
          </a>
          {me.member && (
            <Link className="study-today-step" href={`/study/journal?day=${focus}`}>
              <span className="study-today-num">2</span>
              <span>
                <strong>Write what stands out</strong>
                <em>
                  In your journal
                  {readable
                    ? studyToday
                      ? ` - with ${author ?? "the study"}'s notes: ${studyToday.title}`
                      : ` - ${author ? `${author}'s` : "the study's"} notes are there too`
                    : " - private to you"}
                </em>
              </span>
            </Link>
          )}
          {me.member && daysLoaded && !read.has(focus) && (
            <button type="button" className="study-today-step is-tick" onClick={markRead}>
              <span className="study-today-num">3</span>
              <span>
                <strong>Mark Day {n} as read</strong>
                <em>{n < 365 ? `It turns gold, and Day ${n + 1} is ready` : "It turns gold - the last day of the plan"}</em>
              </span>
            </button>
          )}
        </div>

        {me.member && (
          <div className="study-progress">
            <div className="study-progress-row">
              <span>
                <strong>{readCount}</strong> of 365 days read
              </span>
            </div>
            {justRead && <p className="dash-word-saved mt-2">✓ Day {justRead} done - Day {n} is next.</p>}
            <span className="dash-read-bar" aria-hidden>
              <span style={{ width: `${Math.min(100, (readCount / 365) * 100)}%` }} />
            </span>
          </div>
        )}
      </section>

      {/* ── How it works: the first thing to read, always open ── */}
      {me.member && (
        <section className="study-how" id="how">
          <div className="eyebrow eyebrow-amber">How The Study works</div>
          <ul>
            <li>
              <strong>The plan</strong> The whole Bible in 365 days, in the order it happened. Day 1 is Genesis 1.
            </li>
            <li>
              <strong>Your pace</strong> No dates to keep up with. Each day you mark as read turns gold.
            </li>
            <li>
              <strong>Finding your way</strong> <em>Today</em> (this page) shows your next reading.{" "}
              <em>My journal</em> has a page for every day - your notes, {author ?? "Daniel"}&apos;s notes and the videos.{" "}
              <em>All words</em> keeps the Hebrew and Greek words you study. The menu is on the left - at the top on a phone.
            </li>
            <li>
              <strong>The calls</strong> Daniel and Reggie meet on a call once or twice a week. The video goes up on the
              days it covers, and the 🔔 at the top tells you.
            </li>
            <li>
              <strong>Your Bible</strong> Free in the{" "}
              <a href={PLAN.bibleApp} target="_blank" rel="noreferrer">
                Bible App
              </a>{" "}
              (choose NIV), or get the paper book:{" "}
              <a href={PLAN.takealot} target="_blank" rel="noreferrer">
                Takealot
              </a>{" "}
              ·{" "}
              <a href={PLAN.amazon} target="_blank" rel="noreferrer">
                Amazon
              </a>
              .
            </li>
            <li>
              <strong>Why the NIV</strong> {WHY_NIV}
            </li>
            <li>
              <strong>On your phone</strong> Put The Study on your Home Screen and open it like an app. iPhone: open
              alltheglory.co.za/study in Safari, tap Share (the square with the arrow), then &ldquo;Add to Home Screen&rdquo;.
              Android: tap the ⋮ menu in Chrome, then &ldquo;Add to Home screen&rdquo;.
            </li>
          </ul>
        </section>
      )}

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

      {lastDay && inPlan(lastDay) && lastDay > focus && (
        <Link href={`/study/journal?day=${lastDay}`} className="study-resume">
          <span>
            Pick up where you left off · <strong>Day {planDay(lastDay).n}</strong> · {bookDate(lastDay)}
          </span>
          <span aria-hidden>→</span>
        </Link>
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

      {invite && (
        <section className={`study-invite study-foldable ${inviteFolded ? "is-folded" : ""}`} id="invite">
          <FoldToggle folded={inviteFolded} onToggle={toggleInvite} what="invite a friend" />
          <div className="eyebrow eyebrow-amber">Invite a friend</div>
          {!inviteFolded && (
            <>
              <h2 className="study-today-title">Read through the Bible together</h2>
              <p className="study-card-text mb-4">
                Send your link - they&apos;ll start at Day 1 with their own private journal, and go at their own pace.
              </p>
              <ShareLink
                url={invite}
                subject="Read through the Bible with me"
                message="I'm reading through the Bible in the order it happened with The Study from All The Glory - join me:"
              />
            </>
          )}
        </section>
      )}
    </div>
  );
}
