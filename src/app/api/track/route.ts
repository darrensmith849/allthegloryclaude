/**
 * POST /api/track
 *
 * Appends a "something happened" event to the D1 events table:
 *   - { event: "view",     path, sid?, ref? }
 *   - { event: "download", file }
 *   - { event: "play",     file, sid? }   ← music plays (hero track / previews)
 *
 * Always returns 204 (even on error / when D1 is unavailable) so the client
 * can fire-and-forget without ever blocking the visitor. Country + device are
 * sniffed from Cloudflare / the User-Agent so the client stays tiny.
 */
import type { NextRequest } from "next/server";
import { getDb } from "@/lib/analytics/store";

export const dynamic = "force-dynamic";

function deviceFromUA(ua: string): string {
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua)) return "tablet";
  if (/Mobi|Android|iPhone|iPod|Windows Phone/i.test(ua)) return "mobile";
  return "desktop";
}

export async function POST(req: NextRequest) {
  try {
    const db = await getDb();
    if (!db) return new Response(null, { status: 204 });

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const event = String(body.event ?? "");
    const country = (req.headers.get("cf-ipcountry") || "??").slice(0, 4);
    const device = deviceFromUA(req.headers.get("user-agent") || "");
    const ts = Date.now();

    if (event === "view") {
      const path = String(body.path ?? "/").slice(0, 200);
      const sid = String(body.sid ?? "").slice(0, 64);
      const ref = String(body.ref ?? "direct").slice(0, 120) || "direct";
      await db
        .prepare(
          "INSERT INTO events (type, path, country, sid, ts, ref, device) VALUES ('view', ?1, ?2, ?3, ?4, ?5, ?6)",
        )
        .bind(path, country, sid, ts, ref, device)
        .run();
    } else if (event === "download") {
      const file = String(body.file ?? "").slice(0, 200);
      await db
        .prepare(
          "INSERT INTO events (type, file, country, ts, device) VALUES ('download', ?1, ?2, ?3, ?4)",
        )
        .bind(file, country, ts, device)
        .run();
    } else if (event === "play") {
      const file = String(body.file ?? "").slice(0, 200);
      const sid = String(body.sid ?? "").slice(0, 64);
      await db
        .prepare(
          "INSERT INTO events (type, file, country, sid, ts, device) VALUES ('play', ?1, ?2, ?3, ?4, ?5)",
        )
        .bind(file, country, sid, ts, device)
        .run();
    }
  } catch {
    // D1 hiccup — swallow it; analytics must never affect the visitor.
  }
  return new Response(null, { status: 204 });
}
