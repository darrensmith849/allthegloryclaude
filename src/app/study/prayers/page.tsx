"use client";

// A member's private prayer list: what they're praying for, and - when God
// answers - the date and how. Looking back on answered prayers is the point,
// so answered ones are kept, with how long they were prayed for.

import { useEffect, useMemo, useState } from "react";
import { Panel } from "@/components/dashboard/panel";
import { NoteText } from "@/components/dashboard/note-text";
import { MemberOnly } from "@/components/study/shell";
import type { Prayer } from "@/lib/study/types";

const when = (ms: number) => new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function after(from: number, to: number): string {
  const days = Math.max(0, Math.round((to - from) / 86_400_000));
  if (days === 0) return "the same day";
  if (days < 14) return `after ${days} ${days === 1 ? "day" : "days"}`;
  if (days < 60) return `after ${Math.round(days / 7)} weeks`;
  if (days < 730) return `after ${Math.round(days / 30)} months`;
  return `after ${Math.round(days / 365)} years`;
}

async function call<T>(method: string, body?: unknown, query = ""): Promise<T> {
  const r = await fetch(`/api/study/prayers${query}`, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await r.json().catch(() => ({}))) as T & { error?: string };
  if (!r.ok) throw new Error(data.error ?? "Couldn't save that - check your connection.");
  return data;
}

