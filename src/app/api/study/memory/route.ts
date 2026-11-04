/**
 * Memory verses a member knows by heart (table member_memory).
 *
 *   GET                                  -> { verses: [{ ref, knownAt }] }
 *   POST { ref, known: boolean, reflectionId? } -> { ok }   tick it (or untick)
 */
import { getDb } from "@/lib/analytics/store";
import { getMember } from "@/lib/study/members";
import { cleanVerseRef } from "@/lib/study/memory";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const db = await getDb();
  if (!db) return Response.json({ error: "Not available right now." }, { status: 503 });
  const member = await getMember(req, db);
  if (!member) return Response.json({ error: "Please log in.", login: true }, { status: 401 });
  const { results } = await db
    .prepare("SELECT ref, known_at FROM member_memory WHERE member_id = ?1 ORDER BY known_at DESC LIMIT 1000")
    .bind(member.id)
    .all<{ ref: string; known_at: number }>();
  return Response.json(
    { verses: results.map((r) => ({ ref: r.ref, knownAt: r.known_at })) },
    { headers: { "cache-control": "no-store" } },
  );
}

export async function POST(req: Request) {
  const db = await getDb();
  if (!db) return Response.json({ error: "Not available right now." }, { status: 503 });
  const member = await getMember(req, db);
  if (!member) return Response.json({ error: "Please log in.", login: true }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { ref?: unknown; known?: unknown; reflectionId?: unknown };
  const ref = cleanVerseRef(body.ref);
  if (!ref) return Response.json({ error: "Which verse?" }, { status: 400 });
  if (body.known === false) {
    await db.prepare("DELETE FROM member_memory WHERE member_id = ?1 AND ref = ?2").bind(member.id, ref).run();
  } else {
    await db
      .prepare("INSERT OR IGNORE INTO member_memory (member_id, ref, reflection_id, known_at) VALUES (?1, ?2, ?3, ?4)")
      .bind(member.id, ref, typeof body.reflectionId === "string" ? body.reflectionId.slice(0, 64) : null, Date.now())
      .run();
  }
  return Response.json({ ok: true });
}
