// The owner's sermons (tables sermons + sermon_versions; each sermon's
// saved notes in sermon_notes, changed through /api/sermon-notes - see
// db/schema.sql). The dashboard middleware requires the admin session, so
// only Daniel reaches this - never the team or members.
//
// Nothing is ever hard-deleted: DELETE sets deleted_at ("Recently deleted",
// restorable with PATCH { restore: true }), and edits keep the earlier
// version in sermon_versions.
import { getDb, type D1Db } from "@/lib/analytics/store";
import { toNote, type NoteRow, type Sermon, type SermonItem, type SermonNote } from "@/lib/dashboard/sermons";

export const dynamic = "force-dynamic";

const VERSION_GAP_MS = 15 * 60 * 1000;
const MAX_NOTES = 200_000;
const MAX_ITEMS = 500;

interface Row {
  id: string;
  title: string;
  preacher: string;
  url: string;
  listened_on: string | null;
  notes: string;
  items: string;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

function toSermon(r: Row, noteList: SermonNote[] = []): Sermon {
  let items: SermonItem[] = [];
  try {
    const parsed = JSON.parse(r.items || "[]");
    if (Array.isArray(parsed)) items = parsed;
  } catch {
    /* keep [] */
  }
  return {
    id: r.id,
    title: r.title,
    preacher: r.preacher,
    url: r.url,
    listenedOn: r.listened_on,
    notes: r.notes,
    noteList,
    items,
    createdAt: Number(r.created_at),
    updatedAt: Number(r.updated_at),
    deletedAt: r.deleted_at == null ? null : Number(r.deleted_at),
  };
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : undefined);
const day = (v: unknown) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : v === null ? null : undefined);

function cleanItems(v: unknown): SermonItem[] | undefined {
  if (!Array.isArray(v)) return undefined;
  return v.slice(0, MAX_ITEMS).flatMap((x): SermonItem[] => {
    const i = x as Partial<SermonItem>;
    if (typeof i?.id !== "string" || (i.kind !== "verse" && i.kind !== "word")) return [];
    return [
      {
        id: i.id.slice(0, 40),
        kind: i.kind,
        ref: str(i.ref, 120),
        text: str(i.text, 20000), // a whole passage can be long
        word: str(i.word, 80),
        original: str(i.original, 160),
        strongs: str(i.strongs, 12),
        addedAt: typeof i.addedAt === "number" ? i.addedAt : Date.now(),
      },
    ];
  });
}

async function open(): Promise<D1Db | Response> {
  const db = await getDb();
  if (!db) return Response.json({ error: "Storage isn't available here." }, { status: 503 });
  return db;
}

async function fetchOne(db: D1Db, id: string): Promise<Row | null> {
  return db.prepare("SELECT * FROM sermons WHERE id = ?").bind(id).first<Row>();
}

/** One sermon with its notes, for the response after a change. */
async function full(db: D1Db, id: string): Promise<Sermon | null> {
  const row = await fetchOne(db, id);
  if (!row) return null;
  const notes = await db.prepare("SELECT * FROM sermon_notes WHERE sermon_id = ? ORDER BY position, created_at").bind(id).all<NoteRow>();
  return toSermon(row, (notes.results ?? []).map(toNote));
}

// The first version had one notes box per sermon. Move what's in it into a
// saved note (keeping a copy in sermon_versions), so it reads like the rest.
async function moveOldNotes(db: D1Db, rows: Row[], noteRows: NoteRow[]): Promise<boolean> {
  const has = new Set(noteRows.map((n) => n.sermon_id));
  const old = rows.filter((r) => r.notes.trim() && !has.has(r.id));
  if (!old.length) return false;
  const now = Date.now();
  await db.batch(
    old.flatMap((r) => [
      db.prepare("INSERT INTO sermon_versions (sermon_id, json, saved_at) VALUES (?, ?, ?)").bind(r.id, JSON.stringify(r), now),
      db
        .prepare("INSERT INTO sermon_notes (id, sermon_id, text, position, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)")
        .bind(`n_${r.id}_first`, r.id, r.notes.trim(), r.updated_at, now),
      db.prepare("UPDATE sermons SET notes = '' WHERE id = ?").bind(r.id),
    ]),
  );
  return true;
}

