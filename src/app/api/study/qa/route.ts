/**
 * Answered questions shared for everyone to read (The Study page and the
 * members' Community page). The person who asked is never included.
 *
 *   GET -> { questions: [{ id, text, ref, answer, answeredBy, answeredAt }] }
 */
import { getDb } from "@/lib/analytics/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = await getDb();
  if (!db) return Response.json({ questions: [] });
  const { results } = await db
    .prepare(
      "SELECT id, text, ref, answer, answerer_name, answered_at FROM community_questions " +
        "WHERE published = 1 AND status = 'answered' ORDER BY answered_at DESC LIMIT 50",
    )
    .all<{ id: string; text: string; ref: string | null; answer: string; answerer_name: string | null; answered_at: number }>()
    .catch(() => ({ results: [] as never[] }));
  return Response.json(
    {
      questions: results.map((q) => ({
        id: q.id,
        text: q.text,
        ref: q.ref,
        answer: q.answer,
        answeredBy: q.answerer_name,
        answeredAt: q.answered_at,
      })),
    },
    { headers: { "cache-control": "public, max-age=60, s-maxage=300" } },
  );
}
