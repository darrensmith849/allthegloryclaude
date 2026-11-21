/**
 * Daniel's own daily reading reminder on the dashboard (his Home Screen
 * app) - one row per device in member_reminders with member_id 'owner'.
 * Owner only (admin session; also in the middleware).
 *
 *   GET                              -> { reminders: [{ endpoint, hour, tz }], publicKey }
 *   PUT   { endpoint, hour, tz }     -> { ok }   turn on (or change the time) for this device
 *   PUT   { endpoint, replaces }     -> { ok }   the browser renewed this device's subscription
 *   DELETE { endpoint }              -> { ok }   turn off for this device
 *   POST  { endpoint, test: true }   -> { ok }   send one now, to check it works
 *
 * Sent hourly by the Cron Trigger (src/lib/study/push.ts → runReminders);
 * skipped on days he's marked a reading as read. Tapping it opens Study
 * Notes (public/dashboard-sw.js).
 */
import { getDb } from "@/lib/analytics/store";
import { isSignedIn } from "@/lib/admin-auth";
import { isPushEndpoint, sendPush, VAPID_PUBLIC_KEY } from "@/lib/study/push";

export const dynamic = "force-dynamic";

const OWNER = "owner";

const validTz = (tz: unknown): tz is string => {
  if (typeof tz !== "string" || tz.length > 64) return false;
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

async function session(req: Request) {
  const db = await getDb();
  if (!db) return { error: Response.json({ error: "Not available right now." }, { status: 503 }) } as const;
  if (!(await isSignedIn(req.headers.get("cookie")))) {
    return { error: Response.json({ error: "Please log in to the dashboard." }, { status: 401 }) } as const;
  }
  return { db } as const;
}

export async function GET(req: Request) {
  const s = await session(req);
  if ("error" in s) return s.error;
  const { results } = await s.db
    .prepare("SELECT endpoint, hour, tz FROM member_reminders WHERE member_id = ?1")
    .bind(OWNER)
    .all<{ endpoint: string; hour: number; tz: string }>();
  return Response.json({ reminders: results, publicKey: VAPID_PUBLIC_KEY }, { headers: { "cache-control": "no-store" } });
}

export async function PUT(req: Request) {
  const s = await session(req);
  if ("error" in s) return s.error;
  const body = (await req.json().catch(() => ({}))) as { endpoint?: unknown; hour?: unknown; tz?: unknown; replaces?: unknown };
  const old =
    typeof body.replaces === "string"
      ? await s.db
          .prepare("SELECT hour, tz FROM member_reminders WHERE endpoint = ?1 AND member_id = ?2")
          .bind(body.replaces, OWNER)
          .first<{ hour: number; tz: string }>()
      : null;
  const hour = old ? old.hour : Number(body.hour);
  const tz = old ? old.tz : body.tz;
  if (!isPushEndpoint(body.endpoint) || !Number.isInteger(hour) || hour < 0 || hour > 23 || !validTz(tz)) {
    return Response.json({ error: "Couldn't set that reminder." }, { status: 400 });
  }
  if (old && body.replaces !== body.endpoint) {
    await s.db.prepare("DELETE FROM member_reminders WHERE endpoint = ?1 AND member_id = ?2").bind(body.replaces, OWNER).run();
  }
  await s.db
    .prepare(
      "INSERT INTO member_reminders (endpoint, member_id, hour, tz, created_at) VALUES (?1, ?2, ?3, ?4, ?5) " +
        "ON CONFLICT(endpoint) DO UPDATE SET member_id = excluded.member_id, hour = excluded.hour, tz = excluded.tz, failures = 0",
    )
    .bind(body.endpoint, OWNER, hour, tz, Date.now())
    .run();
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const s = await session(req);
  if ("error" in s) return s.error;
  const body = (await req.json().catch(() => ({}))) as { endpoint?: unknown };
  if (typeof body.endpoint === "string") {
    await s.db.prepare("DELETE FROM member_reminders WHERE endpoint = ?1 AND member_id = ?2").bind(body.endpoint, OWNER).run();
  }
  return Response.json({ ok: true });
}

export async function POST(req: Request) {
  const s = await session(req);
  if ("error" in s) return s.error;
  const body = (await req.json().catch(() => ({}))) as { endpoint?: unknown };
  const row =
    typeof body.endpoint === "string"
      ? await s.db
          .prepare("SELECT endpoint FROM member_reminders WHERE endpoint = ?1 AND member_id = ?2")
          .bind(body.endpoint, OWNER)
          .first<{ endpoint: string }>()
      : null;
  if (!row) return Response.json({ error: "Turn reminders on first." }, { status: 400 });
  const jwk = process.env.VAPID_PRIVATE_JWK;
  if (!jwk) return Response.json({ error: "Reminders aren't set up yet." }, { status: 503 });
  const status = await sendPush(row.endpoint, jwk).catch(() => 0);
  if (status === 404 || status === 410) {
    await s.db.prepare("DELETE FROM member_reminders WHERE endpoint = ?1").bind(row.endpoint).run();
    return Response.json({ error: "This device has turned notifications off - turn reminders on again." }, { status: 410 });
  }
  if (status < 200 || status >= 300) return Response.json({ error: "Couldn't reach this device just now." }, { status: 502 });
  return Response.json({ ok: true });
}
