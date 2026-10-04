/**
 * A member's private prayer list (table member_prayers). Only ever their own.
 *
 *   GET                                        -> { prayers }  (incl. removed ones)
 *   POST  { text, ref? }                       -> { prayer }
 *   PATCH { id, text?, ref? }                  -> { prayer }   edit
 *   PATCH { id, answered: boolean, answer? }   -> { prayer }   answered (with how) / back to praying
 *   PATCH { id, restore: true }                -> { prayer }   back from removed
 *   DELETE ?id=...                             -> { ok }       removed (can be restored)
 */
import { getDb, type D1Db } from "@/lib/analytics/store";
import { getMember, type Member } from "@/lib/study/members";
import type { Prayer } from "@/lib/study/types";

export const dynamic = "force-dynamic";

const MAX_PRAYERS = 2_000;
const noStore = { "cache-control": "no-store" };

interface Row {
  id: string;
  text: string;
  ref: string | null;
  answered_at: number | null;
  answer: string | null;
  deleted_at: number | null;
  created_at: number;
  updated_at: number;
}


const toPrayer = (r: Row): Prayer => ({
  id: r.id,
  text: r.text,
  ref: r.ref,
  answeredAt: r.answered_at,
  answer: r.answer,
  deletedAt: r.deleted_at,
  createdAt: r.created_at,
});

const clip = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

async function session(req: Request): Promise<{ db: D1Db; member: Member } | Response> {
  const db = await getDb();
  if (!db) return Response.json({ error: "Not available right now." }, { status: 503 });
  const member = await getMember(req, db);
  if (!member) return Response.json({ error: "Please log in.", login: true }, { status: 401 });
  return { db, member };
}

const one = (db: D1Db, id: string, memberId: string) =>
  db.prepare("SELECT * FROM member_prayers WHERE id = ?1 AND member_id = ?2").bind(id, memberId).first<Row>();

export async function GET(req: Request) {
  const s = await session(req);
  if (s instanceof Response) return s;
  const { results } = await s.db
    .prepare("SELECT * FROM member_prayers WHERE member_id = ?1 ORDER BY created_at DESC LIMIT 2000")
    .bind(s.member.id)
    .all<Row>();
  return Response.json({ prayers: results.map(toPrayer) }, { headers: noStore });
}

export async function POST(req: Request) {
  const s = await session(req);
  if (s instanceof Response) return s;
  const body = (await req.json().catch(() => ({}))) as { text?: unknown; ref?: unknown };
  const text = clip(body.text, 2000);
  if (text.length < 2) return Response.json({ error: "Write what you're praying for." }, { status: 400 });
  const count = await s.db
    .prepare("SELECT COUNT(*) AS n FROM member_prayers WHERE member_id = ?1")
    .bind(s.member.id)
    .first<{ n: number }>();
  if (Number(count?.n ?? 0) >= MAX_PRAYERS) {
    return Response.json({ error: "Your prayer list is full - get in touch and we'll make room." }, { status: 413 });
  }
  const now = Date.now();
  const id = crypto.randomUUID();
  const ref = clip(body.ref, 80) || null;
  await s.db
    .prepare("INSERT INTO member_prayers (id, member_id, text, ref, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?5)")
    .bind(id, s.member.id, text, ref, now)
    .run();
  return Response.json({ prayer: toPrayer({ id, text, ref, answered_at: null, answer: null, deleted_at: null, created_at: now, updated_at: now }) });
}

export async function PATCH(req: Request) {
  const s = await session(req);
  if (s instanceof Response) return s;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const id = typeof body.id === "string" ? body.id : "";
  const row = id ? await one(s.db, id, s.member.id) : null;
  if (!row) return Response.json({ error: "Not found." }, { status: 404 });
  const now = Date.now();
  if (body.restore === true) {
    await s.db.prepare("UPDATE member_prayers SET deleted_at = NULL, updated_at = ?3 WHERE id = ?1 AND member_id = ?2").bind(id, s.member.id, now).run();
  } else if (typeof body.answered === "boolean") {
    await s.db
      .prepare("UPDATE member_prayers SET answered_at = ?3, answer = ?4, updated_at = ?5 WHERE id = ?1 AND member_id = ?2")
      // Back to "still praying" keeps what they wrote about the answer.
      .bind(id, s.member.id, body.answered ? (row.answered_at ?? now) : null, body.answered ? clip(body.answer, 2000) || row.answer : row.answer, now)
      .run();
  } else {
    const text = "text" in body ? clip(body.text, 2000) : row.text;
    if (text.length < 2) return Response.json({ error: "Write what you're praying for." }, { status: 400 });
    const ref = "ref" in body ? clip(body.ref, 80) || null : row.ref;
    const answer = "answer" in body ? clip(body.answer, 2000) || null : row.answer;
    await s.db
      .prepare("UPDATE member_prayers SET text = ?3, ref = ?4, answer = ?5, updated_at = ?6 WHERE id = ?1 AND member_id = ?2")
      .bind(id, s.member.id, text, ref, answer, now)
      .run();
  }
  const fresh = await one(s.db, id, s.member.id);
  return fresh ? Response.json({ prayer: toPrayer(fresh) }) : Response.json({ error: "Not found." }, { status: 404 });
}

export async function DELETE(req: Request) {
  const s = await session(req);
  if (s instanceof Response) return s;
  const id = new URL(req.url).searchParams.get("id") ?? "";
  await s.db
    .prepare("UPDATE member_prayers SET deleted_at = ?3, updated_at = ?3 WHERE id = ?1 AND member_id = ?2")
    .bind(id, s.member.id, Date.now())
    .run();
  return Response.json({ ok: true });
}
