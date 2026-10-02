/**
 * Bible study notes for the private dashboard - one D1 row per note
 * (table study_notes, see db/schema.sql) so the list can grow without the
 * size limits of the dashboard's single state blob.
 *
 *   GET                         -> { notes: StudyNote[] }  (order written)
 *   POST   { note }             -> { note }       new note, next seq
 *   POST   { import: [...] }    -> { notes }      many, in the given order
 *   PATCH  { id, ...fields }    -> { note }
 *   DELETE ?id=...              -> 204
 */
import { getDb, type D1Db } from "@/lib/analytics/store";
import type { NoteInput, StudyNote } from "@/lib/dashboard/notes";

export const dynamic = "force-dynamic";

const MAX_TEXT = 20_000;
const MAX_IMPORT = 5_000;

interface Row {
  id: string;
  page: number | null;
  seq: number;
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
  page: r.page,
  seq: r.seq,
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

// Validates one note; null if there's no text to save.
function clean(input: Partial<NoteInput> | undefined): NoteInput | null {
  const text = String(input?.text ?? "").trim().slice(0, MAX_TEXT);
  if (!text) return null;
  const book = int(input?.book, 1, 66);
  const chapter = book ? int(input?.chapter, 1, 150) : null;
  const verse = chapter ? int(input?.verse, 1, 200) : null;
  const verseEnd = verse ? int(input?.verseEnd, verse, 200) : null;
  return { page: int(input?.page, 0, 100_000), book, chapter, verse, verseEnd, text };
}

const unavailable = () =>
  Response.json({ error: "Notes storage isn't available here." }, { status: 503 });

async function nextSeq(db: D1Db): Promise<number> {
  const row = await db.prepare("SELECT COALESCE(MAX(seq), 0) AS seq FROM study_notes").first<{ seq: number }>();
  return Number(row?.seq ?? 0) + 1;
}

function insert(db: D1Db, n: NoteInput, seq: number, now: number): { stmt: ReturnType<D1Db["prepare"]>; note: StudyNote } {
  const note: StudyNote = { id: crypto.randomUUID(), seq, createdAt: now, updatedAt: now, ...n };
  const stmt = db
    .prepare(
      "INSERT INTO study_notes (id, page, seq, book, chapter, verse, verse_end, text, created_at, updated_at) " +
        "VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
    )
    .bind(note.id, n.page, seq, n.book, n.chapter, n.verse, n.verseEnd, n.text, now, now);
  return { stmt, note };
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
  const body = (await req.json().catch(() => ({}))) as Partial<NoteInput> & { id?: string };
  const id = String(body.id ?? "");
  const n = clean(body);
  if (!id || !n) return Response.json({ error: "Nothing to save." }, { status: 400 });
  try {
    const now = Date.now();
    await db
      .prepare(
        "UPDATE study_notes SET page=?2, book=?3, chapter=?4, verse=?5, verse_end=?6, text=?7, updated_at=?8 WHERE id=?1",
      )
      .bind(id, n.page, n.book, n.chapter, n.verse, n.verseEnd, n.text, now)
      .run();
    const row = await db.prepare("SELECT * FROM study_notes WHERE id=?1").bind(id).first<Row>();
    return row ? Response.json({ note: toNote(row) }) : Response.json({ error: "Note not found." }, { status: 404 });
  } catch (e) {
    console.error("study-notes PATCH:", e);
    return Response.json({ error: "Couldn't save that note." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const db = await getDb();
  if (!db) return unavailable();
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!id) return Response.json({ error: "Which note?" }, { status: 400 });
  try {
    await db.prepare("DELETE FROM study_notes WHERE id=?1").bind(id).run();
    return new Response(null, { status: 204 });
  } catch (e) {
    console.error("study-notes DELETE:", e);
    return Response.json({ error: "Couldn't delete that note." }, { status: 500 });
  }
}
