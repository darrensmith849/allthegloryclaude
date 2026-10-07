/**
 * Members' bell: what's new in The Study - each session video Daniel posts.
 *
 *   GET            -> { notices, unseen }   the latest (90 days), newest first
 *   GET ?latest=1  -> { notice, next }      for the phone's service worker: a
 *                                           video posted in the last 12 hours,
 *                                           and the day the member is up to
 *   POST { seen: true } -> { ok }           the bell was opened
 *
 * Only videos still on a shared day. Members only.
 */
import { getDb } from "@/lib/analytics/store";
import { planDay } from "@/lib/dashboard/notes";
import { getMember } from "@/lib/study/members";
import { memberReach } from "@/lib/study/progress";

export const dynamic = "force-dynamic";

const noStore = { "cache-control": "no-store" };

interface Row {
  id: string;
  day: string;
  day_to: string | null;
  video: string | null;
  created_at: number;
  title: string | null;
}

const toNotice = (r: Row) => ({
  id: r.id,
  kind: "video" as const,
  day: r.day,
  dayTo: r.day_to,
  from: planDay(r.day).n,
  to: r.day_to ? planDay(r.day_to).n : null,
  title: r.title ?? "",
  at: r.created_at,
});

export async function GET(req: Request) {
  const db = await getDb();
  if (!db) return Response.json({ error: "Not available right now." }, { status: 503 });
  const member = await getMember(req, db).catch(() => null);
  if (!member) return Response.json({ error: "Log in to see what's new." }, { status: 401, headers: noStore });
  const latest = new URL(req.url).searchParams.get("latest") === "1";
  const since = Date.now() - (latest ? 12 * 3_600_000 : 90 * 86_400_000);
  const { results } = await db
    .prepare(
      "SELECT n.id, n.day, n.day_to, n.video, n.created_at, d.title FROM study_notices n " +
        "JOIN study_days d ON d.day = n.day AND d.shared != 0 AND d.video IS NOT NULL AND d.video <> '' " +
        "WHERE n.created_at > ?1 ORDER BY n.created_at DESC LIMIT 15",
    )
    .bind(since)
    .all<Row>();
  if (latest) {
    const reach = await memberReach(db, member.id);
    return Response.json({ notice: results[0] ? toNotice(results[0]) : null, next: planDay(reach).n }, { headers: noStore });
  }
  const row = await db
    .prepare("SELECT notices_seen_at, created_at FROM members WHERE id = ?1")
    .bind(member.id)
    .first<{ notices_seen_at: number | null; created_at: number }>();
  // New to them: since they last opened the bell (or a week before joining).
  const seenAt = row?.notices_seen_at ?? (row?.created_at ?? Date.now()) - 7 * 86_400_000;
  const notices = results.map(toNotice);
  return Response.json({ notices, unseen: notices.filter((n) => n.at > seenAt).length }, { headers: noStore });
}

export async function POST(req: Request) {
  const db = await getDb();
  if (!db) return Response.json({ error: "Not available right now." }, { status: 503 });
  const member = await getMember(req, db).catch(() => null);
  if (!member) return Response.json({ error: "Log in first." }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { seen?: unknown };
  if (body.seen !== true) return Response.json({ error: "Nothing to do." }, { status: 400 });
  await db.prepare("UPDATE members SET notices_seen_at = ?2 WHERE id = ?1").bind(member.id, Date.now()).run();
  return Response.json({ ok: true }, { headers: noStore });
}
