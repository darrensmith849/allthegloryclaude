"use client";

// Cmd+K command palette for the dashboard. Press ⌘K (or Ctrl+K) anywhere
// to search routes and quick actions. Keyboard-driven: arrow keys move,
// Enter activates, Esc closes.

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useDashboard } from "@/lib/dashboard/storage";
import { emptyHabits, resolveHabits, resolveSchedule } from "@/lib/dashboard/types";
import { todayISO } from "@/lib/dashboard/dates";

interface Command {
  id: string;
  title: string;
  hint?: string;
  group: "Navigate" | "Action";
  run: () => void;
}

export default function CommandPalette() {
  const router = useRouter();
  const { state, update } = useDashboard();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hi, setHi] = useState(0);
  const today = todayISO();

  // Global ⌘K / Ctrl+K listener — and Esc to close.
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
    const tracked = resolveHabits(state.settings);
    const sched = resolveSchedule(state.settings);
    return [
      // ── Navigation ─────────────────────────────────────────
      { id: "go-welcome", title: "Who am I?", group: "Navigate", run: go("/dashboard") },
      { id: "go-today", title: "Today", hint: "Daily schedule + habits", group: "Navigate", run: go("/dashboard/today") },
      { id: "go-bible", title: "Bible Reading", hint: "Chronological plan + journal", group: "Navigate", run: go("/dashboard/bible") },
      { id: "go-word", title: "Word Study", hint: "Greek / Hebrew + verse lookup", group: "Navigate", run: go("/dashboard/word-study") },
      { id: "go-habits", title: "Habits & Streaks", group: "Navigate", run: go("/dashboard/habits") },
      { id: "go-self", title: "Self-Control", hint: "Clean streak", group: "Navigate", run: go("/dashboard/self-control") },
      { id: "go-cal", title: "Calendar", group: "Navigate", run: go("/dashboard/calendar") },
      { id: "go-tasks", title: "Tasks", group: "Navigate", run: go("/dashboard/tasks") },
      { id: "go-guitar", title: "Guitar", hint: "Course + weekly plan", group: "Navigate", run: go("/dashboard/guitar") },
      { id: "go-book", title: "Book", group: "Navigate", run: go("/dashboard/book") },
      { id: "go-rem", title: "Reminders", group: "Navigate", run: go("/dashboard/reminders") },
      { id: "go-rew", title: "Rewards", group: "Navigate", run: go("/dashboard/rewards") },
      { id: "go-set", title: "Settings", group: "Navigate", run: go("/dashboard/settings") },
      // ── Actions ──────────────────────────────────────────
      {
        id: "act-mark-all",
        title: "Mark all done for today",
        hint: "Tick every habit + schedule row",
        group: "Action",
        run: () => {
          update((draft) => {
            const h = draft.habits[today] ?? emptyHabits();
            for (const habit of tracked) h[habit.id] = true;
            draft.habits[today] = h;
            if (!draft.scheduleChecks) draft.scheduleChecks = {};
            const day = draft.scheduleChecks[today] ?? {};
            for (const row of sched) if (!row.habitId) day[row.id] = true;
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
            for (const habit of tracked) h[habit.id] = false;
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
        id: "act-bible-read",
        title: "Mark Bible read today",
        group: "Action",
        run: () => {
          update((draft) => {
            const h = draft.habits[today] ?? emptyHabits();
            h["bibleRead"] = true;
            draft.habits[today] = h;
          });
          setOpen(false);
        },
      },
      {
        id: "act-clean",
        title: "Mark today clean",
        group: "Action",
        run: () => {
          update((draft) => {
            const h = draft.habits[today] ?? emptyHabits();
            h["noPorn"] = true;
            draft.habits[today] = h;
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
    return commands.filter(
      (c) => norm(c.title).includes(t) || (c.hint && norm(c.hint).includes(t)),
    );
  }, [q, commands]);

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
          placeholder="Search routes and actions…"
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
          {(["Navigate", "Action"] as const).map((group) => {
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
