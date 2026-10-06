"use client";

// A saved word from the word journal, as a compact row that opens to the
// full entry. Used on the Word Journal page and on the Study Notes day view.

import { useState } from "react";
import { formatShort } from "@/lib/dashboard/dates";
import { dayLabel } from "@/lib/dashboard/notes";
import type { BibleWord, KeyVerse } from "@/lib/dashboard/types";
import { languageLabel, wordDate } from "@/lib/dashboard/words";
import { DictionaryMeaning } from "@/components/study/dictionary-meaning";
import { SayIt } from "@/components/study/say-it";

interface Verse {
  chapter: number;
  verse: number;
  text: string;
}
interface VerseView {
  loading: boolean;
  label?: string;
  verses?: Verse[];
  error?: string;
}

export function KeyVerses({ verses, onRemove }: { verses: KeyVerse[]; onRemove?: (i: number) => void }) {
  return (
    <ul className="dash-word-keyverses">
      {verses.map((v, i) => (
        <li key={`${v.ref}-${i}`}>
          <span className="dash-word-keyverse-ref">{v.ref}</span>
          <span className="dash-word-keyverse-text">“{v.text}”</span>
          {onRemove && (
            <button
              type="button"
              className="dash-word-keyverse-remove"
              onClick={() => onRemove(i)}
              aria-label={`Remove ${v.ref}`}
              title="Remove this verse"
            >
              ✕
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

export function WordRow({
  w,
  open,
  isNew = false,
  editing = false,
  onToggle,
  onEdit,
  onDelete,
}: {
  w: BibleWord;
  open: boolean;
  isNew?: boolean;
  editing?: boolean;
  onToggle: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const [verse, setVerse] = useState<VerseView | null>(null);
  const preview = w.application || w.englishMeaning || w.originalMeaning;

  async function toggleVerse() {
    if (!w.reference) return;
    if (verse) return setVerse(null);
    setVerse({ loading: true });
    try {
      const r = await fetch(`/api/verse?ref=${encodeURIComponent(w.reference)}`);
      const data = await r.json();
      setVerse(
        data.error
          ? { loading: false, error: data.error }
          : { loading: false, label: `${data.reference} · ${data.translation}`, verses: data.verses },
      );
    } catch {
      setVerse({ loading: false, error: "Couldn't load that passage." });
    }
  }

  return (
    <article
      id={`word-${w.id}`}
      className={`dash-word-row ${open ? "is-open" : ""} ${isNew ? "is-new" : ""} ${editing ? "is-editing" : ""}`}
    >
      <button type="button" className="dash-word-row-head" onClick={onToggle} aria-expanded={open}>
        <span className="dash-word-row-main">
          <span className="dash-word-row-line">
            <span className="dash-word-row-title">{w.word}</span>
            {w.original && (
              <span className="dash-word-row-orig" dir="auto" lang={w.language === "greek" ? "grc" : "he"}>
                {w.original}
              </span>
            )}
            {w.translit && <span className="dash-word-row-translit">{w.translit}</span>}
          </span>
          {!open && preview && <span className="dash-word-row-sub">{preview}</span>}
        </span>
        <span className={`dash-word-lang is-${w.language}`}>{languageLabel(w)}</span>
        <span className="dash-word-row-chev" aria-hidden>
          ›
        </span>
      </button>

      {open && (
        <div className="dash-word-row-body">
          {w.translit && (
            <div className="dash-word-say">
              <SayIt text={w.translit.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[ʼʽ'’]/g, "")} label={`Say ${w.translit}`} />
              <span>Hear “{w.translit}”</span>
            </div>
          )}
          <dl className="dash-word-defs">
            {w.originalMeaning && (
              <div>
                <dt>
                  {languageLabel(w)} meaning{w.strongs ? ` · ${w.strongs}` : ""}
                </dt>
                <dd>{w.originalMeaning}</dd>
                {w.meaningSource && <div className="dash-word-source">{w.meaningSource}</div>}
              </div>
            )}
            <DictionaryMeaning word={w.word} />
            {w.englishMeaning && (
              <div>
                <dt>English meaning</dt>
                <dd>{w.englishMeaning}</dd>
              </div>
            )}
          </dl>

          {w.keyVerses && w.keyVerses.length > 0 && (
            <div className="mt-4">
              <div className="eyebrow mb-1.5">Key verses</div>
              <KeyVerses verses={w.keyVerses} />
            </div>
          )}

          {w.application && (
            <div className="dash-word-apply">
              <span className="eyebrow eyebrow-amber">For my life</span>
              <p>{w.application}</p>
            </div>
          )}

          {w.comment && (
            <div className="dash-word-comment">
              <span className="eyebrow">My comment</span>
              <p>{w.comment}</p>
            </div>
          )}

          <div className="dash-word-foot">
            {w.reference ? (
              <button
                type="button"
                className="dash-word-ref"
                onClick={toggleVerse}
                aria-expanded={Boolean(verse)}
                title={verse ? "Hide the passage" : "Read the passage"}
              >
                ↗ {w.reference}
              </button>
            ) : (
              <span />
            )}
            <span className="dash-word-date">
              {w.day ? `${dayLabel(w.day, { weekday: false })} reading` : formatShort(wordDate(w))}
            </span>
            {onEdit && (
              <button type="button" className="dash-word-link" onClick={onEdit}>
                Edit
              </button>
            )}
            {onDelete && (
              <button type="button" className="dash-word-link is-danger" onClick={onDelete}>
                Delete
              </button>
            )}
          </div>

          {verse && (
            <div className="dash-word-verse">
              {verse.loading && <span className="dash-word-hint">Opening the passage…</span>}
              {verse.error && <span className="text-[12.5px] text-[#f1a07d]">{verse.error}</span>}
              {verse.verses && (
                <>
                  <div className="eyebrow eyebrow-amber mb-1.5">{verse.label}</div>
                  <div className="dash-verse">
                    {verse.verses.map((x) => (
                      <p key={`${x.chapter}-${x.verse}`} className="mb-1.5">
                        <span className="dash-verse-num">{x.verse}</span>
                        {x.text}
                      </p>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
