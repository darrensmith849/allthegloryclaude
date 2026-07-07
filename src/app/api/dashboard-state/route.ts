/**
 * Private dashboard state sync (durable) — Cloudflare D1.
 *
 *   GET  → { json: string | null, updatedAt: number }
 *   PUT  { json: string, updatedAt: number } → upsert (204)
 *
 * The whole dashboard state (streak, habits, tasks, fast, …) is a single
 * JSON blob kept in one row (id='owner'). localStorage stays the instant
 * local cache; this makes the data durable and cross-device.
 *
 * Safeguards so it can NEVER reset your data:
 *   - last-write-wins: an update only applies if its updatedAt is >= the
 *     stored one, so a stale client can't clobber fresher data.
 *   - anti-wipe: a state with no recorded habit-days will NOT overwrite a
 *     stored state that has them (guards against a fresh/empty browser —
 *     e.g. the apex vs www case — pushing an empty blob over your history).
 * Every path is best-effort and never throws to the caller.
 */
import { getDb } from "@/lib/analytics/store";

export const dynamic = "force-dynamic";

const OWNER = "owner";
const MAX_BYTES = 1_000_000; // 1MB ceiling — the state is a few KB in practice

// Cheap "how much real data is in here" measure = number of recorded
// habit-days. Used only to refuse an empty blob overwriting a full one.
function habitWeight(jsonStr: string | null | undefined): number {
  if (!jsonStr) return 0;
  try {
    const s = JSON.parse(jsonStr) as { habits?: Record<string, unknown> };
    return s.habits ? Object.keys(s.habits).length : 0;
  } catch {
    return 0;
  }
}

export async function GET() {
  try {
    const db = await getDb();
    if (!db) return Response.json({ json: null, updatedAt: 0 });
    const row = await db
      .prepare("SELECT json, updated_at FROM dashboard_state WHERE id=?1")
      .bind(OWNER)
      .first<{ json: string; updated_at: number }>();
    return Response.json(
      { json: row?.json ?? null, updatedAt: Number(row?.updated_at ?? 0) },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return Response.json({ json: null, updatedAt: 0 });
  }
}

export async function PUT(req: Request) {
  try {
    const db = await getDb();
    if (!db) return new Response(null, { status: 204 });

    const body = (await req.json().catch(() => ({}))) as {
      json?: unknown;
      updatedAt?: number;
    };
    const json = typeof body.json === "string" ? body.json : null;
    const updatedAt = Number(body.updatedAt) || Date.now();
    if (!json || json.length > MAX_BYTES) {
      return new Response(null, { status: 204 });
    }

    // Anti-wipe: never let an empty state overwrite a non-empty stored one.
    if (habitWeight(json) === 0) {
      const existing = await db
        .prepare("SELECT json FROM dashboard_state WHERE id=?1")
        .bind(OWNER)
        .first<{ json: string }>();
      if (habitWeight(existing?.json) > 0) {
        return new Response(null, { status: 204 });
      }
    }

    // Last-write-wins: only apply if this update is at least as new.
    await db
      .prepare(
        "INSERT INTO dashboard_state (id, json, updated_at) VALUES (?1, ?2, ?3) " +
          "ON CONFLICT(id) DO UPDATE SET json=excluded.json, updated_at=excluded.updated_at " +
          "WHERE excluded.updated_at >= dashboard_state.updated_at",
      )
      .bind(OWNER, json, updatedAt)
      .run();
  } catch {
    // never surface storage errors to the client
  }
  return new Response(null, { status: 204 });
}