function PrayerList() {
  const [prayers, setPrayers] = useState<Prayer[] | null>(null);
  const [text, setText] = useState("");
  const [ref, setRef] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answering, setAnswering] = useState<{ id: string; answer: string } | null>(null);
  const [editing, setEditing] = useState<{ id: string; text: string; ref: string; answer: string } | null>(null);
  const [showRemoved, setShowRemoved] = useState(false);

  useEffect(() => {
    call<{ prayers: Prayer[] }>("GET")
      .then((d) => setPrayers(d.prayers))
      .catch(() => setPrayers([]));
  }, []);

  const live = useMemo(() => (prayers ?? []).filter((p) => !p.deletedAt), [prayers]);
  const praying = live.filter((p) => !p.answeredAt);
  const answered = live.filter((p) => p.answeredAt).sort((a, b) => (b.answeredAt ?? 0) - (a.answeredAt ?? 0));
  const removed = (prayers ?? []).filter((p) => p.deletedAt);

  const put = (p: Prayer) => setPrayers((list) => [p, ...(list ?? []).filter((x) => x.id !== p.id)]);

  async function add() {
    if (busy) return;
    if (text.trim().length < 2) return setError("Write what you're praying for.");
    setBusy(true);
    setError(null);
    try {
      const { prayer } = await call<{ prayer: Prayer }>("POST", { text, ref });
      put(prayer);
      setText("");
      setRef("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save that.");
    } finally {
      setBusy(false);
    }
  }

  async function patch(body: Record<string, unknown>) {
    try {
      const { prayer } = await call<{ prayer: Prayer }>("PATCH", body);
      put(prayer);
      return true;
    } catch (e) {
      alert(e instanceof Error ? e.message : "Couldn't save that.");
      return false;
    }
  }

  async function remove(p: Prayer) {
    if (!confirm("Take this off your prayer list? You can bring it back from Removed.")) return;
    try {
      await call("DELETE", undefined, `?id=${encodeURIComponent(p.id)}`);
      put({ ...p, deletedAt: Date.now() });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Couldn't remove it.");
    }
  }

  const editor = (p: Prayer) =>
    editing?.id === p.id && (
      <div className="dash-prayer-edit">
        <textarea
          className="dash-textarea"
          rows={3}
          value={editing.text}
          onChange={(e) => setEditing({ ...editing, text: e.target.value })}
          aria-label="Prayer"
        />
        <input
          className="dash-input"
          placeholder="A verse to pray (optional), e.g. Philippians 4:6"
          value={editing.ref}
          onChange={(e) => setEditing({ ...editing, ref: e.target.value })}
        />
        {p.answeredAt && (
          <textarea
            className="dash-textarea"
            rows={2}
            placeholder="How was it answered?"
            value={editing.answer}
            onChange={(e) => setEditing({ ...editing, answer: e.target.value })}
          />
        )}
        <div className="flex gap-2">
          <button
            type="button"
            className="dash-btn dash-btn-primary dash-note-nav"
            onClick={async () => {
              if (await patch({ id: p.id, text: editing.text, ref: editing.ref, ...(p.answeredAt ? { answer: editing.answer } : {}) }))
                setEditing(null);
            }}
          >
            Save
          </button>
          <button type="button" className="dash-btn dash-btn-ghost dash-note-nav" onClick={() => setEditing(null)}>
            Cancel
          </button>
        </div>
      </div>
    );

  return (
    <>
      <div className="dash-pagehead">
        <div>
          <div className="eyebrow eyebrow-amber">Private to you</div>
          <h1 className="dash-title mt-1">Prayer list</h1>
          <div className="dash-subtitle">
            Write what you&apos;re praying for. When God answers, tick it - you&apos;ll keep the date and how, so you can look back
            on His faithfulness.
          </div>
        </div>
      </div>

      <div className="dash-grid">
        <div className="dash-col-7">
          <Panel eyebrow={`Praying for · ${praying.length}`} title="My prayers">
            <div className="dash-prayer-add">
              <textarea
                className="dash-textarea"
                rows={3}
                placeholder="What are you praying for?"
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  if (error) setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void add();
                }}
                aria-label="What are you praying for?"
              />
              <div className="flex gap-2 flex-wrap items-center">
                <input
                  className="dash-input dash-prayer-ref"
                  placeholder="A verse to pray (optional), e.g. Philippians 4:6"
                  value={ref}
                  onChange={(e) => setRef(e.target.value)}
                  aria-label="A verse to pray"
                />
                <button type="button" className="dash-btn dash-btn-primary" onClick={add} disabled={busy}>
                  {busy ? "Adding…" : "Add to my list"}
                </button>
              </div>
              {error && <p className="dash-starter-error">{error}</p>}
            </div>

            {prayers === null && <p className="dash-word-hint mt-4">Opening your list…</p>}
            {prayers && praying.length === 0 && (
              <p className="dash-word-hint mt-4">Nothing on your list right now. &ldquo;Be anxious for nothing, but in everything, by prayer and petition, with thanksgiving, present your requests to God.&rdquo; - Philippians 4:6 (BSB)</p>
            )}
            <div className="dash-prayer-list">
              {praying.map((p) => (
                <article key={p.id} className="dash-prayer">
                  {editing?.id === p.id ? (
                    editor(p)
                  ) : (
                    <>
                      <NoteText text={p.text} />
                      <div className="dash-prayer-meta">
                        {p.ref && <span className="dash-prayer-verse">{p.ref}</span>}
                        <span>Since {when(p.createdAt)}</span>
                      </div>
                      {answering?.id === p.id ? (
                        <div className="dash-prayer-edit">
                          <textarea
                            className="dash-textarea"
                            rows={2}
                            placeholder="How did God answer? (optional)"
                            value={answering.answer}
                            onChange={(e) => setAnswering({ ...answering, answer: e.target.value })}
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              className="dash-btn dash-btn-primary dash-note-nav"
                              onClick={async () => {
                                if (await patch({ id: p.id, answered: true, answer: answering.answer })) setAnswering(null);
                              }}
                            >
                              Save as answered
                            </button>
                            <button type="button" className="dash-btn dash-btn-ghost dash-note-nav" onClick={() => setAnswering(null)}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="dash-prayer-actions">
                          <button type="button" className="dash-btn dash-btn-ghost dash-note-nav" onClick={() => setAnswering({ id: p.id, answer: "" })}>
                            ✓ Answered
                          </button>
                          <span className="flex-1" />
                          <button
                            type="button"
                            className="dash-word-link"
                            onClick={() => setEditing({ id: p.id, text: p.text, ref: p.ref ?? "", answer: p.answer ?? "" })}
                          >
                            Edit
                          </button>
                          <button type="button" className="dash-word-link" onClick={() => remove(p)}>
                            Remove
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </article>
              ))}
            </div>
          </Panel>
        </div>

        <div className="dash-col-5">
          <Panel eyebrow={`Answered · ${answered.length}`} title="God answered">
            {answered.length === 0 && (
              <p className="dash-word-hint">When a prayer is answered, tick it - it moves here with the date and how.</p>
            )}
            <div className="dash-prayer-list">
              {answered.map((p) => (
                <article key={p.id} className="dash-prayer is-answered">
                  {editing?.id === p.id ? (
                    editor(p)
                  ) : (
                    <>
                      <div className="dash-prayer-when">
                        ✓ Answered {when(p.answeredAt ?? 0)} · {after(p.createdAt, p.answeredAt ?? p.createdAt)}
                      </div>
                      <NoteText text={p.text} />
                      {p.answer && <blockquote className="dash-prayer-answer">{p.answer}</blockquote>}
                      <div className="dash-prayer-actions">
                        {p.ref && <span className="dash-prayer-verse">{p.ref}</span>}
                        <span className="flex-1" />
                        <button
                          type="button"
                          className="dash-word-link"
                          onClick={() => setEditing({ id: p.id, text: p.text, ref: p.ref ?? "", answer: p.answer ?? "" })}
                        >
                          Edit
                        </button>
                        <button type="button" className="dash-word-link" onClick={() => void patch({ id: p.id, answered: false })}>
                          Still praying
                        </button>
                      </div>
                    </>
                  )}
                </article>
              ))}
            </div>
          </Panel>

          {removed.length > 0 && (
            <div className="mt-[18px]">
              <Panel eyebrow="Nothing is lost" title={`Removed · ${removed.length}`}>
                <button type="button" className="dash-word-link" onClick={() => setShowRemoved((v) => !v)}>
                  {showRemoved ? "Hide" : "Show"} removed prayers
                </button>
                {showRemoved &&
                  removed.map((p) => (
                    <div key={p.id} className="dash-prayer is-removed">
                      <NoteText text={p.text} />
                      <button type="button" className="dash-word-link" onClick={() => void patch({ id: p.id, restore: true })}>
                        Bring it back
                      </button>
                    </div>
                  ))}
              </Panel>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function PrayersPage() {
  return (
    <MemberOnly>
      <PrayerList />
    </MemberOnly>
  );
}
