"use client";

// This week's memory verse on a member's home page: the words (BSB, public
// domain), a link to read it in the NIV, and "I know it by heart".

import { useEffect, useState } from "react";
import { parsePassage } from "@/lib/dashboard/notes";
import { bibleAppVerse } from "@/lib/study/plan";

export function MemoryVerse({ verse, reflectionId, author }: { verse: string; reflectionId?: string; author?: string | null }) {
  const [text, setText] = useState<string | null>(null);
  const [known, setKnown] = useState<{ ref: string; knownAt: number }[] | null>(null);
  const p = parsePassage(verse);

  useEffect(() => {
    let live = true;
    fetch(`/api/bible?q=${encodeURIComponent(verse)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { results?: { text: string }[] } | null) => {
        if (!live) return;
        const words = (d?.results ?? []).map((r) => r.text.replace(/<\/?mark>/g, "")).join(" ");
        // The verse sits inside our own quote marks, so drop any it opens or closes with.
        setText(words.replace(/^[\s“"‘']+|[\s”"’']+$/g, ""));
      })
      .catch(() => live && setText(""));
    fetch("/api/study/memory", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { verses?: { ref: string; knownAt: number }[] } | null) => live && setKnown(d?.verses ?? []))
      .catch(() => live && setKnown([]));
    return () => {
      live = false;
    };
  }, [verse]);

  const isKnown = Boolean(known?.some((k) => k.ref === verse));
  async function toggle() {
    const next = !isKnown;
    setKnown((list) => (next ? [{ ref: verse, knownAt: Date.now() }, ...(list ?? [])] : (list ?? []).filter((k) => k.ref !== verse)));
    await fetch("/api/study/memory", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ref: verse, known: next, reflectionId }),
    }).catch(() => {});
  }
  const learned = known?.length ?? 0;

  return (
    <section className="study-memory">
      <div className="study-memory-head">
        <span className="eyebrow eyebrow-amber">Memory verse this week{author ? ` · from ${author}` : ""}</span>
        {learned > 0 && (
          <span className="study-memory-count">
            {learned} {learned === 1 ? "verse" : "verses"} learned
          </span>
        )}
      </div>
      <div className="study-memory-ref">{verse}</div>
      {text === null ? (
        <p className="study-memory-text is-loading">…</p>
      ) : text ? (
        <p className="study-memory-text">
          &ldquo;{text}&rdquo; <span className="study-memory-version">BSB</span>
        </p>
      ) : null}
      <div className="study-memory-actions">
        <button type="button" className={`dash-btn dash-btn-ghost dash-note-nav dash-read-btn ${isKnown ? "is-read" : ""}`} onClick={toggle}>
          {isKnown ? "✓ I know it by heart" : "I know it by heart"}
        </button>
        {p && (
          <a className="dash-plan-link" href={bibleAppVerse(p.book, p.chapter, p.verse)} target="_blank" rel="noreferrer">
            Read it in the NIV ↗
          </a>
        )}
      </div>
      {!isKnown && <p className="study-memory-tip">Say it out loud each morning this week - by Sunday it&apos;s yours.</p>}
    </section>
  );
}
