/**
 * The signed-in member and the study's public settings.
 *
 *   GET                                   -> { member | null, study: { reading, signup, author, intro } }
 *   PATCH { name }                        -> { member }
 *   PATCH { emailUpdates: boolean }       -> { emailUpdates }  join / leave the owner's email list
 *   PATCH { current, password }           -> { ok }   new password; other devices are logged out
 *   DELETE { password, confirm: "DELETE" } -> { ok }  removes the account and everything in it
 *
 * Deleting an account removes the member's own notes, words and days, and
 * takes them off the email list - it's their data and their choice. (The owner's study is never touched here.)
 */
import { getDb } from "@/lib/analytics/store";
import {
  MEMBER_TABLES,
  MIN_MEMBER_PASSWORD,
  checkMemberPassword,
  cleanName,
  clearedMemberCookie,
  createMemberSession,
  getMember,
  getSettings,
  hashMemberPassword,
  isSubscribed,
  memberCookie,
  slowDown,
  subscribeStmt,
  unsubscribeStmt,
} from "@/lib/study/members";
import { tidyPassword } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const noStore = { "cache-control": "no-store" };

export async function GET(req: Request) {
  const db = await getDb();
  if (!db) return Response.json({ error: "Accounts aren't available right now." }, { status: 503 });
  const [member, settings] = await Promise.all([getMember(req, db), getSettings(db)]);
  const emailUpdates = member ? await isSubscribed(db, member.email) : false;
  return Response.json({ member: member && { ...member, emailUpdates }, study: settings }, { headers: noStore });
}

export async function PATCH(req: Request) {
  const db = await getDb();
  if (!db) return Response.json({ error: "Accounts aren't available right now." }, { status: 503 });
  const member = await getMember(req, db);
  if (!member) return Response.json({ error: "Please log in.", login: true }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  if (typeof body.emailUpdates === "boolean") {
    await (body.emailUpdates ? subscribeStmt(db, member.email, member.name, "study") : unsubscribeStmt(db, member.email)).run();
    return Response.json({ emailUpdates: body.emailUpdates }, { headers: noStore });
  }

  if (typeof body.password === "string") {
    const password = tidyPassword(body.password);
    if (!(await checkMemberPassword(db, member.id, String(body.current ?? "")))) {
      await slowDown();
      return Response.json({ error: "Your current password isn't right." }, { status: 401 });
    }
    if (password.length < MIN_MEMBER_PASSWORD || password.length > 200) {
      return Response.json({ error: `Use at least ${MIN_MEMBER_PASSWORD} characters.` }, { status: 400 });
    }
    const rec = await hashMemberPassword(password);
    await db.batch([
      db.prepare("UPDATE members SET hash = ?2, salt = ?3, iterations = ?4 WHERE id = ?1").bind(member.id, rec.hash, rec.salt, rec.iterations),
      db.prepare("DELETE FROM member_sessions WHERE member_id = ?1").bind(member.id),
      db.prepare("UPDATE member_resets SET used_at = ?2 WHERE member_id = ?1 AND used_at IS NULL").bind(member.id, Date.now()),
    ]);
    const token = await createMemberSession(db, member.id);
    return Response.json({ ok: true }, { headers: { "set-cookie": memberCookie(token), ...noStore } });
  }

  const name = cleanName(body.name);
  if (!name) return Response.json({ error: "Add your name." }, { status: 400 });
  await db.prepare("UPDATE members SET name = ?2 WHERE id = ?1").bind(member.id, name).run();
  return Response.json({ member: { ...member, name } }, { headers: noStore });
}

export async function DELETE(req: Request) {
  const db = await getDb();
  if (!db) return Response.json({ error: "Accounts aren't available right now." }, { status: 503 });
  const member = await getMember(req, db);
  if (!member) return Response.json({ error: "Please log in.", login: true }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (body.confirm !== "DELETE") return Response.json({ error: "Type DELETE to confirm." }, { status: 400 });
  if (!(await checkMemberPassword(db, member.id, String(body.password ?? "")))) {
    await slowDown();
    return Response.json({ error: "That password isn't right." }, { status: 401 });
  }
  await db.batch([
    ...MEMBER_TABLES.map((t) => db.prepare(`DELETE FROM ${t} WHERE member_id = ?1`).bind(member.id)),
    db.prepare("DELETE FROM ai_usage WHERE who = ?1").bind(member.id),
    // Their "Invite a friend" link stops working and loses their name.
    db
      .prepare("UPDATE member_invites SET revoked_at = COALESCE(revoked_at, ?2), label = 'A former member''s link', member_id = NULL WHERE member_id = ?1")
      .bind(member.id, Date.now()),
    db.prepare("DELETE FROM email_list WHERE email = ?1").bind(member.email),
    db.prepare("DELETE FROM members WHERE id = ?1").bind(member.id),
  ]);
  return Response.json({ ok: true }, { headers: { "set-cookie": clearedMemberCookie(), ...noStore } });
}
