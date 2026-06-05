"use client";

import Link from "next/link";
import Image from "next/image";
import { IDENTITY_STATEMENTS } from "@/lib/dashboard/identity";
import { reminderForDate } from "@/lib/dashboard/reminders";
import { todayISO, formatHuman } from "@/lib/dashboard/dates";

export default function WhoAmIPage() {
  const today = todayISO();
  const backdrop = reminderForDate(today); // reuse the daily reminder art as the hero photo

  return (
    <div className="dash-welcome">
      {/* Hero — big "Who am I?" question over today's reminder art */}
      <section className="dash-welcome-hero">
        <div className="dash-welcome-hero-image">
          <Image
            src={backdrop.src}
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-top"
            priority
          />
          <div className="dash-welcome-hero-veil" />
        </div>
        <div className="dash-welcome-hero-body">
          <div className="eyebrow eyebrow-amber">{formatHuman(today)}</div>
          <h1 className="dash-welcome-title font-display">Who am I?</h1>
          <p className="dash-welcome-lead">
            Read this before the day takes hold. Twenty-five truths the Father has spoken over you.
          </p>
          <Link href="/dashboard/today" className="dash-btn dash-btn-primary dash-welcome-cta">
            Open Dashboard →
          </Link>
        </div>
      </section>

      {/* 25 identity cards — glass tiles, verse ref + statement only */}
      <section className="dash-identity-grid">
        {IDENTITY_STATEMENTS.map((s, i) => (
          <article key={i} className="dash-identity-card">
            <div className="dash-identity-ref eyebrow eyebrow-amber">{s.ref}</div>
            <p className="dash-identity-text font-display">{s.text}</p>
          </article>
        ))}
      </section>

      {/* Foot CTA — repeat the entry button at the bottom for long-scrollers */}
      <section className="dash-welcome-foot">
        <Link href="/dashboard/today" className="dash-btn dash-btn-primary dash-welcome-cta">
          Open Dashboard →
        </Link>
        <p className="dash-welcome-foot-tip">
          Bookmark <code>/dashboard/today</code> if you want to skip this page tomorrow.
        </p>
      </section>
    </div>
  );
}
