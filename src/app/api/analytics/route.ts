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
  visitors: number;
  plays: number;
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
  trackedSince: number;
  totalViews: number;
  viewsToday: number;
  activeNow: number;
  uniqueVisitors: number;
  visitorsToday: number;
  totalDownloads: number;
  downloadsToday: number;
  totalPlays: number;
  playsToday: number;
  views7d: number;
  visitors7d: number;
  downloads7d: number;
  plays7d: number;
  views30d: number;
  visitors30d: number;
  downloads30d: number;
  plays30d: number;
  viewsThisWeek: number;
  viewsLastWeek: number;
  downloadsThisWeek: number;
  downloadsLastWeek: number;
  playsThisWeek: number;
  playsLastWeek: number;
  topPages: { path: string; count: number }[];
  topCountries: { code: string; count: number }[];
  topDownloadCountries: { code: string; count: number }[];
  topSources: Count[];
  deviceSplit: Count[];
  topTracks: Count[];
  topDownloads: Count[];
  last7Days: DayRow[];
  last30Days: DayRow[];
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
  const thirtyDaysAgo = now - 30 * 86_400_000;
  const thirtyDayStart = startOfUtcDayMs(new Date(thirtyDaysAgo));

  // Owner dashboard wants true lifetime numbers: "all time" means every row
  // stored in D1, not a launch-day reset. Keep any filtering decision in the UI
  // layer later if a campaign view is needed.
  const since = 0;

  try {
    const [
      totalsRow,
      todayRow,
      activeRow,
      weekRow,
      periodRow,
      topPathsRes,
      topCountriesRes,
      topDownloadCountriesRes,
      topSourcesRes,
      deviceRes,
      topTracksRes,
      topDownloadsRes,
      perDayRes,
      perDay30Res,
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
            "FROM events WHERE ts>=?1",
        )
        .bind(since)
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
        .prepare(
          "SELECT " +
            "COUNT(CASE WHEN type='view' AND ts>=?1 THEN 1 END) AS viewsToday, " +
            "COUNT(DISTINCT CASE WHEN type='view' AND sid<>'' AND ts>=?1 THEN sid END) AS visitorsToday, " +
            "COUNT(CASE WHEN type='download' AND ts>=?1 THEN 1 END) AS downloadsToday, " +
            "COUNT(CASE WHEN type='play' AND ts>=?1 THEN 1 END) AS playsToday, " +
            "COUNT(CASE WHEN type='view' AND ts>=?2 THEN 1 END) AS views7d, " +
            "COUNT(DISTINCT CASE WHEN type='view' AND sid<>'' AND ts>=?2 THEN sid END) AS visitors7d, " +
            "COUNT(CASE WHEN type='download' AND ts>=?2 THEN 1 END) AS downloads7d, " +
            "COUNT(CASE WHEN type='play' AND ts>=?2 THEN 1 END) AS plays7d, " +
            "COUNT(CASE WHEN type='view' AND ts>=?3 THEN 1 END) AS views30d, " +
            "COUNT(DISTINCT CASE WHEN type='view' AND sid<>'' AND ts>=?3 THEN sid END) AS visitors30d, " +
            "COUNT(CASE WHEN type='download' AND ts>=?3 THEN 1 END) AS downloads30d, " +
            "COUNT(CASE WHEN type='play' AND ts>=?3 THEN 1 END) AS plays30d, " +
            "COUNT(CASE WHEN type='download' AND ts>=?2 THEN 1 END) AS downloadsThisWeek, " +
            "COUNT(CASE WHEN type='download' AND ts>=?4 AND ts<?2 THEN 1 END) AS downloadsLastWeek, " +
            "COUNT(CASE WHEN type='play' AND ts>=?2 THEN 1 END) AS playsThisWeek, " +
            "COUNT(CASE WHEN type='play' AND ts>=?4 AND ts<?2 THEN 1 END) AS playsLastWeek " +
            "FROM events",
        )
        .bind(todayStart, weekAgo, thirtyDayStart, twoWeeksAgo)
        .first<{
          viewsToday: number;
          visitorsToday: number;
          downloadsToday: number;
          playsToday: number;
          views7d: number;
          visitors7d: number;
          downloads7d: number;
          plays7d: number;
          views30d: number;
          visitors30d: number;
          downloads30d: number;
          plays30d: number;
          downloadsThisWeek: number;
          downloadsLastWeek: number;
          playsThisWeek: number;
          playsLastWeek: number;
        }>(),
      db
        .prepare("SELECT path, COUNT(*) AS c FROM events WHERE type='view' AND ts>=?1 AND path IS NOT NULL GROUP BY path ORDER BY c DESC LIMIT 10")
        .bind(since)
        .all<{ path: string; c: number }>(),
      db
        // Unique visitors per country (distinct sessions), not raw page views —
        // "Where visitors come from" should count people, not page loads.
        .prepare("SELECT country, COUNT(DISTINCT CASE WHEN sid<>'' THEN sid END) AS c FROM events WHERE type='view' AND ts>=?1 AND country IS NOT NULL GROUP BY country ORDER BY c DESC LIMIT 10")
        .bind(since)
        .all<{ country: string; c: number }>(),
      db
        .prepare("SELECT country, COUNT(*) AS c FROM events WHERE type='download' AND ts>=?1 AND country IS NOT NULL GROUP BY country ORDER BY c DESC LIMIT 8")
        .bind(since)
        .all<{ country: string; c: number }>(),
      db
        .prepare("SELECT ref, COUNT(*) AS c FROM events WHERE type='view' AND ts>=?1 AND ref IS NOT NULL AND ref<>'internal' GROUP BY ref ORDER BY c DESC LIMIT 8")
        .bind(since)
        .all<{ ref: string; c: number }>(),
      db
        .prepare("SELECT device, COUNT(*) AS c FROM events WHERE type='view' AND ts>=?1 AND device IS NOT NULL GROUP BY device ORDER BY c DESC")
        .bind(since)
        .all<{ device: string; c: number }>(),
      db
        .prepare("SELECT file, COUNT(*) AS c FROM events WHERE type='play' AND ts>=?1 AND file IS NOT NULL GROUP BY file ORDER BY c DESC LIMIT 8")
        .bind(since)
        .all<{ file: string; c: number }>(),
      db
        .prepare("SELECT COALESCE(file,'Album download') AS file, COUNT(*) AS c FROM events WHERE type='download' AND ts>=?1 GROUP BY file ORDER BY c DESC LIMIT 8")
        .bind(since)
        .all<{ file: string; c: number }>(),
      db
        .prepare("SELECT date(ts/1000,'unixepoch') AS d, type, COUNT(*) AS c, COUNT(DISTINCT CASE WHEN type='view' AND sid<>'' THEN sid END) AS visitors FROM events WHERE ts>=?1 GROUP BY d, type")
        .bind(weekStart)
        .all<{ d: string; type: string; c: number; visitors: number }>(),
      db
        .prepare("SELECT date(ts/1000,'unixepoch') AS d, type, COUNT(*) AS c, COUNT(DISTINCT CASE WHEN type='view' AND sid<>'' THEN sid END) AS visitors FROM events WHERE ts>=?1 GROUP BY d, type")
        .bind(thirtyDayStart)
        .all<{ d: string; type: string; c: number; visitors: number }>(),
      db
        .prepare("SELECT type, path, file, country, ts FROM events WHERE ts>=?1 ORDER BY ts DESC LIMIT 18")
        .bind(since)
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
    const topDownloadCountries = (topDownloadCountriesRes.results ?? []).map((r) => ({ code: r.country, count: Number(r.c) }));
    const topSources: Count[] = (topSourcesRes.results ?? []).map((r) => ({ label: r.ref, count: Number(r.c) }));
    const deviceSplit: Count[] = (deviceRes.results ?? []).map((r) => ({ label: r.device, count: Number(r.c) }));
    const topTracks: Count[] = (topTracksRes.results ?? []).map((r) => ({ label: r.file, count: Number(r.c) }));
    const topDownloads: Count[] = (topDownloadsRes.results ?? []).map((r) => ({ label: r.file, count: Number(r.c) }));

    const last7Days: DayRow[] = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - (6 - i));
      return { date: utcDayKey(d), views: 0, visitors: 0, plays: 0, downloads: 0 };
    });
    const byDate = new Map(last7Days.map((r) => [r.date, r]));
    for (const row of perDayRes.results ?? []) {
      const t = byDate.get(row.d);
      if (!t) continue;
      if (row.type === "view") t.views = Number(row.c);
      if (row.type === "view") t.visitors = Number(row.visitors ?? 0);
      else if (row.type === "download") t.downloads = Number(row.c);
      else if (row.type === "play") t.plays = Number(row.c);
    }

    const last30Days: DayRow[] = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - (29 - i));
      return { date: utcDayKey(d), views: 0, visitors: 0, plays: 0, downloads: 0 };
    });
    const byDate30 = new Map(last30Days.map((r) => [r.date, r]));
    for (const row of perDay30Res.results ?? []) {
      const t = byDate30.get(row.d);
      if (!t) continue;
      if (row.type === "view") {
        t.views = Number(row.c);
        t.visitors = Number(row.visitors ?? 0);
      } else if (row.type === "download") t.downloads = Number(row.c);
      else if (row.type === "play") t.plays = Number(row.c);
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
      trackedSince: since,
      totalViews: Number(totalsRow?.views ?? 0),
      viewsToday: Number(periodRow?.viewsToday ?? todayRow?.views ?? 0),
      activeNow: Number(activeRow?.c ?? 0),
      uniqueVisitors: Number(totalsRow?.uniques ?? 0),
      visitorsToday: Number(periodRow?.visitorsToday ?? 0),
      totalDownloads: Number(totalsRow?.downloads ?? 0),
      downloadsToday: Number(periodRow?.downloadsToday ?? todayRow?.downloads ?? 0),
      totalPlays: Number(totalsRow?.plays ?? 0),
      playsToday: Number(periodRow?.playsToday ?? todayRow?.plays ?? 0),
      views7d: Number(periodRow?.views7d ?? 0),
      visitors7d: Number(periodRow?.visitors7d ?? 0),
      downloads7d: Number(periodRow?.downloads7d ?? 0),
      plays7d: Number(periodRow?.plays7d ?? 0),
      views30d: Number(periodRow?.views30d ?? 0),
      visitors30d: Number(periodRow?.visitors30d ?? 0),
      downloads30d: Number(periodRow?.downloads30d ?? 0),
      plays30d: Number(periodRow?.plays30d ?? 0),
      viewsThisWeek: Number(weekRow?.thisW ?? 0),
      viewsLastWeek: Number(weekRow?.lastW ?? 0),
      downloadsThisWeek: Number(periodRow?.downloadsThisWeek ?? 0),
      downloadsLastWeek: Number(periodRow?.downloadsLastWeek ?? 0),
      playsThisWeek: Number(periodRow?.playsThisWeek ?? 0),
      playsLastWeek: Number(periodRow?.playsLastWeek ?? 0),
      topPages,
      topCountries,
      topDownloadCountries,
      topSources,
      deviceSplit,
      topTracks,
      topDownloads,
      last7Days,
      last30Days,
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
