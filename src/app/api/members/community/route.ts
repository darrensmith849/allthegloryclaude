/**
 * The owner's side of members-only sharing and the weekly check-in
 * (/dashboard/community). Admin session required (middleware).
 *
 *   GET [?count=1]                            -> { posts, reports, weekly, replies } | { pending, unread }
 *   PATCH { post: id, status: "approved" | "declined" } -> { ok }
 *   POST  { weekly: { title, body, question? } }        -> { weekly }   publish this week's reflection
 *   PATCH { weekly: id, title?, body?, question? }      -> { ok }       edit it
 *   DELETE ?weekly=id                                    -> { ok }       take it down (kept)
 *   PATCH { reply: id | "all", read: true }             -> { ok }
 */
import { getDb } from "@/lib/analytics/store";

export const dynamic = "force-dynamic";

const noStore = { "cache-control": "no-store" };
const unavailable = () => Response.json({ error: "Storage isn't available here." }, { status: 503 });

export async function GET(req: Request) {
  const db = await getDb();
  if (!db) return unavailable();
  if (new URL(req.url).searchParams.get("count")) {
    const row = await db
      .prepare(
        "SELECT (SELECT COUNT(*) FROM community_posts WHERE status = 'pending') AS pending, " +
          "(SELECT COUNT(*) FROM checkin_replies WHERE read_at IS NULL) AS unread, " +
          "(SELECT COUNT(DISTINCT post_id) FROM community_reports r JOIN community_posts p ON p.id = r.post_id WHERE p.status = 'approved') AS reported",
      )
      .first<{ pending: number; unread: number; reported: number }>()
      .catch(() => null);
    return Response.json(
      { pending: Number(row?.pending ?? 0), unread: Number(row?.unread ?? 0), reported: Number(row?.reported ?? 0) },
      { headers: noStore },
    );
  }
  const [{ results: posts }, { results: reports }, { results: weekly }, { results: replies }] = await Promise.all([
    db
      .prepare(
        "SELECT p.*, m.name AS member_name, m.email AS member_email FROM community_posts p " +
          "LEFT JOIN members m ON m.id = p.member_id ORDER BY (p.status = 'pending') DESC, p.created_at DESC LIMIT 300",
      )
      .all<Record<string, unknown>>(),
    db
      .prepare("SELECT post_id, COUNT(*) AS n, GROUP_CONCAT(reason, ' · ') AS reasons FROM community_reports GROUP BY post_id")
      .all<{ post_id: string; n: number; reasons: string | null }>(),
    db
      .prepare(
        "SELECT w.*, (SELECT COUNT(*) FROM checkin_replies c WHERE c.reflection_id = w.id) AS replies " +
          "FROM weekly_reflections w WHERE w.deleted_at IS NULL ORDER BY w.published_at DESC LIMIT 52",
      )
      .all<Record<string, unknown>>(),
    db
      .prepare(
        "SELECT c.id, c.reflection_id, c.text, c.created_at, c.read_at, m.name AS member_name, m.email AS member_email " +
          "FROM checkin_replies c LEFT JOIN members m ON m.id = c.member_id ORDER BY c.created_at DESC LIMIT 300",
      )
      .all<Record<string, unknown>>(),
  ]);
  const reported = new Map(reports.map((r) => [r.post_id, r]));
  return Response.json(
    {
      posts: posts.map((p) => ({
        id: p.id,
        kind: p.kind,
        status: p.status,
        shownAs: p.author_name ?? "Anonymous",
        member: p.member_name ?? "(account deleted)",
        email: p.member_email ?? "",
        day: p.day,
        ref: p.ref,
        title: p.title,
        text: p.text,
        createdAt: p.created_at,
        reports: Number(reported.get(String(p.id))?.n ?? 0),
        reportReasons: reported.get(String(p.id))?.reasons ?? "",
      })),
      weekly: weekly.map((w) => ({
        id: w.id,
        title: w.title,
        body: w.body,
        question: w.question,
        publishedAt: w.published_at,
        replies: Number(w.replies ?? 0),
      })),
      replies: replies.map((r) => ({
        id: r.id,
        reflectionId: r.reflection_id,
        text: r.text,
        createdAt: r.created_at,
        read: Boolean(r.read_at),
        member: r.member_name ?? "(account deleted)",
        email: r.member_email ?? "",
      })),
    },
    { headers: noStore },
  );
}

export async function PATCH(req: Request) {
  const db = await getDb();
  if (!db) return unavailable();
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const now = Date.now();
  if (typeof body.post === "string" && (body.status === "approved" || body.status === "declined")) {
    await db.batch([
      db.prepare("UPDATE community_posts SET status = ?2, reviewed_at = ?3 WHERE id = ?1").bind(body.post, body.status, now),
      // Re-approving after a review clears the old reports.
      ...(body.status === "approved" ? [db.prepare("DELETE FROM community_reports WHERE post_id = ?1").bind(body.post)] : []),
    ]);
    return Response.json({ ok: true });
  }
  if (typeof body.weekly === "string") {
    const title = typeof body.title === "string" ? body.title.trim().slice(0, 160) : null;
    const text = typeof body.body === "string" ? body.body.trim().slice(0, 8000) : null;
    const question = typeof body.question === "string" ? body.question.trim().slice(0, 300) : null;
    await db
      .prepare(
        "UPDATE weekly_reflections SET title = COALESCE(?2, title), body = COALESCE(?3, body), question = COALESCE(?4, question), updated_at = ?5 WHERE id = ?1",
      )
      .bind(body.weekly, title || null, text || null, question, now)
      .run();
    return Response.json({ ok: true });
  }
  if (body.read === true && typeof body.reply === "string") {
    if (body.reply === "all") await db.prepare("UPDATE checkin_replies SET read_at = ?1 WHERE read_at IS NULL").bind(now).run();
    else await db.prepare("UPDATE checkin_replies SET read_at = ?2 WHERE id = ?1").bind(body.reply, now).run();
    return Response.json({ ok: true });
  }
  return Response.json({ error: "Nothing to change." }, { status: 400 });
}

export async function POST(req: Request) {
  const db = await getDb();
  if (!db) return unavailable();
  const body = (await req.json().catch(() => ({}))) as { weekly?: { title?: unknown; body?: unknown; question?: unknown } };
  const title = String(body.weekly?.title ?? "").trim().slice(0, 160);
  const text = String(body.weekly?.body ?? "").trim().slice(0, 8000);
  const question = String(body.weekly?.question ?? "").trim().slice(0, 300) || null;
  if (!title || !text) return Response.json({ error: "Add a title and your reflection." }, { status: 400 });
  const id = crypto.randomUUID();
  const now = Date.now();
  await db
    .prepare("INSERT INTO weekly_reflections (id, title, body, question, published_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?5)")
    .bind(id, title, text, question, now)
    .run();
  return Response.json({ weekly: { id, title, body: text, question, publishedAt: now, replies: 0 } });
}

export async function DELETE(req: Request) {
  const db = await getDb();
  if (!db) return unavailable();
  const id = new URL(req.url).searchParams.get("weekly") ?? "";
  await db.prepare("UPDATE weekly_reflections SET deleted_at = ?2 WHERE id = ?1").bind(id, Date.now()).run();
  return Response.json({ ok: true });
}
