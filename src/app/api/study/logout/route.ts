// Member logout: ends this device's session.
import { getDb } from "@/lib/analytics/store";
import { clearedMemberCookie, endSession } from "@/lib/study/members";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const db = await getDb();
  if (db) await endSession(req, db).catch(() => {});
  return Response.json({ ok: true }, { headers: { "set-cookie": clearedMemberCookie() } });
}
