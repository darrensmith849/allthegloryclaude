/**
 * Admin login for the private dashboard.
 *
 *   POST { password } -> 200 + session cookie | 401 | 429 | 503
 *
 * More than MAX_FAILURES wrong passwords from one address within
 * LOCKOUT_MS locks that address out until the window passes.
 */
import { checkPassword, createSession, getAdminRecord, sessionCookie } from "@/lib/admin-auth";
import { getDb } from "@/lib/analytics/store";

export const dynamic = "force-dynamic";

const MAX_FAILURES = 8;
const LOCKOUT_MS = 15 * 60_000;

export async function POST(req: Request) {
  const rec = await getAdminRecord(true);
  if (!rec) {
    return Response.json({ error: "No password has been set yet.", setup: true }, { status: 409 });
  }

  const body = (await req.json().catch(() => ({}))) as { password?: unknown };
  const attempt = String(body.password ?? "").slice(0, 200);
  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for") ?? "unknown";
  const db = await getDb();
  const now = Date.now();

  if (db) {
    const row = await db
      .prepare("SELECT COUNT(*) AS n FROM login_attempts WHERE ip=?1 AND ts>?2")
      .bind(ip, now - LOCKOUT_MS)
      .first<{ n: number }>()
      .catch(() => null);
    if (Number(row?.n ?? 0) >= MAX_FAILURES) {
      return Response.json(
        { error: "Too many wrong attempts. Try again in 15 minutes." },
        { status: 429 },
      );
    }
  }

  if (!attempt || !(await checkPassword(attempt, rec))) {
    if (db) {
      await db
        .batch([
          db.prepare("INSERT INTO login_attempts (ip, ts) VALUES (?1, ?2)").bind(ip, now),
          db.prepare("DELETE FROM login_attempts WHERE ts<?1").bind(now - 86_400_000),
        ])
        .catch(() => {});
    }
    await new Promise((r) => setTimeout(r, 600)); // slow down guessing
    return Response.json({ error: "That password isn't right." }, { status: 401 });
  }

  if (db) {
    await db.prepare("DELETE FROM login_attempts WHERE ip=?1").bind(ip).run().catch(() => {});
  }
  return Response.json(
    { ok: true },
    { headers: { "set-cookie": sessionCookie(await createSession(rec)), "cache-control": "no-store" } },
  );
}
