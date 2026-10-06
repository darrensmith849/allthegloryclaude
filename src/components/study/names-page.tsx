"use client";

// The Names of God page - for members (/study/names) and on the owner's
// dashboard (/dashboard/names). Three tabs: the names of God, the names of
// Jesus, and people & places (who they were and what their names mean).
// Each name opens to its meaning, story, first appearance and key verses,
// with a speaker to hear it said. A chapter box shows which names are in
// any chapter. #el-shaddai (etc.) opens straight on that name.

import { useEffect, useMemo, useState } from "react";
import { Panel } from "@/components/dashboard/panel";
import { NAMES, type DivineName, type NameGroup } from "@/lib/study/names-of-god";
import { DICT_CREDIT, NameLookup } from "./name-lookup";
import { NamesInReading } from "./names-in-reading";
import { SayIt, speakable } from "./say-it";

type Tab = NameGroup | "people";

const TABS: { id: Tab; label: string }[] = [
  { id: "god", label: "Names of God" },
  { id: "jesus", label: "Names of Jesus" },
  { id: "people", label: "People & places" },
];

const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

interface VerseView {
  loading: boolean;
  text?: string;
  error?: string;
}

function KeyVerse({ refText }: { refText: string }) {
  const [v, setV] = useState<VerseView | null>(null);
  async function toggle() {
    if (v) return setV(null);
    setV({ loading: true });
    try {
      const r = await fetch(`/api/verse?ref=${encodeURIComponent(refText)}`);
      const d = (await r.json()) as { error?: string; verses?: { verse: number; text: string }[] };
      setV(
        d.error || !d.verses?.length
          ? { loading: false, error: d.error ?? "Couldn't find that verse." }
          : { loading: false, text: d.verses.map((x) => (d.verses!.length > 1 ? `${x.verse} ${x.text}` : x.text)).join(" ") },
      );
    } catch {
      setV({ loading: false, error: "Couldn't load that verse." });
    }
  }
  return (
    <li className={`names-verse ${v ? "is-open" : ""}`}>
      <button type="button" className="names-verse-ref" onClick={toggle} aria-expanded={Boolean(v)}>
        {refText}
      </button>
      {v && <span className="names-verse-text">{v.loading ? "Opening…" : (v.error ?? `“${v.text}”`)}</span>}
    </li>
  );
}

