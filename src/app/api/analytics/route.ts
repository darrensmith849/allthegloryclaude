/**
 * GET /api/analytics
 *
 * Aggregates everything behind /dashboard/analytics from the D1 store:
 * visits, unique visitors, music plays, album downloads, donations,
 * traffic sources, device split, top tracks, a live activity feed, and
 * week-over-week growth. Polled by the dashboard so it stays near-live.
 */
import {
  getDb,
  startOfUtcDayMs,
  utcDayKey,
  ACTIVE_WINDOW_MS,
} from "@/lib/analytics/store";

export const dynamic = "force-dynamic";

interface Count {
  label: string;
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
interface DonationRow {
  time: number;
  amount: number; // major units
  currency: string;
}
interface Activity {
  kind: "view" | "download" | "play" | "donation";
  label: string;
  time: number;
  country?: string;
}

export interface AnalyticsPayload {
  setupNeeded?: boolean;
  fetchedAt: number;
  totalViews: number;
  viewsToday: number;
  activeNow: number;
  uniqueVisitors: number;
  totalDownloads: number;
  downloadsToday: number;
  totalPlays: number;
  playsToday: number;
  viewsThisWeek: number;
  viewsLastWeek: number;
  topPages: { path: string; count: number }[];
  topCountries: { code: string; count: number }[];
  topSources: Count[];
  deviceSplit: Count[];
  topTracks: Count[];
  last7Days: DayRow[];
  recentDownloads: DownloadEvent[];
  recentActivity: Activity[];
  // Donations
  totalDonations: number;
  totalRaised: number;
  raisedToday: number;
  raisedCurrency: string;
  recentDonations: DonationRow[];
}

export async function GET() {
  const db = await getDb();
  if (!db) return Response.json({ setupNeeded: true });

  const now = Date.now();
  const activeSince = now - ACTIVE_WINDOW_MS;
  const todayStart = startOfUtcDayMs();
  const weekStart = startOfUtcDayMs(new Date(now - 6 * 86_400_000));
  const weekAgo = now - 7 * 86_400_000;
  const twoWeeksAgo = now - 14 * 86_400_000;

  try {
    const [
      totalsRow,
      todayRow,
      activeRow,
      weekRow,
      topPathsRes,
      topCountriesRes,
      topSourcesRes,
      deviceRes,
      topTracksRes,
      perDayRes,
      recentEventsRes,
      donRow,
      recentDonationsRes,
    ] = await Promise.all([
      db
        .prepare(
          "SELECT " +
            "COUNT(CASE WHEN type='view' THEN 1 END) AS views, " +
            "COUNT(CASE WHEN type='download' THEN 1 END) AS downloads, " +
            "COUNT(CASE WHEN type='play' THEN 1 END) AS plays, " +
            "COUNT(DISTINCT CASE WHEN type='view' AND sid<>'' THEN sid END) AS uniques " +
            "FROM events",
        )
        .first<{ views: number; downloads: number; plays: number; uniques: number }>(),
      db
        .prepare(
          "SELECT " +
            "COUNT(CASE WHEN type='view' THEN 1 END) AS views, " +
            "COUNT(CASE WHEN type='download' THEN 1 END) AS downloads, " +
            "COUNT(CASE WHEN type='play' THEN 1 END) AS plays " +
            "FROM events WHERE ts>=?1",
        )
        .bind(todayStart)
        .first<{ views: number; downloads: number; plays: number }>(),
      db
        .prepare("SELECT COUNT(DISTINCT sid) AS c FROM events WHERE type='view' AND sid<>'' AND ts>?1")
        .bind(activeSince)
        .first<{ c: number }>(),
      db
        .prepare(
          "SELECT " +
            "COUNT(CASE WHEN ts>=?1 THEN 1 END) AS thisW, " +
            "COUNT(CASE WHEN ts>=?2 AND ts<?1 THEN 1 END) AS lastW " +
            "FROM events WHERE type='view' AND ts>=?2",
        )
        .bind(weekAgo, twoWeeksAgo)
        .first<{ thisW: number; lastW: number }>(),
      db
        .prepare("SELECT path, COUNT(*) AS c FROM events WHERE type='view' AND path IS NOT NULL GROUP BY path ORDER BY c DESC LIMIT 10")
        .all<{ path: string; c: number }>(),
      db
        .prepare("SELECT country, COUNT(*) AS c FROM events WHERE type='view' AND country IS NOT NULL GROUP BY country ORDER BY c DESC LIMIT 10")
        .all<{ country: string; c: number }>(),
      db
        .prepare("SELECT ref, COUNT(*) AS c FROM events WHERE type='view' AND ref IS NOT NULL AND ref<>'internal' GROUP BY ref ORDER BY c DESC LIMIT 8")
        .all<{ ref: string; c: number }>(),
      db
        .prepare("SELECT device, COUNT(*) AS c FROM events WHERE type='view' AND device IS NOT NULL GROUP BY device ORDER BY c DESC")
        .all<{ device: string; c: number }>(),
      db
        .prepare("SELECT file, COUNT(*) AS c FROM events WHERE type='play' AND file IS NOT NULL GROUP BY file ORDER BY c DESC LIMIT 8")
        .all<{ file: string; c: number }>(),
      db
        .prepare("SELECT date(ts/1000,'unixepoch') AS d, type, COUNT(*) AS c FROM events WHERE ts>=?1 GROUP BY d, type")
        .bind(weekStart)
        .all<{ d: string; type: string; c: number }>(),
      db
        .prepare("SELECT type, path, file, country, ts FROM events ORDER BY ts DESC LIMIT 18")
        .all<{ type: string; path: string | null; file: string | null; country: string | null; ts: number }>(),
      db
        .prepare("SELECT COUNT(*) AS n, COALESCE(SUM(amount),0) AS s, COALESCE(SUM(CASE WHEN ts>=?1 THEN amount END),0) AS today FROM donations")
        .bind(todayStart)
        .first<{ n: number; s: number; today: number }>(),
      db
        .prepare("SELECT amount, currency, ts FROM donations ORDER BY ts DESC LIMIT 12")
        .all<{ amount: number; currency: string; ts: number }>(),
    ]);

    const topPages = (topPathsRes.results ?? []).map((r) => ({ path: r.path, count: Number(r.c) }));
    const topCountries = (topCountriesRes.results ?? []).map((r) => ({ code: r.country, count: Number(r.c) }));
    const topSources: Count[] = (topSourcesRes.results ?? []).map((r) => ({ label: r.ref, count: Number(r.c) }));
    const deviceSplit: Count[] = (deviceRes.results ?? []).map((r) => ({ label: r.device, count: Number(r.c) }));
    const topTracks: Count[] = (topTracksRes.results ?? []).map((r) => ({ label: r.file, count: Number(r.c) }));

    const last7Days: DayRow[] = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - (6 - i));
      return { date: utcDayKey(d), views: 0, downloads: 0 };
    });
    const byDate = new Map(last7Days.map((r) => [r.date, r]));
    for (const row of perDayRes.results ?? []) {
      const t = byDate.get(row.d);
      if (!t) continue;
      if (row.type === "view") t.views = Number(row.c);
      else if (row.type === "download") t.downloads = Number(row.c);
    }

    const recentDownloads: DownloadEvent[] = (recentEventsRes.results ?? [])
      .filter((r) => r.type === "download")
      .slice(0, 20)
      .map((r) => ({ time: Number(r.ts), file: r.file ?? "album", country: r.country ?? "??" }));

    const recentDonations: DonationRow[] = (recentDonationsRes.results ?? []).map((r) => ({
      time: Number(r.ts),
      amount: Number(r.amount) / 100,
      currency: r.currency ?? "ZAR",
    }));
    const raisedCurrency = recentDonations[0]?.currency ?? "ZAR";

    // Unified live activity feed: recent events + recent donations, newest first.
    const activity: Activity[] = [
      ...(recentEventsRes.results ?? []).map((r): Activity => {
        if (r.type === "download") return { kind: "download", label: "Album downloaded", time: Number(r.ts), country: r.country ?? undefined };
        if (r.type === "play") return { kind: "play", label: `Played ${r.file ?? "music"}`, time: Number(r.ts), country: r.country ?? undefined };
        return { kind: "view", label: `Visited ${r.path ?? "/"}`, time: Number(r.ts), country: r.country ?? undefined };
      }),
      ...recentDonations.map((d): Activity => ({
        kind: "donation",
        label: `Gift · ${d.currency === "ZAR" ? "R" : d.currency + " "}${d.amount.toLocaleString()}`,
        time: d.time,
      })),
    ]
      .sort((a, b) => b.time - a.time)
      .slice(0, 15);

    const payload: AnalyticsPayload = {
      fetchedAt: now,
      totalViews: Number(totalsRow?.views ?? 0),
      viewsToday: Number(todayRow?.views ?? 0),
      activeNow: Number(activeRow?.c ?? 0),
      uniqueVisitors: Number(totalsRow?.uniques ?? 0),
      totalDownloads: Number(totalsRow?.downloads ?? 0),
      downloadsToday: Number(todayRow?.downloads ?? 0),
      totalPlays: Number(totalsRow?.plays ?? 0),
      playsToday: Number(todayRow?.plays ?? 0),
      viewsThisWeek: Number(weekRow?.thisW ?? 0),
      viewsLastWeek: Number(weekRow?.lastW ?? 0),
      topPages,
      topCountries,
      topSources,
      deviceSplit,
      topTracks,
      last7Days,
      recentDownloads,
      recentActivity: activity,
      totalDonations: Number(donRow?.n ?? 0),
      totalRaised: Number(donRow?.s ?? 0) / 100,
      raisedToday: Number(donRow?.today ?? 0) / 100,
      raisedCurrency,
      recentDonations,
    };
    return Response.json(payload, { headers: { "cache-control": "no-store" } });
  } catch (err) {
    return Response.json(
      { setupNeeded: false, error: err instanceof Error ? err.message : "D1 read failed" },
      { status: 500 },
    );
  }
}
