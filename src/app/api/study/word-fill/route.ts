/**
 * Word fill for members (src/lib/dashboard/word-fill.ts).
 *
 * The AI write-up runs on Workers AI's free daily allowance, shared with
 * the owner, so each member gets MEMBER_DAILY AI fills a day and all
 * members together MEMBERS_DAILY. Past that, fills still return the
 * Hebrew / Greek word, lexicon meaning and verses - just no AI wording.
 */
import { getDb } from "@/lib/analytics/store";
import { fillWord } from "@/lib/dashboard/word-fill";
import { getMember } from "@/lib/study/members";

export const dynamic = "force-dynamic";

const MEMBER_DAILY = 8;
const MEMBERS_DAILY = 40;

export async function POST(req: Request) {
  const db = await getDb();
  const member = await getMember(req, db);
  if (!db || !member) return Response.json({ error: "Please log in to your study.", login: true }, { status: 401 });

  const day = new Date().toISOString().slice(0, 10);
  const { results } = await db
    .prepare("SELECT who, n FROM ai_usage WHERE day = ?1 AND who IN (?2, '*members')")
    .bind(day, member.id)
    .all<{ who: string; n: number }>()
    .catch(() => ({ results: [] as { who: string; n: number }[] }));
  const used = (who: string) => Number(results.find((r) => r.who === who)?.n ?? 0);
  const ai = used(member.id) < MEMBER_DAILY && used("*members") < MEMBERS_DAILY;
  // The quick first answer (no AI) doesn't count towards the allowance.
  const quick = ((await req.clone().json().catch(() => ({}))) as { quick?: unknown }).quick === true;

  if (ai && !quick) {
    const bump = (who: string) =>
      db
        .prepare("INSERT INTO ai_usage (day, who, n) VALUES (?1, ?2, 1) ON CONFLICT(day, who) DO UPDATE SET n = n + 1")
        .bind(day, who);
    await db.batch([bump(member.id), bump("*members")]).catch(() => {});
  }
  return fillWord(req, {
    ai,
    aiNote: "Today's AI write-ups are used up - here's the lexicon meaning and verses. Write your own reflection, or fill it in again tomorrow.",
  });
}
