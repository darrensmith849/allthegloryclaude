/**
 * GET /api/analytics
 *
 * Aggregates the numbers behind /dashboard/analytics from the D1 store.
 * Polled by that page so the dashboard stays close to live.
 *
 * D1 is always bound in production, so `setupNeeded` is only ever true in a
 * local dev environment without the Cloudflare proxy.
 */
import {
  getDb,
  startOfUtcDayMs,
  utcDayKey,
  ACTIVE_WINDOW_MS,
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
interface DonationRow {
  time: number;
  amount: number; // major units (e.g. Rand)
  currency: string;
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
  // Donations ("money given" via Paystack).
  totalDonations: number; // number of gifts
  totalRaised: number; // sum of amounts, major units
  raisedToday: number; // today's sum, major units
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

  try {
    const [
      totalViewsRow,
      totalDownloadsRow,
      activeRow,
      topPathsRes,
      topCountriesRes,
      perDayRes,
      recentDownloadsRes,
      donTotalsRow,
      donTodayRow,
      donCurrencyRow,
      recentDonationsRes,
    ] = await Promise.all([
      db.prepare("SELECT COUNT(*) AS c FROM events WHERE type='view'").first<{ c: number }>(),
      db.prepare("SELECT COUNT(*) AS c FROM events WHERE type='download'").first<{ c: number }>(),
      db
        .prepare("SELECT COUNT(DISTINCT sid) AS c FROM events WHERE type='view' AND sid<>'' AND ts>?1")
        .bind(activeSince)
        .first<{ c: number }>(),
      db
        .prepare(
          "SELECT path, COUNT(*) AS c FROM events WHERE type='view' AND path IS NOT NULL GROUP BY path ORDER BY c DESC LIMIT 10",
        )
        .all<{ path: string; c: number }>(),
      db
        .prepare(
          "SELECT country, COUNT(*) AS c FROM events WHERE type='view' AND country IS NOT NULL GROUP BY country ORDER BY c DESC LIMIT 10",
        )
        .all<{ country: string; c: number }>(),
      db
        .prepare(
          "SELECT date(ts/1000,'unixepoch') AS d, type, COUNT(*) AS c FROM events WHERE ts>=?1 GROUP BY d, type",
        )
        .bind(weekStart)
        .all<{ d: string; type: string; c: number }>(),
      db
        .prepare(
          "SELECT file, country, ts FROM events WHERE type='download' ORDER BY ts DESC LIMIT 20",
        )
        .all<{ file: string; country: string; ts: number }>(),
      db.prepare("SELECT COUNT(*) AS n, COALESCE(SUM(amount),0) AS s FROM donations").first<{ n: number; s: number }>(),
      db.prepare("SELECT COALESCE(SUM(amount),0) AS s FROM donations WHERE ts>=?1").bind(todayStart).first<{ s: number }>(),
      db.prepare("SELECT currency FROM donations ORDER BY ts DESC LIMIT 1").first<{ currency: string }>(),
      db
        .prepare("SELECT amount, currency, ts FROM donations ORDER BY ts DESC LIMIT 10")
        .all<{ amount: number; currency: string; ts: number }>(),
    ]);

    const topPages: PathCount[] = (topPathsRes.results ?? []).map((r) => ({
      path: r.path,
      count: Number(r.c),
    }));
    const topCountries: CountryCount[] = (topCountriesRes.results ?? []).map((r) => ({
      code: r.country,
      count: Number(r.c),
    }));

    // Build the 7-day window (today minus 0..6, oldest first) and fill it.
    const last7Days: DayRow[] = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - (6 - i));
      return { date: utcDayKey(d), views: 0, downloads: 0 };
    });
    const byDate = new Map(last7Days.map((r) => [r.date, r]));
    for (const row of perDayRes.results ?? []) {
      const target = byDate.get(row.d);
      if (!target) continue;
      if (row.type === "view") target.views = Number(row.c);
      else if (row.type === "download") target.downloads = Number(row.c);
    }

    const recentDownloads: DownloadEvent[] = (recentDownloadsRes.results ?? []).map((r) => ({
      time: Number(r.ts),
      file: r.file,
      country: r.country ?? "??",
    }));

    const recentDonations: DonationRow[] = (recentDonationsRes.results ?? []).map((r) => ({
      time: Number(r.ts),
      amount: Number(r.amount) / 100,
      currency: r.currency ?? "ZAR",
    }));

    const payload: AnalyticsPayload = {
      fetchedAt: now,
      totalViews: Number(totalViewsRow?.c ?? 0),
      viewsToday: last7Days[6]?.views ?? 0,
      activeNow: Number(activeRow?.c ?? 0),
      totalDownloads: Number(totalDownloadsRow?.c ?? 0),
      downloadsToday: last7Days[6]?.downloads ?? 0,
      topPages,
      topCountries,
      last7Days,
      recentDownloads,
      totalDonations: Number(donTotalsRow?.n ?? 0),
      totalRaised: Number(donTotalsRow?.s ?? 0) / 100,
      raisedToday: Number(donTodayRow?.s ?? 0) / 100,
      raisedCurrency: donCurrencyRow?.currency ?? "ZAR",
      recentDonations,
    };
    return Response.json(payload, { headers: { "cache-control": "no-store" } });
  } catch (err) {
    return Response.json(
      {
        setupNeeded: false,
        error: err instanceof Error ? err.message : "D1 read failed",
      },
      { status: 500 },
    );
  }
}
