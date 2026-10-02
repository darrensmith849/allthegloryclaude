// Admin login for the private dashboard.
//
// The owner creates the password on the dashboard's own login screen the
// first time, and can change it in Settings. Only a PBKDF2-SHA256 hash
// (random salt) is kept, in D1 (table admin_auth, one row 'owner').
//
// Logging in sets a session cookie holding an expiry signed with a key
// derived from that hash, so changing the password logs every device out.
// Web Crypto only - this runs in the middleware as well as route handlers.

import { getDb } from "@/lib/analytics/store";

export const SESSION_COOKIE = "__Host-atg-admin";
export const SESSION_DAYS = 90;
export const MIN_PASSWORD = 10;
const ITERATIONS = 100_000; // the most Workers' PBKDF2 allows

const enc = new TextEncoder();

export interface AdminRecord {
  hash: string; // base64url
  salt: string; // base64url
  iterations: number;
}

function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  let s = "";
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array<ArrayBuffer> | null {
  try {
    const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
    const out = new Uint8Array(new ArrayBuffer(bin.length));
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

// ── The stored password ──────────────────────────────────────────

// Cached briefly per isolate so the middleware isn't a D1 read on every
// page. "No password yet" is never cached, and a session that doesn't match
// the cached record is re-checked against D1 (see isSignedIn), so a new or
// changed password works straight away.
let cached: { rec: AdminRecord; at: number } | null = null;
const CACHE_MS = 30_000;

export async function getAdminRecord(fresh = false): Promise<AdminRecord | null> {
  if (!fresh && cached && Date.now() - cached.at < CACHE_MS) return cached.rec;
  const db = await getDb();
  if (!db) return null;
  const row = await db
    .prepare("SELECT hash, salt, iterations FROM admin_auth WHERE id='owner'")
    .first<AdminRecord>()
    .catch(() => null);
  cached = row ? { rec: row, at: Date.now() } : null;
  return row ?? null;
}

async function derive(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256);
  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<AdminRecord> {
  const salt = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(16)));
  return {
    hash: toBase64Url(await derive(password, salt, ITERATIONS)),
    salt: toBase64Url(salt),
    iterations: ITERATIONS,
  };
}

export async function checkPassword(input: string, rec: AdminRecord): Promise<boolean> {
  const salt = fromBase64Url(rec.salt);
  const want = fromBase64Url(rec.hash);
  if (!salt || !want) return false;
  const got = await derive(input, salt, rec.iterations);
  if (got.length !== want.length) return false;
  let diff = 0; // constant time
  for (let i = 0; i < got.length; i++) diff |= got[i] ^ want[i];
  return diff === 0;
}

// Saves a new password hash, replacing any old one.
export async function saveAdminRecord(rec: AdminRecord): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("No database");
  await db
    .prepare(
      "INSERT INTO admin_auth (id, hash, salt, iterations, updated_at) VALUES ('owner', ?1, ?2, ?3, ?4) " +
        "ON CONFLICT(id) DO UPDATE SET hash=excluded.hash, salt=excluded.salt, " +
        "iterations=excluded.iterations, updated_at=excluded.updated_at",
    )
    .bind(rec.hash, rec.salt, rec.iterations, Date.now())
    .run();
  cached = { rec, at: Date.now() };
}

// First-time setup only: saves the hash if no password exists yet.
// Returns false if one was already set (someone got there first).
export async function createAdminRecord(rec: AdminRecord): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("No database");
  await db
    .prepare(
      "INSERT OR IGNORE INTO admin_auth (id, hash, salt, iterations, updated_at) VALUES ('owner', ?1, ?2, ?3, ?4)",
    )
    .bind(rec.hash, rec.salt, rec.iterations, Date.now())
    .run();
  const stored = await getAdminRecord(true);
  return stored?.hash === rec.hash;
}

// ── Sessions ─────────────────────────────────────────────────────

function signingKey(rec: AdminRecord): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(`atg-dashboard-session:${rec.hash}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

// "v1.<expiry ms>.<signature>"
export async function createSession(rec: AdminRecord, now = Date.now()): Promise<string> {
  const payload = `v1.${now + SESSION_DAYS * 86_400_000}`;
  const sig = await crypto.subtle.sign("HMAC", await signingKey(rec), enc.encode(payload));
  return `${payload}.${toBase64Url(sig)}`;
}

export async function verifySession(token: string | undefined, rec: AdminRecord): Promise<boolean> {
  const m = token?.match(/^(v1\.(\d+))\.([A-Za-z0-9_-]+)$/);
  if (!m || Number(m[2]) < Date.now()) return false;
  const sig = fromBase64Url(m[3]);
  if (!sig) return false;
  return crypto.subtle.verify("HMAC", await signingKey(rec), sig, enc.encode(m[1]));
}

// The signed-in session from a request's cookies, if valid.
export async function isSignedIn(cookieHeader: string | null): Promise<boolean> {
  const token = cookieHeader
    ?.split(/;\s*/)
    .find((c) => c.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1);
  if (!token) return false;
  const rec = await getAdminRecord();
  if (rec && (await verifySession(token, rec))) return true;
  const fresh = await getAdminRecord(true);
  return Boolean(fresh && fresh.hash !== rec?.hash && (await verifySession(token, fresh)));
}

export function sessionCookie(token: string): string {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DAYS * 86_400}`;
}

export function clearedSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}
