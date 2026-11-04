"use client";

// A member's private prayer list: what they're praying for, with an
// optional verse. Removing one puts it in the Recycle bin for 30 days (here
// under "Removed", and in the journal's bin) so it can come back.

import { useEffect, useMemo, useState } from "react";
import { Panel } from "@/components/dashboard/panel";
import { NoteText } from "@/components/dashboard/note-text";
import { MemberOnly } from "@/components/study/shell";
import type { Prayer } from "@/lib/study/types";
import { BIN_DAYS } from "@/lib/study/bin-erase";

const when = (ms: number) => new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

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
  const [editing, setEditing] = useState<{ id: string; text: string; ref: string } | null>(null);
  const [showRemoved, setShowRemoved] = useState(false);

  useEffect(() => {
    call<{ prayers: Prayer[] }>("GET")
      .then((d) => setPrayers(d.prayers))
      .catch(() => setPrayers([]));
  }, []);

  const live = useMemo(() => (prayers ?? []).filter((p) => !p.deletedAt), [prayers]);
  const praying = live;
  const binSince = Date.now() - BIN_DAYS * 86_400_000;
  const removed = (prayers ?? []).filter((p) => p.deletedAt && !p.purgedAt && p.deletedAt >= binSince);

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
    if (!confirm("Take this off your prayer list? It goes to the Recycle bin in your journal - you can bring it back for 30 days.")) return;
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
          placeholder="A verse (optional), e.g. Phil 4:6"
          value={editing.ref}
          onChange={(e) => setEditing({ ...editing, ref: e.target.value })}
        />
        <div className="flex gap-2">
          <button
            type="button"
            className="dash-btn dash-btn-primary dash-note-nav"
            onClick={async () => {
              if (await patch({ id: p.id, text: editing.text, ref: editing.ref })) setEditing(null);
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
            Write down what you&apos;re praying for, with a verse to pray if you like. Private to you - only you ever see it.
          </div>
        </div>
      </div>

      <div className="dash-grid">
        <div className="dash-col-12 dash-prayer-col">
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
                  placeholder="A verse (optional), e.g. Phil 4:6"
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
                      <div className="dash-prayer-actions">
                        <span className="flex-1" />
                        <button
                          type="button"
                          className="dash-word-link"
                          onClick={() => setEditing({ id: p.id, text: p.text, ref: p.ref ?? "" })}
                        >
                          Edit
                        </button>
                        <button type="button" className="dash-word-link" onClick={() => remove(p)}>
                          Remove
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
              <Panel eyebrow={`In the Recycle bin for ${BIN_DAYS} days`} title={`Removed · ${removed.length}`}>
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
