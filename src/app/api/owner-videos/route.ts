/**
 * "Notify members" under a video on one of Daniel's journal days: tells
 * members about that day's video again - the bell in The Study straight
 * away, and a phone alert to everyone who turned notifications on. (Saving
 * a new video on a day already does this - see src/lib/study/days-api.ts.)
 * Owner only (admin session; also in the middleware).
 *
 *   POST { notify: day } -> { ok, devices, private }
 *   (private: the day is set not to be shared, so members won't see it there)
 */
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/lib/analytics/store";
import { isSignedIn } from "@/lib/admin-auth";
import { isDay } from "@/lib/dashboard/notes";
import { addVideoNotice, pushToMembers } from "@/lib/study/notices";

export const dynamic = "force-dynamic";

const noStore = { "cache-control": "no-store" };

export async function POST(req: Request) {
  const db = await getDb();
  if (!db) return Response.json({ error: "Not available right now." }, { status: 503 });
  if (!(await isSignedIn(req.headers.get("cookie")))) {
    return Response.json({ error: "Please log in to the dashboard." }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as { notify?: unknown };
  if (!isDay(body.notify)) return Response.json({ error: "Which day?" }, { status: 400 });
  const row = await db
    .prepare("SELECT video, shared FROM study_days WHERE day = ?1")
    .bind(body.notify)
    .first<{ video: string | null; shared: number }>();
  if (!row?.video) return Response.json({ error: "There's no video on that day." }, { status: 404 });
  const last = await db
    .prepare("SELECT day_to FROM study_notices WHERE day = ?1 ORDER BY created_at DESC LIMIT 1")
    .bind(body.notify)
    .first<{ day_to: string | null }>();
  await addVideoNotice(db, { day: body.notify, dayTo: last?.day_to ?? null, video: row.video });
  const job = pushToMembers(db, process.env.VAPID_PRIVATE_JWK).catch((e) => console.error("video push:", e));
  try {
    const { ctx } = await getCloudflareContext({ async: true });
    ctx.waitUntil(job);
  } catch {
    await job;
  }
  const devices = await db
    .prepare("SELECT COUNT(*) AS n FROM member_reminders r JOIN members m ON m.id = r.member_id AND m.disabled_at IS NULL")
    .first<{ n: number }>();
  return Response.json({ ok: true, devices: devices?.n ?? 0, private: !row.shared }, { headers: noStore });
}
