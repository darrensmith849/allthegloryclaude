/**
 * Each reading day's own details for Study Notes - a title, the key
 * takeaway, and whether the day is included when the study is shared.
 *
 *   GET                                   -> { days }
 *   PUT  { day, title, takeaway, shared } -> { day }
 *
 * Nothing is ever lost: each change first copies the old row into
 * study_day_versions.
 */
import { getDb } from "@/lib/analytics/store";
import { isDay, type StudyDay } from "@/lib/dashboard/notes";

export const dynamic = "force-dynamic";

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

export async function GET() {
  const db = await getDb();
  if (!db) return Response.json({ error: "Storage isn't available here." }, { status: 503 });
  try {
    const { results } = await db.prepare("SELECT * FROM study_days ORDER BY day").all<Row>();
    return Response.json({ days: results.map(toDay) }, { headers: { "cache-control": "no-store" } });
  } catch (e) {
    console.error("study-days GET:", e);
    return Response.json({ error: "Couldn't load the days." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const db = await getDb();
  if (!db) return Response.json({ error: "Storage isn't available here." }, { status: 503 });
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
          "INSERT INTO study_day_versions (day, title, takeaway, shared, saved_at) " +
            "SELECT day, title, takeaway, shared, ?2 FROM study_days WHERE day=?1",
        )
        .bind(body.day, now),
      db
        .prepare(
          "INSERT INTO study_days (day, title, takeaway, shared, updated_at) VALUES (?1, ?2, ?3, ?4, ?5) " +
            "ON CONFLICT(day) DO UPDATE SET title=excluded.title, takeaway=excluded.takeaway, " +
            "shared=excluded.shared, updated_at=excluded.updated_at",
        )
        .bind(body.day, title, takeaway, shared, now),
    ]);
    return Response.json({ day: { day: body.day, title, takeaway, shared: Boolean(shared), updatedAt: now } });
  } catch (e) {
    console.error("study-days PUT:", e);
    return Response.json({ error: "Couldn't save that." }, { status: 500 });
  }
}
