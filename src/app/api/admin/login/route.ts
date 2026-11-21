/**
 * Admin login for the private dashboard.
 *
 *   POST { password } -> 200 + session cookie | 401 | 429 | 503
 *   POST { password, as: "family" } -> the same for family (Daniel's sister):
 *     her one password, set by Daniel in Settings, opens her own dashboard
 *     (a Study session for her 'personal' member account).
 *
 * More than MAX_FAILURES wrong passwords from one address within
 * LOCKOUT_MS locks that address out until the window passes.
 */
import { checkPasswordAnyDevice, clearedSessionCookie, createSession, getAdminRecord, sessionCookie } from "@/lib/admin-auth";
import { getDb, type D1Db } from "@/lib/analytics/store";
import { createMemberSession, memberCookie } from "@/lib/study/members";
import { clearedWhoCookie, whoCookie } from "@/lib/team";

export const dynamic = "force-dynamic";

const MAX_FAILURES = 8;
const LOCKOUT_MS = 15 * 60_000;

export async function POST(req: Request) {
  const rec = await getAdminRecord(true);
  if (!rec) {
    return Response.json({ error: "No password has been set yet.", setup: true }, { status: 409 });
  }

  const body = (await req.json().catch(() => ({}))) as { password?: unknown; as?: unknown };
  const attempt = String(body.password ?? "").slice(0, 200);
  const family = body.as === "family";
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

  const familyId = family && db && attempt ? await familyMember(db, attempt) : null;
  if (!attempt || (family ? !familyId : !(await checkPasswordAnyDevice(attempt, rec)))) {
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
  if (familyId && db) {
    const headers = new Headers({ "cache-control": "no-store" });
    headers.append("set-cookie", memberCookie(await createMemberSession(db, familyId)));
    headers.append("set-cookie", whoCookie(`member:${familyId}`));
    // One person per device: Daniel's own login here ends, so this device shows hers.
    headers.append("set-cookie", clearedSessionCookie());
    return Response.json({ ok: true, family: true }, { headers });
  }
  const headers = new Headers({ "cache-control": "no-store" });
  headers.append("set-cookie", sessionCookie(await createSession(rec)));
  headers.append("set-cookie", clearedWhoCookie());
  return Response.json({ ok: true }, { headers });
}

// The family account (members.role 'personal') this password opens, if any.
async function familyMember(db: D1Db, password: string): Promise<string | null> {
  const { results } = await db
    .prepare("SELECT id, hash, salt, iterations FROM members WHERE role = 'personal' AND disabled_at IS NULL")
    .all<{ id: string; hash: string; salt: string; iterations: number }>()
    .catch(() => ({ results: [] as { id: string; hash: string; salt: string; iterations: number }[] }));
  for (const m of results) if (await checkPasswordAnyDevice(password, m)) return m.id;
  return null;
}
