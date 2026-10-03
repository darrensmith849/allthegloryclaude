/**
 * "Forgotten your password?" - emails a one-time link to set a new one.
 *
 *   POST { email } -> { ok: true }   (always the same answer, whether or not
 *                                     there's an account - nothing to learn)
 *
 * The link (/the-study?reset=…) works once, for an hour. Limited per
 * address and per email so it can't be used to flood an inbox.
 */
import { getDb } from "@/lib/analytics/store";
import { clientIp, memberByEmail, noteAttempt, normEmail, randomToken, sha256, tooMany } from "@/lib/study/members";
import { sendStudyEmail, studyEmail } from "@/lib/study/mail";

export const dynamic = "force-dynamic";

const HOUR = 3_600_000;

export async function POST(req: Request) {
  const db = await getDb();
  if (!db) return Response.json({ error: "Not available right now." }, { status: 503 });
  const body = (await req.json().catch(() => ({}))) as { email?: unknown };
  const email = normEmail(body.email);
  const ipKey = `forgot:${clientIp(req)}`;
  const emailKey = `forgot-email:${email}`;
  if ((await tooMany(db, ipKey, 5, HOUR)) || (await tooMany(db, emailKey, 3, HOUR))) {
    return Response.json({ error: "Too many tries - please wait an hour and try again." }, { status: 429 });
  }
  await noteAttempt(db, ipKey);
  await noteAttempt(db, emailKey);

  const member = email ? await memberByEmail(db, email) : null;
  if (member && !member.disabled_at) {
    const token = randomToken();
    const now = Date.now();
    await db
      .prepare("INSERT INTO member_resets (token_hash, member_id, created_at, expires_at) VALUES (?1, ?2, ?3, ?4)")
      .bind(await sha256(token), member.id, now, now + HOUR)
      .run();
    const url = `${new URL(req.url).origin}/the-study?reset=${token}`;
    await sendStudyEmail(
      { email: member.email, name: member.name },
      "Set a new password for The Study",
      studyEmail({
        heading: `Hi ${member.name.split(" ")[0]},`,
        paragraphs: [
          "Someone (hopefully you) asked to reset the password for your Bible study journal on All The Glory.",
          "Tap the button to choose a new one. The link works once, for the next hour.",
          "If you didn't ask for this, you can ignore this email - your password stays as it is.",
        ],
        button: { label: "Set a new password", url },
      }),
    );
  }
  return Response.json({ ok: true });
}
