/**
 * POST /api/track
 *
 * Accepts a tiny "something happened" event from the public site and
 * writes it to Vercel KV. Two event types:
 *   - { event: "view",     path: string,  sid?: string }
 *   - { event: "download", file: string }
 *
 * Returns 204 always (even when KV isn't configured) so the client can
 * fire-and-forget without ever blocking the user. Country is sniffed
 * from the Vercel edge header so the client never has to send it.
 */
import type { NextRequest } from "next/server";
import {
  isAnalyticsConfigured,
  kv,
  K,
  DAY_TTL_SECONDS,
  ACTIVE_WINDOW_MS,
  utcDayKey,
} from "@/lib/analytics/store";

// Force the route to render dynamically — every request must hit the KV
// store, never the Next response cache.
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!isAnalyticsConfigured()) {
    return new Response(null, { status: 204 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response("bad json", { status: 400 });
  }

  const event = String(body.event ?? "");
  const country = req.headers.get("x-vercel-ip-country") ?? "??";
  const now = Date.now();
  const day = utcDayKey();

  try {
    if (event === "view") {
      const path = String(body.path ?? "/").slice(0, 200);
      const sid = String(body.sid ?? "").slice(0, 64);

      // Five writes per view + a prune. Within the free-tier budget for
      // realistic traffic; if it ever isn't, switch the daily/path/country
      // counters to a single pipeline.
      await Promise.all([
        kv.incr(K.viewsTotal),
        kv.incr(K.viewsDay(day)).then(() =>
          kv.expire(K.viewsDay(day), DAY_TTL_SECONDS),
        ),
        kv.zincrby(K.viewsByPath, 1, path),
        kv.zincrby(K.viewsByCountry, 1, country),
        sid ? kv.zadd(K.viewsActive, { score: now, member: sid }) : Promise.resolve(),
        kv.zremrangebyscore(K.viewsActive, 0, now - ACTIVE_WINDOW_MS),
      ]);
    } else if (event === "download") {
      const file = String(body.file ?? "").slice(0, 200);

      await Promise.all([
        kv.incr(K.downloadsTotal),
        kv.incr(K.downloadsDay(day)).then(() =>
          kv.expire(K.downloadsDay(day), DAY_TTL_SECONDS),
        ),
        kv.lpush(
          K.downloadsList,
          JSON.stringify({ time: now, file, country }),
        ),
        kv.ltrim(K.downloadsList, 0, 99),
      ]);
    }
  } catch {
    // KV outage / quota — never bubble it to the visitor.
    return new Response(null, { status: 204 });
  }

  return new Response(null, { status: 204 });
}
