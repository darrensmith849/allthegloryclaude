/**
 * Tiny wrapper around @upstash/redis with a graceful no-op fallback for
 * when the env vars aren't provisioned yet. Lets the API routes import
 * this without crashing on cold-start in environments where the user
 * hasn't enabled the storage backend.
 *
 * Supports BOTH naming conventions:
 *   - Legacy Vercel KV: KV_REST_API_URL + KV_REST_API_TOKEN
 *   - New Upstash Marketplace integration: UPSTASH_REDIS_REST_URL +
 *     UPSTASH_REDIS_REST_TOKEN
 *
 * To turn analytics on: in Vercel → Marketplace → install the Upstash
 * Redis integration → connect to the project. The env vars auto-deploy
 * and `isAnalyticsConfigured()` flips to true.
 */
import { Redis } from "@upstash/redis";

function readUrl(): string | undefined {
  return process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
}
function readToken(): string | undefined {
  return process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
}

export function isAnalyticsConfigured(): boolean {
  return Boolean(readUrl() && readToken());
}

// Lazy singleton so the import doesn't blow up at module-load time when
// the env vars aren't set (which is the normal state before the user
// connects the integration).
let _kv: Redis | null = null;
function getKv(): Redis {
  if (_kv) return _kv;
  const url = readUrl();
  const token = readToken();
  if (!url || !token) {
    throw new Error(
      "Upstash Redis not configured — guard with isAnalyticsConfigured() before calling kv",
    );
  }
  _kv = new Redis({ url, token });
  return _kv;
}

// Re-exported as `kv` so call sites read identically to the old @vercel/kv
// API (kv.incr, kv.zadd, etc.).
export const kv = new Proxy({} as Redis, {
  get(_t, prop) {
    const target = getKv();
    const value = target[prop as keyof Redis];
    return typeof value === "function" ? value.bind(target) : value;
  },
});

// ─── Key shape ────────────────────────────────────────────────────
// All keys live under a single "atg:" prefix so the KV namespace stays
// tidy even if another tenant ends up sharing the store.
export const K = {
  viewsTotal: "atg:views:total",
  viewsDay: (iso: string) => `atg:views:day:${iso}`,
  viewsByPath: "atg:views:by-path",
  viewsByCountry: "atg:views:by-country",
  viewsActive: "atg:views:active",
  downloadsTotal: "atg:downloads:total",
  downloadsDay: (iso: string) => `atg:downloads:day:${iso}`,
  downloadsList: "atg:downloads:list",
};

// Day keys auto-expire after 100 days so the store can't bloat
// indefinitely with per-day counters.
export const DAY_TTL_SECONDS = 60 * 60 * 24 * 100;

// "Active now" = sessions seen in the last 5 minutes.
export const ACTIVE_WINDOW_MS = 5 * 60 * 1000;

// Local-date YYYY-MM-DD using UTC so it stays consistent server-side.
export function utcDayKey(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}
