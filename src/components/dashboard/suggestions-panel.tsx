"use client";

// Members' private suggestions on the dashboard's Community page, for the
// owner and his team: mark them seen or done, and reply - the member sees
// the reply under their suggestion. Nothing is ever removed.

import { useState } from "react";
import { Panel } from "@/components/dashboard/panel";
import { GrowingTextarea } from "@/components/dashboard/growing-textarea";
import { NoteText } from "@/components/dashboard/note-text";

export interface Suggestion {
  id: string;
  kind: string;
  text: string;
  createdAt: number;
  seen: boolean;
  done: boolean;
  reply: string | null;
  repliedBy: string | null;
  member: string;
  email: string;
}

const KIND: Record<string, string> = { dashboard: "For their dashboard", study: "For the study", other: "Something else" };
const when = (ms: number) => new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export function SuggestionsPanel({ items, onChange }: { items: Suggestion[]; onChange: (s: Suggestion) => void }) {
  const [replying, setReplying] = useState<{ id: string; text: string } | null>(null);
  const [showDone, setShowDone] = useState(false);
  const fresh = items.filter((s) => !s.seen).length;
  const open = items.filter((s) => !s.done);
  const done = items.filter((s) => s.done);

  async function patch(s: Suggestion, change: { seen?: true; done?: boolean; reply?: string }) {
    const r = await fetch("/api/members/community", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ suggestion: s.id, ...change }),
    }).catch(() => null);
    if (!r?.ok) return alert("Couldn't save that - check your connection.");
    onChange({
      ...s,
      seen: true,
      done: change.done ?? s.done,
      reply: change.reply !== undefined ? change.reply || null : s.reply,
      repliedBy: change.reply !== undefined ? (change.reply ? (s.repliedBy ?? "You") : null) : s.repliedBy,
    });
  }

  const card = (s: Suggestion) => (
    <div key={s.id} className={`dash-mod-card suggest-card ${s.seen ? "" : "is-new"}`}>
      <div className="dash-mod-meta">
        <strong>{s.member}</strong>
        <span>{s.email}</span>
        <span>{KIND[s.kind] ?? "Suggestion"}</span>
        <span>{when(s.createdAt)}</span>
        {!s.seen && <span className="suggest-new">New</span>}
      </div>
      <NoteText text={s.text} />
      {s.reply && replying?.id !== s.id && (
        <div className="dash-answer">
          <span className="dash-reader-label">Your reply{s.repliedBy ? ` · ${s.repliedBy}` : ""}</span>
          <NoteText text={s.reply} />
        </div>
      )}
      {replying?.id === s.id ? (
        <div className="mt-2">
          <GrowingTextarea
            className="dash-textarea dash-word-field"
            placeholder="A short reply - they'll see it under their suggestion."
            value={replying.text}
            onChange={(e) => setReplying({ id: s.id, text: e.target.value })}
            autoFocus
          />
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              className="dash-btn dash-btn-primary dash-note-nav"
              onClick={async () => {
                await patch(s, { reply: replying.text.trim() });
                setReplying(null);
              }}
            >
              Save reply
            </button>
            <button type="button" className="dash-btn dash-btn-ghost dash-note-nav" onClick={() => setReplying(null)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="dash-mod-actions">
          {!s.seen && (
            <button type="button" className="dash-word-link" onClick={() => void patch(s, { seen: true })}>
              Mark as seen
            </button>
          )}
          <button type="button" className="dash-word-link" onClick={() => setReplying({ id: s.id, text: s.reply ?? "" })}>
            {s.reply ? "Edit reply" : "Reply"}
          </button>
          <button type="button" className="dash-word-link" onClick={() => void patch(s, { done: !s.done })}>
            {s.done ? "Not done yet" : "✓ Done"}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <Panel eyebrow={fresh ? `${fresh} new` : "From members, privately"} title="Suggestions">
      {open.length === 0 && <p className="dash-word-hint">No suggestions waiting. Members send them from Community → Suggest something.</p>}
      <div className="flex flex-col gap-3">{open.map(card)}</div>
      {done.length > 0 && (
        <>
          <button type="button" className="dash-word-link mt-3" onClick={() => setShowDone((v) => !v)}>
            {showDone ? "Hide" : "Show"} done · {done.length}
          </button>
          {showDone && <div className="flex flex-col gap-3 mt-3">{done.map(card)}</div>}
        </>
      )}
    </Panel>
  );
}
