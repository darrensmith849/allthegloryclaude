// The owner's books and their chapters (tables books, book_chapters - see
// db/schema.sql). Notes are changed through /api/reading-notes. The dashboard
// middleware requires the admin session (owner only).
//
// Never hard-deleted: DELETE sets deleted_at, PATCH { restore: true } brings
// it back, and chapter edits keep the earlier version in book_chapter_versions.
// The first time there are no books at all, The Personal MBA is added with
// its chapters and headings (src/lib/dashboard/reading-seed.ts).
import { getDb, type D1Db } from "@/lib/analytics/store";
import { toBookNote, toChapter, type Book, type ChapterRow, type NoteRow } from "@/lib/dashboard/reading";
import { PERSONAL_MBA } from "@/lib/dashboard/reading-seed";

export const dynamic = "force-dynamic";

interface BookRow {
  id: string;
  title: string;
  author: string;
  subtitle: string;
  started_on: string | null;
  finished_on: string | null;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

const uid = (p: string) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : undefined);
const day = (v: unknown) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : v === null ? null : undefined);

async function open(): Promise<D1Db | Response> {
  const db = await getDb();
  if (!db) return Response.json({ error: "Storage isn't available here." }, { status: 503 });
  return db;
}

function toBook(r: BookRow, chapters: ChapterRow[], notes: NoteRow[]): Book {
  return {
    id: r.id,
    title: r.title,
    author: r.author,
    subtitle: r.subtitle,
    startedOn: r.started_on,
    finishedOn: r.finished_on,
    createdAt: Number(r.created_at),
    updatedAt: Number(r.updated_at),
    deletedAt: r.deleted_at == null ? null : Number(r.deleted_at),
    chapters: chapters.map(toChapter),
    notes: notes.map(toBookNote),
  };
}

