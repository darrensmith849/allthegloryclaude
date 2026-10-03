"use client";

// The word journal's words, shared by every page that shows them. The
// server (/api/words, one D1 row per word) is the record; this keeps an
// instant local copy and a queue of changes not yet confirmed, so a word
// saved with no signal is sent the next time the dashboard opens - never
// dropped. Deleting only moves a word to Recently deleted.

import { useCallback, useEffect, useMemo, useState } from "react";
import type { BibleWord } from "./types";

const API = "/api/words";
const CACHE_KEY = "atg:words:v1";
const PENDING_KEY = "atg:words:pending";

type Op =
  | { kind: "put"; word: BibleWord }
  | { kind: "delete"; id: string; at: string }
  | { kind: "restore"; id: string };

let words: BibleWord[] = [];
let synced = false;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full / private window - the server copy still counts
  }
}

function setWords(next: BibleWord[]) {
  words = next;
  write(CACHE_KEY, next);
  emit();
}

function applyOp(list: BibleWord[], op: Op): BibleWord[] {
  if (op.kind === "put") {
    return list.some((w) => w.id === op.word.id)
      ? list.map((w) => (w.id === op.word.id ? { ...op.word, deletedAt: w.deletedAt } : w))
      : [op.word, ...list];
  }
  if (op.kind === "delete") return list.map((w) => (w.id === op.id ? { ...w, deletedAt: op.at } : w));
  return list.map((w) => (w.id === op.id ? { ...w, deletedAt: undefined } : w));
}

async function send(op: Op): Promise<boolean> {
  try {
    const r =
      op.kind === "put"
        ? await fetch(API, {
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ word: op.word }),
          })
        : op.kind === "delete"
          ? await fetch(`${API}?id=${encodeURIComponent(op.id)}`, { method: "DELETE" })
          : await fetch(API, {
              method: "PATCH",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ id: op.id, restore: true }),
            });
    return r.ok;
  } catch {
    return false;
  }
}

let flushing: Promise<void> | null = null;
function flush(): Promise<void> {
  if (flushing) return flushing;
  flushing = (async () => {
    for (;;) {
      const [op] = read<Op[]>(PENDING_KEY, []);
      if (!op || !(await send(op))) break;
      write(PENDING_KEY, read<Op[]>(PENDING_KEY, []).slice(1));
    }
  })().finally(() => {
    flushing = null;
  });
  return flushing;
}

function queue(op: Op) {
  write(PENDING_KEY, [...read<Op[]>(PENDING_KEY, []), op]);
  setWords(applyOp(words, op));
  void flush();
}

function load(): Promise<void> {
  if (loading) return loading;
  words = read<BibleWord[]>(CACHE_KEY, []);
  loading = (async () => {
    await flush(); // anything saved while offline goes first
    try {
      const r = await fetch(API, { cache: "no-store" });
      if (r.ok) {
        const data = (await r.json()) as { words?: BibleWord[] };
        // Keep anything still waiting to be sent on top of the server copy.
        let next = data.words ?? [];
        for (const op of read<Op[]>(PENDING_KEY, [])) next = applyOp(next, op);
        words = next;
        write(CACHE_KEY, next);
      }
    } catch {
      // offline - the local copy stands until next time
    }
    synced = true;
    emit();
  })();
  return loading;
}

export function useWords() {
  const [, setTick] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const listener = () => setTick((t) => t + 1);
    listeners.add(listener);
    void load();
    setMounted(true);
    // Retry unsent changes when the connection comes back.
    const online = () => void flush();
    window.addEventListener("online", online);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("online", online);
    };
  }, []);

  const all = mounted ? words : [];
  const live = useMemo(() => all.filter((w) => !w.deletedAt), [all]);
  const deleted = useMemo(
    () => all.filter((w) => w.deletedAt).sort((a, b) => (b.deletedAt ?? "").localeCompare(a.deletedAt ?? "")),
    [all],
  );

  const save = useCallback((w: BibleWord) => queue({ kind: "put", word: w }), []);
  const remove = useCallback((id: string) => queue({ kind: "delete", id, at: new Date().toISOString() }), []);
  const restore = useCallback((id: string) => queue({ kind: "restore", id }), []);

  return { words: live, deleted, ready: mounted, synced, save, remove, restore };
}
