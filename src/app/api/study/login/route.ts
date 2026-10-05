/**
 * Member login for The Study.
 *
 *   POST { email, password, invite? } -> 200 + session cookie | 401 | 403 | 429
 *   (invite: Daniel's one-time team invite - logging in with it joins his team)
 *
 * Every try is counted before the password is checked - per address and
 * per email - so 8 tries from one address, or 10 at one account, in 15
 * minutes lock out until the window passes. A good login clears that
 * email's count only (logging into your own account doesn't reset the
 * address's count).
 */
import { changesOf, getDb } from "@/lib/analytics/store";
import {
  clearAttempts,
  clientIp,
  createMemberSession,
  memberCookie,
  normEmail,
  noteAttempt,
  slowDown,
  tooMany,
  usableInvite,
  verifyLogin,
} from "@/lib/study/members";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const db = await getDb();
  if (!db) return Response.json({ error: "Accounts aren't available right now." }, { status: 503 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const email = normEmail(body.email);
  const password = String(body.password ?? "").slice(0, 200);
  // "admin" (no @) is Daniel looking for his dashboard login, not a member.
  if (!email.includes("@")) {
    return Response.json(
      {
        error:
          "This is the members' login, with an email address. Daniel - your dashboard is at alltheglory.co.za/dashboard and only asks for your password.",
      },
      { status: 400 },
    );
  }
  const key = `study:${clientIp(req)}`;
  const emailKey = `study-email:${email}`;
  const started = Date.now();
  await Promise.all([noteAttempt(db, key), noteAttempt(db, emailKey)]);
  const [busyIp, busyEmail] = await Promise.all([
    tooMany(db, key, 9, 15 * 60_000),
    tooMany(db, emailKey, 11, 15 * 60_000),
  ]);
  if (busyIp || busyEmail) {
    await slowDown();
    return Response.json({ error: "Too many wrong attempts. Try again in 15 minutes." }, { status: 429 });
  }
  const { member, ok } = await verifyLogin(db, email, password);
  if (!member || !ok) {
    await slowDown();
    return Response.json({ error: "That email and password don't match." }, { status: 401 });
  }
  if (member.disabled_at) {
    return Response.json({ error: "This account is paused. Please get in touch." }, { status: 403 });
  }
  await Promise.all([
    clearAttempts(db, emailKey),
    db.prepare("DELETE FROM login_attempts WHERE ip = ?1 AND ts >= ?2").bind(key, started).run().catch(() => {}),
  ]);
  // Already a member and opened Daniel's team invite? Logging in with it
  // puts them on the team (the link works once).
  let team = false;
  const code = String(body.invite ?? "").trim();
  if (code) {
    const invite = await usableInvite(db, code);
    if (invite?.role === "team") {
      const used = await db
        .prepare("UPDATE member_invites SET uses = uses + 1 WHERE code = ?1 AND revoked_at IS NULL AND (max_uses IS NULL OR uses < max_uses)")
        .bind(invite.code)
        .run();
      if (changesOf(used)) {
        await db.prepare("UPDATE members SET role = 'team' WHERE id = ?1").bind(member.id).run();
        team = true;
      }
    }
  }
  const token = await createMemberSession(db, member.id);
  return Response.json(
    { member: { id: member.id, email: member.email, name: member.name, createdAt: member.created_at }, team },
    { headers: { "set-cookie": memberCookie(token), "cache-control": "no-store" } },
  );
}
