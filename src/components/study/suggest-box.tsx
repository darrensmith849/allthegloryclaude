"use client";

// "Suggest something" on Community: an idea for The Study - something they'd
// like on their dashboard, or for the study - sent privately to Daniel and
// his team. Their own suggestions show underneath, with any reply.

import { useEffect, useState } from "react";
import { Panel } from "@/components/dashboard/panel";
import { GrowingTextarea } from "@/components/dashboard/growing-textarea";
import { NoteText } from "@/components/dashboard/note-text";

interface Suggestion {
  id: string;
  kind: string;
  text: string;
  createdAt: number;
  seen: boolean;
  done: boolean;
  reply: string | null;
  repliedBy: string | null;
}

const KINDS = [
  { id: "dashboard", label: "Something for my dashboard" },
  { id: "study", label: "Something for the study" },
  { id: "other", label: "Something else" },
];

const when = (ms: number) => new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export function SuggestBox() {
  const [mine, setMine] = useState<Suggestion[]>([]);
  const [to, setTo] = useState("Daniel");
  const [kind, setKind] = useState("dashboard");
  const [text, setText] = useState("");
  const [state, setState] = useState<{ busy?: boolean; error?: string; sent?: boolean }>({});

  useEffect(() => {
    fetch("/api/study/suggestions", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { mine?: Suggestion[]; to?: string } | null) => {
        if (d?.mine) setMine(d.mine);
        if (d?.to) setTo(d.to);
      })
      .catch(() => {});
  }, []);

  async function send() {
    if (state.busy) return;
    if (text.trim().length < 5) return setState({ error: "Write a little more about your idea." });
    setState({ busy: true });
    try {
      const r = await fetch("/api/study/suggestions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, kind }),
      });
      const d = (await r.json().catch(() => ({}))) as { suggestion?: Suggestion; error?: string };
      if (!r.ok || !d.suggestion) throw new Error(d.error ?? "Couldn't send that - check your connection.");
      setMine((list) => [d.suggestion as Suggestion, ...list]);
      setText("");
      setState({ sent: true });
      window.setTimeout(() => setState((s) => (s.sent ? {} : s)), 5000);
    } catch (e) {
      setState({ error: e instanceof Error ? e.message : "Couldn't send that." });
    }
  }

  async function takeBack(s: Suggestion) {
    if (!confirm("Take this suggestion back?")) return;
    const r = await fetch(`/api/study/suggestions?id=${encodeURIComponent(s.id)}`, { method: "DELETE" }).catch(() => null);
    if (r?.ok) setMine((list) => list.filter((x) => x.id !== s.id));
  }

  return (
    <Panel eyebrow={`Private to ${to}`} title="Suggest something">
      <p className="dash-word-hint mb-3">
        Is there something you&apos;d love to have here - on your dashboard, in the study, anywhere? Tell us. Only {to} see
        it.
      </p>
      <div className="suggest-kinds" role="group" aria-label="What is it for?">
        {KINDS.map((k) => (
          <button key={k.id} type="button" className={`dash-starter-chip ${kind === k.id ? "is-on" : ""}`} onClick={() => setKind(k.id)}>
            {k.label}
          </button>
        ))}
      </div>
      <GrowingTextarea
        className="dash-textarea dash-word-field mt-3"
        placeholder="Your idea…"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (state.error) setState({});
        }}
        aria-label="Your suggestion"
      />
      <div className="flex gap-3 mt-2 flex-wrap items-center">
        <button type="button" className="dash-btn dash-btn-primary" disabled={state.busy || !text.trim()} onClick={send}>
          {state.busy ? "Sending…" : "Send privately"}
        </button>
        {state.sent && <span className="dash-word-saved">✓ Sent - thank you!</span>}
        {state.error && <span className="dash-starter-error">{state.error}</span>}
      </div>

      {mine.length > 0 && (
        <div className="dash-fold">
          <div className="dash-note-section-row">
            <span className="eyebrow eyebrow-amber">Your suggestions · {mine.length}</span>
          </div>
          <div className="suggest-list">
            {mine.map((s) => (
              <article key={s.id} className="suggest-item">
                <div className="suggest-meta">
                  <span>{KINDS.find((k) => k.id === s.kind)?.label ?? "Suggestion"}</span>
                  <span>· {when(s.createdAt)}</span>
                  <span className={`suggest-status ${s.done ? "is-done" : s.seen ? "is-seen" : ""}`}>
                    {s.done ? "✓ Done" : s.seen ? "Seen" : "Sent"}
                  </span>
                </div>
                <NoteText text={s.text} />
                {s.reply && (
                  <div className="dash-answer">
                    <span className="dash-reader-label">{s.repliedBy ?? "Reply"}</span>
                    <NoteText text={s.reply} />
                  </div>
                )}
                {!s.seen && (
                  <button type="button" className="dash-word-link mt-1" onClick={() => void takeBack(s)}>
                    Take it back
                  </button>
                )}
              </article>
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
}
