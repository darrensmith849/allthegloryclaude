/**
 * Set a new password from a one-time reset link - emailed by "Forgotten
 * your password?" (works for an hour) or made by the owner on
 * /dashboard/members → "Reset link" (7 days).
 *
 *   POST { token, password } -> 200 + session cookie
 *
 * A link works once; using it cancels any other unused links for that
 * member, and every other device is logged out.
 */
import { changesOf, getDb } from "@/lib/analytics/store";
import {
  MIN_MEMBER_PASSWORD,
  clientIp,
  createMemberSession,
  hashMemberPassword,
  memberCookie,
  noteAttempt,
  sha256,
  slowDown,
  tooMany,
} from "@/lib/study/members";
import { tidyPassword } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const db = await getDb();
  if (!db) return Response.json({ error: "Accounts aren't available right now." }, { status: 503 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const token = String(body.token ?? "").slice(0, 100);
  const password = tidyPassword(String(body.password ?? ""));
  const key = `reset:${clientIp(req)}`;
  if (await tooMany(db, key, 10, 3_600_000)) {
    return Response.json({ error: "Too many tries - wait an hour." }, { status: 429 });
  }
  if (password.length < MIN_MEMBER_PASSWORD || password.length > 200) {
    return Response.json({ error: `Use a password of at least ${MIN_MEMBER_PASSWORD} characters.` }, { status: 400 });
  }
  const now = Date.now();
  const row = token
    ? await db
        .prepare(
          "SELECT r.member_id FROM member_resets r JOIN members m ON m.id = r.member_id " +
            "WHERE r.token_hash = ?1 AND r.used_at IS NULL AND r.expires_at > ?2 AND m.disabled_at IS NULL",
        )
        .bind(await sha256(token), now)
        .first<{ member_id: string }>()
    : null;
  if (!row) {
    await noteAttempt(db, key);
    await slowDown();
    return Response.json({ error: "This reset link has expired or was already used." }, { status: 400 });
  }
  // Claim the link first, so two quick submissions can't both use it, then
  // cancel any other unused links for this member.
  const claimed = await db
    .prepare("UPDATE member_resets SET used_at = ?2 WHERE token_hash = ?1 AND used_at IS NULL")
    .bind(await sha256(token), now)
    .run();
  if (!changesOf(claimed)) {
    return Response.json({ error: "This reset link has expired or was already used." }, { status: 400 });
  }
  const rec = await hashMemberPassword(password);
  await db.batch([
    db.prepare("UPDATE members SET hash = ?2, salt = ?3, iterations = ?4 WHERE id = ?1").bind(row.member_id, rec.hash, rec.salt, rec.iterations),
    db.prepare("UPDATE member_resets SET used_at = ?2 WHERE member_id = ?1 AND used_at IS NULL").bind(row.member_id, now),
    db.prepare("DELETE FROM member_sessions WHERE member_id = ?1").bind(row.member_id),
  ]);
  const session = await createMemberSession(db, row.member_id);
  return Response.json({ ok: true }, { headers: { "set-cookie": memberCookie(session), "cache-control": "no-store" } });
}
