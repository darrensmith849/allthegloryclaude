/**
 * Bible names saved to a reading day from "Look up a name" - who they were
 * and what the name means - shown under "Words studied" on that day. For
 * the owner (study_names) or a member (member_names), see ./scope.ts.
 *
 *   GET                                   -> { names }   (incl. removed - the Recycle bin - not emptied)
 *   POST { day, name, meaning?, about? }  -> { name }
 *   DELETE ?id=...                        -> { ok }      removed, never erased (deleted_at)
 */
import { getDb } from "@/lib/analytics/store";
import { isDay } from "@/lib/dashboard/notes";
import { andMine, mine, mineArgs, pre, preQ, type ScopeOf } from "./scope";

export interface SavedName {
  id: string;
  day: string;
  name: string;
  meaning: string;
  about: string;
  createdAt: number;
  deletedAt: number | null; // in the Recycle bin since
}

interface Row {
  id: string;
  day: string;
  name: string;
  meaning: string | null;
  about: string | null;
  created_at: number;
  deleted_at?: number | null;
}

const MAX_NAMES = 5_000;
const noStore = { "cache-control": "no-store" };
const unavailable = () => Response.json({ error: "Storage isn't available here." }, { status: 503 });

const toName = (r: Row): SavedName => ({
  id: r.id,
  day: r.day,
  name: r.name,
  meaning: r.meaning ?? "",
  about: r.about ?? "",
  createdAt: r.created_at,
  deletedAt: r.deleted_at ?? null,
});

export function namesApi(scopeOf: ScopeOf) {
  async function GET(req: Request) {
    const s = await scopeOf(req);
    if (s instanceof Response) return s;
    const db = await getDb();
    if (!db) return unavailable();
    try {
      const { results } = await db
        .prepare(
          `SELECT id, day, name, meaning, about, created_at, deleted_at FROM ${s.names} WHERE ${mine(s)} AND purged_at IS NULL ORDER BY day, created_at`,
        )
        .bind(...mineArgs(s))
        .all<Row>();
      return Response.json({ names: results.map(toName) }, { headers: noStore });
    } catch (e) {
      console.error("names GET:", e);
      return Response.json({ error: "Couldn't load the names." }, { status: 500 });
    }
  }

  async function POST(req: Request) {
    const s = await scopeOf(req);
    if (s instanceof Response) return s;
    const db = await getDb();
    if (!db) return unavailable();
    const body = (await req.json().catch(() => ({}))) as { day?: unknown; name?: unknown; meaning?: unknown; about?: unknown };
    const name = String(body.name ?? "").trim().slice(0, 80);
    if (!isDay(body.day) || !name) return Response.json({ error: "Which day, and which name?" }, { status: 400 });
    const meaning = String(body.meaning ?? "").trim().slice(0, 300);
    const about = String(body.about ?? "").trim().slice(0, 1200);
    try {
      const count = await db
        .prepare(`SELECT COUNT(*) AS n FROM ${s.names} WHERE ${mine(s)}`)
        .bind(...mineArgs(s))
        .first<{ n: number }>();
      if ((count?.n ?? 0) >= MAX_NAMES) return Response.json({ error: "That's the most names that can be saved." }, { status: 400 });
      // Saved once per day: saving it again just brings it back.
      const existing = await db
        .prepare(`SELECT id FROM ${s.names} WHERE day = ? AND name = ?${andMine(s)}`)
        .bind(body.day, name, ...mineArgs(s))
        .first<{ id: string }>();
      const now = Date.now();
      const id = existing?.id ?? crypto.randomUUID();
      if (existing) {
        await db
          .prepare(`UPDATE ${s.names} SET deleted_at = NULL, purged_at = NULL, meaning = ?, about = ? WHERE id = ?${andMine(s)}`)
          .bind(meaning, about, id, ...mineArgs(s))
          .run();
      } else {
        await db
          .prepare(`INSERT INTO ${s.names} (id, ${pre(s)}day, name, meaning, about, created_at) VALUES (?, ${preQ(s)}?, ?, ?, ?, ?)`)
          .bind(id, ...mineArgs(s), body.day, name, meaning, about, now)
          .run();
      }
      const row = await db
        .prepare(`SELECT id, day, name, meaning, about, created_at, deleted_at FROM ${s.names} WHERE id = ?${andMine(s)}`)
        .bind(id, ...mineArgs(s))
        .first<Row>();
      return Response.json({ name: row ? toName(row) : null });
    } catch (e) {
      console.error("names POST:", e);
      return Response.json({ error: "Couldn't save that name." }, { status: 500 });
    }
  }

  async function DELETE(req: Request) {
    const s = await scopeOf(req);
    if (s instanceof Response) return s;
    const db = await getDb();
    if (!db) return unavailable();
    const id = new URL(req.url).searchParams.get("id") ?? "";
    if (!id) return Response.json({ error: "Which name?" }, { status: 400 });
    try {
      await db
        .prepare(`UPDATE ${s.names} SET deleted_at = ? WHERE id = ?${andMine(s)}`)
        .bind(Date.now(), id, ...mineArgs(s))
        .run();
      return Response.json({ ok: true });
    } catch (e) {
      console.error("names DELETE:", e);
      return Response.json({ error: "Couldn't remove that name." }, { status: 500 });
    }
  }

  return { GET, POST, DELETE };
}