export async function GET() {
  const db = await open();
  if (db instanceof Response) return db;
  try {
    const order = "SELECT * FROM sermons ORDER BY COALESCE(listened_on, '') DESC, created_at DESC";
    const allNotes = "SELECT * FROM sermon_notes ORDER BY position, created_at";
    let [rows, notes] = await Promise.all([db.prepare(order).all<Row>(), db.prepare(allNotes).all<NoteRow>()]);
    if (await moveOldNotes(db, rows.results ?? [], notes.results ?? [])) {
      [rows, notes] = await Promise.all([db.prepare(order).all<Row>(), db.prepare(allNotes).all<NoteRow>()]);
    }
    const bySermon = new Map<string, SermonNote[]>();
    for (const n of notes.results ?? []) {
      const list = bySermon.get(n.sermon_id) ?? [];
      list.push(toNote(n));
      bySermon.set(n.sermon_id, list);
    }
    return Response.json(
      { sermons: (rows.results ?? []).map((r) => toSermon(r, bySermon.get(r.id))) },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (e) {
    console.error("sermons GET:", e);
    return Response.json({ error: "Couldn't load your sermons." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const db = await open();
  if (db instanceof Response) return db;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const now = Date.now();
  const id = `s_${now.toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const today = new Date(now + 2 * 3600 * 1000).toISOString().slice(0, 10); // SAST
  try {
    await db
      .prepare(
        "INSERT INTO sermons (id, title, preacher, url, listened_on, notes, items, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, '[]', ?, ?)",
      )
      .bind(
        id,
        str(body.title, 300) ?? "",
        str(body.preacher, 200) ?? "",
        str(body.url, 500) ?? "",
        day(body.listenedOn) ?? today,
        str(body.notes, MAX_NOTES) ?? "",
        now,
        now,
      )
      .run();
    return Response.json({ sermon: await full(db, id) });
  } catch (e) {
    console.error("sermons POST:", e);
    return Response.json({ error: "Couldn't add that sermon." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const db = await open();
  if (db instanceof Response) return db;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const id = typeof body.id === "string" ? body.id : "";
  const now = Date.now();
  try {
    const before = id ? await fetchOne(db, id) : null;
    if (!before) return Response.json({ error: "Sermon not found." }, { status: 404 });

    if (body.restore === true) {
      await db.prepare("UPDATE sermons SET deleted_at = NULL, updated_at = ? WHERE id = ?").bind(now, id).run();
    } else {
      const sets: string[] = [];
      const args: unknown[] = [];
      const put = (col: string, v: unknown) => {
        if (v === undefined) return;
        sets.push(`${col} = ?`);
        args.push(v);
      };
      put("title", str(body.title, 300));
      put("preacher", str(body.preacher, 200));
      put("url", str(body.url, 500));
      put("listened_on", day(body.listenedOn));
      put("notes", str(body.notes, MAX_NOTES));
      const items = cleanItems(body.items);
      put("items", items ? JSON.stringify(items) : undefined);
      if (!sets.length) return Response.json({ error: "Nothing to save." }, { status: 400 });

      // Keep the earlier version - at most one every 15 minutes per sermon.
      const last = await db
        .prepare("SELECT MAX(saved_at) AS t FROM sermon_versions WHERE sermon_id = ?")
        .bind(id)
        .first<{ t: number | null }>();
      const stmts = [];
      // Removing a saved verse / word always keeps the version before it.
      const dropped = items !== undefined && items.length < toSermon(before).items.length;
      if (dropped || !last?.t || now - Number(last.t) > VERSION_GAP_MS) {
        stmts.push(
          db.prepare("INSERT INTO sermon_versions (sermon_id, json, saved_at) VALUES (?, ?, ?)").bind(id, JSON.stringify(before), now),
        );
      }
      stmts.push(db.prepare(`UPDATE sermons SET ${sets.join(", ")}, updated_at = ? WHERE id = ?`).bind(...args, now, id));
      await db.batch(stmts);
    }
    return Response.json({ sermon: await full(db, id) });
  } catch (e) {
    console.error("sermons PATCH:", e);
    return Response.json({ error: "Couldn't save that." }, { status: 500 });
  }
}

// Moves a sermon to "Recently deleted" - never removes it.
export async function DELETE(req: Request) {
  const db = await open();
  if (db instanceof Response) return db;
  const id = new URL(req.url).searchParams.get("id") ?? "";
  const now = Date.now();
  try {
    await db.prepare("UPDATE sermons SET deleted_at = ?, updated_at = ? WHERE id = ?").bind(now, now, id).run();
    return Response.json({ sermon: await full(db, id) });
  } catch (e) {
    console.error("sermons DELETE:", e);
    return Response.json({ error: "Couldn't move that to Recently deleted." }, { status: 500 });
  }
}
