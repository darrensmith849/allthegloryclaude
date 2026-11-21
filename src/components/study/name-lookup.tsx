"use client";

// "Look up a name" - who a Bible person (or place) was and what their name
// means, with the name said aloud. From Easton's Bible Dictionary and
// Hitchcock's Bible Names (public domain), built into /study/dict/<letter>.json
// by scripts/build-bible-dict.mjs; a letter's file loads only when needed.
// In the journal a name can be saved to the open day (onSave).

import { useEffect, useMemo, useState } from "react";
import { SayIt } from "./say-it";

type Entry = [name: string, meaning: string, background: string];

const letters = new Map<string, Promise<Entry[]>>();
function loadLetter(l: string): Promise<Entry[]> {
  let p = letters.get(l);
  if (!p) {
    p = fetch(`/study/dict/${l}.json`)
      .then((r) => (r.ok ? (r.json() as Promise<Entry[]>) : []))
      .catch(() => {
        letters.delete(l);
        return [];
      });
    letters.set(l, p);
  }
  return p;
}

const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z ]/g, "")
    .trim();

const SHORT = 520;

export interface NameToSave {
  name: string;
  meaning: string;
  about: string;
}

export function NameLookup({
  autoFocus = false,
  start = "",
  onSave,
  saved = [],
}: {
  autoFocus?: boolean;
  start?: string;
  onSave?: (n: NameToSave) => Promise<boolean>; // save to the open day
  saved?: string[]; // names already saved to that day
}) {
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState(start);
  const [list, setList] = useState<Entry[] | null>(null);
  const [picked, setPicked] = useState<Entry | null>(null);
  const [full, setFull] = useState(false);
  const key = fold(q);
  const letter = key[0] ?? "";

  useEffect(() => {
    if (!letter) return setList(null);
    let live = true;
    void loadLetter(letter).then((l) => live && setList(l));
    return () => {
      live = false;
    };
  }, [letter]);

  const matches = useMemo(() => {
    if (!list || key.length < 2) return [];
    const starts = list.filter((e) => fold(e[0]).startsWith(key));
    const inside = key.length >= 3 ? list.filter((e) => !fold(e[0]).startsWith(key) && fold(e[0]).includes(key)) : [];
    return [...starts, ...inside].slice(0, 8);
  }, [list, key]);

  // An exact name opens straight away.
  useEffect(() => {
    const exact = matches.find((e) => fold(e[0]) === key);
    if (exact) {
      setPicked(exact);
      setFull(false);
    }
  }, [matches, key]);

  const show = picked && fold(picked[0]) === key ? picked : null;
  const background = show?.[2] ?? "";
  const long = background.length > SHORT;
  const shown = !long || full ? background : `${background.slice(0, background.lastIndexOf(" ", SHORT))}…`;

  return (
    <div className="name-lookup">
      <input
        type="search"
        className="dash-input"
        placeholder="A person or place - e.g. Melchizedek, Bethel"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setPicked(null);
        }}
        aria-label="Look up a Bible name"
        autoComplete="off"
        autoFocus={autoFocus}
      />
      {!show && matches.length > 0 && (
        <div className="name-lookup-list" role="listbox" aria-label="Names">
          {matches.map((e) => (
            <button
              key={e[0]}
              type="button"
              className="name-lookup-pick"
              onClick={() => {
                setQ(e[0]);
                setPicked(e);
                setFull(false);
              }}
            >
              <strong>{e[0]}</strong>
              {e[1] && <span> · {e[1]}</span>}
            </button>
          ))}
        </div>
      )}
      {!show && list && key.length >= 2 && matches.length === 0 && (
        <p className="dash-word-hint mt-2">No name like “{q.trim()}” - try another spelling.</p>
      )}

      {show && (
        <article className="name-card">
          <div className="name-card-head">
            <h3 className="name-card-name">{show[0]}</h3>
            <SayIt text={show[0]} label={`Say ${show[0]}`} />
          </div>
          {show[1] && (
            <div className="name-card-means">
              <span className="dash-reader-label">Name means</span> {show[1]}
              <SayIt text={`${show[0]}. ${show[0]} means ${show[1]}`} label={`Hear what ${show[0]} means`} className="is-small" />
            </div>
          )}
          {background && (
            <div className="name-card-about">
              {shown.split(/\n\n/).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
              {long && (
                <button type="button" className="dash-word-link" onClick={() => setFull((v) => !v)}>
                  {full ? "Show less" : "Read more"}
                </button>
              )}
            </div>
          )}
          <div className="dash-word-source">
            {[show[1] && "Hitchcock's Bible Names (1869)", background && "Easton's Bible Dictionary (1897)"].filter(Boolean).join(" · ")}
          </div>
          {onSave &&
            (saved.includes(show[0]) ? (
              <p className="dash-word-saved name-card-saved">✓ Saved to this day - it&apos;s under &ldquo;Names studied&rdquo;</p>
            ) : (
              <button
                type="button"
                className="dash-btn dash-btn-primary dash-note-nav name-card-save"
                disabled={saving}
                onClick={async () => {
                  setSaving(true);
                  await onSave({ name: show[0], meaning: show[1], about: background.slice(0, 1200) });
                  setSaving(false);
                }}
              >
                {saving ? "Saving…" : "+ Save to this day"}
              </button>
            ))}
        </article>
      )}
    </div>
  );
}

export const DICT_CREDIT =
  "People and places: Easton's Bible Dictionary (1897) and Hitchcock's Bible Names (1869), both public domain, from the NEUU Bible Dictionary Dataset (CC BY 4.0).";
