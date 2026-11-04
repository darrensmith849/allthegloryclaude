"use client";

// The Recycle bin, in the journal: everything deleted in the last 30 days -
// notes, words, names (and a member's prayers) - each with Restore (back on
// its day, in its place) and Delete for good, plus Restore all / Empty bin.

import { useState } from "react";
import { dayLabel } from "@/lib/dashboard/notes";
import { BIN_DAYS } from "@/lib/study/bin-erase";

export type BinKind = "note" | "word" | "name" | "prayer";

export interface BinItem {
  kind: BinKind;
  id: string;
  day: string | null; // the day it goes back to
  title: string; // "John 4:7", the word, the name, "Prayer"
  text: string; // a preview
  deletedAt: number; // epoch ms
}

const KIND: Record<BinKind, string> = { note: "Note", word: "Word", name: "Name", prayer: "Prayer" };

const daysLeft = (deletedAt: number) => Math.max(1, BIN_DAYS - Math.floor((Date.now() - deletedAt) / 86_400_000));

export function RecycleBin({
  items,
  owner,
  onRestore,
  onPurge,
  onOpenDay,
}: {
  items: BinItem[];
  owner: boolean; // the owner's items are only taken out of the bin, never erased
  onRestore: (items: BinItem[]) => Promise<boolean>;
  onPurge: (items: BinItem[]) => Promise<boolean>;
  onOpenDay: (day: string) => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function run(key: string, fn: () => Promise<boolean>, message: string) {
    if (busy) return;
    setBusy(key);
    setDone(null);
    const ok = await fn();
    setBusy(null);
    if (ok) {
      setDone(message);
      window.setTimeout(() => setDone((m) => (m === message ? null : m)), 4000);
    }
  }

  const goneText = owner
    ? "They'll be taken out of the bin (on your side nothing is ever erased - they stay safely stored)."
    : "They'll be deleted for good - this can't be undone.";

  return (
    <div className="recycle-bin">
      <p className="recycle-bin-lead">
        Deleted notes, words, names{owner ? "" : " and prayers"} stay here for {BIN_DAYS} days. Restore puts them back on
        their day, in their place.
      </p>
      {items.length > 0 && (
        <div className="recycle-bin-all">
          <button
            type="button"
            className="dash-btn dash-btn-primary dash-note-nav"
            disabled={Boolean(busy)}
            onClick={() =>
              void run("all-restore", () => onRestore(items), `✓ ${items.length === 1 ? "1 item" : `${items.length} items`} restored`)
            }
          >
            {busy === "all-restore" ? "Restoring…" : `Restore all · ${items.length}`}
          </button>
          <button
            type="button"
            className="dash-btn dash-btn-ghost dash-note-nav recycle-bin-empty"
            disabled={Boolean(busy)}
            onClick={() => {
              if (!confirm(`Empty the bin - ${items.length === 1 ? "1 item" : `all ${items.length} items`}? ${goneText}`)) return;
              void run("all-purge", () => onPurge(items), "✓ Bin emptied");
            }}
          >
            {busy === "all-purge" ? "Emptying…" : "Empty bin"}
          </button>
        </div>
      )}
      {done && (
        <p className="dash-word-saved" role="status">
          {done}
        </p>
      )}
      {!items.length && <p className="dash-word-hint mt-2">The bin is empty.</p>}

      <div className="recycle-bin-list">
        {items.map((it) => {
          const key = `${it.kind}:${it.id}`;
          return (
            <article key={key} className="recycle-bin-item">
              <div className="recycle-bin-meta">
                <span className={`recycle-bin-kind is-${it.kind}`}>{KIND[it.kind]}</span>
                {it.day ? (
                  <button type="button" className="dash-word-link" onClick={() => onOpenDay(it.day as string)}>
                    {dayLabel(it.day, { weekday: false })}
                  </button>
                ) : (
                  <span>{it.kind === "prayer" ? "Prayer list" : "No day"}</span>
                )}
                <span className="recycle-bin-left">
                  {daysLeft(it.deletedAt)} {daysLeft(it.deletedAt) === 1 ? "day" : "days"} left
                </span>
              </div>
              <div className="recycle-bin-title">{it.title}</div>
              {it.text && <p className="recycle-bin-text">{it.text}</p>}
              <div className="recycle-bin-actions">
                <button
                  type="button"
                  className="dash-word-link"
                  disabled={Boolean(busy)}
                  onClick={() => void run(key, () => onRestore([it]), `✓ Restored to ${it.day ? dayLabel(it.day, { weekday: false }) : "its place"}`)}
                >
                  {busy === key ? "Restoring…" : "Restore"}
                </button>
                <button
                  type="button"
                  className="dash-word-link is-danger"
                  disabled={Boolean(busy)}
                  onClick={() => {
                    if (!confirm(`Delete this ${KIND[it.kind].toLowerCase()} for good? ${owner ? goneText : "This can't be undone."}`)) return;
                    void run(`${key}:purge`, () => onPurge([it]), "✓ Deleted");
                  }}
                >
                  Delete for good
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
