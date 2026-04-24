"use client";

/**
 * Command palette — the Linear / Vercel-style ⌘K menu.
 *
 * - Open: ⌘K on macOS, Ctrl+K on Windows/Linux.
 * - Navigate: ↑ / ↓ to move, Enter to go, Esc to close.
 * - Surfaces every page in `site.nav`, plus the album page even though
 *   it lives outside the top nav.
 *
 * Intentionally no third-party dependency — it's ~120 lines and doesn't
 * need cmdk's full state machine for a menu this small.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { site } from "@/content/site";
import { album } from "@/content/album";

type Item = { label: string; href: string; hint?: string };

const extraItems: Item[] = [
  { label: "Album — From Darkness To Light", href: album.path, hint: "Music" },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const reduce = useReducedMotion();

  // All navigable targets, deduped by href.
  const items = useMemo<Item[]>(() => {
    const byHref = new Map<string, Item>();
    for (const n of site.nav) byHref.set(n.href, { label: n.label, href: n.href });
    for (const e of extraItems) if (!byHref.has(e.href)) byHref.set(e.href, e);
    return Array.from(byHref.values());
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.label.toLowerCase().includes(q) ||
        i.href.toLowerCase().includes(q) ||
        (i.hint ?? "").toLowerCase().includes(q)
    );
  }, [items, query]);

  // Keep cursor valid as filter shrinks.
  useEffect(() => {
    if (cursor >= filtered.length) setCursor(Math.max(0, filtered.length - 1));
  }, [filtered.length, cursor]);

  // Global hotkeys: ⌘K / Ctrl+K to open, Esc handled inside when open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Focus the input when the palette opens; reset state on close.
  useEffect(() => {
    if (open) {
      const t = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(t);
    }
    setQuery("");
    setCursor(0);
  }, [open]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router]
  );

  const onInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => (c + 1) % Math.max(1, filtered.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => (c - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = filtered[cursor];
      if (target) go(target.href);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  const dialogTransition = reduce
    ? { duration: 0.01 }
    : { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Command menu"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0.01 : 0.18 }}
          className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[14vh]"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
            transition={dialogTransition}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-xl panel-scrim overflow-hidden"
          >
            <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-white/10">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="text-white/40 shrink-0"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onInputKey}
                placeholder="Jump to…"
                className="flex-1 bg-transparent text-[15px] text-white placeholder:text-white/30 focus:outline-none"
                aria-label="Search pages"
                aria-controls="command-results"
                aria-activedescendant={
                  filtered[cursor] ? `cmd-item-${cursor}` : undefined
                }
              />
              <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/40 border border-white/15 rounded">
                Esc
              </kbd>
            </div>

            <ul
              id="command-results"
              role="listbox"
              aria-label="Pages"
              className="max-h-[50vh] overflow-y-auto py-2"
            >
              {filtered.length === 0 ? (
                <li className="px-5 py-4 text-sm text-white/50">
                  No matches.
                </li>
              ) : (
                filtered.map((item, i) => {
                  const active = i === cursor;
                  return (
                    <li
                      id={`cmd-item-${i}`}
                      key={item.href}
                      role="option"
                      aria-selected={active}
                      onMouseEnter={() => setCursor(i)}
                      onClick={() => go(item.href)}
                      className={`flex items-center justify-between gap-4 px-5 py-3 cursor-pointer transition-colors ${
                        active ? "bg-white/[0.06]" : "bg-transparent"
                      }`}
                    >
                      <div className="min-w-0">
                        <div
                          className={`text-sm tracking-tight ${
                            active ? "text-white" : "text-white/80"
                          }`}
                        >
                          {item.label}
                        </div>
                        <div className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.22em] text-white/35">
                          {item.hint ?? item.href}
                        </div>
                      </div>
                      {active && (
                        <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--colour-amber)] border border-[var(--colour-amber)]/40 rounded">
                          ↵
                        </kbd>
                      )}
                    </li>
                  );
                })
              )}
            </ul>

            <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-white/10 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/35">
              <span>Navigate</span>
              <span className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 border border-white/15 rounded">↑</kbd>
                <kbd className="px-1.5 py-0.5 border border-white/15 rounded">↓</kbd>
                <span>to move</span>
                <kbd className="ml-3 px-1.5 py-0.5 border border-white/15 rounded">↵</kbd>
                <span>to open</span>
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
