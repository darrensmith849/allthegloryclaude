"use client";

// Word study on the Study Notes page: type a word from the day's reading,
// fill it in (Hebrew / Greek, meaning, key verses, reflection) and save it
// to the word journal, tied to that reading day. The full editor and the
// whole library stay on the Word Journal page.

import { useEffect, useState } from "react";
import { GrowingTextarea } from "@/components/dashboard/growing-textarea";
import { KeyVerses } from "@/components/dashboard/word-entry";
import { useWords } from "@/lib/dashboard/words-store";
import { useStudyClient } from "@/lib/study/client";
import type { BibleWord, WordLanguage } from "@/lib/dashboard/types";
import type { LanguageFill, WordFill } from "@/lib/dashboard/words";

const LANG_NAME: Record<WordLanguage, string> = { hebrew: "Hebrew", greek: "Greek" };

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function QuickWord({
  day,
  verseHint,
  onSaved,
}: {
  day: string | null; // reading day to tie the word to
  verseHint: string; // the passage being read, e.g. "John 2:11"
  onSaved?: (w: BibleWord) => void;
}) {
  const client = useStudyClient();
  const { save: saveWord } = useWords();
  const [word, setWord] = useState("");
  const [verse, setVerse] = useState(verseHint);
  const [verseTouched, setVerseTouched] = useState(false);
  const [data, setData] = useState<WordFill | null>(null);
  const [lang, setLang] = useState<WordLanguage>("hebrew");
  const [application, setApplication] = useState<Record<WordLanguage, string>>({ hebrew: "", greek: "" });
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  // Follow the open day's passage until the verse is typed by hand.
  useEffect(() => {
    if (!verseTouched) setVerse(verseHint);
  }, [verseHint, verseTouched]);

  async function fill(pick?: string) {
    const w = word.trim();
    if (!w || busy) return;
    setBusy(true);
    setNote(null);
    setSaved(null);
    try {
      const r = await fetch(client.fillApi, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ word: w, reference: verse, pick }),
      });
      if (!r.ok) {
        const err = (await r.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? String(r.status));
      }
      const fresh = (await r.json()) as WordFill;
      // A "Try ..." pick only re-looks-up that one language.
      const merged: WordFill =
        pick && data
          ? { ...data, hebrew: fresh.hebrew ?? data.hebrew, greek: fresh.greek ?? data.greek }
          : fresh;
      const target = pick ? (fresh.hebrew ? "hebrew" : "greek") : fresh.primary;
      setData(merged);
      setLang(target);
      setApplication((a) => ({
        hebrew: pick && target !== "hebrew" ? a.hebrew : (merged.hebrew?.application ?? ""),
        greek: pick && target !== "greek" ? a.greek : (merged.greek?.application ?? ""),
      }));
      setNote(fresh.note ?? null);
    } catch (e) {
      const msg = e instanceof Error && !/^\d+$/.test(e.message) ? e.message : "";
      setNote(msg || "Couldn't fill it in just now - check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  function save() {
    const f: LanguageFill | null = data?.[lang] ?? null;
    const w = word.trim();
    if (!w || !f) return;
    const now = new Date().toISOString();
    const entry: BibleWord = {
      id: uid(),
      createdAt: now,
      word: w,
      language: lang,
      original: f.entry.original,
      translit: f.entry.translit,
      strongs: f.entry.number,
      originalMeaning: f.meaning,
      meaningSource: f.meaningSource,
      englishMeaning: data?.englishMeaning ?? "",
      keyVerses: f.keyVerses.length ? f.keyVerses : undefined,
      application: application[lang].trim(),
      reference: verse.trim() || undefined,
      day: day ?? undefined,
      comment: comment.trim() || undefined,
    };
    saveWord(entry);
    setSaved(w);
    setWord("");
    setData(null);
    setComment("");
    setApplication({ hebrew: "", greek: "" });
    onSaved?.(entry);
  }

  const f = data?.[lang] ?? null;
  const langs = (["hebrew", "greek"] as const).filter((l) => data?.[l]);

  return (
    <div className="dash-quickword">
      {saved && (
        <div className="dash-word-saved" role="status">
          ✓ Saved “{saved}” to this day and your Word Journal
        </div>
      )}
      <div className="dash-quickword-inputs">
        <input
          className="dash-input"
          placeholder="A word from today's reading"
          value={word}
          onChange={(e) => {
            setWord(e.target.value);
            setData(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              fill();
            }
          }}
          aria-label="Word"
          autoComplete="off"
        />
        <input
          className="dash-input"
          placeholder="Verse, e.g. John 2:11"
          value={verse}
          onChange={(e) => {
            setVerse(e.target.value);
            setVerseTouched(true);
          }}
          aria-label="Verse"
        />
      </div>
      <button
        type="button"
        className="dash-btn dash-btn-primary dash-word-fill-btn mt-2"
        onClick={() => fill()}
        disabled={busy || !word.trim()}
      >
        {busy ? "Studying the word…" : data ? "✦ Fill it in again" : "✦ Fill it in"}
      </button>
      {note && <div className="dash-word-note mt-2">{note}</div>}

      {data && f && (
        <div className="dash-quickword-result">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="dash-word-row-line">
                <span className="dash-word-script" dir="auto">
                  {f.entry.original}
                </span>
                <span className="dash-word-translit">{f.entry.translit}</span>
              </div>
              <div className="dash-word-source">{f.entry.number}</div>
            </div>
            {langs.length > 1 && (
              <div className="dash-toggle" role="group" aria-label="Original language">
                {langs.map((l) => (
                  <button key={l} type="button" className={lang === l ? "is-on" : ""} onClick={() => setLang(l)}>
                    {LANG_NAME[l]}
                  </button>
                ))}
              </div>
            )}
          </div>
          {f.alternatives.length > 0 && (
            <div className="dash-word-alts">
              <span>Not the right word? Try</span>
              {f.alternatives.slice(0, 4).map((a) => (
                <button key={a.number} type="button" className="dash-word-alt" onClick={() => fill(a.number)} disabled={busy}>
                  <span dir="auto">{a.original}</span> {a.translit}
                </button>
              ))}
            </div>
          )}

          <dl className="dash-word-defs">
            <div>
              <dt>{LANG_NAME[lang]} meaning</dt>
              <dd>{f.meaning}</dd>
              <div className="dash-word-source">{f.meaningSource}</div>
            </div>
            {data.englishMeaning && (
              <div>
                <dt>English meaning</dt>
                <dd>{data.englishMeaning}</dd>
              </div>
            )}
          </dl>

          {f.keyVerses.length > 0 && (
            <div className="mt-4">
              <div className="eyebrow mb-1.5">Key verses</div>
              <KeyVerses verses={f.keyVerses} />
            </div>
          )}

          <label className="dash-label mt-4" htmlFor="qw-life">
            For my life
          </label>
          <GrowingTextarea
            id="qw-life"
            className="dash-textarea dash-word-field"
            placeholder="Write your own line here."
            value={application[lang]}
            onChange={(e) => setApplication((a) => ({ ...a, [lang]: e.target.value }))}
          />
          <label className="dash-label mt-3" htmlFor="qw-comment">
            My comment · optional
          </label>
          <GrowingTextarea
            id="qw-comment"
            className="dash-textarea dash-word-field"
            placeholder="What struck you, a prayer, a question."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button type="button" className="dash-btn dash-btn-primary dash-word-fill-btn mt-3" onClick={save}>
            Save word
          </button>
        </div>
      )}
    </div>
  );
}
