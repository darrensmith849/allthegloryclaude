// Member accounts for The Study (/study).
//
// Anyone the owner lets in gets their own journal. Passwords are kept only
// as PBKDF2 hashes (same scheme as the dashboard admin, src/lib/admin-auth.ts).
// A login sets a random session token in a cookie; D1 keeps only its
// SHA-256 (member_sessions), so a session can be ended from the server
// and a database leak exposes no usable tokens.

import { getDb, type D1Db } from "@/lib/analytics/store";
import { checkPassword, hashPassword } from "@/lib/admin-auth";
import { memberScope, type Scope } from "./scope";

export const MEMBER_COOKIE = "__Host-atg-study";
export const MEMBER_SESSION_DAYS = 90;
export const MIN_MEMBER_PASSWORD = 8;

export interface Member {
  id: string;
  email: string;
  name: string;
  createdAt: number;
}

export type SignupMode = "invite" | "open" | "closed";
export type ReadingMode = "off" | "members" | "public";

export interface StudySettings {
  signup: SignupMode; // who can make an account
  reading: ReadingMode; // who can read the owner's study
  author: string; // name shown on the owner's study
  intro: string; // a welcome line on /study
}

export const DEFAULT_SETTINGS: StudySettings = {
  signup: "invite",
  reading: "off",
  author: "All The Glory",
  intro: "",
};

const enc = new TextEncoder();

function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  let s = "";
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function randomToken(bytes = 32): string {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(new ArrayBuffer(bytes))));
}

export async function sha256(s: string): Promise<string> {
  return toBase64Url(await crypto.subtle.digest("SHA-256", enc.encode(s)));
}

export const normEmail = (v: unknown) => String(v ?? "").trim().toLowerCase().slice(0, 200);
export const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
export const cleanName = (v: unknown) => String(v ?? "").trim().replace(/\s+/g, " ").slice(0, 80);

export function clientIp(req: Request): string {
  return req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for") ?? "unknown";
}

// ── Settings ─────────────────────────────────────────────────────

export async function getSettings(db: D1Db): Promise<StudySettings> {
  const { results } = await db
    .prepare("SELECT key, value FROM study_settings")
    .all<{ key: string; value: string }>()
    .catch(() => ({ results: [] as { key: string; value: string }[] }));
  const raw = Object.fromEntries(results.map((r) => [r.key, r.value]));
  return {
    signup: (["invite", "open", "closed"] as const).find((m) => m === raw.signup) ?? DEFAULT_SETTINGS.signup,
    reading: (["off", "members", "public"] as const).find((m) => m === raw.reading) ?? DEFAULT_SETTINGS.reading,
    author: raw.author?.trim() || DEFAULT_SETTINGS.author,
    intro: raw.intro ?? DEFAULT_SETTINGS.intro,
  };
}

export async function saveSettings(db: D1Db, patch: Partial<StudySettings>): Promise<StudySettings> {
  const now = Date.now();
  const entries: [string, string][] = [];
  if (patch.signup && ["invite", "open", "closed"].includes(patch.signup)) entries.push(["signup", patch.signup]);
  if (patch.reading && ["off", "members", "public"].includes(patch.reading)) entries.push(["reading", patch.reading]);
  if (typeof patch.author === "string") entries.push(["author", patch.author.trim().slice(0, 80)]);
  if (typeof patch.intro === "string") entries.push(["intro", patch.intro.trim().slice(0, 1000)]);
  if (entries.length) {
    await db.batch(
      entries.map(([k, v]) =>
        db
          .prepare(
            "INSERT INTO study_settings (key, value, updated_at) VALUES (?1, ?2, ?3) " +
              "ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
          )
          .bind(k, v, now),
      ),
    );
  }
  return getSettings(db);
}

// ── Passwords ────────────────────────────────────────────────────

interface MemberRow {
  id: string;
  email: string;
  name: string;
  hash: string;
  salt: string;
  iterations: number;
  created_at: number;
  disabled_at: number | null;
}

export const hashMemberPassword = hashPassword;

export async function memberByEmail(db: D1Db, email: string): Promise<MemberRow | null> {
  return db.prepare("SELECT * FROM members WHERE email = ?1").bind(email).first<MemberRow>();
}

// Checks a login. Runs the hash even for an unknown email so the answer
// takes the same time either way.
export async function verifyLogin(
  db: D1Db,
  email: string,
  password: string,
): Promise<{ member: MemberRow | null; ok: boolean }> {
  const member = await memberByEmail(db, email);
  if (!member) {
    await hashPassword(password || "x");
    return { member: null, ok: false };
  }
  return { member, ok: await checkPassword(password, member) };
}

export async function checkMemberPassword(db: D1Db, id: string, password: string): Promise<boolean> {
  const row = await db.prepare("SELECT * FROM members WHERE id = ?1").bind(id).first<MemberRow>();
  return Boolean(row && (await checkPassword(password, row)));
}

// ── Sessions ─────────────────────────────────────────────────────

export async function createMemberSession(db: D1Db, memberId: string): Promise<string> {
  const token = randomToken();
  const now = Date.now();
  await db.batch([
    db
      .prepare("INSERT INTO member_sessions (token_hash, member_id, created_at, expires_at) VALUES (?1, ?2, ?3, ?4)")
      .bind(await sha256(token), memberId, now, now + MEMBER_SESSION_DAYS * 86_400_000),
    db.prepare("DELETE FROM member_sessions WHERE expires_at < ?1").bind(now),
    db.prepare("UPDATE members SET last_seen = ?2 WHERE id = ?1").bind(memberId, now),
  ]);
  return token;
}