function NameCard({ n, open, onToggle }: { n: DivineName; open: boolean; onToggle: () => void }) {
  return (
    <article id={n.id} className={`names-card ${open ? "is-open" : ""}`}>
      <div className="names-card-top">
        <button type="button" className="names-card-head" onClick={onToggle} aria-expanded={open}>
          <span className="names-card-titles">
            <span className="names-card-name">{n.name}</span>
            <span className="names-card-english">{n.english}</span>
          </span>
          {n.original && (
            <span className="names-card-orig" dir="auto">
              {n.original}
            </span>
          )}
          <span className="names-card-meaning">{n.meaning}</span>
          <span className="dash-word-row-chev" aria-hidden>
            ›
          </span>
        </button>
        {n.say && <SayIt text={speakable(n.say)} label={`Say ${n.name}`} />}
      </div>
      {open && (
        <div className="names-card-body">
          <dl className="names-card-facts">
            {n.say && (
              <div>
                <dt>Say it</dt>
                <dd>
                  {n.say}
                  {n.translit ? ` · ${n.translit}` : ""}
                </dd>
              </div>
            )}
            <div>
              <dt>In English Bibles</dt>
              <dd>{n.reads}</dd>
            </div>
            <div>
              <dt>{n.lang}</dt>
              <dd>{n.strongs ? `Strong's ${n.strongs}` : n.translit ?? n.name}</dd>
            </div>
          </dl>
          {n.about.map((p, i) => (
            <p key={i} className="names-card-about">
              {p}
            </p>
          ))}
          <div className="names-card-first">
            <span className="eyebrow eyebrow-amber">Where it first appears</span>
            <span>
              <strong>{n.first.ref}</strong> - {n.first.note}
            </span>
          </div>
          <div className="eyebrow mt-4 mb-1.5">Key verses · tap to read</div>
          <ul className="names-verses">
            {n.verses.map((r) => (
              <KeyVerse key={r} refText={r} />
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

export function NamesPage() {
  const [tab, setTab] = useState<Tab>("god");
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const [filter, setFilter] = useState("");
  const [chapter, setChapter] = useState("");
  const [checking, setChecking] = useState("");

  // #el-shaddai: open that name, on its tab.
  useEffect(() => {
    const go = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      const n = NAMES.find((x) => x.id === id);
      if (!n) return;
      setTab(n.group);
      setFilter("");
      setOpen((s) => new Set([...s, n.id]));
      window.setTimeout(() => document.getElementById(n.id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    };
    go();
    window.addEventListener("hashchange", go);
    return () => window.removeEventListener("hashchange", go);
  }, []);

  const list = useMemo(() => {
    if (tab === "people") return [];
    const f = fold(filter.trim());
    return NAMES.filter(
      (n) => n.group === tab && (!f || fold(`${n.name} ${n.english} ${n.meaning} ${n.reads} ${n.translit ?? ""}`).includes(f)),
    );
  }, [tab, filter]);

  const toggle = (id: string) =>
    setOpen((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <>
      <div className="dash-pagehead">
        <div>
          <div className="eyebrow eyebrow-amber">Who He is</div>
          <h1 className="dash-title mt-1">Names of God</h1>
          <div className="dash-subtitle">
            Every name of God tells you something about Him. Tap a name to read its meaning and story, tap the speaker to hear it
            said.
          </div>
        </div>
      </div>

      <div className="names-tabs" role="tablist" aria-label="Names">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`names-tab ${tab === t.id ? "is-on" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="dash-grid">
        <div className="dash-col-8 names-main">
          {tab === "people" ? (
            <Panel eyebrow="People & places" title="Look up a name" className="names-people">
              <p className="dash-word-hint mb-3">
                Who they were, and what their name means - from Aaron to Zerubbabel. Tap the speaker to hear the name said.
              </p>
              <NameLookup autoFocus />
              <p className="dash-word-source mt-4">{DICT_CREDIT}</p>
            </Panel>
          ) : (
            <>
              <input
                type="search"
                className="dash-input names-filter"
                placeholder={tab === "god" ? "Find a name - e.g. shepherd, peace, Yahweh" : "Find a name - e.g. Lamb, Word, Messiah"}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                aria-label="Find a name"
              />
              <div className="names-list">
                {list.map((n) => (
                  <NameCard key={n.id} n={n} open={open.has(n.id)} onToggle={() => toggle(n.id)} />
                ))}
                {!list.length && <p className="dash-word-hint">No name matches “{filter.trim()}”.</p>}
              </div>
              <p className="dash-word-source mt-4">Verses quoted from the Berean Standard Bible (public domain).</p>
            </>
          )}
        </div>

        <aside className="dash-col-4 names-side">
          <Panel eyebrow="In a chapter" title="Which names are here?">
            <p className="dash-word-hint mb-3">
              Type a chapter to see which name of God is behind “God” or “LORD” in it.
            </p>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                setChecking(chapter.trim());
              }}
            >
              <input
                className="dash-input"
                placeholder="Genesis 17"
                value={chapter}
                onChange={(e) => setChapter(e.target.value)}
                aria-label="Book and chapter"
              />
              <button type="submit" className="dash-btn dash-btn-primary">
                Look
              </button>
            </form>
            {checking && (
              <div className="mt-4">
                <NamesInReading chapters={[checking]} namesUrl="" />
              </div>
            )}
          </Panel>
        </aside>
      </div>
    </>
  );
}
