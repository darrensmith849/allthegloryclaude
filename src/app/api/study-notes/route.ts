/**
 * Bible study notes for the private dashboard - one D1 row per note
 * (table study_notes, see db/schema.sql) so the list can grow without the
 * size limits of the dashboard's single state blob.
 *
 *   GET                                   -> { notes }  (order written, incl. deleted)
 *   POST   { note }                       -> { note }   new note, next seq
 *   POST   { import: [...] }              -> { notes }  many, in the given order
 *   PATCH  { id, ...note }                -> { note }   edit one note
 *   PATCH  { id, restore: true }          -> { note }   back from Recently deleted
 *   PATCH  { moves: [{ id, position }] }  -> { notes }  reorder
 *   PATCH  { ids: [...], day?, page? }    -> { notes }  set day / page on many
 *   DELETE ?id=...                        -> 204        to Recently deleted
 *
 * Nothing is ever removed: DELETE only marks a note deleted (it can be
 * restored), and every edit first copies the old version into
 * study_note_versions.
 */
import { getDb, type D1Db } from "@/lib/analytics/store";
import { isDay, type NoteInput, type StudyNote } from "@/lib/dashboard/notes";

export const dynamic = "force-dynamic";

const MAX_TEXT = 20_000;
const MAX_IMPORT = 5_000;

interface Row {
  id: string;
  day: string | null;
  page: number | null;
  seq: number;
  position: number | null;
  deleted_at: number | null;
  book: number | null;
  chapter: number | null;
  verse: number | null;
  verse_end: number | null;
  text: string;
  created_at: number;
  updated_at: number;
}

