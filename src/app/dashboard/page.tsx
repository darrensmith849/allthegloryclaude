"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { IDENTITY_STATEMENTS } from "@/lib/dashboard/identity";
import { todayISO, formatHuman } from "@/lib/dashboard/dates";

export default function WhoAmIPage() {
  const today = todayISO();
  const total = IDENTITY_STATEMENTS.length;

  const [index, setIndex] = useState(0);
  const current = IDENTITY_STATEMENTS[index];
  const isLast = index === total - 1;

  const next = useCallback(
    () => setIndex((i) => (i + 1) % total),
    [total],
  );
  const prev = useCallback(
    () => setIndex((i) => (i - 1 + total) % total),
    [total],
  );

  // Keyboard navigation — arrows scroll, Enter on last opens the dashboard.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Ignore when typing into an input
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.key === "ArrowRight" || e.key === " " || e.key === "j") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft" || e.key === "k") {
        e.preventDefault();
        prev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  // Swipe / drag — basic touch support so it works one-handed on phone.
  const [dragStart, setDragStart] = useState<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => setDragStart(e.touches[0].clientX);
  const onTouchEnd = (e: React.TouchEvent) => {
    if (dragStart == null) return;
    const dx = e.changedTouches[0].clientX - dragStart;
    if (dx < -40) next();
    else if (dx > 40) prev();
    setDragStart(null);
  };

  return (
    <div className="dash-welcome-full">
      {/* Persistent top-right CTA — accessible at any point */}
      <Link href="/dashboard/today" className="dash-welcome-skip">
        Open Dashboard →
      </Link>

      {/* Centerpiece — heading, counter, card, controls */}
      <div className="dash-welcome-stage">
        <div className="dash-welcome-eyebrow eyebrow eyebrow-amber">{formatHuman(today)}</div>
        <h1 className="dash-welcome-h1 font-display">Who am I?</h1>
        <p className="dash-welcome-sub">
          Twenty-five truths the Father has spoken over you. Read each one.
        </p>

        <div
          className="dash-carousel"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <button
            type="button"
            className="dash-carousel-arrow dash-carousel-arrow-left"
            onClick={prev}
            aria-label="Previous verse"
          >
            ‹
          </button>

          <article key={current.ref} className="dash-carousel-card">
            <div className="dash-carousel-ref eyebrow eyebrow-amber">{current.ref}</div>
            <p className="dash-carousel-text font-display">{current.text}</p>
            <div className="dash-carousel-counter">
              {index + 1} <span>/ {total}</span>
            </div>
          </article>

          <button
            type="button"
            className="dash-carousel-arrow dash-carousel-arrow-right"
            onClick={next}
            aria-label="Next verse"
          >
            ›
          </button>
        </div>

        {/* Dot indicators — click any to jump */}
        <div className="dash-carousel-dots" role="tablist" aria-label="Identity statements">
          {IDENTITY_STATEMENTS.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`dash-carousel-dot ${i === index ? "is-on" : ""}`}
              onClick={() => setIndex(i)}
              aria-label={`Go to verse ${i + 1}`}
              role="tab"
              aria-selected={i === index}
            />
          ))}
        </div>

        {/* End-of-list CTA — only when on the last card */}
        {isLast && (
          <Link href="/dashboard/today" className="dash-welcome-cta-big">
            ✦ Open Dashboard
          </Link>
        )}

        <p className="dash-welcome-hint">
          ← → arrow keys to navigate · tap dots to jump · swipe on mobile
        </p>
      </div>
    </div>
  );
}
