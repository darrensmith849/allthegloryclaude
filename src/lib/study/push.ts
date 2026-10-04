// Daily reading reminders by Web Push. The push carries no message - the
// service worker (public/study/sw.js) shows "Day N is ready" itself - so
// nothing personal passes through Google / Apple / Mozilla, and no payload
// encryption is needed: only the VAPID signature (RFC 8292) proving the
// push comes from this site. No Next.js imports: the hourly Cron Trigger in
// custom-worker.ts runs it too.

/** Public half of the VAPID key (the private half is the VAPID_PRIVATE_JWK secret). */
export const VAPID_PUBLIC_KEY = "BD7snAVy-poHpp8aaBTCwQKdcThAdlyKz3k-O6iWS2iP-xJ1VAcxTcJgDhoXmAcmTCglNtToPYAlbbdNt7P8Ces";

// Only real push services - never post to an address a browser didn't give us.
// (Chrome / Android, Firefox, Safari / iPhone, Edge.)
const PUSH_HOSTS = [/^fcm\.googleapis\.com$/, /^updates\.push\.services\.mozilla\.com$/, /\.push\.apple\.com$/, /\.notify\.windows\.com$/];

export function isPushEndpoint(url: unknown): url is string {
  if (typeof url !== "string" || url.length > 1000) return false;
  try {
    const u = new URL(url);
    return u.protocol === "https:" && PUSH_HOSTS.some((h) => h.test(u.hostname));
  } catch {
    return false;
  }
}

const b64u = (bytes: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
const text = (s: string) => new TextEncoder().encode(s);

async function vapidAuth(endpoint: string, privateJwk: string): Promise<string> {
  const jwk = JSON.parse(privateJwk) as { x: string; y: string; d: string };
  const key = await crypto.subtle.importKey(
    "jwk",
    { kty: "EC", crv: "P-256", x: jwk.x, y: jwk.y, d: jwk.d, ext: true },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const head = b64u(text(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const claims = b64u(
    text(
      JSON.stringify({
        aud: new URL(endpoint).origin,
        exp: Math.floor(Date.now() / 1000) + 12 * 3600,
        sub: "mailto:daniel@alltheglory.co.za",
      }),
    ),
  );
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, text(`${head}.${claims}`));
  return `vapid t=${head}.${claims}.${b64u(sig)}, k=${VAPID_PUBLIC_KEY}`;
}

/** Sends one empty push. Returns the push service's status (201 = sent; 404 / 410 = gone). */
export async function sendPush(endpoint: string, privateJwk: string): Promise<number> {
  const r = await fetch(endpoint, {
    method: "POST",
    headers: { authorization: await vapidAuth(endpoint, privateJwk), ttl: "43200", urgency: "normal" },
    body: new Uint8Array(0),
  });
  return r.status;
}

interface D1Like {
  prepare(sql: string): {
    bind(...args: unknown[]): {
      run(): Promise<unknown>;
      first<T = Record<string, unknown>>(): Promise<T | null>;
    };
    all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  };
}

// Local hour and date in a time zone ("Africa/Johannesburg").
export function localNow(tz: string, at = new Date()): { hour: number; day: string } {
  try {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" })
        .formatToParts(at)
        .map((p) => [p.type, p.value]),
    );
    return { hour: Number(parts.hour), day: `${parts.year}-${parts.month}-${parts.day}` };
  } catch {
    return localNow("Africa/Johannesburg", at);
  }
}

/** Hourly: remind everyone whose chosen hour it is (once a day, and not if they've already read today). */
export async function runReminders(db: D1Like, privateJwk: string | undefined): Promise<{ sent: number; gone: number }> {
  if (!privateJwk) return { sent: 0, gone: 0 };
  const { results } = await db
    .prepare(
      "SELECT r.endpoint, r.member_id, r.hour, r.tz, r.last_sent, r.failures FROM member_reminders r " +
        "JOIN members m ON m.id = r.member_id AND m.disabled_at IS NULL",
    )
    .all<{ endpoint: string; member_id: string; hour: number; tz: string; last_sent: string | null; failures: number }>();
  let sent = 0;
  let gone = 0;
  for (const r of results) {
    const now = localNow(r.tz);
    if (now.hour !== r.hour || r.last_sent === now.day) continue;
    const read = await db
      .prepare("SELECT 1 AS ok FROM member_days WHERE member_id = ?1 AND day = ?2 AND read_at IS NOT NULL")
      .bind(r.member_id, now.day)
      .first();
    if (read) continue;
    const status = await sendPush(r.endpoint, privateJwk).catch(() => 0);
    if (status >= 200 && status < 300) {
      sent++;
      await db.prepare("UPDATE member_reminders SET last_sent = ?2, failures = 0 WHERE endpoint = ?1").bind(r.endpoint, now.day).run();
    } else if (status === 404 || status === 410 || r.failures >= 20) {
      gone++;
      await db.prepare("DELETE FROM member_reminders WHERE endpoint = ?1").bind(r.endpoint).run();
    } else {
      await db.prepare("UPDATE member_reminders SET failures = failures + 1 WHERE endpoint = ?1").bind(r.endpoint).run();
    }
  }
  return { sent, gone };
}
