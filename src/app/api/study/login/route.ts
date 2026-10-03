/**
 * Member login for The Study.
 *
 *   POST { email, password } -> 200 + session cookie | 401 | 403 | 429
 *
 * More than 8 wrong tries from one address in 15 minutes locks that
 * address out until the window passes.
 */
import { getDb } from "@/lib/analytics/store";
import {
  clearAttempts,
  clientIp,
  createMemberSession,
  memberCookie,
  normEmail,
  noteAttempt,
  slowDown,
  tooMany,
  verifyLogin,
} from "@/lib/study/members";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const db = await getDb();
  if (!db) return Response.json({ error: "Accounts aren't available right now." }, { status: 503 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const email = normEmail(body.email);
  const password = String(body.password ?? "").slice(0, 200);
  const key = `study:${clientIp(req)}`;

  if (await tooMany(db, key, 8, 15 * 60_000)) {
    return Response.json({ error: "Too many wrong attempts. Try again in 15 minutes." }, { status: 429 });
  }
  const { member, ok } = await verifyLogin(db, email, password);
  if (!member || !ok) {
    await noteAttempt(db, key);
    await slowDown();
    return Response.json({ error: "That email and password don't match." }, { status: 401 });
  }
  if (member.disabled_at) {
    return Response.json({ error: "This account is paused. Please get in touch." }, { status: 403 });
  }
  await clearAttempts(db, key);
  const token = await createMemberSession(db, member.id);
  return Response.json(
    { member: { id: member.id, email: member.email, name: member.name, createdAt: member.created_at } },
    { headers: { "set-cookie": memberCookie(token), "cache-control": "no-store" } },
  );
}
