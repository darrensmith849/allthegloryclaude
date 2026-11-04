// Shared notes, in the browser: the lock and the key.
//
// A group's key is made here, in the browser, and travels only inside the
// group's link, after the "#" - browsers never send that part to a server.
// Everything written in a group is locked with it (AES-256-GCM) before it's
// sent, so the site only ever stores scrambled text. Each device keeps the
// key once the link has been opened on it, so the group opens by itself.
//
// Because of that, never send a link anywhere over the web: no analytics, no
// wa.me share URLs, no query strings. Copy it or use the device's share sheet.

import type { NoteInput } from "@/lib/dashboard/notes";

export type SharedNoteBody = Pick<NoteInput, "text" | "day" | "book" | "chapter" | "verse" | "verseEnd"> & { from?: string };

export interface GroupRow {
  id: string;
  sealedName: string;
  sealedLink: string;
  people: number;
  notes: number;
  leader: boolean;
  updatedAt: number;
}

export interface GroupPerson {
  id: string;
  sealedName: string;
  joinedAt: number;
  leader: boolean;
  me: boolean;
}

export interface GroupNoteRow {
  id: string;
  memberId: string;
  sealed: string;
  createdAt: number;
  updatedAt: number;
}

// ── Locking ──────────────────────────────────────────────────────

const enc = new TextEncoder();
const dec = new TextDecoder();

function toB64(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64(s: string): Uint8Array<ArrayBuffer> {
  const raw = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

const randomB64 = (bytes: number) => toB64(crypto.getRandomValues(new Uint8Array(new ArrayBuffer(bytes))));
export const newSecret = () => randomB64(32);
export const newJoinCode = () => randomB64(18);

const imported = new Map<string, Promise<CryptoKey>>();
function keyOf(secret: string): Promise<CryptoKey> {
  let key = imported.get(secret);
  if (!key) {
    key = crypto.subtle.importKey("raw", fromB64(secret), "AES-GCM", false, ["encrypt", "decrypt"]);
    imported.set(secret, key);
  }
  return key;
}

export async function seal(secret: string, value: unknown): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(12)));
  const data = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await keyOf(secret), enc.encode(JSON.stringify(value)));
  return `v1.${toB64(iv)}.${toB64(new Uint8Array(data))}`;
}

// Throws if the key is wrong or the text has been changed.
export async function unseal<T>(secret: string, sealed: string): Promise<T> {
  const [, iv, data] = sealed.split(".");
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromB64(iv) }, await keyOf(secret), fromB64(data));
  return JSON.parse(dec.decode(plain)) as T;
}

// ── The link ─────────────────────────────────────────────────────

export interface Invite {
  code: string;
  secret: string;
}

export const inviteLink = ({ code, secret }: Invite) => `${window.location.origin}/study/shared#join=${code}.${secret}`;

export function parseInvite(text: string): Invite | null {
  const m = /#join=([A-Za-z0-9_-]{16,64})\.([A-Za-z0-9_-]{43})/.exec(text);
  return m ? { code: m[1], secret: m[2] } : null;
}

// ── What this device remembers ───────────────────────────────────

// An invite waiting while its new member logs in or makes an account.
const PENDING = "atg:study:groupInvite";

// Takes the key out of the address bar as soon as the page opens, so it isn't
// left on show, and holds on to it for joining. True if there is one waiting.
export function catchInvite(): boolean {
  try {
    const invite = parseInvite(window.location.hash);
    if (invite) {
      window.localStorage.setItem(PENDING, JSON.stringify(invite));
      window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
    }
    return Boolean(window.localStorage.getItem(PENDING));
  } catch {
    return false; // private window
  }
}

export function pendingInvite(): Invite | null {
  try {
    return JSON.parse(window.localStorage.getItem(PENDING) ?? "null") as Invite | null;
  } catch {
    return null;
  }
}

export function clearInvite() {
  try {
    window.localStorage.removeItem(PENDING);
  } catch {
    // private window
  }
}

// Under the member's own prefix: kept when they log out (the link may be the
// only other copy), wiped with everything else if the account is deleted -
// see forgetMe in src/components/study/shell.tsx.
const keyring = (memberId: string) => `atg:study:${memberId}:groupKeys`;
const sharedLog = (memberId: string) => `atg:study:${memberId}:groupShared`;

function readJson<T>(key: string, empty: T): T {
  try {
    return (JSON.parse(window.localStorage.getItem(key) ?? "null") as T | null) ?? empty;
  } catch {
    return empty;
  }
}
function writeJson(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // private window
  }
}

export const loadSecrets = (memberId: string) => readJson<Record<string, string>>(keyring(memberId), {});

export function saveSecret(memberId: string, groupId: string, secret: string): Record<string, string> {
  const all = { ...loadSecrets(memberId), [groupId]: secret };
  writeJson(keyring(memberId), all);
  return all;
}

// Which journal notes have already gone to which group, so the Share button
// can say so. Only on this device; the server can't tell.
export const sharedTo = (memberId: string) => readJson<Record<string, string[]>>(sharedLog(memberId), {});

export function markShared(memberId: string, noteId: string, groupId: string) {
  const all = sharedTo(memberId);
  all[noteId] = [...new Set([...(all[noteId] ?? []), groupId])];
  writeJson(sharedLog(memberId), all);
}

// ── Talking to the server ────────────────────────────────────────

export async function groupsCall<T>(method: string, body?: unknown, query = ""): Promise<T> {
  const r = await fetch(`/api/study/groups${query}`, {
    method,
    cache: "no-store",
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await r.json().catch(() => ({}))) as T & { error?: string };
  if (!r.ok) throw new Error(data.error ?? "Couldn't reach the group - check your connection.");
  return data;
}
