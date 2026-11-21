/**
 * Members' questions (table community_questions).
 *
 *   GET                          -> { mine, published, queue? }
 *        mine: your questions and their answers
 *        published: answered questions the owner chose to share (asker never named)
 *        queue: open questions - helpers only
 *   POST { text, ref? }          -> { question }   ask privately
 *   PATCH { id, answer, publish? } -> { ok }       helpers: answer (and optionally share as a Q&A)
 *   DELETE ?id=...               -> { ok }         withdraw your own question
 *
 * Only the owner (/api/members/community) and helpers answer. Members
 * can't comment on anything.
 */
import { changesOf, getDb, type D1Db } from "@/lib/analytics/store";
import { getMember, type Member } from "@/lib/study/members";
import { notifyOwnerFrom } from "@/lib/study/notify";

export const dynamic = "force-dynamic";

const MAX_OPEN = 5;
const noStore = { "cache-control": "no-store" };

interface Row {
  id: string;
  member_id: string;
  asker_name: string | null;
  text: string;
  ref: string | null;
  status: string;
  answer: string | null;
  answerer_name: string | null;
  answered_at: number | null;
  published: number;
  created_at: number;
}

async function session(req: Request): Promise<{ db: D1Db; member: Member } | Response> {
  const db = await getDb();
  if (!db) return Response.json({ error: "Not available right now." }, { status: 503 });
  const member = await getMember(req, db);
  if (!member) return Response.json({ error: "Please log in.", login: true }, { status: 401 });
  return { db, member };
}

const mineOut = (r: Row) => ({
  id: r.id,
  text: r.text,
  ref: r.ref,
  status: r.status,
  answer: r.answer,
  answeredBy: r.answerer_name,
  answeredAt: r.answered_at,
  published: Boolean(r.published),
  createdAt: r.created_at,
});
const publicOut = (r: Row) => ({
  id: r.id,
  text: r.text,
  ref: r.ref,
  answer: r.answer,
  answeredBy: r.answerer_name,
  answeredAt: r.answered_at,
});

export async function GET(req: Request) {
  const s = await session(req);
  if (s instanceof Response) return s;
  const { db, member } = s;
  const [{ results: mine }, { results: published }] = await Promise.all([
    db.prepare("SELECT * FROM community_questions WHERE member_id = ?1 ORDER BY created_at DESC").bind(member.id).all<Row>(),
    db
      .prepare("SELECT * FROM community_questions WHERE published = 1 AND status = 'answered' ORDER BY answered_at DESC LIMIT 200")
      .all<Row>(),
  ]);
  const queue = member.helper
    ? (
        await db
          .prepare("SELECT * FROM community_questions WHERE status = 'open' AND member_id != ?1 ORDER BY created_at")
          .bind(member.id)
          .all<Row>()
      ).results.map((r) => ({ id: r.id, text: r.text, ref: r.ref, askerName: r.asker_name ?? "A member", createdAt: r.created_at }))
    : undefined;
  return Response.json(
    { mine: mine.map(mineOut), published: published.map(publicOut), ...(queue ? { queue, helper: true } : {}) },
    { headers: noStore },
  );
}

export async function POST(req: Request) {
  const s = await session(req);
  if (s instanceof Response) return s;
  const { db, member } = s;
  const body = (await req.json().catch(() => ({}))) as { text?: unknown; ref?: unknown };
  const text = String(body.text ?? "").trim().slice(0, 2000);
  const ref = String(body.ref ?? "").trim().slice(0, 60) || null;
  if (text.length < 5) return Response.json({ error: "Write your question first." }, { status: 400 });
  const open = await db
    .prepare("SELECT COUNT(*) AS n FROM community_questions WHERE member_id = ?1 AND status = 'open'")
    .bind(member.id)
    .first<{ n: number }>();
  if (Number(open?.n ?? 0) >= MAX_OPEN) {
    return Response.json({ error: "You have a few questions waiting already - they'll be answered soon." }, { status: 429 });
  }
  const id = crypto.randomUUID();
  const now = Date.now();
  await db
    .prepare("INSERT INTO community_questions (id, member_id, asker_name, text, ref, status, created_at) VALUES (?1, ?2, ?3, ?4, ?5, 'open', ?6)")
    .bind(id, member.id, member.name.split(" ")[0], text, ref, now)
    .run();
  await notifyOwnerFrom(db, member.id, "A member asked a question", `${member.name} (${member.email})${ref ? ` on ${ref}` : ""}:\n\n${text}`);
  return Response.json({
    question: { id, text, ref, status: "open", answer: null, answeredBy: null, answeredAt: null, published: false, createdAt: now },
  });
}

export async function PATCH(req: Request) {
  const s = await session(req);
  if (s instanceof Response) return s;
  const { db, member } = s;
  if (!member.helper) return Response.json({ error: "Only helpers can answer." }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as { id?: unknown; answer?: unknown; publish?: unknown };
  const answer = String(body.answer ?? "").trim().slice(0, 6000);
  if (typeof body.id !== "string" || answer.length < 2) return Response.json({ error: "Write the answer first." }, { status: 400 });
  const res = await db
    .prepare(
      "UPDATE community_questions SET answer = ?2, status = 'answered', answered_by = ?3, answerer_name = ?4, answered_at = ?5, published = ?6 " +
        "WHERE id = ?1 AND member_id != ?3 AND (status = 'open' OR answered_by = ?3)",
    )
    .bind(body.id, answer, member.id, member.name.split(" ")[0], Date.now(), body.publish === true ? 1 : 0)
    .run();
  // Helpers answer open questions (or edit their own answer) - never
  // someone else's answer.
  if (!changesOf(res)) {
    return Response.json({ error: "This question has already been answered." }, { status: 409 });
  }
  await notifyOwnerFrom(db, member.id, `${member.name} answered a question`, answer.slice(0, 800));
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const s = await session(req);
  if (s instanceof Response) return s;
  const { db, member } = s;
  const id = new URL(req.url).searchParams.get("id") ?? "";
  await db.prepare("DELETE FROM community_questions WHERE id = ?1 AND member_id = ?2").bind(id, member.id).run();
  return Response.json({ ok: true });
}
