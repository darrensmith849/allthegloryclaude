/**
 * POST /api/track
 *
 * Accepts a tiny "something happened" event from the public site and
 * appends it to the D1 events table. Two event types:
 *   - { event: "view",     path: string,  sid?: string }
 *   - { event: "download", file: string }
 *
 * Always returns 204 (even on error / when D1 is unavailable) so the client
 * can fire-and-forget without ever blocking the visitor. Country is sniffed
 * from Cloudflare's edge header so the client never has to send it.
 */
import type { NextRequest } from "next/server";
import { getDb } from "@/lib/analytics/store";

// Never cached — every request records a fresh event.
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const db = await getDb();
    if (!db) return new Response(null, { status: 204 });

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const event = String(body.event ?? "");
    const country = (req.headers.get("cf-ipcountry") || "??").slice(0, 4);
    const ts = Date.now();

    if (event === "view") {
      const path = String(body.path ?? "/").slice(0, 200);
      const sid = String(body.sid ?? "").slice(0, 64);
      await db
        .prepare(
          "INSERT INTO events (type, path, country, sid, ts) VALUES ('view', ?1, ?2, ?3, ?4)",
        )
        .bind(path, country, sid, ts)
        .run();
    } else if (event === "download") {
      const file = String(body.file ?? "").slice(0, 200);
      await db
        .prepare(
          "INSERT INTO events (type, file, country, ts) VALUES ('download', ?1, ?2, ?3)",
        )
        .bind(file, country, ts)
        .run();
    }
  } catch {
    // D1 hiccup — swallow it; analytics must never affect the visitor.
  }
  return new Response(null, { status: 204 });
}
