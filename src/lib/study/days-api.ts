/**
 * Each reading day's own details - a title, the key takeaway, and (owner
 * only) whether the day is included when the study is shared. For the
 * owner (study_days) or a member (member_days), see ./scope.ts.
 *
 *   GET                                   -> { days }
 *   PUT  { day, title, takeaway, shared } -> { day }
 *
 * Nothing is ever lost: each change first copies the old row into the
 * versions table.
 */
import { getDb } from "@/lib/analytics/store";
import { isDay, type StudyDay } from "@/lib/dashboard/notes";
import { andMine, mine, mineArgs, pre, preQ, type ScopeOf } from "./scope";

interface Row {
  day: string;
  title: string | null;
  takeaway: string | null;
  shared: number;
  updated_at: number;
}

const toDay = (r: Row): StudyDay => ({
  day: r.day,
  title: r.title ?? "",
  takeaway: r.takeaway ?? "",
  shared: Boolean(r.shared),
  updatedAt: r.updated_at,
});

const unavailable = () => Response.json({ error: "Storage isn't available here." }, { status: 503 });

export function daysApi(scopeOf: ScopeOf) {
  async function GET(req: Request) {
    const s = await scopeOf(req);
    if (s instanceof Response) return s;
    const db = await getDb();
    if (!db) return unavailable();
    try {
      const { results } = await db
        .prepare(`SELECT * FROM ${s.days} WHERE ${mine(s)} ORDER BY day`)
        .bind(...mineArgs(s))
        .all<Row>();
      return Response.json({ days: results.map(toDay) }, { headers: { "cache-control": "no-store" } });
    } catch (e) {
      console.error("days GET:", e);
      return Response.json({ error: "Couldn't load the days." }, { status: 500 });
    }
  }

  async function PUT(req: Request) {
    const s = await scopeOf(req);
    if (s instanceof Response) return s;
    const db = await getDb();
    if (!db) return unavailable();
    const body = (await req.json().catch(() => ({}))) as Partial<StudyDay>;
    if (!isDay(body.day)) return Response.json({ error: "Which day?" }, { status: 400 });
    const title = String(body.title ?? "").trim().slice(0, 200);
    const takeaway = String(body.takeaway ?? "").trim().slice(0, 4000);
    const shared = body.shared === false ? 0 : 1;
    const now = Date.now();
    try {
      await db.batch([
        db
          .prepare(
            `INSERT INTO ${s.dayVersions} (${pre(s)}day, title, takeaway, shared, saved_at) ` +
              `SELECT ${pre(s)}day, title, takeaway, shared, ? FROM ${s.days} WHERE day = ?${andMine(s)}`,
          )
          .bind(now, body.day, ...mineArgs(s)),
        db
          .prepare(
            `INSERT INTO ${s.days} (${pre(s)}day, title, takeaway, shared, updated_at) VALUES (${preQ(s)}?, ?, ?, ?, ?) ` +
              `ON CONFLICT(${s.member ? "member_id, day" : "day"}) DO UPDATE SET title = excluded.title, ` +
              "takeaway = excluded.takeaway, shared = excluded.shared, updated_at = excluded.updated_at",
          )
          .bind(...mineArgs(s), body.day, title, takeaway, shared, now),
      ]);
      return Response.json({ day: { day: body.day, title, takeaway, shared: Boolean(shared), updatedAt: now } });
    } catch (e) {
      console.error("days PUT:", e);
      return Response.json({ error: "Couldn't save that." }, { status: 500 });
    }
  }

  return { GET, PUT };
}