async function seed(db: D1Db): Promise<void> {
  const now = Date.now();
  const bookId = "b_personal_mba";
  const today = new Date(now + 2 * 3600 * 1000).toISOString().slice(0, 10);
  await db.batch([
    db
      .prepare(
        "INSERT OR IGNORE INTO books (id, title, author, subtitle, started_on, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(bookId, PERSONAL_MBA.title, PERSONAL_MBA.author, PERSONAL_MBA.subtitle, today, now, now),
    ...PERSONAL_MBA.chapters.map((c, i) =>
      db
        .prepare(
          "INSERT OR IGNORE INTO book_chapters (id, book_id, position, kind, title, headings, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(`${bookId}_c${i}`, bookId, i + 1, c.kind, c.title, JSON.stringify(c.headings), now),
    ),
  ]);
}

async function all(db: D1Db): Promise<Book[]> {
  const [books, chapters, notes] = await Promise.all([
    db.prepare("SELECT * FROM books ORDER BY created_at DESC").all<BookRow>(),
    db.prepare("SELECT * FROM book_chapters ORDER BY position").all<ChapterRow>(),
    db.prepare("SELECT * FROM book_notes ORDER BY position, created_at").all<NoteRow>(),
  ]);
  const c = chapters.results ?? [];
  const n = notes.results ?? [];
  return (books.results ?? []).map((b) => toBook(b, c.filter((x) => x.book_id === b.id), n.filter((x) => x.book_id === b.id)));
}

async function one(db: D1Db, id: string): Promise<Book | null> {
  const b = await db.prepare("SELECT * FROM books WHERE id = ?").bind(id).first<BookRow>();
  if (!b) return null;
  const [chapters, notes] = await Promise.all([
    db.prepare("SELECT * FROM book_chapters WHERE book_id = ? ORDER BY position").bind(id).all<ChapterRow>(),
    db.prepare("SELECT * FROM book_notes WHERE book_id = ? ORDER BY position, created_at").bind(id).all<NoteRow>(),
  ]);
  return toBook(b, chapters.results ?? [], notes.results ?? []);
}

export async function GET() {
  const db = await open();
  if (db instanceof Response) return db;
  try {
    const count = await db.prepare("SELECT COUNT(*) AS n FROM books").first<{ n: number }>();
    if (!Number(count?.n ?? 0)) await seed(db);
    return Response.json({ books: await all(db) }, { headers: { "cache-control": "no-store" } });
  } catch (e) {
    console.error("reading GET:", e);
    return Response.json({ error: "Couldn't load your books." }, { status: 500 });
  }
}

// { kind: "book", title, author } adds a book; { kind: "chapter", bookId, title } adds a chapter at the end.
export async function POST(req: Request) {
  const db = await open();
  if (db instanceof Response) return db;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const now = Date.now();
  try {
    if (body.kind === "chapter") {
      const bookId = str(body.bookId, 60) ?? "";
      const title = (str(body.title, 200) ?? "").trim();
      if (!bookId || !title) return Response.json({ error: "Give the chapter a title." }, { status: 400 });
      const last = await db.prepare("SELECT MAX(position) AS p FROM book_chapters WHERE book_id = ?").bind(bookId).first<{ p: number | null }>();
      await db
        .prepare("INSERT INTO book_chapters (id, book_id, position, kind, title, headings, updated_at) VALUES (?, ?, ?, 'chapter', ?, '[]', ?)")
        .bind(uid("c"), bookId, Number(last?.p ?? 0) + 1, title, now)
        .run();
      return Response.json({ book: await one(db, bookId) });
    }
    const id = uid("b");
    const today = new Date(now + 2 * 3600 * 1000).toISOString().slice(0, 10);
    await db
      .prepare("INSERT INTO books (id, title, author, subtitle, started_on, created_at, updated_at) VALUES (?, ?, ?, '', ?, ?, ?)")
      .bind(id, (str(body.title, 300) ?? "").trim(), (str(body.author, 200) ?? "").trim(), today, now, now)
      .run();
    return Response.json({ book: await one(db, id) });
  } catch (e) {
    console.error("reading POST:", e);
    return Response.json({ error: "Couldn't add that." }, { status: 500 });
  }
}

// { kind: "book", id, title?, author?, subtitle?, startedOn?, finishedOn?, restore? }
// { kind: "chapter", id, title?, takeaway?, headings?, read?, restore? }
export async function PATCH(req: Request) {
  const db = await open();
  if (db instanceof Response) return db;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const id = typeof body.id === "string" ? body.id : "";
  const now = Date.now();
  try {
    if (body.kind === "chapter") {
      const before = await db.prepare("SELECT * FROM book_chapters WHERE id = ?").bind(id).first<ChapterRow>();
      if (!before) return Response.json({ error: "Chapter not found." }, { status: 404 });
      const sets: string[] = [];
      const args: unknown[] = [];
      const put = (col: string, v: unknown) => {
        if (v === undefined) return;
        sets.push(`${col} = ?`);
        args.push(v);
      };
      if (body.restore === true) put("deleted_at", null);
      put("title", str(body.title, 200));
      put("takeaway", str(body.takeaway, 5000));
      if (Array.isArray(body.headings)) {
        put("headings", JSON.stringify(body.headings.filter((h) => typeof h === "string").map((h) => (h as string).slice(0, 200)).slice(0, 300)));
      }
      if (typeof body.read === "boolean") put("read_at", body.read ? now : null);
      if (!sets.length) return Response.json({ error: "Nothing to save." }, { status: 400 });
      // Keep the earlier version - at most one every 15 minutes, so typing a takeaway doesn't flood it.
      const last = await db.prepare("SELECT MAX(saved_at) AS t FROM book_chapter_versions WHERE chapter_id = ?").bind(id).first<{ t: number | null }>();
      const stmts = [];
      if (!last?.t || now - Number(last.t) > 15 * 60 * 1000) {
        stmts.push(db.prepare("INSERT INTO book_chapter_versions (chapter_id, json, saved_at) VALUES (?, ?, ?)").bind(id, JSON.stringify(before), now));
      }
      stmts.push(db.prepare(`UPDATE book_chapters SET ${sets.join(", ")}, updated_at = ? WHERE id = ?`).bind(...args, now, id));
      await db.batch(stmts);
      return Response.json({ book: await one(db, before.book_id) });
    }
    const before = await db.prepare("SELECT id FROM books WHERE id = ?").bind(id).first<{ id: string }>();
    if (!before) return Response.json({ error: "Book not found." }, { status: 404 });
    const sets: string[] = [];
    const args: unknown[] = [];
    const put = (col: string, v: unknown) => {
      if (v === undefined) return;
      sets.push(`${col} = ?`);
      args.push(v);
    };
    if (body.restore === true) put("deleted_at", null);
    put("title", str(body.title, 300));
    put("author", str(body.author, 200));
    put("subtitle", str(body.subtitle, 300));
    put("started_on", day(body.startedOn));
    put("finished_on", day(body.finishedOn));
    if (!sets.length) return Response.json({ error: "Nothing to save." }, { status: 400 });
    await db.prepare(`UPDATE books SET ${sets.join(", ")}, updated_at = ? WHERE id = ?`).bind(...args, now, id).run();
    return Response.json({ book: await one(db, id) });
  } catch (e) {
    console.error("reading PATCH:", e);
    return Response.json({ error: "Couldn't save that." }, { status: 500 });
  }
}

// ?kind=book|chapter&id= - moves it to "Recently deleted", never removes it.
export async function DELETE(req: Request) {
  const db = await open();
  if (db instanceof Response) return db;
  const url = new URL(req.url);
  const id = url.searchParams.get("id") ?? "";
  const kind = url.searchParams.get("kind") === "chapter" ? "chapter" : "book";
  const now = Date.now();
  try {
    if (kind === "chapter") {
      const c = await db.prepare("SELECT book_id FROM book_chapters WHERE id = ?").bind(id).first<{ book_id: string }>();
      if (!c) return Response.json({ error: "Chapter not found." }, { status: 404 });
      await db.prepare("UPDATE book_chapters SET deleted_at = ?, updated_at = ? WHERE id = ?").bind(now, now, id).run();
      return Response.json({ book: await one(db, c.book_id) });
    }
    await db.prepare("UPDATE books SET deleted_at = ?, updated_at = ? WHERE id = ?").bind(now, now, id).run();
    return Response.json({ book: await one(db, id) });
  } catch (e) {
    console.error("reading DELETE:", e);
    return Response.json({ error: "Couldn't move that to Recently deleted." }, { status: 500 });
  }
}
