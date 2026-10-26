/**
 * "Tell members" on the dashboard's Members page: a note from Daniel to
 * everyone in The Study (e.g. "no video this week") - in the bell straight
 * away, and a phone alert to everyone who turned notifications on.
 * Owner only (admin session; also in the middleware).
 *
 *   POST { message } -> { ok, devices }
 */
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/lib/analytics/store";
import { isSignedIn } from "@/lib/admin-auth";
import { addMessageNotice, pushToMembers } from "@/lib/study/notices";
import { localNow } from "@/lib/study/push";

export const dynamic = "force-dynamic";

const noStore = { "cache-control": "no-store" };

export async function POST(req: Request) {
  const db = await getDb();
  if (!db) return Response.json({ error: "Not available right now." }, { status: 503 });
  if (!(await isSignedIn(req.headers.get("cookie")))) {
    return Response.json({ error: "Please log in to the dashboard." }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as { message?: unknown };
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) return Response.json({ error: "Write the note first." }, { status: 400 });
  if (message.length > 600) return Response.json({ error: "Keep it under 600 characters." }, { status: 400 });
  await addMessageNotice(db, message, localNow("Africa/Johannesburg").day);
  const job = pushToMembers(db, process.env.VAPID_PRIVATE_JWK).catch((e) => console.error("note push:", e));
  try {
    const { ctx } = await getCloudflareContext({ async: true });
    ctx.waitUntil(job);
  } catch {
    await job;
  }
  const devices = await db
    .prepare("SELECT COUNT(*) AS n FROM member_reminders r JOIN members m ON m.id = r.member_id AND m.disabled_at IS NULL")
    .first<{ n: number }>();
  return Response.json({ ok: true, devices: devices?.n ?? 0 }, { headers: noStore });
}
