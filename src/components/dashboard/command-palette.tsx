"use client";

// Cmd+K command palette for the dashboard. Press ⌘K (or Ctrl+K) anywhere
// to search routes, quick actions and saved journal words. Keyboard-driven:
// arrow keys move, Enter activates, Esc closes.

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useDashboard } from "@/lib/dashboard/storage";
import { useWords } from "@/lib/dashboard/words-store";
import { emptyHabits, getScheduleForDate } from "@/lib/dashboard/types";
import { todayISO } from "@/lib/dashboard/dates";
import { languageLabel, matchesWord } from "@/lib/dashboard/words";

const GROUPS = ["Words", "Navigate", "Action"] as const;

interface Command {
  id: string;
  title: string;
  hint?: string;
  group: (typeof GROUPS)[number];
  run: () => void;
}

export default function CommandPalette() {
  const router = useRouter();
  const { state, update } = useDashboard();
  const { words: journalWords } = useWords();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hi, setHi] = useState(0);
  const today = todayISO();

  // Global ⌘K / Ctrl+K listener - and Esc to close.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setOpen((v) => !v);
        setQ("");
        setHi(0);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const commands: Command[] = useMemo(() => {
    const go = (href: string) => () => {
      setOpen(false);
      router.push(href);
    };
    const sched = getScheduleForDate(today, state.settings, state.scheduleExtras);
    return [
      // ── Navigation ─────────────────────────────────────────
      { id: "go-welcome", title: "Who am I?", group: "Navigate", run: go("/dashboard") },
      { id: "go-word", title: "Word Journal", hint: "Hebrew / Greek words you're studying", group: "Navigate", run: go("/dashboard/word-study") },
      { id: "go-notes", title: "Study Notes", hint: "Notes from your Bible reading, in order", group: "Navigate", run: go("/dashboard/notes") },
      { id: "go-today", title: "Today", hint: "Daily schedule", group: "Navigate", run: go("/dashboard/today") },
      { id: "go-cal", title: "Calendar", group: "Navigate", run: go("/dashboard/calendar") },
      { id: "go-tasks", title: "Tasks", group: "Navigate", run: go("/dashboard/tasks") },
      { id: "go-guitar", title: "Guitar", hint: "Course + weekly plan", group: "Navigate", run: go("/dashboard/guitar") },
      { id: "go-book", title: "Book", group: "Navigate", run: go("/dashboard/book") },
      { id: "go-rem", title: "Reminders", group: "Navigate", run: go("/dashboard/reminders") },
      { id: "go-analytics", title: "Analytics", group: "Navigate", run: go("/dashboard/analytics") },
      { id: "go-set", title: "Settings", group: "Navigate", run: go("/dashboard/settings") },
      // ── Actions ──────────────────────────────────────────
      {
        id: "act-add-word",
        title: "Add a word to the journal",
        hint: "Hebrew / Greek meaning, English meaning, for my life",
        group: "Action",
        run: go("/dashboard/word-study?new=1"),
      },
      {
        id: "act-add-note",
        title: "Write a study note",
        hint: "Page, passage and what you saw",
        group: "Action",
        run: go("/dashboard/notes"),
      },
      {
        id: "act-mark-all",
        title: "Mark all done for today",
        hint: "Tick every schedule row",
        group: "Action",
        run: () => {
          update((draft) => {
            const h = draft.habits[today] ?? emptyHabits();
            if (!draft.scheduleChecks) draft.scheduleChecks = {};
            const day = draft.scheduleChecks[today] ?? {};
            for (const row of sched) {
              if (row.habitId) h[row.habitId] = true;
              else day[row.id] = true;
            }
            draft.habits[today] = h;
            draft.scheduleChecks[today] = day;
          });
          setOpen(false);
        },
      },
      {
        id: "act-clear-all",
        title: "Clear all of today",
        group: "Action",
        run: () => {
          update((draft) => {
            const h = draft.habits[today] ?? emptyHabits();
            for (const row of sched) if (row.habitId) h[row.habitId] = false;
            draft.habits[today] = h;
            if (!draft.scheduleChecks) draft.scheduleChecks = {};
            draft.scheduleChecks[today] = {};
          });
          setOpen(false);
        },
      },
      {
        id: "act-complete-day",
        title: "Complete the day",
        hint: "Lock today's data with a timestamp",
        group: "Action",
        run: () => {
          update((draft) => {
            if (!draft.dayCompleted) draft.dayCompleted = {};
            draft.dayCompleted[today] = new Date().toISOString();
          });
          setOpen(false);
        },
      },
      {
        id: "act-back-to-public",
        title: "Back to the public site",
        group: "Action",
        run: () => {
          setOpen(false);
          router.push("/");
        },
      },
    ];
  }, [state, update, router, today]);

  const norm = (s: string) => s.toLowerCase();
  const filtered = useMemo(() => {
    const t = norm(q.trim());
    if (!t) return commands;
    // Saved words only appear once you start typing, so the palette stays
    // short when it opens.
    const words: Command[] = journalWords
      .filter((w) => matchesWord(w, q))
      .slice(0, 6)
      .map((w) => ({
        id: `word-${w.id}`,
        title: w.word,
        hint: [w.translit, languageLabel(w), w.strongs].filter(Boolean).join(" · "),
        group: "Words",
        run: () => {
          setOpen(false);
          router.push(`/dashboard/word-study?q=${encodeURIComponent(w.word)}`);
        },
      }));
    return [
      ...words,
      ...commands.filter(
        (c) => norm(c.title).includes(t) || (c.hint && norm(c.hint).includes(t)),
      ),
    ];
  }, [q, commands, journalWords, router]);

  useEffect(() => setHi(0), [q]);

  if (!open) return null;

  return (
    <div
      className="dash-cmdk-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="dash-cmdk-panel" role="dialog" aria-modal="true">
        <input
          autoFocus
          className="dash-cmdk-input"
          placeholder="Search words, pages and actions…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setHi((h) => Math.min(h + 1, filtered.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHi((h) => Math.max(h - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              const cmd = filtered[hi];
              if (cmd) cmd.run();
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
        />
        <div className="dash-cmdk-list">
          {GROUPS.map((group) => {
            const items = filtered.filter((c) => c.group === group);
            if (!items.length) return null;
            return (
              <div key={group}>
                <div className="dash-cmdk-group">{group}</div>
                {items.map((c) => {
                  const idx = filtered.indexOf(c);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      className={`dash-cmdk-item ${idx === hi ? "is-on" : ""}`}
                      onMouseEnter={() => setHi(idx)}
                      onClick={c.run}
                    >
                      <span className="dash-cmdk-title">{c.title}</span>
                      {c.hint && <span className="dash-cmdk-hint">{c.hint}</span>}
                    </button>
                  );
                })}
              </div>
            );
          })}
          {!filtered.length && (
            <div className="dash-cmdk-empty">No matches. Try a different word.</div>
          )}
        </div>
        <div className="dash-cmdk-foot">
          ↑↓ to navigate · Enter to run · Esc to close · ⌘K to reopen
        </div>
      </div>
    </div>
  );
}
