/**
 * Bible study notes - one D1 row per note, for the owner (study_notes) or a
 * member (member_notes), see ./scope.ts.
 *
 *   GET    [?since=ms]                    -> { notes, syncedAt }  (incl. deleted; only
 *                                            notes changed since `since` when given)
 *   POST   { note }                       -> { note }   new note, next seq
 *   POST   { import: [...] }              -> { notes }  many, in the given order
 *   PATCH  { id, ...note }                -> { note }   edit one note
 *   PATCH  { id, restore: true }          -> { note }   back from Recently deleted
 *   PATCH  { id, private: boolean }       -> { note }   keep out of the shared study
 *   PATCH  { moves: [{ id, position }] }  -> { notes }  reorder
 *   PATCH  { ids: [...], day?, page? }    -> { notes }  set day / page on many
 *   DELETE ?id=...                        -> 204        to Recently deleted
 *
 * Nothing is ever removed here: DELETE only marks a note deleted (it can be
 * restored), and every edit first copies the old version into the versions
 * table.
 */
import { getDb, type D1Db } from "@/lib/analytics/store";
import { isDay, type NoteInput, type StudyNote } from "@/lib/dashboard/notes";
import { andMine, mine, mineArgs, pre, preQ, type Scope, type ScopeOf } from "./scope";

const MAX_TEXT = 20_000;
const MAX_IMPORT = 5_000;
const MAX_MEMBER_NOTES = 50_000;

