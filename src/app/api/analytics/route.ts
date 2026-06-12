/**
 * GET /api/analytics
 *
 * Returns the aggregated numbers behind /dashboard/analytics. Polled by
 * that page every ~12 seconds so the dashboard stays close to live.
 *
 * Two response shapes:
 *   - { setupNeeded: true } when Vercel KV env vars aren't provisioned
 *     (the dashboard renders a friendly setup card in that case)
 *   - the full payload below otherwise
 */
import {
  isAnalyticsConfigured,
  kv,
  K,
  ACTIVE_WINDOW_MS,
  utcDayKey,
} from "@/lib/analytics/store";

export const dynamic = "force-dynamic";

interface PathCount {
  path: string;
  count: number;
}
interface CountryCount {
  code: string;
  count: number;
}
interface DayRow {
  date: string;
  views: number;
  downloads: number;
}
interface DownloadEvent {
  time: number;
  file: string;
  country: string;
}

export interface AnalyticsPayload {
  setupNeeded?: boolean;
  fetchedAt: number;
  totalViews: number;
  viewsToday: number;
  activeNow: number;
  totalDownloads: number;
  downloadsToday: number;
  topPages: PathCount[];
  topCountries: CountryCount[];
  last7Days: DayRow[];
  recentDownloads: DownloadEvent[];
}

// upstash returns [member1, score1, member2, score2, ...] for withScores;
// chunk that into typed pairs.
function pairsFromZRange(raw: unknown): { member: string; score: number }[] {
  if (!Array.isArray(raw)) return [];
  const out: { member: string; score: number }[] = [];
  for (let i = 0; i < raw.length; i += 2) {
    const member = String(raw[i] ?? "");
    const score = Number(raw[i + 1] ?? 0);
    if (member) out.push({ member, score });
  }
  return out;
}

export async function GET() {
  if (!isAnalyticsConfigured()) {
    return Response.json({ setupNeeded: true });
  }

  const now = Date.now();

  // Build the 7-day key window (today minus 0..6 days, oldest first).
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - (6 - i));
    return utcDayKey(d);
  });

  try {
    const [
      totalViews,
      totalDownloads,
      activeNow,
      topPathsRaw,
      topCountriesRaw,
      dayViewsRaw,
      dayDownloadsRaw,
      recentRaw,
    ] = await Promise.all([
      kv.get<number>(K.viewsTotal),
      kv.get<number>(K.downloadsTotal),
      kv.zcount(K.viewsActive, now - ACTIVE_WINDOW_MS, "+inf" as unknown as number),
      kv.zrange(K.viewsByPath, 0, 9, { rev: true, withScores: true }),
      kv.zrange(K.viewsByCountry, 0, 9, { rev: true, withScores: true }),
      kv.mget<number[]>(...last7.map(K.viewsDay)),
      kv.mget<number[]>(...last7.map(K.downloadsDay)),
      kv.lrange(K.downloadsList, 0, 19),
    ]);

    const topPages: PathCount[] = pairsFromZRange(topPathsRaw).map((p) => ({
      path: p.member,
      count: p.score,
    }));
    const topCountries: CountryCount[] = pairsFromZRange(topCountriesRaw).map(
      (p) => ({ code: p.member, count: p.score }),
    );

    const last7Days: DayRow[] = last7.map((date, i) => ({
      date,
      views: Number(dayViewsRaw?.[i] ?? 0),
      downloads: Number(dayDownloadsRaw?.[i] ?? 0),
    }));

    const recentDownloads: DownloadEvent[] = (recentRaw ?? [])
      .map((entry) => {
        try {
          // Upstash sometimes returns an already-parsed object — handle both.
          if (typeof entry === "string") return JSON.parse(entry) as DownloadEvent;
          return entry as DownloadEvent;
        } catch {
          return null;
        }
      })
      .filter((x): x is DownloadEvent => Boolean(x));

    const payload: AnalyticsPayload = {
      fetchedAt: now,
      totalViews: Number(totalViews ?? 0),
      viewsToday: last7Days[6]?.views ?? 0,
      activeNow: Number(activeNow ?? 0),
      totalDownloads: Number(totalDownloads ?? 0),
      downloadsToday: last7Days[6]?.downloads ?? 0,
      topPages,
      topCountries,
      last7Days,
      recentDownloads,
    };
    return Response.json(payload, {
      headers: { "cache-control": "no-store" },
    });
  } catch (err) {
    return Response.json(
      {
        setupNeeded: false,
        error: err instanceof Error ? err.message : "KV read failed",
      },
      { status: 500 },
    );
  }
}

