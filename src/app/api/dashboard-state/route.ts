/**
 * Private dashboard state sync (durable) — Cloudflare D1.
 *
 *   GET  → { json: string | null, updatedAt: number }
 *   PUT  { json: string, updatedAt: number } → upsert (204)
 *
 * The dashboard state (schedule, tasks, guitar, book, settings, …) is a
 * single JSON blob kept in one row (id='owner'). localStorage stays the
 * instant local cache; this makes the data durable and cross-device.
 * Word journal entries and study notes have their own tables
 * (/api/words, /api/study-notes) so they can grow without limit.
 *
 * Safeguards so it can NEVER reset your data:
 *   - last-write-wins: an update only applies if its updatedAt is >= the
 *     stored one, so a stale client can't clobber fresher data.
 *   - anti-wipe: a state with no recorded habit-days or saved words will
 *     NOT overwrite a stored state that has them (guards against a
 *     fresh/empty browser — e.g. the apex vs www case — pushing an empty
 *     blob over your history).
 *   - history: the state as it stood at the end of each day is kept in
 *     dashboard_state_history, forever - a restore point for any day.
 * Every path is best-effort and never throws to the caller.
 *
 * Whose copy: the owner's row ('owner', as it always was), or family's own
 * ('member:<id>', Daniel's sister - src/lib/team.ts), always decided from the
 * session, never from the request. GET says whose it is ("who") so the page
 * keeps it under the right key on the device; a PUT for anyone else's is
 * refused (409), so two people's copies can never mix.
 */
import { getDb } from "@/lib/analytics/store";
import { dashboardUser, stateIdOf } from "@/lib/team";

export const dynamic = "force-dynamic";

const MAX_BYTES = 1_900_000; // just under D1's 2MB row limit - in practice a few KB

// Cheap "how much real data is in here" measure = recorded habit-days,
// saved journal words, money entries and to-do items. Used only to refuse
// an empty blob overwriting a full one.
function dataWeight(jsonStr: string | null | undefined): number {
  if (!jsonStr) return 0;
  try {
    const s = JSON.parse(jsonStr) as {
      habits?: Record<string, unknown>;
      words?: unknown[];
      money?: { entries?: unknown[] };
      todo?: { items?: unknown[] };
    };
    const habitDays = s.habits ? Object.keys(s.habits).length : 0;
    const words = Array.isArray(s.words) ? s.words.length : 0;
    const money = Array.isArray(s.money?.entries) ? s.money.entries.length : 0;
    const todo = Array.isArray(s.todo?.items) ? s.todo.items.length : 0;
    return habitDays + words + money + todo;
  } catch {
    return 0;
  }
}

// The row this request's user reads and writes, or null.
async function stateId(req: Request): Promise<string | null> {
  const who = await dashboardUser(req).catch(() => null);
  return who ? stateIdOf(who) : null;
}

export async function GET(req: Request) {
  try {
    const id = await stateId(req);
    if (!id) return Response.json({ error: "Please log in to the dashboard." }, { status: 403 });
    const db = await getDb();
    if (!db) return Response.json({ json: null, updatedAt: 0, who: id });
    const row = await db
      .prepare("SELECT json, updated_at FROM dashboard_state WHERE id=?1")
      .bind(id)
      .first<{ json: string; updated_at: number }>();
    return Response.json(
      { json: row?.json ?? null, updatedAt: Number(row?.updated_at ?? 0), who: id },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return Response.json({ json: null, updatedAt: 0 });
  }
}

export async function PUT(req: Request) {
  try {
    const id = await stateId(req);
    if (!id) return Response.json({ error: "Please log in to the dashboard." }, { status: 403 });
    const db = await getDb();
    if (!db) return new Response(null, { status: 204 });

    const body = (await req.json().catch(() => ({}))) as {
      json?: unknown;
      updatedAt?: number;
      who?: unknown; // whose copy the page thinks it is (older pages: the owner's)
    };
    if ((typeof body.who === "string" ? body.who : "owner") !== id) {
      return Response.json({ error: "That's someone else's dashboard." }, { status: 409 });
    }
    const json = typeof body.json === "string" ? body.json : null;
    const updatedAt = Number(body.updatedAt) || Date.now();
    if (!json || json.length > MAX_BYTES) {
      return new Response(null, { status: 204 });
    }

    // Anti-wipe: never let an empty state overwrite a non-empty stored one.
    if (dataWeight(json) === 0) {
      const existing = await db
        .prepare("SELECT json FROM dashboard_state WHERE id=?1")
        .bind(id)
        .first<{ json: string }>();
      if (dataWeight(existing?.json) > 0) {
        return new Response(null, { status: 204 });
      }
    }

    // Last-write-wins: only apply if this update is at least as new. Then
    // copy whatever is now current into today's history row.
    await db.batch([
      db
        .prepare(
          "INSERT INTO dashboard_state (id, json, updated_at) VALUES (?1, ?2, ?3) " +
            "ON CONFLICT(id) DO UPDATE SET json=excluded.json, updated_at=excluded.updated_at " +
            "WHERE excluded.updated_at >= dashboard_state.updated_at",
        )
        .bind(id, json, updatedAt),
      db
        .prepare(
          "INSERT INTO dashboard_state_history (day, json, updated_at) " +
            "SELECT ?2, json, updated_at FROM dashboard_state WHERE id=?1 " +
            "ON CONFLICT(day) DO UPDATE SET json=excluded.json, updated_at=excluded.updated_at",
        )
        // The owner's history rows are keyed by day, as they always were; family's by "<id>:<day>".
        .bind(id, `${id === "owner" ? "" : `${id}:`}${new Date().toISOString().slice(0, 10)}`),
    ]);
  } catch {
    // never surface storage errors to the client
  }
  return new Response(null, { status: 204 });
}
