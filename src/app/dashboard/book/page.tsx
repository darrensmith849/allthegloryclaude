"use client";

import { useMemo, useState } from "react";
import { Panel, Stat } from "@/components/dashboard/panel";
import { useDashboard } from "@/lib/dashboard/storage";
import { BookSession, emptyHabits } from "@/lib/dashboard/types";
import { formatShort, todayISO, addDays } from "@/lib/dashboard/dates";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export default function BookPage() {
  const { state, update, ready } = useDashboard();
  const meta = state.book.meta;
  const sessions = state.book.sessions;
  const today = todayISO();

  // Add-session form state
  const [minutes, setMinutes] = useState<number>(30);
  const [words, setWords] = useState<number>(500);
  const [chapter, setChapter] = useState<string>(meta.chapters[0]?.id ?? "");
  const [notes, setNotes] = useState("");

  const totalWords = useMemo(() => sessions.reduce((s, x) => s + (x.words || 0), 0), [sessions]);
  const totalMinutes = useMemo(() => sessions.reduce((s, x) => s + (x.minutes || 0), 0), [sessions]);
  const last7Words = useMemo(() => {
    const cutoff = addDays(today, -7);
    return sessions.filter((s) => s.date >= cutoff).reduce((sum, s) => sum + s.words, 0);
  }, [sessions, today]);
  const target = meta.targetWords || state.settings.goals.bookWordTarget;
  const pct = Math.min(100, Math.round((totalWords / target) * 100));

  function addSession(e?: React.FormEvent) {
    e?.preventDefault();
    if (!minutes && !words) return;
    const s: BookSession = {
      id: uid(),
      date: today,
      minutes,
      words,
      chapter,
      notes: notes.trim() || undefined,
    };
    update((d) => {
      d.book.sessions.unshift(s);
      const ch = d.book.meta.chapters.find((c) => c.id === chapter);
      if (ch) ch.words = (ch.words ?? 0) + words;
      if (!d.habits[today]) d.habits[today] = { ...emptyHabits(), bookWriting: true };
      else d.habits[today].bookWriting = true;
    });
    setNotes("");
  }

  function setMeta(patch: Partial<typeof meta>) {
    update((d) => {
      d.book.meta = { ...d.book.meta, ...patch };
    });
  }

  function addChapter() {
    update((d) => {
      const n = d.book.meta.chapters.length + 1;
      d.book.meta.chapters.push({
        id: `ch-${uid()}`,
        title: `Chapter ${n}`,
        status: "todo",
        words: 0,
      });
    });
  }

  function patchChapter(id: string, patch: Partial<typeof meta.chapters[number]>) {
    update((d) => {
      const ch = d.book.meta.chapters.find((c) => c.id === id);
      if (ch) Object.assign(ch, patch);
    });
  }

  function removeChapter(id: string) {
    update((d) => {
      d.book.meta.chapters = d.book.meta.chapters.filter((c) => c.id !== id);
    });
  }

  if (!ready) return null;

  return (
    <>
      <div className="dash-pagehead">
        <div>
          <div className="eyebrow eyebrow-amber">Manuscript</div>
          <h1 className="dash-title mt-1">{meta.title || "Untitled"}</h1>
          <div className="dash-subtitle">{meta.subtitle || "Track every word."}</div>
        </div>
      </div>

      <div className="dash-grid">
        <div className="dash-col-3">
          <Stat label="Total words" value={totalWords.toLocaleString()} hint={`${pct}% of target`} />
        </div>
        <div className="dash-col-3">
          <Stat label="This week" value={last7Words.toLocaleString()} tone="ok" />
        </div>
        <div className="dash-col-3">
          <Stat label="Minutes lifetime" value={totalMinutes} tone="calm" />
        </div>
        <div className="dash-col-3">
          <Stat label="Sessions" value={sessions.length} />
        </div>

        <div className="dash-col-12">
          <Panel eyebrow="Progress" title={`${totalWords.toLocaleString()} / ${target.toLocaleString()} words`}>
            <div className="dash-reward-progress" style={{ height: 10 }}>
              <span style={{ width: `${pct}%` }} />
            </div>
            <div className="text-[12px] text-[var(--colour-ink-quiet)] mt-2">{pct}% there.</div>
          </Panel>
        </div>

        <div className="dash-col-7">
          <Panel eyebrow="Chapters" title="Outline">
            <div className="flex flex-col gap-2">
              {meta.chapters.map((ch) => (
                <div
                  key={ch.id}
                  className="grid gap-3 items-center p-2.5 rounded-md border border-white/6 bg-white/[0.02]"
                  style={{ gridTemplateColumns: "1fr 130px 100px auto" }}
                >
                  <input
                    className="dash-input"
                    value={ch.title}
                    onChange={(e) => patchChapter(ch.id, { title: e.target.value })}
                  />
                  <select
                    className="dash-select"
                    value={ch.status}
                    onChange={(e) =>
                      patchChapter(ch.id, { status: e.target.value as "todo" | "drafting" | "done" })
                    }
                  >
                    <option value="todo">To do</option>
                    <option value="drafting">Drafting</option>
                    <option value="done">Done</option>
                  </select>
                  <input
                    className="dash-input"
                    type="number"
                    value={ch.words ?? 0}
                    onChange={(e) =>
                      patchChapter(ch.id, { words: Number(e.target.value) || 0 })
                    }
                  />
                  <button onClick={() => removeChapter(ch.id)} className="opacity-50 hover:opacity-100">
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <div className="dash-divider" />
            <button onClick={addChapter} className="dash-btn">
              + Add chapter
            </button>
          </Panel>
        </div>

        <div className="dash-col-5">
          <Panel eyebrow="Book metadata" title="Title &amp; target">
            <label className="dash-label">Title</label>
            <input
              className="dash-input"
              value={meta.title}
              onChange={(e) => setMeta({ title: e.target.value })}
            />
            <label className="dash-label mt-3">Subtitle</label>
            <input
              className="dash-input"
              value={meta.subtitle ?? ""}
              onChange={(e) => setMeta({ subtitle: e.target.value })}
            />
            <label className="dash-label mt-3">Word target</label>
            <input
              type="number"
              className="dash-input"
              value={meta.targetWords}
              onChange={(e) => setMeta({ targetWords: Number(e.target.value) || 0 })}
            />
          </Panel>

          <div className="h-4" />

          <Panel eyebrow="Log a session" title="Today">
            <form onSubmit={addSession} className="flex flex-col gap-3">
              <div>
                <label className="dash-label">Chapter</label>
                <select
                  className="dash-select"
                  value={chapter}
                  onChange={(e) => setChapter(e.target.value)}
                >
                  {meta.chapters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="dash-label">Minutes</label>
                  <input
                    type="number"
                    className="dash-input"
                    value={minutes}
                    onChange={(e) => setMinutes(Number(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="dash-label">Words</label>
                  <input
                    type="number"
                    className="dash-input"
                    value={words}
                    onChange={(e) => setWords(Number(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div>
                <label className="dash-label">Notes</label>
                <textarea
                  className="dash-textarea"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <button className="dash-btn dash-btn-primary" type="submit">
                Log session
              </button>
            </form>
          </Panel>
        </div>

        <div className="dash-col-12">
          <Panel eyebrow="History" title="Recent writing sessions">
            {sessions.length === 0 ? (
              <div className="dash-empty">No sessions yet. Start with 500 words.</div>
            ) : (
              <div className="flex flex-col gap-2">
                {sessions.slice(0, 24).map((s) => {
                  const ch = meta.chapters.find((c) => c.id === s.chapter);
                  return (
                    <div
                      key={s.id}
                      className="grid items-start gap-3 p-3 rounded-md border border-white/6 bg-white/[0.02]"
                      style={{ gridTemplateColumns: "90px 1fr 80px 80px" }}
                    >
                      <div className="text-[12px] text-[var(--colour-amber-soft)]">
                        {formatShort(s.date)}
                      </div>
                      <div>
                        <div className="text-[14px] text-[var(--colour-ink-strong)]">
                          {ch?.title ?? "—"}
                        </div>
                        {s.notes && (
                          <div className="text-[12.5px] text-[var(--colour-ink-soft)] mt-0.5">
                            {s.notes}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-display text-[16px] text-[var(--colour-glow)]">
                          {s.words}
                        </div>
                        <div className="text-[11px] text-[var(--colour-ink-quiet)]">words</div>
                      </div>
                      <div className="text-right">
                        <div className="font-display text-[16px] text-[var(--colour-ink-strong)]">
                          {s.minutes}
                        </div>
                        <div className="text-[11px] text-[var(--colour-ink-quiet)]">min</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