export function memberCookie(token: string): string {
  return `${MEMBER_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MEMBER_SESSION_DAYS * 86_400}`;
}

export function clearedMemberCookie(): string {
  return `${MEMBER_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export function sessionToken(req: Request): string | null {
  return (
    req.headers
      .get("cookie")
      ?.split(/;\s*/)
      .find((c) => c.startsWith(`${MEMBER_COOKIE}=`))
      ?.slice(MEMBER_COOKIE.length + 1) || null
  );
}

// The signed-in member for a request, or null.
export async function getMember(req: Request, db?: D1Db | null): Promise<Member | null> {
  const token = sessionToken(req);
  if (!token || token.length > 100) return null;
  const d = db ?? (await getDb());
  if (!d) return null;
  const row = await d
    .prepare(
      "SELECT m.id, m.email, m.name, m.created_at, m.last_seen FROM member_sessions s JOIN members m ON m.id = s.member_id " +
        "WHERE s.token_hash = ?1 AND s.expires_at > ?2 AND m.disabled_at IS NULL",
    )
    .bind(await sha256(token), Date.now())
    .first<{ id: string; email: string; name: string; created_at: number; last_seen: number | null }>()
    .catch(() => null);
  if (!row) return null;
  // Note when they were last here, at most once an hour.
  if (!row.last_seen || Date.now() - row.last_seen > 3_600_000) {
    await d.prepare("UPDATE members SET last_seen = ?2 WHERE id = ?1").bind(row.id, Date.now()).run().catch(() => {});
  }
  return { id: row.id, email: row.email, name: row.name, createdAt: row.created_at };
}

export async function endSession(req: Request, db: D1Db): Promise<void> {
  const token = sessionToken(req);
  if (token) await db.prepare("DELETE FROM member_sessions WHERE token_hash = ?1").bind(await sha256(token)).run();
}

// For the member journal APIs: the signed-in member's scope, or a 401.
export async function memberScopeOf(req: Request): Promise<Scope | Response> {
  const member = await getMember(req);
  return member
    ? memberScope(member.id)
    : Response.json({ error: "Please log in to your study.", login: true }, { status: 401 });
}

// ── Brute-force limits (shares login_attempts with the admin login) ──

export async function tooMany(db: D1Db, key: string, max: number, windowMs: number): Promise<boolean> {
  const row = await db
    .prepare("SELECT COUNT(*) AS n FROM login_attempts WHERE ip = ?1 AND ts > ?2")
    .bind(key, Date.now() - windowMs)
    .first<{ n: number }>()
    .catch(() => null);
  return Number(row?.n ?? 0) >= max;
}

export async function noteAttempt(db: D1Db, key: string): Promise<void> {
  const now = Date.now();
  await db
    .batch([
      db.prepare("INSERT INTO login_attempts (ip, ts) VALUES (?1, ?2)").bind(key, now),
      db.prepare("DELETE FROM login_attempts WHERE ts < ?1").bind(now - 86_400_000),
    ])
    .catch(() => {});
}

export async function clearAttempts(db: D1Db, key: string): Promise<void> {
  await db.prepare("DELETE FROM login_attempts WHERE ip = ?1").bind(key).run().catch(() => {});
}

export const slowDown = () => new Promise((r) => setTimeout(r, 600));

// ── Invites ──────────────────────────────────────────────────────

export interface InviteRow {
  code: string;
  label: string | null;
  max_uses: number | null;
  uses: number;
  created_at: number;
  revoked_at: number | null;
}

export async function usableInvite(db: D1Db, code: string): Promise<InviteRow | null> {
  if (!code || code.length > 64) return null;
  return db
    .prepare(
      "SELECT * FROM member_invites WHERE code = ?1 AND revoked_at IS NULL AND (max_uses IS NULL OR uses < max_uses)",
    )
    .bind(code)
    .first<InviteRow>();
}

// Every table a member's own data lives in (for account deletion).
export const MEMBER_TABLES = [
  "member_notes",
  "member_note_versions",
  "member_words",
  "member_word_versions",
  "member_days",
  "member_day_versions",
  "member_sessions",
  "member_resets",
] as const;

// ── The owner's email list (table email_list) ────────────────────

export async function isSubscribed(db: D1Db, email: string): Promise<boolean> {
  const row = await db
    .prepare("SELECT 1 AS ok FROM email_list WHERE email = ?1 AND unsubscribed_at IS NULL")
    .bind(email)
    .first<{ ok: number }>()
    .catch(() => null);
  return Boolean(row);
}

// Adds someone who asked for updates (or re-subscribes them).
export const subscribeStmt = (db: D1Db, email: string, name: string | null, source: "newsletter" | "study") =>
  db
    .prepare(
      "INSERT INTO email_list (email, name, source, subscribed_at) VALUES (?1, ?2, ?3, ?4) " +
        "ON CONFLICT(email) DO UPDATE SET name = COALESCE(excluded.name, email_list.name), unsubscribed_at = NULL, " +
        "subscribed_at = CASE WHEN email_list.unsubscribed_at IS NULL THEN email_list.subscribed_at ELSE excluded.subscribed_at END",
    )
    .bind(email, name, source, Date.now());

export const unsubscribeStmt = (db: D1Db, email: string) =>
  db.prepare("UPDATE email_list SET unsubscribed_at = ?2 WHERE email = ?1").bind(email, Date.now());
