/**
 * The Recycle bin: notes, words, names (and a member's prayers) that were
 * deleted stay restorable for 30 days.
 *
 *   POST { action: "restore", items: [{ kind, id }] } -> { done }   back on their day, in their place
 *   POST { action: "purge",   items: [{ kind, id }] } -> { done }   emptied from the bin
 *
 * kind: "note" | "word" | "name" | "prayer" (prayers: members only).
 *
 * Restoring clears deleted_at - the item keeps its day, page and position,
 * so it goes straight back where it was. Emptying marks purged_at: members'
 * emptied items (and anything in their bin over 30 days) are erased in the
 * nightly job (eraseMemberBin, ./bin-erase.ts); the owner's are never erased - only taken
 * out of the bin.
 */
import { getDb } from "@/lib/analytics/store";
import { BIN_DAYS } from "./bin-erase";
import { andMine, mineArgs, type Scope, type ScopeOf } from "./scope";

export { BIN_DAYS };
const MAX_ITEMS = 2_000;

type Kind = "note" | "word" | "name" | "prayer";

function tableOf(s: Scope, kind: Kind): { table: string; updated: boolean } | null {
  if (kind === "note") return { table: s.notes, updated: true };
  if (kind === "word") return { table: s.words, updated: true };
  if (kind === "name") return { table: s.names, updated: false };
  if (kind === "prayer" && s.member) return { table: "member_prayers", updated: true };
  return null;
}

export function binApi(scopeOf: ScopeOf) {
  async function POST(req: Request) {
    const s = await scopeOf(req);
    if (s instanceof Response) return s;
    const db = await getDb();
    if (!db) return Response.json({ error: "Storage isn't available here." }, { status: 503 });
    const body = (await req.json().catch(() => ({}))) as { action?: unknown; items?: unknown };
    const action = body.action === "restore" || body.action === "purge" ? body.action : null;
    const items = Array.isArray(body.items) ? (body.items as { kind?: unknown; id?: unknown }[]).slice(0, MAX_ITEMS) : [];
    if (!action || !items.length) return Response.json({ error: "Nothing to do." }, { status: 400 });

    const now = Date.now();
    const statements = [];
    for (const it of items) {
      const t = typeof it.id === "string" ? tableOf(s, it.kind as Kind) : null;
      if (!t) continue;
      const touched = t.updated ? ", updated_at = ?" : "";
      statements.push(
        action === "restore"
          ? db
              .prepare(`UPDATE ${t.table} SET deleted_at = NULL${touched} WHERE id = ? AND purged_at IS NULL${andMine(s)}`)
              .bind(...(t.updated ? [now] : []), it.id, ...mineArgs(s))
          : db
              .prepare(`UPDATE ${t.table} SET purged_at = ?${touched} WHERE id = ? AND deleted_at IS NOT NULL${andMine(s)}`)
              .bind(now, ...(t.updated ? [now] : []), it.id, ...mineArgs(s)),
      );
    }
    if (!statements.length) return Response.json({ error: "Nothing to do." }, { status: 400 });
    try {
      await db.batch(statements);
      return Response.json({ done: statements.length });
    } catch (e) {
      console.error("bin POST:", e);
      return Response.json({ error: "Couldn't do that just now - try again." }, { status: 500 });
    }
  }
  return { POST };
}
