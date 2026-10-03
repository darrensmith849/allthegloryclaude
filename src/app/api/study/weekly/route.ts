/**
 * The owner's weekly reflection, for members.
 *
 *   GET                                 -> { reflection | null, replies }  the latest, and your replies to it
 *   POST { reflectionId, text }          -> { reply }   a private reply - only the owner reads it
 */
import { getDb } from "@/lib/analytics/store";
import { getMember } from "@/lib/study/members";
import { notifyOwnerFrom } from "@/lib/study/notify";

export const dynamic = "force-dynamic";

const noStore = { "cache-control": "no-store" };

export async function GET(req: Request) {
  const db = await getDb();
  if (!db) return Response.json({ error: "Not available right now." }, { status: 503 });
  const member = await getMember(req, db);
  if (!member) return Response.json({ error: "Please log in.", login: true }, { status: 401 });
  const reflection = await db
    .prepare("SELECT id, title, body, question, published_at FROM weekly_reflections WHERE deleted_at IS NULL ORDER BY published_at DESC LIMIT 1")
    .first<{ id: string; title: string; body: string; question: string | null; published_at: number }>();
  const { results: replies } = reflection
    ? await db
        .prepare("SELECT id, text, created_at FROM checkin_replies WHERE reflection_id = ?1 AND member_id = ?2 ORDER BY created_at")
        .bind(reflection.id, member.id)
        .all<{ id: string; text: string; created_at: number }>()
    : { results: [] };
  return Response.json(
    {
      reflection: reflection && {
        id: reflection.id,
        title: reflection.title,
        body: reflection.body,
        question: reflection.question,
        publishedAt: reflection.published_at,
      },
      replies: replies.map((r) => ({ id: r.id, text: r.text, createdAt: r.created_at })),
    },
    { headers: noStore },
  );
}

export async function POST(req: Request) {
  const db = await getDb();
  if (!db) return Response.json({ error: "Not available right now." }, { status: 503 });
  const member = await getMember(req, db);
  if (!member) return Response.json({ error: "Please log in.", login: true }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { reflectionId?: unknown; text?: unknown };
  const text = String(body.text ?? "").trim().slice(0, 3000);
  if (typeof body.reflectionId !== "string" || !text) {
    return Response.json({ error: "Write your reply first." }, { status: 400 });
  }
  const exists = await db
    .prepare("SELECT title FROM weekly_reflections WHERE id = ?1 AND deleted_at IS NULL")
    .bind(body.reflectionId)
    .first<{ title: string }>();
  if (!exists) return Response.json({ error: "That reflection isn't there any more." }, { status: 404 });
  const today = await db
    .prepare("SELECT COUNT(*) AS n FROM checkin_replies WHERE member_id = ?1 AND created_at > ?2")
    .bind(member.id, Date.now() - 86_400_000)
    .first<{ n: number }>();
  if (Number(today?.n ?? 0) >= 10) return Response.json({ error: "That's plenty for today - thank you." }, { status: 429 });
  const id = crypto.randomUUID();
  const now = Date.now();
  await db
    .prepare("INSERT INTO checkin_replies (id, reflection_id, member_id, text, created_at) VALUES (?1, ?2, ?3, ?4, ?5)")
    .bind(id, body.reflectionId, member.id, text, now)
    .run();
  await notifyOwnerFrom(db, member.id, `${member.name} replied to "${exists.title}"`, `${member.name} (${member.email}):\n\n${text.slice(0, 1000)}`);
  return Response.json({ reply: { id, text, createdAt: now } });
}
