// A sermon's saved notes (table sermon_notes, see db/schema.sql) - the
// Sermons tab's version of Study Notes, by sermon instead of reading day.
// The dashboard middleware requires the admin session (owner only).
//
// Never hard-deleted: DELETE sets deleted_at, PATCH { restore: true } brings
// a note back, and every edit keeps the earlier text in sermon_note_versions.
import { getDb, type D1Db } from "@/lib/analytics/store";
import { toNote, type NoteRow } from "@/lib/dashboard/sermons";

export const dynamic = "force-dynamic";

const MAX_TEXT = 50_000;

async function open(): Promise<D1Db | Response> {
  const db = await getDb();
  if (!db) return Response.json({ error: "Storage isn't available here." }, { status: 503 });
  return db;
}

const one = (db: D1Db, id: string) => db.prepare("SELECT * FROM sermon_notes WHERE id = ?").bind(id).first<NoteRow>();

// Save a new note at the end of the sermon's notes.
export async function POST(req: Request) {
  const db = await open();
  if (db instanceof Response) return db;
  const body = (await req.json().catch(() => ({}))) as { sermonId?: unknown; text?: unknown };
  const sermonId = typeof body.sermonId === "string" ? body.sermonId : "";
  const text = typeof body.text === "string" ? body.text.trim().slice(0, MAX_TEXT) : "";
  if (!sermonId) return Response.json({ error: "Which sermon?" }, { status: 400 });
  if (!text) return Response.json({ error: "Write something first." }, { status: 400 });
  const now = Date.now();
  const id = `n_${now.toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  try {
    const sermon = await db.prepare("SELECT id FROM sermons WHERE id = ?").bind(sermonId).first<{ id: string }>();
    if (!sermon) return Response.json({ error: "Sermon not found." }, { status: 404 });
    const last = await db
      .prepare("SELECT MAX(position) AS p FROM sermon_notes WHERE sermon_id = ?")
      .bind(sermonId)
      .first<{ p: number | null }>();
    await db.batch([
      db
        .prepare("INSERT INTO sermon_notes (id, sermon_id, text, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(id, sermonId, text, Number(last?.p ?? 0) + 1, now, now),
      db.prepare("UPDATE sermons SET updated_at = ? WHERE id = ?").bind(now, sermonId),
    ]);
    const row = await one(db, id);
    return Response.json({ note: row ? toNote(row) : null });
  } catch (e) {
    console.error("sermon-notes POST:", e);
    return Response.json({ error: "Couldn't save that note." }, { status: 500 });
  }
}

// Edit a note's text, or bring a deleted one back ({ restore: true }).
export async function PATCH(req: Request) {
  const db = await open();
  if (db instanceof Response) return db;
  const body = (await req.json().catch(() => ({}))) as { id?: unknown; text?: unknown; restore?: unknown };
  const id = typeof body.id === "string" ? body.id : "";
  const now = Date.now();
  try {
    const before = id ? await one(db, id) : null;
    if (!before) return Response.json({ error: "Note not found." }, { status: 404 });
    if (body.restore === true) {
      await db.prepare("UPDATE sermon_notes SET deleted_at = NULL, updated_at = ? WHERE id = ?").bind(now, id).run();
    } else {
      const text = typeof body.text === "string" ? body.text.trim().slice(0, MAX_TEXT) : "";
      if (!text) return Response.json({ error: "A note can't be empty - delete it instead." }, { status: 400 });
      if (text !== before.text) {
        await db.batch([
          db.prepare("INSERT INTO sermon_note_versions (note_id, text, saved_at) VALUES (?, ?, ?)").bind(id, before.text, now),
          db.prepare("UPDATE sermon_notes SET text = ?, updated_at = ? WHERE id = ?").bind(text, now, id),
        ]);
      }
    }
    const row = await one(db, id);
    return Response.json({ note: row ? toNote(row) : null });
  } catch (e) {
    console.error("sermon-notes PATCH:", e);
    return Response.json({ error: "Couldn't save that." }, { status: 500 });
  }
}

// Moves a note to "Recently deleted" - never removes it.
export async function DELETE(req: Request) {
  const db = await open();
  if (db instanceof Response) return db;
  const id = new URL(req.url).searchParams.get("id") ?? "";
  const now = Date.now();
  try {
    await db.prepare("UPDATE sermon_notes SET deleted_at = ?, updated_at = ? WHERE id = ?").bind(now, now, id).run();
    const row = await one(db, id);
    return Response.json({ note: row ? toNote(row) : null });
  } catch (e) {
    console.error("sermon-notes DELETE:", e);
    return Response.json({ error: "Couldn't move that to Recently deleted." }, { status: 500 });
  }
}
