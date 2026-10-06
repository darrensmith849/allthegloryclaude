/**
 * Each reading day's own details - a title, the key takeaway, and (owner
 * only) whether the day is included when the study is shared. For the
 * owner (study_days) or a member (member_days), see ./scope.ts.
 *
 *   GET                                   -> { days }
 *   PUT  { day, title, takeaway, shared, video? } -> { day }   (video: owner only, a YouTube link)
 *   PATCH { day, read: boolean }          -> { day }   tick the day's reading done (or not)
 *   PATCH { day, star: boolean }          -> { day }   star the day as a favourite (or not)
 *
 * Nothing is ever lost: each change first copies the old row into the
 * versions table. The owner's GET also says which days are held back from
 * the shared study until next year (study_settings "hold").
 */
import { getDb } from "@/lib/analytics/store";
import { isDay, type StudyDay } from "@/lib/dashboard/notes";
import { getSettings } from "./members";
import { andMine, mine, mineArgs, pre, preQ, type ScopeOf } from "./scope";
import { parseYouTube } from "./youtube";

interface Row {
  day: string;
  title: string | null;
  takeaway: string | null;
  shared: number;
  updated_at: number;
  read_at: number | null;
  starred_at?: number | null;
  video?: string | null; // owner only
}

const toDay = (r: Row): StudyDay => ({
  day: r.day,
  title: r.title ?? "",
  takeaway: r.takeaway ?? "",
  shared: Boolean(r.shared),
  updatedAt: r.updated_at,
  readAt: r.read_at ?? null,
  starredAt: r.starred_at ?? null,
  video: r.video ?? null,
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
      const hold = s.member ? undefined : (await getSettings(db)).hold;
      return Response.json({ days: results.map(toDay), ...(s.member ? {} : { hold }) }, { headers: { "cache-control": "no-store" } });
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
    // The owner's session video: kept as it is unless sent.
    const setVideo = !s.member && "video" in body;
    const videoText = String(body.video ?? "").trim().slice(0, 300);
    if (setVideo && videoText && !parseYouTube(videoText)) {
      return Response.json({ error: "That doesn't look like a YouTube link - copy it from YouTube's Share button." }, { status: 400 });
    }
    const video = videoText || null;
    const vcol = s.member ? "" : ", video";
    const now = Date.now();
    try {
      await db.batch([
        db
          .prepare(
            `INSERT INTO ${s.dayVersions} (${pre(s)}day, title, takeaway, shared${vcol}, saved_at) ` +
              `SELECT ${pre(s)}day, title, takeaway, shared${vcol}, ? FROM ${s.days} WHERE day = ?${andMine(s)}`,
          )
          .bind(now, body.day, ...mineArgs(s)),
        db
          .prepare(
            `INSERT INTO ${s.days} (${pre(s)}day, title, takeaway, shared, updated_at${setVideo ? ", video" : ""}) ` +
              `VALUES (${preQ(s)}?, ?, ?, ?, ?${setVideo ? ", ?" : ""}) ` +
              `ON CONFLICT(${s.member ? "member_id, day" : "day"}) DO UPDATE SET title = excluded.title, ` +
              `takeaway = excluded.takeaway, shared = excluded.shared, updated_at = excluded.updated_at${setVideo ? ", video = excluded.video" : ""}`,
          )
          .bind(...mineArgs(s), body.day, title, takeaway, shared, now, ...(setVideo ? [video] : [])),
      ]);
      const row = await db
        .prepare(`SELECT * FROM ${s.days} WHERE day = ?${andMine(s)}`)
        .bind(body.day, ...mineArgs(s))
        .first<Row>();
      return Response.json({
        day: row ? toDay(row) : { day: body.day, title, takeaway, shared: Boolean(shared), updatedAt: now },
      });
    } catch (e) {
      console.error("days PUT:", e);
      return Response.json({ error: "Couldn't save that." }, { status: 500 });
    }
  }

  async function PATCH(req: Request) {
    const s = await scopeOf(req);
    if (s instanceof Response) return s;
    const db = await getDb();
    if (!db) return unavailable();
    const body = (await req.json().catch(() => ({}))) as { day?: unknown; read?: unknown; star?: unknown };
    const field = typeof body.read === "boolean" ? "read_at" : typeof body.star === "boolean" ? "starred_at" : null;
    if (!isDay(body.day) || !field) {
      return Response.json({ error: "Which day?" }, { status: 400 });
    }
    const on = field === "read_at" ? body.read === true : body.star === true;
    const now = Date.now();
    try {
      await db
        .prepare(
          `INSERT INTO ${s.days} (${pre(s)}day, ${field}, updated_at) VALUES (${preQ(s)}?, ?, ?) ` +
            `ON CONFLICT(${s.member ? "member_id, day" : "day"}) DO UPDATE SET ${field} = excluded.${field}, updated_at = excluded.updated_at`,
        )
        .bind(...mineArgs(s), body.day, on ? now : null, now)
        .run();
      const row = await db
        .prepare(`SELECT * FROM ${s.days} WHERE day = ?${andMine(s)}`)
        .bind(body.day, ...mineArgs(s))
        .first<Row>();
      return row ? Response.json({ day: toDay(row) }) : Response.json({ error: "Couldn't save that." }, { status: 500 });
    } catch (e) {
      console.error("days PATCH:", e);
      return Response.json({ error: "Couldn't save that." }, { status: 500 });
    }
  }

  return { GET, PUT, PATCH };
}
