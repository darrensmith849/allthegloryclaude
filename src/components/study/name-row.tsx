"use client";

// A Bible name saved to a journal day, as a row under "Names studied" that
// opens to what the name means and who they were, with the name said aloud.

import type { SavedName } from "@/lib/study/names-api";
import { SayIt } from "./say-it";

export function NameRow({ n, open, onToggle, onRemove }: { n: SavedName; open: boolean; onToggle: () => void; onRemove: () => void }) {
  return (
    <article className={`dash-word-row name-row ${open ? "is-open" : ""}`}>
      <div className="name-row-top">
        <button type="button" className="dash-word-row-head" onClick={onToggle} aria-expanded={open}>
          <span className="dash-word-row-main">
            <span className="dash-word-row-line">
              <span className="dash-word-row-title">{n.name}</span>
            </span>
            {n.meaning && <span className="dash-word-row-sub">Means: {n.meaning}</span>}
          </span>
          <span className="dash-word-lang is-name">Name</span>
          <span className="dash-word-row-chev" aria-hidden>
            ›
          </span>
        </button>
        <SayIt text={n.name} label={`Say ${n.name}`} className="is-small" />
      </div>
      {open && (
        <div className="dash-word-row-body">
          {n.meaning && (
            <p className="name-row-means">
              <span className="dash-reader-label">Name means</span> {n.meaning}
              <SayIt text={`${n.name}. ${n.name} means ${n.meaning}`} label={`Hear what ${n.name} means`} className="is-small" />
            </p>
          )}
          {n.about && (
            <div className="name-card-about">
              {n.about.split(/\n\n/).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          )}
          <div className="name-row-actions">
            <button type="button" className="dash-word-link is-danger" onClick={onRemove}>
              Remove
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
