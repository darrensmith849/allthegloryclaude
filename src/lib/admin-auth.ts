// Admin login for the private dashboard.
//
// The password lives only in the DASHBOARD_PASSWORD Worker secret
// (`npx wrangler secret put DASHBOARD_PASSWORD`). Logging in sets a session
// cookie holding an expiry signed with a key derived from that password, so
// changing the password logs every device out. Web Crypto only - this runs
// in the middleware as well as in route handlers.

export const SESSION_COOKIE = "__Host-atg-admin";
export const SESSION_DAYS = 90;

const enc = new TextEncoder();

export function adminPassword(): string | null {
  const p = process.env.DASHBOARD_PASSWORD;
  return p ? p : null;
}

function signingKey(password: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(`atg-dashboard-session:${password}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function toBase64Url(bytes: ArrayBuffer): string {
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

// "v1.<expiry ms>.<signature>"
export async function createSession(password: string, now = Date.now()): Promise<string> {
  const payload = `v1.${now + SESSION_DAYS * 86_400_000}`;
  const sig = await crypto.subtle.sign("HMAC", await signingKey(password), enc.encode(payload));
  return `${payload}.${toBase64Url(sig)}`;
}

export async function verifySession(token: string | undefined, password: string): Promise<boolean> {
  const m = token?.match(/^(v1\.(\d+))\.([A-Za-z0-9_-]+)$/);
  if (!m || Number(m[2]) < Date.now()) return false;
  const sig = fromBase64Url(m[3]);
  if (!sig) return false;
  return crypto.subtle.verify("HMAC", await signingKey(password), sig, enc.encode(m[1]));
}

// Constant-time comparison: compare HMACs of both strings under a one-off
// key, so the time taken says nothing about how much of the guess matched.
export async function passwordMatches(input: string, password: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    crypto.getRandomValues(new Uint8Array(32)),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const [a, b] = await Promise.all([
    crypto.subtle.sign("HMAC", key, enc.encode(input)),
    crypto.subtle.sign("HMAC", key, enc.encode(password)),
  ]);
  const x = new Uint8Array(a);
  const y = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

export function sessionCookie(token: string): string {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DAYS * 86_400}`;
}

export function clearedSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

// Only send people back to somewhere inside the dashboard.
export function safeNext(next: string | null | undefined): string {
  return next && /^\/dashboard(?:[/?#]|$)/.test(next) && !next.startsWith("/dashboard/login")
    ? next
    : "/dashboard";
}
