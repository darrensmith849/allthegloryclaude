/**
 * The owner's side of members-only sharing and the weekly check-in
 * (/dashboard/community). Admin session required (middleware).
 *
 *   GET [?count=1]                            -> { posts, reports, weekly, replies } | { pending, unread }
 *   PATCH { post: id, status: "approved" | "declined" } -> { ok }
 *   POST  { weekly: { title, body, question?, memoryVerse? } } -> { weekly }   publish this week's reflection
 *   PATCH { weekly: id, title?, body?, question?, memoryVerse? } -> { ok }   edit it ("" memoryVerse clears it)
 *   DELETE ?weekly=id                                    -> { ok }       take it down (kept)
 *   PATCH { reply: id | "all", read: true }             -> { ok }
 *   PATCH { question: id, answer?, publish? }           -> { ok }   answer a member's question / share it as a Q&A
 *   DELETE ?question=id                                  -> { ok }   remove a question
 */
import { getSettings } from "@/lib/study/members";
import { getDb } from "@/lib/analytics/store";
import { cleanVerseRef } from "@/lib/study/memory";

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
          "(SELECT COUNT(*) FROM community_questions WHERE status = 'open') AS questions, " +
          "(SELECT COUNT(DISTINCT post_id) FROM community_reports r JOIN community_posts p ON p.id = r.post_id WHERE p.status = 'approved') AS reported",
      )
      .first<{ pending: number; unread: number; reported: number; questions: number }>()
      .catch(() => null);
    return Response.json(
      {
        pending: Number(row?.pending ?? 0) + Number(row?.questions ?? 0),
        unread: Number(row?.unread ?? 0),
        reported: Number(row?.reported ?? 0),
      },
      { headers: noStore },
    );
  }
  const [{ results: posts }, { results: reports }, { results: weekly }, { results: replies }, { results: questions }] = await Promise.all([
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
    db
      .prepare(
        "SELECT q.*, m.name AS member_name, m.email AS member_email FROM community_questions q " +
          "LEFT JOIN members m ON m.id = q.member_id ORDER BY (q.status = 'open') DESC, q.created_at DESC LIMIT 300",
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
        memoryVerse: w.memory_verse ?? null,
        publishedAt: w.published_at,
        replies: Number(w.replies ?? 0),
      })),
      questions: questions.map((q) => ({
        id: q.id,
        text: q.text,
        ref: q.ref,
        status: q.status,
        answer: q.answer,
        answeredBy: q.answerer_name,
        answeredAt: q.answered_at,
        published: Boolean(q.published),
        member: q.member_name ?? "(account deleted)",
        email: q.member_email ?? "",
        createdAt: q.created_at,
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
    if ("memoryVerse" in body) {
      const verse = String(body.memoryVerse ?? "").trim() ? cleanVerseRef(body.memoryVerse) : null;
      if (String(body.memoryVerse ?? "").trim() && !verse) {
        return Response.json({ error: "Write the memory verse like John 4:14 (a verse or a few)." }, { status: 400 });
      }
      await db.prepare("UPDATE weekly_reflections SET memory_verse = ?2, updated_at = ?3 WHERE id = ?1").bind(body.weekly, verse, now).run();
      return Response.json({ ok: true, memoryVerse: verse });
    }
    return Response.json({ ok: true });
  }
  if (typeof body.question === "string") {
    const answer = typeof body.answer === "string" ? body.answer.trim().slice(0, 6000) : null;
    const publish = typeof body.publish === "boolean" ? (body.publish ? 1 : 0) : null;
    if (answer) {
      const settings = await getSettings(db);
      await db
        .prepare(
          "UPDATE community_questions SET answer = ?2, status = 'answered', answered_by = 'owner', answerer_name = ?3, " +
            "answered_at = ?4, published = COALESCE(?5, published) WHERE id = ?1",
        )
        .bind(body.question, answer, settings.author, now, publish)
        .run();
    } else if (publish !== null) {
      await db.prepare("UPDATE community_questions SET published = ?2 WHERE id = ?1 AND status = 'answered'").bind(body.question, publish).run();
    } else {
      return Response.json({ error: "Write the answer first." }, { status: 400 });
    }
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
  const body = (await req.json().catch(() => ({}))) as {
    weekly?: { title?: unknown; body?: unknown; question?: unknown; memoryVerse?: unknown };
  };
  const title = String(body.weekly?.title ?? "").trim().slice(0, 160);
  const text = String(body.weekly?.body ?? "").trim().slice(0, 8000);
  const question = String(body.weekly?.question ?? "").trim().slice(0, 300) || null;
  if (!title || !text) return Response.json({ error: "Add a title and your reflection." }, { status: 400 });
  const rawVerse = String(body.weekly?.memoryVerse ?? "").trim();
  const memoryVerse = rawVerse ? cleanVerseRef(rawVerse) : null;
  if (rawVerse && !memoryVerse) {
    return Response.json({ error: "Write the memory verse like John 4:14 (a verse or a few)." }, { status: 400 });
  }
  const id = crypto.randomUUID();
  const now = Date.now();
  await db
    .prepare(
      "INSERT INTO weekly_reflections (id, title, body, question, memory_verse, published_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6)",
    )
    .bind(id, title, text, question, memoryVerse, now)
    .run();
  return Response.json({ weekly: { id, title, body: text, question, memoryVerse, publishedAt: now, replies: 0 } });
}

export async function DELETE(req: Request) {
  const db = await getDb();
  if (!db) return unavailable();
  const url = new URL(req.url);
  const question = url.searchParams.get("question");
  if (question) {
    await db.prepare("DELETE FROM community_questions WHERE id = ?1").bind(question).run();
    return Response.json({ ok: true });
  }
  const id = url.searchParams.get("weekly") ?? "";
  await db.prepare("UPDATE weekly_reflections SET deleted_at = ?2 WHERE id = ?1").bind(id, Date.now()).run();
  return Response.json({ ok: true });
}
