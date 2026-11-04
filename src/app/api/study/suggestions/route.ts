/**
 * Members' suggestions (table member_suggestions) - an idea for The Study,
 * sent privately to Daniel and his team. Nobody else ever sees them.
 *
 *   GET                       -> { mine, to }       your suggestions, with any reply; to: "Daniel and Reggie"
 *   POST { text, kind? }      -> { suggestion }     kind: "dashboard" | "study" | "other"
 *   DELETE ?id=...            -> { ok }             take back one of yours (kept, marked removed)
 *
 * The owner and team read and answer them on /dashboard/community
 * (/api/members/community).
 */
import { getDb, type D1Db } from "@/lib/analytics/store";
import { getMember, getSettings, type Member } from "@/lib/study/members";
import { notifyOwnerFrom } from "@/lib/study/notify";

export const dynamic = "force-dynamic";

const noStore = { "cache-control": "no-store" };
const KINDS = ["dashboard", "study", "other"] as const;
const PER_DAY = 5;

interface Row {
  id: string;
  kind: string | null;
  text: string;
  created_at: number;
  seen_at: number | null;
  done_at: number | null;
  reply: string | null;
  replied_by: string | null;
}

const out = (r: Row) => ({
  id: r.id,
  kind: r.kind ?? "other",
  text: r.text,
  createdAt: r.created_at,
  seen: Boolean(r.seen_at),
  done: Boolean(r.done_at),
  reply: r.reply,
  repliedBy: r.replied_by,
});

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
  const { results } = await s.db
    .prepare(
      "SELECT id, kind, text, created_at, seen_at, done_at, reply, replied_by FROM member_suggestions " +
        "WHERE member_id = ?1 AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 100",
    )
    .bind(s.member.id)
    .all<Row>();
  // Who reads them: the owner and his team, by first name.
  const [settings, { results: team }] = await Promise.all([
    getSettings(s.db),
    s.db
      .prepare("SELECT name FROM members WHERE role = 'team' AND disabled_at IS NULL LIMIT 5")
      .all<{ name: string }>()
      .catch(() => ({ results: [] as { name: string }[] })),
  ]);
  const owner = settings.author || "Daniel";
  const names = [...new Set(team.map((t) => t.name.trim().split(/\s+/)[0]).filter((n) => n && n !== owner))];
  const to = names.length === 1 ? `${owner} and ${names[0]}` : names.length ? `${owner} and the team` : owner;
  return Response.json({ mine: results.map(out), to }, { headers: noStore });
}

export async function POST(req: Request) {
  const s = await session(req);
  if (s instanceof Response) return s;
  const body = (await req.json().catch(() => ({}))) as { text?: unknown; kind?: unknown };
  const text = String(body.text ?? "").trim().slice(0, 2000);
  const kind = KINDS.find((k) => k === body.kind) ?? "other";
  if (text.length < 5) return Response.json({ error: "Write a little more about your idea." }, { status: 400 });
  const now = Date.now();
  const recent = await s.db
    .prepare("SELECT COUNT(*) AS n FROM member_suggestions WHERE member_id = ?1 AND created_at > ?2")
    .bind(s.member.id, now - 86_400_000)
    .first<{ n: number }>();
  if (Number(recent?.n ?? 0) >= PER_DAY) {
    return Response.json({ error: "That's plenty of ideas for one day - thank you! Send more tomorrow." }, { status: 429 });
  }
  const id = crypto.randomUUID();
  await s.db
    .prepare("INSERT INTO member_suggestions (id, member_id, member_name, kind, text, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)")
    .bind(id, s.member.id, s.member.name, kind, text, now)
    .run();
  const label = kind === "dashboard" ? "for their dashboard" : kind === "study" ? "for the study" : "";
  await notifyOwnerFrom(s.db, s.member.id, `A suggestion from ${s.member.name}`, `${s.member.name} has a suggestion${label ? ` ${label}` : ""}:\n\n${text}`, {
    team: true,
  }).catch(() => {});
  const row = await s.db
    .prepare("SELECT id, kind, text, created_at, seen_at, done_at, reply, replied_by FROM member_suggestions WHERE id = ?1")
    .bind(id)
    .first<Row>();
  return Response.json({ suggestion: row ? out(row) : null });
}

export async function DELETE(req: Request) {
  const s = await session(req);
  if (s instanceof Response) return s;
  const id = new URL(req.url).searchParams.get("id") ?? "";
  await s.db
    .prepare("UPDATE member_suggestions SET deleted_at = ?1 WHERE id = ?2 AND member_id = ?3")
    .bind(Date.now(), id, s.member.id)
    .run();
  return Response.json({ ok: true });
}
