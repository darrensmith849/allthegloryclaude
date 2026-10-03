"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { canRead, studyName, useMe } from "@/components/study/shell";
import { dayLabel, planDay, todayDay } from "@/lib/dashboard/notes";
import { bibleAppDay, PLAN } from "@/lib/study/plan";

// The Study's front door.
export default function StudyHome() {
  const me = useMe();
  const readable = canRead(me);
  const today = todayDay();

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
      <div className="eyebrow eyebrow-amber">The One Year Chronological Bible</div>
      <h1 className="study-home-title">Read through the Bible in the order it happened.</h1>
      <p className="study-home-lead">
        {me.study?.intro ||
          "One day at a time - with notes on what each passage says, the Hebrew and Greek behind its key words, and room to write your own."}
      </p>

      {me.member && <p className="study-home-hello">Welcome back, {me.member.name.split(" ")[0]}.</p>}

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

      <div className="study-plan">
        <div>
          <div className="eyebrow eyebrow-amber">The reading plan</div>
          <div className="study-plan-title">{PLAN.name}</div>
          <div className="study-card-text">
            {PLAN.edition} - the whole Bible in 365 daily readings, in the order events happened. Today is Day{" "}
            {planDay(today).n}.
          </div>
        </div>
        <div className="study-plan-actions">
          <a className="dash-btn dash-btn-primary" href={bibleAppDay(planDay(today).n)} target="_blank" rel="noreferrer">
            Read today free in the Bible App ↗
          </a>
          <span className="study-plan-buy">
            Get the book:{" "}
            <a href={PLAN.takealot} target="_blank" rel="noreferrer">
              Takealot
            </a>{" "}
            ·{" "}
            <a href={PLAN.amazon} target="_blank" rel="noreferrer">
              Amazon
            </a>
          </span>
        </div>
      </div>

      <div className="study-cards">
        {readable && (
          <Link href="/study/read" className="study-card">
            <span className="eyebrow eyebrow-amber">Today · {dayLabel(today, { weekday: false })}</span>
            <span className="study-card-title">{studyName(me.study)}</span>
            <span className="study-card-text">
              Follow along with {me.study?.author && me.study.author !== "All The Glory" ? `${me.study.author}'s` : "the"} notes, day
              by day through the year.
            </span>
          </Link>
        )}
        {me.member ? (
          <>
            <Link href={`/study/journal?day=${today}`} className="study-card">
              <span className="eyebrow eyebrow-amber">Your journal</span>
              <span className="study-card-title">Write today&apos;s notes</span>
              <span className="study-card-text">Your own calendar of notes and words - private to you.</span>
            </Link>
            <Link href="/study/words" className="study-card">
              <span className="eyebrow eyebrow-amber">Word study</span>
              <span className="study-card-title">My words</span>
              <span className="study-card-text">Every Hebrew and Greek word you&apos;ve looked into, searchable.</span>
            </Link>
          </>
        ) : (
          me.loaded && (
            <div className="study-card is-static">
              <span className="eyebrow eyebrow-amber">Your own journal</span>
              <span className="study-card-title">Keep your notes as you read</span>
              <span className="study-card-text">
                A calendar of your notes by reading day, with word studies from the Hebrew and Greek.
              </span>
              <span className="flex gap-2 mt-3 flex-wrap">
                <Link href="/study/login" className="dash-btn dash-btn-ghost">
                  Log in
                </Link>
                {me.study?.signup === "open" && (
                  <Link href="/study/join" className="dash-btn dash-btn-primary">
                    Make an account
                  </Link>
                )}
              </span>
              {me.study?.signup === "invite" && (
                <span className="dash-word-hint mt-2">Joining is by invite for now.</span>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}
