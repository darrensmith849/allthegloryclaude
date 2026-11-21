"use client";

// "Context" under the reading box in a journal day: each book in the day's
// reading in brief, then who is speaking, who it was for and when -
// and the stories in it that another book tells too (a chronological plan
// reads Mark's and Luke's accounts side by side). Tap a reference to read it
// right there. Folds away; remembered on this device. Data: src/lib/study/context.ts.

import { useEffect, useMemo, useState } from "react";
import { readingContext } from "@/lib/study/context";

const OPEN_KEY = "atg:study:contextOpen";

export function ReadingContext({ passages, onRead }: { passages: string[]; onRead: (ref: string) => void }) {
  const ctx = useMemo(() => readingContext(passages), [passages]);
  const [open, setOpen] = useState(true);
  useEffect(() => {
    try {
      setOpen(window.localStorage.getItem(OPEN_KEY) !== "0");
    } catch {
      // private window
    }
  }, []);
  function toggle() {
    setOpen((o) => {
      try {
        window.localStorage.setItem(OPEN_KEY, o ? "0" : "1");
      } catch {
        // private window
      }
      return !o;
    });
  }

  if (!ctx.books.length) return null;
  const names = ctx.books.map((b) => b.name);
  return (
    <div className={`reading-context ${open ? "is-open" : ""}`}>
      <button type="button" className="reading-context-head" onClick={toggle} aria-expanded={open}>
        <span className="eyebrow eyebrow-amber">Context</span>
        <span className="reading-context-sum">
          {names.length > 2 ? "Today's books" : names.join(" and ")} in brief - who&apos;s speaking, and when
          {ctx.same.length ? ` · ${ctx.same.length} ${ctx.same.length === 1 ? "story" : "stories"} told elsewhere too` : ""}
        </span>
        <span className="dash-daniel-toggle">{open ? "Minimise ▴" : "Open ▾"}</span>
      </button>

      {open && (
        <div className="reading-context-body">
          {ctx.books.map(({ name, context: c }) => (
            <section key={name} className="reading-context-book">
              <h4>{name}</h4>
              <p className="reading-context-brief">{c.brief}</p>
              <dl>
                <dt>Who&apos;s speaking</dt>
                <dd>{c.who}</dd>
                <dt>Written to</dt>
                <dd>{c.to}</dd>
                <dt>When</dt>
                <dd>{c.when}</dd>
              </dl>
              {c.see && (
                <button type="button" className="reading-context-link reading-context-see" onClick={() => onRead(c.see!.read)}>
                  {c.see.label}: {c.see.read} →
                </button>
              )}
            </section>
          ))}

          {ctx.same.length > 0 && (
            <section className="reading-context-same">
              <h4>The same story, told more than once</h4>
              <ul>
                {ctx.same.map((s) => (
                  <li key={s.title}>
                    <strong>{s.title}</strong>
                    <span className="reading-context-refs">
                      {s.here.map((r) => r.label).join(" · ")}
                      {s.others.length > 0 && (
                        <>
                          {" "}
                          - also in{" "}
                          {s.others.map((r, i) => (
                            <span key={r.label}>
                              {i > 0 && " · "}
                              <button type="button" className="reading-context-link" onClick={() => onRead(r.read)}>
                                {r.label}
                              </button>
                            </span>
                          ))}
                        </>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

// One line under a chapter in Read here: whose account it is.
export function WhoIsSpeaking({ passage }: { passage: string }) {
  const ctx = useMemo(() => readingContext([passage]), [passage]);
  const book = ctx.books[0];
  if (!book) return null;
  return (
    <p className="read-here-who">
      <strong>Who&apos;s speaking:</strong> {book.context.who}
    </p>
  );
}
