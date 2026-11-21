// Notes on the Reading page (table book_notes, see db/schema.sql), saved one
// by one like Study Notes - each on a chapter (or the whole book) and,
// optionally, one of the chapter's headings. Owner only (dashboard middleware).
//
// Never hard-deleted: DELETE sets deleted_at, PATCH { restore: true } brings
// a note back, and every edit keeps the earlier text in book_note_versions.
import { getDb, type D1Db } from "@/lib/analytics/store";
import { toBookNote, type NoteRow } from "@/lib/dashboard/reading";

export const dynamic = "force-dynamic";

const MAX_TEXT = 50_000;

async function open(): Promise<D1Db | Response> {
  const db = await getDb();
  if (!db) return Response.json({ error: "Storage isn't available here." }, { status: 503 });
  return db;
}

const one = (db: D1Db, id: string) => db.prepare("SELECT * FROM book_notes WHERE id = ?").bind(id).first<NoteRow>();
const cleanHeading = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 200) : null);

export async function POST(req: Request) {
  const db = await open();
  if (db instanceof Response) return db;
  const body = (await req.json().catch(() => ({}))) as { bookId?: unknown; chapterId?: unknown; heading?: unknown; text?: unknown };
  const bookId = typeof body.bookId === "string" ? body.bookId : "";
  const chapterId = typeof body.chapterId === "string" && body.chapterId ? body.chapterId : null;
  const text = typeof body.text === "string" ? body.text.trim().slice(0, MAX_TEXT) : "";
  if (!bookId) return Response.json({ error: "Which book?" }, { status: 400 });
  if (!text) return Response.json({ error: "Write something first." }, { status: 400 });
  const now = Date.now();
  const id = `n_${now.toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  try {
    const book = await db.prepare("SELECT id FROM books WHERE id = ?").bind(bookId).first<{ id: string }>();
    if (!book) return Response.json({ error: "Book not found." }, { status: 404 });
    const last = await db.prepare("SELECT MAX(position) AS p FROM book_notes WHERE book_id = ?").bind(bookId).first<{ p: number | null }>();
    await db.batch([
      db
        .prepare("INSERT INTO book_notes (id, book_id, chapter_id, heading, text, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(id, bookId, chapterId, cleanHeading(body.heading), text, Number(last?.p ?? 0) + 1, now, now),
      db.prepare("UPDATE books SET updated_at = ? WHERE id = ?").bind(now, bookId),
    ]);
    const row = await one(db, id);
    return Response.json({ note: row ? toBookNote(row) : null });
  } catch (e) {
    console.error("reading-notes POST:", e);
    return Response.json({ error: "Couldn't save that note." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const db = await open();
  if (db instanceof Response) return db;
  const body = (await req.json().catch(() => ({}))) as { id?: unknown; text?: unknown; heading?: unknown; restore?: unknown };
  const id = typeof body.id === "string" ? body.id : "";
  const now = Date.now();
  try {
    const before = id ? await one(db, id) : null;
    if (!before) return Response.json({ error: "Note not found." }, { status: 404 });
    if (body.restore === true) {
      await db.prepare("UPDATE book_notes SET deleted_at = NULL, updated_at = ? WHERE id = ?").bind(now, id).run();
    } else {
      const text = typeof body.text === "string" ? body.text.trim().slice(0, MAX_TEXT) : before.text;
      if (!text) return Response.json({ error: "A note can't be empty - delete it instead." }, { status: 400 });
      const heading = body.heading === undefined ? before.heading : cleanHeading(body.heading);
      if (text !== before.text || heading !== before.heading) {
        await db.batch([
          db.prepare("INSERT INTO book_note_versions (note_id, text, heading, saved_at) VALUES (?, ?, ?, ?)").bind(id, before.text, before.heading, now),
          db.prepare("UPDATE book_notes SET text = ?, heading = ?, updated_at = ? WHERE id = ?").bind(text, heading, now, id),
        ]);
      }
    }
    const row = await one(db, id);
    return Response.json({ note: row ? toBookNote(row) : null });
  } catch (e) {
    console.error("reading-notes PATCH:", e);
    return Response.json({ error: "Couldn't save that." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const db = await open();
  if (db instanceof Response) return db;
  const id = new URL(req.url).searchParams.get("id") ?? "";
  const now = Date.now();
  try {
    await db.prepare("UPDATE book_notes SET deleted_at = ?, updated_at = ? WHERE id = ?").bind(now, now, id).run();
    const row = await one(db, id);
    return Response.json({ note: row ? toBookNote(row) : null });
  } catch (e) {
    console.error("reading-notes DELETE:", e);
    return Response.json({ error: "Couldn't move that to Recently deleted." }, { status: 500 });
  }
}