const toNote = (r: Row): StudyNote => ({
  id: r.id,
  day: r.day,
  page: r.page,
  seq: r.seq,
  position: r.position ?? r.seq,
  deletedAt: r.deleted_at ?? null,
  book: r.book,
  chapter: r.chapter,
  verse: r.verse,
  verseEnd: r.verse_end,
  text: r.text,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const int = (v: unknown, min: number, max: number): number | null => {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v) : NaN;
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
};
const page = (v: unknown) => int(v, 0, 100_000);
const day = (v: unknown) => (isDay(v) ? v : null);

// Validates one note; null if there's no text to save.
function clean(input: Partial<NoteInput> | undefined): NoteInput | null {
  const text = String(input?.text ?? "").trim().slice(0, MAX_TEXT);
  if (!text) return null;
  const book = int(input?.book, 1, 66);
  const chapter = book ? int(input?.chapter, 1, 150) : null;
  const verse = chapter ? int(input?.verse, 1, 200) : null;
  const verseEnd = verse ? int(input?.verseEnd, verse, 200) : null;
  return { day: day(input?.day), page: page(input?.page), book, chapter, verse, verseEnd, text };
}

const unavailable = () =>
  Response.json({ error: "Notes storage isn't available here." }, { status: 503 });

async function nextSeq(db: D1Db): Promise<number> {
  const row = await db.prepare("SELECT COALESCE(MAX(seq), 0) AS seq FROM study_notes").first<{ seq: number }>();
  return Number(row?.seq ?? 0) + 1;
}

function insert(db: D1Db, n: NoteInput, seq: number, now: number): { stmt: ReturnType<D1Db["prepare"]>; note: StudyNote } {
  const note: StudyNote = {
    id: crypto.randomUUID(),
    seq,
    position: seq,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
    ...n,
  };
  const stmt = db
    .prepare(
      "INSERT INTO study_notes (id, day, page, seq, position, book, chapter, verse, verse_end, text, created_at, updated_at) " +
        "VALUES (?1, ?2, ?3, ?4, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?10)",
    )
    .bind(note.id, n.day, n.page, seq, n.book, n.chapter, n.verse, n.verseEnd, n.text, now);
  return { stmt, note };
}

// Copies a note's current content into study_note_versions before it changes.
const keepVersion = (db: D1Db, id: string, now: number) =>
  db
    .prepare(
      "INSERT INTO study_note_versions (note_id, day, page, book, chapter, verse, verse_end, text, saved_at) " +
        "SELECT id, day, page, book, chapter, verse, verse_end, text, ?2 FROM study_notes WHERE id=?1",
    )
    .bind(id, now);

async function fetchNotes(db: D1Db, ids: string[]): Promise<StudyNote[]> {
  if (!ids.length) return [];
  const { results } = await db
    .prepare(`SELECT * FROM study_notes WHERE id IN (${ids.map((_, i) => `?${i + 1}`).join(",")})`)
    .bind(...ids)
    .all<Row>();
  return results.map(toNote);
}

export async function GET() {
  const db = await getDb();
  if (!db) return unavailable();
  try {
    const { results } = await db.prepare("SELECT * FROM study_notes ORDER BY seq").all<Row>();
    return Response.json({ notes: results.map(toNote) }, { headers: { "cache-control": "no-store" } });
  } catch (e) {
    console.error("study-notes GET:", e);
    return Response.json({ error: "Couldn't load your notes." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const db = await getDb();
  if (!db) return unavailable();
  const body = (await req.json().catch(() => ({}))) as { note?: Partial<NoteInput>; import?: Partial<NoteInput>[] };
  try {
    const now = Date.now();
    let seq = await nextSeq(db);
    if (Array.isArray(body.import)) {
      const inputs = body.import.slice(0, MAX_IMPORT).map(clean).filter((n): n is NoteInput => Boolean(n));
      const made = inputs.map((n) => insert(db, n, seq++, now));
      for (let i = 0; i < made.length; i += 50) await db.batch(made.slice(i, i + 50).map((m) => m.stmt));
      return Response.json({ notes: made.map((m) => m.note) });
    }
    const n = clean(body.note);
    if (!n) return Response.json({ error: "Write something first." }, { status: 400 });
    const { stmt, note } = insert(db, n, seq, now);
    await stmt.run();
    return Response.json({ note });
  } catch (e) {
    console.error("study-notes POST:", e);
    return Response.json({ error: "Couldn't save that note." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const db = await getDb();
  if (!db) return unavailable();
  const body = (await req.json().catch(() => ({}))) as Partial<NoteInput> & {
    id?: string;
    ids?: unknown;
    moves?: unknown;
    restore?: unknown;
  };
  const now = Date.now();
  try {
    // Reorder: new positions for a few notes.
    if (Array.isArray(body.moves)) {
      const moves = body.moves
        .map((m) => m as { id?: unknown; position?: unknown })
        .filter((m) => typeof m.id === "string" && typeof m.position === "number" && Number.isFinite(m.position))
        .slice(0, 500) as { id: string; position: number }[];
      if (!moves.length) return Response.json({ error: "Nothing to move." }, { status: 400 });
      await db.batch(
        moves.map((m) =>
          db.prepare("UPDATE study_notes SET position=?2, updated_at=?3 WHERE id=?1").bind(m.id, m.position, now),
        ),
      );
      return Response.json({ notes: await fetchNotes(db, moves.map((m) => m.id)) });
    }

    // Restore from Recently deleted.
    if (body.restore === true && typeof body.id === "string") {
      await db.prepare("UPDATE study_notes SET deleted_at=NULL, updated_at=?2 WHERE id=?1").bind(body.id, now).run();
      const [note] = await fetchNotes(db, [body.id]);
      return note ? Response.json({ note }) : Response.json({ error: "Note not found." }, { status: 404 });
    }

    // Set the day and/or page on many notes at once.
    if (Array.isArray(body.ids)) {
      const ids = body.ids.filter((x): x is string => typeof x === "string").slice(0, 2_000);
      const sets: string[] = [];
      const values: unknown[] = [];
      if ("day" in body) {
        values.push(day(body.day));
        sets.push(`day=?${values.length + 1}`);
      }
      if ("page" in body) {
        values.push(page(body.page));
        sets.push(`page=?${values.length + 1}`);
      }
      if (!ids.length || !sets.length) return Response.json({ error: "Nothing to change." }, { status: 400 });
      values.push(now);
      sets.push(`updated_at=?${values.length + 1}`);
      await db.batch(
        ids.flatMap((id) => [
          keepVersion(db, id, now),
          db.prepare(`UPDATE study_notes SET ${sets.join(", ")} WHERE id=?1`).bind(id, ...values),
        ]),
      );
      return Response.json({ notes: await fetchNotes(db, ids) });
    }

    // Edit one note.
    const id = String(body.id ?? "");
    const n = clean(body);
    if (!id || !n) return Response.json({ error: "Nothing to save." }, { status: 400 });
    await db.batch([
      keepVersion(db, id, now),
      db
        .prepare(
          "UPDATE study_notes SET day=?2, page=?3, book=?4, chapter=?5, verse=?6, verse_end=?7, text=?8, updated_at=?9 WHERE id=?1",
        )
        .bind(id, n.day, n.page, n.book, n.chapter, n.verse, n.verseEnd, n.text, now),
    ]);
    const [note] = await fetchNotes(db, [id]);
    return note ? Response.json({ note }) : Response.json({ error: "Note not found." }, { status: 404 });
  } catch (e) {
    console.error("study-notes PATCH:", e);
    return Response.json({ error: "Couldn't save that change." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const db = await getDb();
  if (!db) return unavailable();
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!id) return Response.json({ error: "Which note?" }, { status: 400 });
  try {
    await db.prepare("UPDATE study_notes SET deleted_at=?2, updated_at=?2 WHERE id=?1").bind(id, Date.now()).run();
    return new Response(null, { status: 204 });
  } catch (e) {
    console.error("study-notes DELETE:", e);
    return Response.json({ error: "Couldn't delete that note." }, { status: 500 });
  }
}
