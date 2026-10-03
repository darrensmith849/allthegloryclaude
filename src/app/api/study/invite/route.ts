/**
 * A member's own link for inviting friends (table member_invites, member_id).
 *
 *   GET -> { code, uses } | { closed: true }
 *
 * Made the first time it's asked for; one per member, any number of uses.
 * It works whatever the owner's joining setting is, except "Nobody", and
 * the owner can stop it on /dashboard/members like any other invite.
 */
import { getDb } from "@/lib/analytics/store";
import { getMember, getSettings, randomToken } from "@/lib/study/members";

export const dynamic = "force-dynamic";

const noStore = { "cache-control": "no-store" };

export async function GET(req: Request) {
  const db = await getDb();
  if (!db) return Response.json({ error: "Not available right now." }, { status: 503 });
  const member = await getMember(req, db);
  if (!member) return Response.json({ error: "Please log in.", login: true }, { status: 401 });
  const settings = await getSettings(db);
  if (settings.signup === "closed") return Response.json({ closed: true }, { headers: noStore });

  const existing = await db
    .prepare("SELECT code, uses FROM member_invites WHERE member_id = ?1 AND revoked_at IS NULL ORDER BY created_at DESC LIMIT 1")
    .bind(member.id)
    .first<{ code: string; uses: number }>();
  if (existing) return Response.json({ code: existing.code, uses: existing.uses }, { headers: noStore });

  const code = randomToken(9);
  await db
    .prepare("INSERT INTO member_invites (code, label, max_uses, uses, created_at, member_id) VALUES (?1, ?2, NULL, 0, ?3, ?4)")
    .bind(code, `From ${member.name}`, Date.now(), member.id)
    .run();
  return Response.json({ code, uses: 0 }, { headers: noStore });
}
