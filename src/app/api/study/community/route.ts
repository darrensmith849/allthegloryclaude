/**
 * Members-only sharing in The Study (table community_posts).
 *
 *   GET ?day=MM-DD          -> { posts }  approved reflections for that date (any year)
 *   GET ?kind=testimony     -> { posts }  approved testimonies
 *   GET ?mine=1             -> { posts }  this member's own posts, any status
 *   POST { kind, text, consent: true, anonymous, day?, ref?, noteId?, title? } -> { post }  waits for approval
 *   PATCH { report: id, reason? } -> { ok }   flag a post for the owner
 *   DELETE ?id=...          -> { ok }     withdraw your own post (removed for good)
 *
 * Signed-in members only, and only approved posts are ever shown to others.
 * Each post needs the member's consent tick; anonymous posts carry no name.
 */
import { getDb, type D1Db } from "@/lib/analytics/store";
import { isDay } from "@/lib/dashboard/notes";
import { getMember, type Member } from "@/lib/study/members";
import { notifyOwner } from "@/lib/study/notify";

export const dynamic = "force-dynamic";

const MAX_PENDING = 10;

interface Row {
  id: string;
  kind: string;
  member_id: string;
  author_name: string | null;
  day: string | null;
  ref: string | null;
  title: string | null;
  text: string;
  note_id: string | null;
  status: string;
  created_at: number;
}

const toPost = (r: Row, me: string) => ({
  id: r.id,
  kind: r.kind,
  author: r.author_name ?? "A member",
  day: r.day,
  ref: r.ref,
  title: r.title,
  text: r.text,
  noteId: r.member_id === me ? r.note_id : null,
  status: r.member_id === me ? r.status : undefined,
  mine: r.member_id === me,
  createdAt: r.created_at,
});

const noStore = { "cache-control": "no-store" };

async function session(req: Request): Promise<{ db: D1Db; member: Member } | Response> {
  const db = await getDb();
  if (!db) return Response.json({ error: "Not available right now." }, { status: 503 });
  const member = await getMember(req, db);
  if (!member) return Response.json({ error: "Please log in.", login: true }, { status: 401 });
  return { db, member };
}

export async function GET(req: Request) {
  const s = await session(req);
  if (s instanceof Response) return s;
  const { db, member } = s;
  const url = new URL(req.url);
  const on = url.searchParams.get("day");
  let results: Row[] = [];
  if (url.searchParams.get("mine")) {
    ({ results } = await db
      .prepare("SELECT * FROM community_posts WHERE member_id = ?1 ORDER BY created_at DESC")
      .bind(member.id)
      .all<Row>());
  } else if (url.searchParams.get("kind") === "testimony") {
    ({ results } = await db
      .prepare("SELECT * FROM community_posts WHERE kind = 'testimony' AND status = 'approved' ORDER BY created_at DESC LIMIT 200")
      .all<Row>());
  } else if (on && /^\d{2}-\d{2}$/.test(on)) {
    ({ results } = await db
      .prepare(
        "SELECT * FROM community_posts WHERE kind = 'reflection' AND status = 'approved' AND substr(day, 6) = ?1 ORDER BY created_at",
      )
      .bind(on)
      .all<Row>());
  } else {
    ({ results } = await db
      .prepare("SELECT * FROM community_posts WHERE kind = 'reflection' AND status = 'approved' ORDER BY created_at DESC LIMIT 30")
      .all<Row>());
  }
  return Response.json({ posts: results.map((r) => toPost(r, member.id)) }, { headers: noStore });
}

export async function POST(req: Request) {
  const s = await session(req);
  if (s instanceof Response) return s;
  const { db, member } = s;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const kind = body.kind === "testimony" ? "testimony" : body.kind === "reflection" ? "reflection" : null;
  const text = String(body.text ?? "").trim().slice(0, kind === "testimony" ? 5000 : 3000);
  if (!kind) return Response.json({ error: "What are you sharing?" }, { status: 400 });
  if (body.consent !== true) {
    return Response.json({ error: "Please tick the box to say you're happy for members to read this." }, { status: 400 });
  }
  if (text.length < (kind === "testimony" ? 20 : 3)) {
    return Response.json({ error: kind === "testimony" ? "Tell a little more of your story." : "Write something first." }, { status: 400 });
  }
  const pending = await db
    .prepare("SELECT COUNT(*) AS n FROM community_posts WHERE member_id = ?1 AND status = 'pending'")
    .bind(member.id)
    .first<{ n: number }>();
  if (Number(pending?.n ?? 0) >= MAX_PENDING) {
    return Response.json({ error: "You have a few posts waiting already - give it a little time." }, { status: 429 });
  }
  const anonymous = body.anonymous === true;
  const first = member.name.split(" ")[0];
  const day = kind === "reflection" && isDay(body.day) ? body.day : null;
  const ref = kind === "reflection" ? String(body.ref ?? "").trim().slice(0, 60) || null : null;
  const title = kind === "testimony" ? String(body.title ?? "").trim().slice(0, 120) || null : null;
  const noteId = kind === "reflection" && typeof body.noteId === "string" ? body.noteId.slice(0, 64) : null;
  const now = Date.now();
  const id = crypto.randomUUID();

  // One shared copy per journal note: sharing it again replaces the old one.
  if (noteId) {
    await db.prepare("DELETE FROM community_posts WHERE member_id = ?1 AND note_id = ?2").bind(member.id, noteId).run();
  }
  await db
    .prepare(
      "INSERT INTO community_posts (id, kind, member_id, author_name, day, ref, title, text, note_id, status, consent_at, created_at) " +
        "VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 'pending', ?10, ?10)",
    )
    .bind(id, kind, member.id, anonymous ? null : first, day, ref, title, text, noteId, now)
    .run();
  await notifyOwner(
    kind === "testimony" ? "A testimony is waiting for you" : "A shared reflection is waiting for you",
    `${member.name} (${member.email}) shared a ${kind}${anonymous ? " (to show anonymously)" : ""}${ref ? ` on ${ref}` : ""}:\n\n${text.slice(0, 600)}`,
  );
  return Response.json({
    post: { id, kind, author: anonymous ? "A member" : first, day, ref, title, text, noteId, status: "pending", mine: true, createdAt: now },
  });
}

export async function PATCH(req: Request) {
  const s = await session(req);
  if (s instanceof Response) return s;
  const { db, member } = s;
  const body = (await req.json().catch(() => ({}))) as { report?: unknown; reason?: unknown };
  if (typeof body.report !== "string") return Response.json({ error: "Nothing to do." }, { status: 400 });
  await db
    .prepare("INSERT OR IGNORE INTO community_reports (post_id, member_id, reason, created_at) VALUES (?1, ?2, ?3, ?4)")
    .bind(body.report, member.id, String(body.reason ?? "").slice(0, 300) || null, Date.now())
    .run();
  await notifyOwner("A shared post was reported", `${member.name} reported a post in The Study.`);
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const s = await session(req);
  if (s instanceof Response) return s;
  const { db, member } = s;
  const id = new URL(req.url).searchParams.get("id") ?? "";
  await db.prepare("DELETE FROM community_posts WHERE id = ?1 AND member_id = ?2").bind(id, member.id).run();
  return Response.json({ ok: true });
}