interface Row {
  id: string;
  day: string | null;
  page: number | null;
  seq: number;
  position: number | null;
  deleted_at: number | null;
  private: number | null;
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
  private: Boolean(r.private),
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

const unavailable = () => Response.json({ error: "Notes storage isn't available here." }, { status: 503 });

async function nextSeq(db: D1Db, s: Scope): Promise<number> {
  const row = await db
    .prepare(`SELECT COALESCE(MAX(seq), 0) AS seq FROM ${s.notes} WHERE ${mine(s)}`)
    .bind(...mineArgs(s))
    .first<{ seq: number }>();
  return Number(row?.seq ?? 0) + 1;
}

function insert(db: D1Db, s: Scope, n: NoteInput, seq: number, now: number) {
  const note: StudyNote = {
    id: crypto.randomUUID(),
    seq,
    position: seq,
    deletedAt: null,
    private: false,
    createdAt: now,
    updatedAt: now,
    ...n,
  };
  const stmt = db
    .prepare(
      `INSERT INTO ${s.notes} (${pre(s)}id, day, page, seq, position, book, chapter, verse, verse_end, text, created_at, updated_at) ` +
        `VALUES (${preQ(s)}?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(...mineArgs(s), note.id, n.day, n.page, seq, seq, n.book, n.chapter, n.verse, n.verseEnd, n.text, now, now);
  return { stmt, note };
}

// Copies a note's current content into the versions table before it changes.
const keepVersion = (db: D1Db, s: Scope, id: string, now: number) =>
  db
    .prepare(
      `INSERT INTO ${s.noteVersions} (${pre(s)}note_id, day, page, book, chapter, verse, verse_end, text, saved_at) ` +
        `SELECT ${pre(s)}id, day, page, book, chapter, verse, verse_end, text, ? FROM ${s.notes} WHERE id = ?${andMine(s)}`,
    )
    .bind(now, id, ...mineArgs(s));

// In groups of 80 - D1 takes at most 100 bound values per query.
async function fetchNotes(db: D1Db, s: Scope, ids: string[]): Promise<StudyNote[]> {
  const out: StudyNote[] = [];
  for (let i = 0; i < ids.length; i += 80) {
    const part = ids.slice(i, i + 80);
    const { results } = await db
      .prepare(`SELECT * FROM ${s.notes} WHERE id IN (${part.map(() => "?").join(",")})${andMine(s)}`)
      .bind(...part, ...mineArgs(s))
      .all<Row>();
    out.push(...results.map(toNote));
  }
  return out;
}

export function notesApi(scopeOf: ScopeOf) {
  async function open(req: Request): Promise<{ db: D1Db; s: Scope } | Response> {
    const s = await scopeOf(req);
    if (s instanceof Response) return s;
    const db = await getDb();
    return db ? { db, s } : unavailable();
  }

  async function GET(req: Request) {
    const ctx = await open(req);
    if (ctx instanceof Response) return ctx;
    const { db, s } = ctx;
    try {
      const syncedAt = Date.now();
      const since = Number(new URL(req.url).searchParams.get("since")) || 0;
      const { results } = since
        ? await db
            .prepare(`SELECT * FROM ${s.notes} WHERE ${mine(s)} AND updated_at > ? ORDER BY seq`)
            .bind(...mineArgs(s), since)
            .all<Row>()
        : await db
            .prepare(`SELECT * FROM ${s.notes} WHERE ${mine(s)} ORDER BY seq`)
            .bind(...mineArgs(s))
            .all<Row>();
      return Response.json({ notes: results.map(toNote), syncedAt }, { headers: { "cache-control": "no-store" } });
    } catch (e) {
      console.error("notes GET:", e);
      return Response.json({ error: "Couldn't load your notes." }, { status: 500 });
    }
  }

  async function POST(req: Request) {
    const ctx = await open(req);
    if (ctx instanceof Response) return ctx;
    const { db, s } = ctx;
    const body = (await req.json().catch(() => ({}))) as { note?: Partial<NoteInput>; import?: Partial<NoteInput>[] };
    try {
      const now = Date.now();
      let seq = await nextSeq(db, s);
      const adding = Array.isArray(body.import) ? Math.min(body.import.length, MAX_IMPORT) : 1;
      if (s.member) {
        const row = await db
          .prepare(`SELECT COUNT(*) AS n FROM ${s.notes} WHERE ${mine(s)}`)
          .bind(...mineArgs(s))
          .first<{ n: number }>();
        if (Number(row?.n ?? 0) + adding > MAX_MEMBER_NOTES) {
          return Response.json({ error: "Your journal is full - get in touch and we'll make room." }, { status: 413 });
        }
      }
      if (Array.isArray(body.import)) {
        const inputs = body.import.slice(0, MAX_IMPORT).map(clean).filter((n): n is NoteInput => Boolean(n));
        const made = inputs.map((n) => insert(db, s, n, seq++, now));
        for (let i = 0; i < made.length; i += 50) await db.batch(made.slice(i, i + 50).map((m) => m.stmt));
        return Response.json({ notes: made.map((m) => m.note) });
      }
      const n = clean(body.note);
      if (!n) return Response.json({ error: "Write something first." }, { status: 400 });
      const { stmt, note } = insert(db, s, n, seq, now);
      await stmt.run();
      return Response.json({ note });
    } catch (e) {
      console.error("notes POST:", e);
      return Response.json({ error: "Couldn't save that note." }, { status: 500 });
    }
  }

  async function PATCH(req: Request) {
    const ctx = await open(req);
    if (ctx instanceof Response) return ctx;
    const { db, s } = ctx;
    const body = (await req.json().catch(() => ({}))) as Partial<NoteInput> & {
      id?: string;
      ids?: unknown;
      moves?: unknown;
      restore?: unknown;
      private?: unknown;
    };
    const now = Date.now();
    const notFound = () => Response.json({ error: "Note not found." }, { status: 404 });
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
            db
              .prepare(`UPDATE ${s.notes} SET position = ?, updated_at = ? WHERE id = ?${andMine(s)}`)
              .bind(m.position, now, m.id, ...mineArgs(s)),
          ),
        );
        return Response.json({ notes: await fetchNotes(db, s, moves.map((m) => m.id)) });
      }

      // Restore from Recently deleted.
      if (body.restore === true && typeof body.id === "string") {
        await db
          .prepare(`UPDATE ${s.notes} SET deleted_at = NULL, updated_at = ? WHERE id = ?${andMine(s)}`)
          .bind(now, body.id, ...mineArgs(s))
          .run();
        const [note] = await fetchNotes(db, s, [body.id]);
        return note ? Response.json({ note }) : notFound();
      }

      // Keep a note out of the shared study (or let it back in).
      if (typeof body.private === "boolean" && typeof body.id === "string" && !("text" in body)) {
        await db
          .prepare(`UPDATE ${s.notes} SET private = ?, updated_at = ? WHERE id = ?${andMine(s)}`)
          .bind(body.private ? 1 : 0, now, body.id, ...mineArgs(s))
          .run();
        const [note] = await fetchNotes(db, s, [body.id]);
        return note ? Response.json({ note }) : notFound();
      }

      // Set the day and/or page on many notes at once.
      if (Array.isArray(body.ids)) {
        const ids = body.ids.filter((x): x is string => typeof x === "string").slice(0, 2_000);
        const sets: string[] = [];
        const values: unknown[] = [];
        if ("day" in body) {
          sets.push("day = ?");
          values.push(day(body.day));
        }
        if ("page" in body) {
          sets.push("page = ?");
          values.push(page(body.page));
        }
        if (!ids.length || !sets.length) return Response.json({ error: "Nothing to change." }, { status: 400 });
        sets.push("updated_at = ?");
        values.push(now);
        await db.batch(
          ids.flatMap((id) => [
            keepVersion(db, s, id, now),
            db
              .prepare(`UPDATE ${s.notes} SET ${sets.join(", ")} WHERE id = ?${andMine(s)}`)
              .bind(...values, id, ...mineArgs(s)),
          ]),
        );
        return Response.json({ notes: await fetchNotes(db, s, ids) });
      }

      // Edit one note.
      const id = String(body.id ?? "");
      const n = clean(body);
      if (!id || !n) return Response.json({ error: "Nothing to save." }, { status: 400 });
      await db.batch([
        keepVersion(db, s, id, now),
        db
          .prepare(
            `UPDATE ${s.notes} SET day = ?, page = ?, book = ?, chapter = ?, verse = ?, verse_end = ?, text = ?, updated_at = ? ` +
              `WHERE id = ?${andMine(s)}`,
          )
          .bind(n.day, n.page, n.book, n.chapter, n.verse, n.verseEnd, n.text, now, id, ...mineArgs(s)),
      ]);
      const [note] = await fetchNotes(db, s, [id]);
      return note ? Response.json({ note }) : notFound();
    } catch (e) {
      console.error("notes PATCH:", e);
      return Response.json({ error: "Couldn't save that change." }, { status: 500 });
    }
  }

  async function DELETE(req: Request) {
    const ctx = await open(req);
    if (ctx instanceof Response) return ctx;
    const { db, s } = ctx;
    const id = new URL(req.url).searchParams.get("id") ?? "";
    if (!id) return Response.json({ error: "Which note?" }, { status: 400 });
    try {
      const now = Date.now();
      await db
        .prepare(`UPDATE ${s.notes} SET deleted_at = ?, updated_at = ? WHERE id = ?${andMine(s)}`)
        .bind(now, now, id, ...mineArgs(s))
        .run();
      return new Response(null, { status: 204 });
    } catch (e) {
      console.error("notes DELETE:", e);
      return Response.json({ error: "Couldn't delete that note." }, { status: 500 });
    }
  }

  return { GET, POST, PATCH, DELETE };
}
