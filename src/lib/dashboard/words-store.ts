"use client";

// The word journal's words, shared by every screen that shows them. The
// server (one D1 row per word) is the record; this keeps an instant local
// copy and a queue of changes not yet confirmed, so a word saved with no
// signal is sent the next time the journal opens - never dropped. Deleting
// only moves a word to Recently deleted.
//
// One store per study (the owner's, or a member's - see
// src/lib/study/client.tsx), each with its own API and cache keys.

import { useCallback, useEffect, useMemo, useState } from "react";
import { useStudyClient, type StudyClient } from "@/lib/study/client";
import type { BibleWord } from "./types";

type Op =
  | { kind: "put"; word: BibleWord }
  | { kind: "delete"; id: string; at: string }
  | { kind: "restore"; id: string };

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

function applyOp(list: BibleWord[], op: Op): BibleWord[] {
  if (op.kind === "put") {
    return list.some((w) => w.id === op.word.id)
      ? list.map((w) => (w.id === op.word.id ? { ...op.word, deletedAt: w.deletedAt } : w))
      : [op.word, ...list];
  }
  if (op.kind === "delete") return list.map((w) => (w.id === op.id ? { ...w, deletedAt: op.at } : w));
  return list.map((w) => (w.id === op.id ? { ...w, deletedAt: undefined } : w));
}

class WordsStore {
  words: BibleWord[] = [];
  synced = false;
  private loading: Promise<void> | null = null;
  private flushing: Promise<void> | null = null;
  readonly listeners = new Set<() => void>();

  constructor(private readonly c: StudyClient) {}

  private get cacheKey() {
    return this.c.key("words");
  }
  private get pendingKey() {
    return this.c.key("wordsPending");
  }
  private get syncedKey() {
    return this.c.key("wordsSynced");
  }

  private emit() {
    this.listeners.forEach((l) => l());
  }

  private setWords(next: BibleWord[]) {
    this.words = next;
    write(this.cacheKey, next);
    this.emit();
  }

  private async send(op: Op): Promise<boolean> {
    const api = this.c.wordsApi;
    try {
      const r =
        op.kind === "put"
          ? await fetch(api, {
              method: "PUT",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ word: op.word }),
            })
          : op.kind === "delete"
            ? await fetch(`${api}?id=${encodeURIComponent(op.id)}`, { method: "DELETE" })
            : await fetch(api, {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ id: op.id, restore: true }),
              });
      return r.ok;
    } catch {
      return false;
    }
  }

  flush(): Promise<void> {
    if (this.flushing) return this.flushing;
    this.flushing = (async () => {
      for (;;) {
        const [op] = read<Op[]>(this.pendingKey, []);
        if (!op || !(await this.send(op))) break;
        write(this.pendingKey, read<Op[]>(this.pendingKey, []).slice(1));
      }
    })().finally(() => {
      this.flushing = null;
    });
    return this.flushing;
  }

  queue(op: Op) {
    write(this.pendingKey, [...read<Op[]>(this.pendingKey, []), op]);
    this.setWords(applyOp(this.words, op));
    void this.flush();
  }

  load(): Promise<void> {
    if (this.loading) return this.loading;
    this.words = read<BibleWord[]>(this.cacheKey, []);
    this.loading = (async () => {
      await this.flush(); // anything saved while offline goes first
      try {
        // After the first load, only ask for what changed (with a minute of
        // overlap) and merge it into the local copy.
        const since = this.words.length ? read<number>(this.syncedKey, 0) : 0;
        const r = await fetch(since ? `${this.c.wordsApi}?since=${since - 60_000}` : this.c.wordsApi, {
          cache: "no-store",
        });
        if (r.ok) {
          const data = (await r.json()) as { words?: BibleWord[]; syncedAt?: number };
          const changed = data.words ?? [];
          let next = since
            ? [...changed, ...this.words.filter((w) => !changed.some((c) => c.id === w.id))]
            : changed;
          if (data.syncedAt) write(this.syncedKey, data.syncedAt);
          // Keep anything still waiting to be sent on top of the server copy.
          for (const op of read<Op[]>(this.pendingKey, [])) next = applyOp(next, op);
          this.words = next;
          write(this.cacheKey, next);
        }
      } catch {
        // offline - the local copy stands until next time
      }
      this.synced = true;
      this.emit();
    })();
    return this.loading;
  }
}

const stores = new Map<string, WordsStore>();
function storeFor(c: StudyClient): WordsStore {
  const id = `${c.wordsApi}|${c.key("words")}`;
  let s = stores.get(id);
  if (!s) {
    s = new WordsStore(c);
    stores.set(id, s);
  }
  return s;
}

export function useWords() {
  const client = useStudyClient();
  const store = storeFor(client);
  const [, setTick] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const listener = () => setTick((t) => t + 1);
    store.listeners.add(listener);
    void store.load();
    setMounted(true);
    // Retry unsent changes when the connection comes back.
    const online = () => void store.flush();
    window.addEventListener("online", online);
    return () => {
      store.listeners.delete(listener);
      window.removeEventListener("online", online);
    };
  }, [store]);

  const all = mounted ? store.words : [];
  const live = useMemo(() => all.filter((w) => !w.deletedAt), [all]);
  const deleted = useMemo(
    () => all.filter((w) => w.deletedAt).sort((a, b) => (b.deletedAt ?? "").localeCompare(a.deletedAt ?? "")),
    [all],
  );

  const save = useCallback((w: BibleWord) => store.queue({ kind: "put", word: w }), [store]);
  const remove = useCallback(
    (id: string) => store.queue({ kind: "delete", id, at: new Date().toISOString() }),
    [store],
  );
  const restore = useCallback((id: string) => store.queue({ kind: "restore", id }), [store]);

  return { words: live, deleted, ready: mounted, synced: store.synced, save, remove, restore };
}
