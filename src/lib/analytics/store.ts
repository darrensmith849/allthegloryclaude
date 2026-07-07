/**
 * Durable analytics store on Cloudflare D1 (SQLite).
 *
 * No external service, no env vars, nothing to provision at runtime — the
 * `DB` binding is declared in wrangler.jsonc and is always present in
 * production. Every helper is defensive: if the binding is somehow missing
 * (e.g. `next dev` without the CF proxy) callers get null and degrade
 * gracefully rather than throwing, so tracking can never break the site.
 */
import { getCloudflareContext } from "@opennextjs/cloudflare";

// Minimal D1 typings so we don't need @cloudflare/workers-types at build time.
export interface D1Stmt {
  bind(...args: unknown[]): D1Stmt;
  run(): Promise<unknown>;
  first<T = unknown>(col?: string): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
}
export interface D1Db {
  prepare(sql: string): D1Stmt;
  batch(stmts: D1Stmt[]): Promise<unknown[]>;
}

/** The D1 binding, or null if it isn't available (never throws). */
export async function getDb(): Promise<D1Db | null> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const db = (env as unknown as { DB?: D1Db }).DB;
    return db ?? null;
  } catch {
    return null;
  }
}

/** Start of today (UTC) as epoch ms — used for "today" totals. */
export function startOfUtcDayMs(d: Date = new Date()): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/** YYYY-MM-DD (UTC) — matches SQLite's date(ts/1000,'unixepoch'). */
export function utcDayKey(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

// "Active now" = distinct sessions seen in the last 5 minutes.
export const ACTIVE_WINDOW_MS = 5 * 60 * 1000;
