/**
 * Word journal entries - one D1 row per word (table study_words, see
 * db/schema.sql), so the journal can grow for years without the size limit
 * of the dashboard's single state blob.
 *
 *   GET    [?since=ms]         -> { words, syncedAt }  all (or changed since), incl. deleted
 *   PUT    { word }            -> { word }    create or update one entry
 *   PATCH  { id, restore: true } -> { word }  back from Recently deleted
 *   DELETE ?id=...             -> 204         to Recently deleted
 *
 * Nothing is ever removed: DELETE only marks a word deleted, and every
 * update first copies the old entry into study_word_versions. Words saved
 * before this table existed are copied in from the state blob on first read.
 */
import { getDb, type D1Db } from "@/lib/analytics/store";
import type { BibleWord } from "@/lib/dashboard/types";

export const dynamic = "force-dynamic";

const MAX_JSON = 200_000;

interface Row {
  json: string;
  deleted_at: number | null;
}

const unavailable = () => Response.json({ error: "Word storage isn't available here." }, { status: 503 });

function toWord(r: Row): BibleWord | null {
  try {
    const w = JSON.parse(r.json) as BibleWord;
    return { ...w, deletedAt: r.deleted_at ? new Date(r.deleted_at).toISOString() : undefined };
  } catch {
    return null;
  }
}

function clean(input: unknown): BibleWord | null {
  const w = input as Partial<BibleWord> | null;
  if (!w || typeof w.id !== "string" || !w.id || typeof w.word !== "string" || !w.word.trim()) return null;
  if (typeof w.createdAt !== "string") return null;
  const { deletedAt: _deleted, ...rest } = w as BibleWord;
  void _deleted;
  return rest as BibleWord;
}

const upsert = (db: D1Db, w: BibleWord, now: number) => {
  const json = JSON.stringify(w);
  return db
    .prepare(
      "INSERT INTO study_words (id, day, word, json, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6) " +
        "ON CONFLICT(id) DO UPDATE SET day=excluded.day, word=excluded.word, json=excluded.json, updated_at=excluded.updated_at",
    )
    .bind(w.id, w.day ?? null, w.word, json, Date.parse(w.createdAt) || now, now);
};

// One-time: copy words from the old state blob into the table.
async function migrateFromBlob(db: D1Db) {
  const count = await db.prepare("SELECT COUNT(*) AS n FROM study_words").first<{ n: number }>();
  if (Number(count?.n ?? 0) > 0) return;
  const row = await db
    .prepare("SELECT json FROM dashboard_state WHERE id='owner'")
    .first<{ json: string }>()
    .catch(() => null);
  if (!row?.json) return;
  let words: BibleWord[] = [];
  try {
    const parsed = JSON.parse(row.json) as { words?: unknown };
    words = (Array.isArray(parsed.words) ? parsed.words : []).map(clean).filter((w): w is BibleWord => Boolean(w));
  } catch {
    return;
  }
  if (!words.length) return;
  const now = Date.now();
  await db.batch(
    words.map((w) =>
      db
        .prepare(
          "INSERT OR IGNORE INTO study_words (id, day, word, json, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        )
        .bind(w.id, w.day ?? null, w.word, JSON.stringify(w), Date.parse(w.createdAt) || now, now),
    ),
  );
}

export async function GET(req: Request) {
  const db = await getDb();
  if (!db) return unavailable();
  try {
    await migrateFromBlob(db);
    const syncedAt = Date.now();
    const since = Number(new URL(req.url).searchParams.get("since")) || 0;
    const { results } = since
      ? await db
          .prepare("SELECT json, deleted_at FROM study_words WHERE updated_at > ?1 ORDER BY created_at DESC")
          .bind(since)
          .all<Row>()
      : await db.prepare("SELECT json, deleted_at FROM study_words ORDER BY created_at DESC").all<Row>();
    const words = results.map(toWord).filter((w): w is BibleWord => Boolean(w));
    return Response.json({ words, syncedAt }, { headers: { "cache-control": "no-store" } });
  } catch (e) {
    console.error("words GET:", e);
    return Response.json({ error: "Couldn't load your words." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const db = await getDb();
  if (!db) return unavailable();
  const body = (await req.json().catch(() => ({}))) as { word?: unknown };
  const w = clean(body.word);
  if (!w) return Response.json({ error: "Nothing to save." }, { status: 400 });
  if (JSON.stringify(w).length > MAX_JSON) return Response.json({ error: "That entry is too long." }, { status: 413 });
  try {
    const now = Date.now();
    await db.batch([
      db
        .prepare("INSERT INTO study_word_versions (word_id, json, saved_at) SELECT id, json, ?2 FROM study_words WHERE id=?1")
        .bind(w.id, now),
      upsert(db, w, now),
    ]);
    return Response.json({ word: w });
  } catch (e) {
    console.error("words PUT:", e);
    return Response.json({ error: "Couldn't save that word." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const db = await getDb();
  if (!db) return unavailable();
  const body = (await req.json().catch(() => ({}))) as { id?: unknown; restore?: unknown };
  if (typeof body.id !== "string" || body.restore !== true) {
    return Response.json({ error: "Nothing to change." }, { status: 400 });
  }
  try {
    await db
      .prepare("UPDATE study_words SET deleted_at=NULL, updated_at=?2 WHERE id=?1")
      .bind(body.id, Date.now())
      .run();
    const row = await db.prepare("SELECT json, deleted_at FROM study_words WHERE id=?1").bind(body.id).first<Row>();
    const word = row ? toWord(row) : null;
    return word ? Response.json({ word }) : Response.json({ error: "Word not found." }, { status: 404 });
  } catch (e) {
    console.error("words PATCH:", e);
    return Response.json({ error: "Couldn't restore that word." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const db = await getDb();
  if (!db) return unavailable();
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!id) return Response.json({ error: "Which word?" }, { status: 400 });
  try {
    const now = Date.now();
    await db.prepare("UPDATE study_words SET deleted_at=?2, updated_at=?2 WHERE id=?1").bind(id, now).run();
    return new Response(null, { status: 204 });
  } catch (e) {
    console.error("words DELETE:", e);
    return Response.json({ error: "Couldn't delete that word." }, { status: 500 });
  }
}
