/**
 * Make a member account for The Study.
 *
 *   POST { name, email, password, invite?, emailUpdates? } -> 200 + session cookie
 *
 * emailUpdates: they ticked "send me updates" - added to the owner's email
 * list (email_list). Never ticked for them.
 *
 * Who can join is the owner's choice (study_settings.signup): only with an
 * invite link (the default), anyone, or nobody for now.
 */
import { getDb } from "@/lib/analytics/store";
import {
  MIN_MEMBER_PASSWORD,
  cleanName,
  clientIp,
  createMemberSession,
  getSettings,
  hashMemberPassword,
  memberByEmail,
  memberCookie,
  normEmail,
  subscribeStmt,
  noteAttempt,
  tooMany,
  usableInvite,
  validEmail,
} from "@/lib/study/members";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const db = await getDb();
  if (!db) return Response.json({ error: "Accounts aren't available right now." }, { status: 503 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const name = cleanName(body.name);
  const email = normEmail(body.email);
  const password = String(body.password ?? "");
  const code = String(body.invite ?? "").trim();

  const settings = await getSettings(db);
  const invite = code ? await usableInvite(db, code) : null;
  if (settings.signup === "closed") {
    return Response.json({ error: "Joining is closed for now." }, { status: 403 });
  }
  if (settings.signup === "invite" && !invite) {
    return Response.json(
      { error: code ? "This invite link isn't valid any more." : "Joining is by invite for now." },
      { status: 403 },
    );
  }

  const key = `join:${clientIp(req)}`;
  if (await tooMany(db, key, 5, 3_600_000)) {
    return Response.json({ error: "Too many new accounts from here - try again in an hour." }, { status: 429 });
  }
  if (!name) return Response.json({ error: "Add your name." }, { status: 400 });
  if (!validEmail(email)) return Response.json({ error: "That email doesn't look right." }, { status: 400 });
  if (password.length < MIN_MEMBER_PASSWORD || password.length > 200) {
    return Response.json({ error: `Use a password of at least ${MIN_MEMBER_PASSWORD} characters.` }, { status: 400 });
  }
  if (await memberByEmail(db, email)) {
    return Response.json({ error: "There's already an account with that email - log in instead." }, { status: 409 });
  }

  await noteAttempt(db, key);
  const rec = await hashMemberPassword(password);
  const id = crypto.randomUUID();
  const now = Date.now();
  try {
    await db.batch([
      db
        .prepare(
          "INSERT INTO members (id, email, name, hash, salt, iterations, invite_code, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        )
        .bind(id, email, name, rec.hash, rec.salt, rec.iterations, invite?.code ?? null, now),
      ...(invite ? [db.prepare("UPDATE member_invites SET uses = uses + 1 WHERE code = ?1").bind(invite.code)] : []),
      ...(body.emailUpdates === true ? [subscribeStmt(db, email, name, "study")] : []),
    ]);
  } catch (e) {
    console.error("study join:", e);
    return Response.json({ error: "Couldn't make your account - try again." }, { status: 500 });
  }
  const token = await createMemberSession(db, id);
  return Response.json(
    { member: { id, email, name, createdAt: now } },
    { headers: { "set-cookie": memberCookie(token), "cache-control": "no-store" } },
  );
}
