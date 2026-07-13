/**
 * GET /api/analytics
 *
 * Privacy-safe analytics for /dashboard/analytics. The selected range and
 * comparison period are applied consistently to every chart, table and card.
 */
import { album } from "@/content/album";
import {
  ACTIVE_WINDOW_MS,
  getDb,
  type D1Db,
} from "@/lib/analytics/store";
import {
  ANALYTICS_TIME_ZONE,
  DAY_MS,
  buildTimeBuckets,
  classifyTrafficSource,
  compareMetric,
  conversionRate,
  normaliseComparisonKey,
  normaliseDevice,
  normaliseRangeKey,
  resolveAnalyticsRange,
  resolveComparison,
  safeHost,
  sqliteBucketExpression,
  startOfDashboardDayMs,
  type AnalyticsComparison,
  type AnalyticsComparisonKey,
  type AnalyticsRange,
  type AnalyticsRangeKey,
  type BucketGranularity,
  type MetricComparison,
  type TrafficSourceClass,
} from "@/lib/analytics/metrics";

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
  amount: number;
  currency: string;
}

interface Activity {
  kind: "view" | "download" | "play" | "donation";
  label: string;
  time: number;
  country?: string;
}

interface SummaryMetrics {
  uniqueVisitors: number;
  pageViews: number;
  musicPlays: number;
  primaryCtaClicks: number;
  uniqueListeners: number;
  avgEngagementTimeSec: number | null;
  returningVisitorPct: number | null;
}

interface AnalyticsChangeSet {
  uniqueVisitors: MetricComparison;
  pageViews: MetricComparison;
  musicPlays: MetricComparison;
  primaryCtaClicks: MetricComparison;
  avgEngagementTimeSec: null;
  returningVisitorPct: null;
}

interface SeriesBucket {
  key: string;
  label: string;
  start: number;
  end: number;
  visitors: number;
  pageViews: number;
  musicPlays: number;
  primaryCtaClicks: number;
}

interface TrafficSourceRow {
  key: TrafficSourceClass["key"];
  label: string;
  visitors: number;
  percentage: number;
  change: MetricComparison;
  topDomain: string | null;
}

interface CampaignRow {
  campaign: string;
  source: string;
  medium: string;
  visitors: number;
  musicPlays: number;
  primaryCtaClicks: number;
  conversionRate: number | null;
}

interface TopPageRow {
  title: string;
  path: string;
  views: number;
  uniqueVisitors: number;
  avgEngagementTimeSec: number | null;
  ctaClicks: number | null;
  change: MetricComparison;
}

interface TrackMetricRow {
  title: string;
  playClicks: number;
  uniqueListeners: number | null;
  uniqueListenersSupported: boolean;
  avgListeningTimeSec: number | null;
  completionRate: number | null;
  externalClicks: number | null;
  change: MetricComparison;
  rawLabels: string[];
}

interface MusicAnalytics {
  totalPlayClicks: number;
  uniqueListeners: number | null;
  uniqueListenersSupported: boolean;
  completionRate: number | null;
  platformClicks: {
    spotify: number | null;
    apple: number | null;
    youtube: number | null;
    other: number | null;
  };
  tracks: TrackMetricRow[];
}

interface FunnelStep {
  label: string;
  count: number;
  continuationPct: number | null;
  detail: string;
}

interface FunnelAnalytics {
  steps: FunnelStep[];
  overallConversionPct: number | null;
  largestDropoff: string | null;
}

interface BreakdownRow {
  label: string;
  count: number;
  percentage: number;
  change: MetricComparison;
}

interface Insight {
  title: string;
  detail: string;
}

interface TrackingAuditRow {
  event: string;
  status: "tracked" | "partial" | "missing";
  note: string;
}

export interface AnalyticsPayload {
  setupNeeded?: boolean;
  fetchedAt: number;
  trackedSince: number;
  range: AnalyticsRange;
  comparison: AnalyticsComparison | null;
  summary: SummaryMetrics & { activeNow: number };
  previousSummary: SummaryMetrics | null;
  changes: AnalyticsChangeSet;
  series: {
    current: SeriesBucket[];
    comparison: SeriesBucket[];
  };
  trafficSources: TrafficSourceRow[];
  campaigns: CampaignRow[];
  topPagesDetailed: TopPageRow[];
  music: MusicAnalytics;
  funnel: FunnelAnalytics;
  breakdowns: {
    devices: BreakdownRow[];
    browsers: BreakdownRow[];
    countries: BreakdownRow[];
    cities: BreakdownRow[];
  };
  recentActivity: Activity[];
  insights: Insight[];
  trackingAudit: TrackingAuditRow[];
  unsupportedMetrics: string[];

  // Backwards-compatible fields from the earlier dashboard payload.
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
  totalDonations: number;
  totalRaised: number;
  raisedToday: number;
  raisedCurrency: string;
  recentDonations: DonationRow[];
}

type SourceKey = TrafficSourceClass["key"];

const SOURCE_ORDER: SourceKey[] = [
  "direct",
  "search",
  "social",
  "referral",
  "email",
  "campaign",
  "unknown",
];

const SOURCE_LABELS: Record<SourceKey, string> = {
  direct: "Direct",
  search: "Google / search",
  social: "Social",
  referral: "Referral websites",
  email: "Email",
  campaign: "Campaign links",
  unknown: "Unknown",
};

const UNSUPPORTED_METRICS = [
  "Average engagement time needs a duration or heartbeat event before it can be calculated.",
  "Returning visitor percentage needs a longer-lived anonymous visitor identifier; the current session id resets by tab.",
  "Browser split is not available because full user agents are not stored.",
  "Track completion and listening time need start/progress/end audio events.",
  "Spotify, Apple Music, YouTube and social follow clicks are not currently tracked.",
  "City-level location is not stored; only aggregate countries are available.",
  "UTM campaign reporting needs campaign fields to be captured on the entry event.",
];

function emptySummary(): SummaryMetrics {
  return {
    uniqueVisitors: 0,
    pageViews: 0,
    musicPlays: 0,
    primaryCtaClicks: 0,
    uniqueListeners: 0,
    avgEngagementTimeSec: null,
    returningVisitorPct: null,
  };
}

function buildChanges(current: SummaryMetrics, previous: SummaryMetrics | null): AnalyticsChangeSet {
  return {
    uniqueVisitors: compareMetric(current.uniqueVisitors, previous?.uniqueVisitors ?? null),
    pageViews: compareMetric(current.pageViews, previous?.pageViews ?? null),
    musicPlays: compareMetric(current.musicPlays, previous?.musicPlays ?? null),
    primaryCtaClicks: compareMetric(current.primaryCtaClicks, previous?.primaryCtaClicks ?? null),
    avgEngagementTimeSec: null,
    returningVisitorPct: null,
  };
}

async function getTrackedBounds(db: D1Db): Promise<{ first: number | null; last: number | null }> {
  const row = await db
    .prepare("SELECT MIN(ts) AS first, MAX(ts) AS last FROM events")
    .first<{ first: number | null; last: number | null }>();
  return {
    first: row?.first ? Number(row.first) : null,
    last: row?.last ? Number(row.last) : null,
  };
}

async function getSummary(db: D1Db, start: number, end: number): Promise<SummaryMetrics> {
  const row = await db
    .prepare(
      "SELECT " +
        "COUNT(CASE WHEN type='view' THEN 1 END) AS pageViews, " +
        "COUNT(DISTINCT CASE WHEN type='view' AND sid<>'' THEN sid END) AS uniqueVisitors, " +
        "COUNT(CASE WHEN type='play' THEN 1 END) AS musicPlays, " +
        "COUNT(DISTINCT CASE WHEN type='play' AND sid<>'' THEN sid END) AS uniqueListeners, " +
        "COUNT(CASE WHEN type='download' THEN 1 END) AS primaryCtaClicks " +
        "FROM events WHERE ts>=?1 AND ts<?2",
    )
    .bind(start, end)
    .first<{
      pageViews: number;
      uniqueVisitors: number;
      musicPlays: number;
      uniqueListeners: number;
      primaryCtaClicks: number;
    }>();

  return {
    uniqueVisitors: Number(row?.uniqueVisitors ?? 0),
    pageViews: Number(row?.pageViews ?? 0),
    musicPlays: Number(row?.musicPlays ?? 0),
    primaryCtaClicks: Number(row?.primaryCtaClicks ?? 0),
    uniqueListeners: Number(row?.uniqueListeners ?? 0),
    avgEngagementTimeSec: null,
    returningVisitorPct: null,
  };
}

async function getActiveNow(db: D1Db, now: number): Promise<number> {
  const row = await db
    .prepare("SELECT COUNT(DISTINCT sid) AS c FROM events WHERE type='view' AND sid<>'' AND ts>?1")
    .bind(now - ACTIVE_WINDOW_MS)
    .first<{ c: number }>();
  return Number(row?.c ?? 0);
}

async function getSeries(
  db: D1Db,
  start: number,
  end: number,
  granularity: BucketGranularity,
): Promise<SeriesBucket[]> {
  const buckets = buildTimeBuckets(start, end, granularity).map((bucket): SeriesBucket => ({
    ...bucket,
    visitors: 0,
    pageViews: 0,
    musicPlays: 0,
    primaryCtaClicks: 0,
  }));
  const byKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));
  if (buckets.length === 0) return buckets;

  const bucketExpr = sqliteBucketExpression(granularity);
  const rows = await db
    .prepare(
      `SELECT ${bucketExpr} AS bucket, type, COUNT(*) AS c, ` +
        "COUNT(DISTINCT CASE WHEN type='view' AND sid<>'' THEN sid END) AS visitors " +
        "FROM events WHERE ts>=?1 AND ts<?2 GROUP BY bucket, type",
    )
    .bind(start, end)
    .all<{ bucket: string; type: string; c: number; visitors: number }>();

  for (const row of rows.results ?? []) {
    const bucket = byKey.get(row.bucket);
    if (!bucket) continue;
    const count = Number(row.c ?? 0);
    if (row.type === "view") {
      bucket.pageViews = count;
      bucket.visitors = Number(row.visitors ?? 0);
    } else if (row.type === "play") {
      bucket.musicPlays = count;
    } else if (row.type === "download") {
      bucket.primaryCtaClicks = count;
    }
  }

  return buckets;
}

async function getSourceRows(
  db: D1Db,
  start: number,
  end: number,
): Promise<{ ref: string | null; visitors: number; views: number }[]> {
  const rows = await db
    .prepare(
      "SELECT COALESCE(ref,'unknown') AS ref, " +
        "COUNT(DISTINCT CASE WHEN sid<>'' THEN sid END) AS visitors, " +
        "COUNT(*) AS views " +
        "FROM events " +
        "WHERE type='view' AND ts>=?1 AND ts<?2 AND COALESCE(ref,'')<>'internal' " +
        "GROUP BY COALESCE(ref,'unknown')",
    )
    .bind(start, end)
    .all<{ ref: string | null; visitors: number; views: number }>();
  return rows.results ?? [];
}

function aggregateSources(
  currentRows: { ref: string | null; visitors: number; views: number }[],
  previousRows: { ref: string | null; visitors: number; views: number }[],
  comparisonActive: boolean,
): TrafficSourceRow[] {
  const current = createSourceMap();
  const previous = createSourceMap();

  addSourceRows(current, currentRows);
  addSourceRows(previous, previousRows);

  const total = SOURCE_ORDER.reduce((sum, key) => sum + current.get(key)!.visitors, 0);
  return SOURCE_ORDER.map((key) => {
    const item = current.get(key)!;
    const prior = previous.get(key)!;
    const topDomain = [...item.domains.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    return {
      key,
      label: SOURCE_LABELS[key],
      visitors: item.visitors,
      percentage: total > 0 ? (item.visitors / total) * 100 : 0,
      change: compareMetric(item.visitors, comparisonActive ? prior.visitors : null),
      topDomain,
    };
  });
}

function createSourceMap(): Map<SourceKey, { visitors: number; domains: Map<string, number> }> {
  return new Map(SOURCE_ORDER.map((key) => [key, { visitors: 0, domains: new Map<string, number>() }]));
}

function addSourceRows(
  map: Map<SourceKey, { visitors: number; domains: Map<string, number> }>,
  rows: { ref: string | null; visitors: number; views: number }[],
): void {
  for (const row of rows) {
    const source = classifyTrafficSource(row.ref);
    const visitors = Number(row.visitors || row.views || 0);
    const bucket = map.get(source.key)!;
    bucket.visitors += visitors;
    const host = safeHost(row.ref);
    if (source.key !== "direct" && source.key !== "unknown" && host && host !== "internal") {
      bucket.domains.set(host, (bucket.domains.get(host) ?? 0) + visitors);
    }
  }
}

async function getTopPageRows(
  db: D1Db,
  start: number,
  end: number,
  comparison: AnalyticsComparison | null,
): Promise<TopPageRow[]> {
  const [currentRows, previousRows] = await Promise.all([
    db
      .prepare(
        "SELECT path, COUNT(*) AS views, " +
          "COUNT(DISTINCT CASE WHEN sid<>'' THEN sid END) AS visitors " +
          "FROM events WHERE type='view' AND ts>=?1 AND ts<?2 AND path IS NOT NULL " +
          "GROUP BY path ORDER BY views DESC LIMIT 200",
      )
      .bind(start, end)
      .all<{ path: string; views: number; visitors: number }>(),
    comparison
      ? db
          .prepare(
            "SELECT path, COUNT(*) AS views FROM events " +
              "WHERE type='view' AND ts>=?1 AND ts<?2 AND path IS NOT NULL GROUP BY path",
          )
          .bind(comparison.start, comparison.end)
          .all<{ path: string; views: number }>()
      : Promise.resolve({ results: [] as { path: string; views: number }[] }),
  ]);

  const previousByPath = new Map(
    (previousRows.results ?? []).map((row) => [row.path, Number(row.views ?? 0)]),
  );

  return (currentRows.results ?? []).map((row) => {
    const views = Number(row.views ?? 0);
    return {
      title: titleForPath(row.path),
      path: row.path,
      views,
      uniqueVisitors: Number(row.visitors ?? 0),
      avgEngagementTimeSec: null,
      ctaClicks: null,
      change: compareMetric(views, comparison ? previousByPath.get(row.path) ?? 0 : null),
    };
  });
}

function titleForPath(path: string): string {
  if (!path || path === "/") return "Home";
  const clean = path.split("?")[0].replace(/^\/+|\/+$/g, "");
  if (!clean) return "Home";
  if (clean === "album/from-darkness-to-light") return "Album - From Darkness To Light";
  return clean
    .split("/")
    .map((part) =>
      part
        .replace(/-/g, " ")
        .replace(/\b\w/g, (match) => match.toUpperCase()),
    )
    .join(" / ");
}

async function getTrackMetrics(
  db: D1Db,
  start: number,
  end: number,
  comparison: AnalyticsComparison | null,
  summary: SummaryMetrics,
): Promise<MusicAnalytics> {
  const [currentRows, previousRows] = await Promise.all([
    getPlayRows(db, start, end),
    comparison ? getPlayRows(db, comparison.start, comparison.end) : Promise.resolve([]),
  ]);

  const current = aggregatePlayRows(currentRows);
  const previous = aggregatePlayRows(previousRows);
  const orderedTitles = [...album.tracks.map((track) => track.title)];
  for (const title of current.keys()) {
    if (!orderedTitles.includes(title)) orderedTitles.push(title);
  }

  const tracks = orderedTitles.map((title): TrackMetricRow => {
    const row = current.get(title) ?? createTrackAccumulator();
    const prior = previous.get(title) ?? createTrackAccumulator();
    const uniqueListeners = row.listeners.size;
    const uniqueSupported = row.playClicks === 0 || uniqueListeners > 0;
    return {
      title,
      playClicks: row.playClicks,
      uniqueListeners: uniqueSupported ? uniqueListeners : null,
      uniqueListenersSupported: uniqueSupported,
      avgListeningTimeSec: null,
      completionRate: null,
      externalClicks: null,
      change: compareMetric(row.playClicks, comparison ? prior.playClicks : null),
      rawLabels: [...row.rawLabels],
    };
  });

  const overallUniqueSupported = summary.musicPlays === 0 || summary.uniqueListeners > 0;

  return {
    totalPlayClicks: summary.musicPlays,
    uniqueListeners: overallUniqueSupported ? summary.uniqueListeners : null,
    uniqueListenersSupported: overallUniqueSupported,
    completionRate: null,
    platformClicks: {
      spotify: null,
      apple: null,
      youtube: null,
      other: null,
    },
    tracks,
  };
}

async function getPlayRows(
  db: D1Db,
  start: number,
  end: number,
): Promise<{ file: string; sid: string; count: number }[]> {
  const rows = await db
    .prepare(
      "SELECT COALESCE(file,'Unknown track') AS file, COALESCE(sid,'') AS sid, COUNT(*) AS count " +
        "FROM events WHERE type='play' AND ts>=?1 AND ts<?2 GROUP BY COALESCE(file,'Unknown track'), COALESCE(sid,'')",
    )
    .bind(start, end)
    .all<{ file: string; sid: string; count: number }>();
  return rows.results ?? [];
}

function createTrackAccumulator(): { playClicks: number; listeners: Set<string>; rawLabels: Set<string> } {
  return { playClicks: 0, listeners: new Set<string>(), rawLabels: new Set<string>() };
}

function aggregatePlayRows(rows: { file: string; sid: string; count: number }[]) {
  const map = new Map<string, ReturnType<typeof createTrackAccumulator>>();
  for (const track of album.tracks) {
    map.set(track.title, createTrackAccumulator());
  }

  for (const row of rows) {
    const title = trackTitleForFile(row.file);
    const item = map.get(title) ?? createTrackAccumulator();
    item.playClicks += Number(row.count ?? 0);
    if (row.sid) item.listeners.add(row.sid);
    if (row.file) item.rawLabels.add(row.file);
    map.set(title, item);
  }

  return map;
}

function trackTitleForFile(file: string): string {
  const lower = file.toLowerCase();
  for (const track of album.tracks) {
    const refVs = track.ref.toLowerCase().replace(":", " vs ");
    if (lower.includes(track.title.toLowerCase()) || lower.includes(track.ref.toLowerCase()) || lower.includes(refVs)) {
      return track.title;
    }
  }
  return file || "Unknown track";
}

async function getFunnel(db: D1Db, start: number, end: number, summary: SummaryMetrics): Promise<FunnelAnalytics> {
  const engagedRow = await db
    .prepare(
      "SELECT COUNT(*) AS c FROM (" +
        "SELECT sid FROM events WHERE ts>=?1 AND ts<?2 AND sid<>'' GROUP BY sid " +
        "HAVING COUNT(CASE WHEN type='view' THEN 1 END)>1 OR COUNT(CASE WHEN type='play' THEN 1 END)>0" +
        ")",
    )
    .bind(start, end)
    .first<{ c: number }>();

  const steps: FunnelStep[] = [
    {
      label: "Website visitor",
      count: summary.uniqueVisitors,
      continuationPct: null,
      detail: "Distinct anonymous sessions with at least one page view.",
    },
    {
      label: "Engaged visitor",
      count: Number(engagedRow?.c ?? 0),
      continuationPct: null,
      detail: "Session with more than one page view or at least one music play.",
    },
    {
      label: "Music play click",
      count: summary.musicPlays,
      continuationPct: null,
      detail: "Actual play-click events. Not completed streams.",
    },
    {
      label: "Album download click",
      count: summary.primaryCtaClicks,
      continuationPct: null,
      detail: "Current primary CTA: album download clicks.",
    },
  ];

  let largestDropoff: string | null = null;
  let largestDrop = -1;
  for (let i = 0; i < steps.length - 1; i += 1) {
    const current = steps[i];
    const next = steps[i + 1];
    current.continuationPct = conversionRate(next.count, current.count);
    const drop = current.count - next.count;
    if (drop > largestDrop) {
      largestDrop = drop;
      largestDropoff = `${current.label} to ${next.label}`;
    }
  }

  const first = steps[0];
  const last = steps[steps.length - 1];
  return {
    steps,
    overallConversionPct: conversionRate(last.count, first.count),
    largestDropoff: largestDrop > 0 ? largestDropoff : null,
  };
}

async function getBreakdown(
  db: D1Db,
  start: number,
  end: number,
  comparison: AnalyticsComparison | null,
  kind: "device" | "country",
): Promise<BreakdownRow[]> {
  const column = kind === "device" ? "device" : "country";
  const [currentRows, previousRows] = await Promise.all([
    db
      .prepare(
        `SELECT COALESCE(${column},'unknown') AS label, ` +
          "COUNT(DISTINCT CASE WHEN sid<>'' THEN sid END) AS visitors, COUNT(*) AS views " +
          "FROM events WHERE type='view' AND ts>=?1 AND ts<?2 GROUP BY label ORDER BY visitors DESC, views DESC LIMIT 12",
      )
      .bind(start, end)
      .all<{ label: string; visitors: number; views: number }>(),
    comparison
      ? db
          .prepare(
            `SELECT COALESCE(${column},'unknown') AS label, ` +
              "COUNT(DISTINCT CASE WHEN sid<>'' THEN sid END) AS visitors, COUNT(*) AS views " +
              "FROM events WHERE type='view' AND ts>=?1 AND ts<?2 GROUP BY label",
          )
          .bind(comparison.start, comparison.end)
          .all<{ label: string; visitors: number; views: number }>()
      : Promise.resolve({ results: [] as { label: string; visitors: number; views: number }[] }),
  ]);

  const previousMap = new Map(
    (previousRows.results ?? []).map((row) => [cleanBreakdownLabel(row.label, kind), Number(row.visitors || row.views || 0)]),
  );
  const current = (currentRows.results ?? []).map((row) => ({
    label: cleanBreakdownLabel(row.label, kind),
    count: Number(row.visitors || row.views || 0),
  }));
  const total = current.reduce((sum, row) => sum + row.count, 0);

  return current.map((row) => ({
    label: row.label,
    count: row.count,
    percentage: total > 0 ? (row.count / total) * 100 : 0,
    change: compareMetric(row.count, comparison ? previousMap.get(row.label) ?? 0 : null),
  }));
}

function cleanBreakdownLabel(label: string, kind: "device" | "country"): string {
  if (kind === "device") {
    const device = normaliseDevice(label);
    return device === "unknown" ? "Unknown" : device[0].toUpperCase() + device.slice(1);
  }
  return label && label !== "??" ? label.toUpperCase() : "Unknown";
}

async function getTopDownloads(db: D1Db, start: number, end: number): Promise<Count[]> {
  const rows = await db
    .prepare(
      "SELECT COALESCE(file,'Album download') AS file, COUNT(*) AS c " +
        "FROM events WHERE type='download' AND ts>=?1 AND ts<?2 GROUP BY file ORDER BY c DESC LIMIT 12",
    )
    .bind(start, end)
    .all<{ file: string; c: number }>();
  return (rows.results ?? []).map((row) => ({ label: row.file, count: Number(row.c ?? 0) }));
}

async function getDownloadCountries(db: D1Db, start: number, end: number): Promise<{ code: string; count: number }[]> {
  const rows = await db
    .prepare(
      "SELECT COALESCE(country,'Unknown') AS country, COUNT(*) AS c " +
        "FROM events WHERE type='download' AND ts>=?1 AND ts<?2 GROUP BY country ORDER BY c DESC LIMIT 10",
    )
    .bind(start, end)
    .all<{ country: string; c: number }>();
  return (rows.results ?? []).map((row) => ({
    code: row.country && row.country !== "??" ? row.country.toUpperCase() : "Unknown",
    count: Number(row.c ?? 0),
  }));
}

async function getRecentDownloads(db: D1Db, start: number, end: number): Promise<DownloadEvent[]> {
  const rows = await db
    .prepare(
      "SELECT COALESCE(file,'Album download') AS file, COALESCE(country,'??') AS country, ts " +
        "FROM events WHERE type='download' AND ts>=?1 AND ts<?2 ORDER BY ts DESC LIMIT 20",
    )
    .bind(start, end)
    .all<{ file: string; country: string; ts: number }>();
  return (rows.results ?? []).map((row) => ({
    time: Number(row.ts),
    file: row.file,
    country: row.country,
  }));
}

async function getRecentActivity(db: D1Db, now: number, recentDonations: DonationRow[]): Promise<Activity[]> {
  const rows = await db
    .prepare("SELECT type, path, file, country, ts FROM events WHERE ts>=?1 ORDER BY ts DESC LIMIT 24")
    .bind(now - DAY_MS)
    .all<{ type: string; path: string | null; file: string | null; country: string | null; ts: number }>();

  return [
    ...(rows.results ?? []).map((row): Activity => {
      if (row.type === "download") {
        return { kind: "download", label: "Album download clicked", time: Number(row.ts), country: row.country ?? undefined };
      }
      if (row.type === "play") {
        return { kind: "play", label: `Played ${row.file ?? "music"}`, time: Number(row.ts), country: row.country ?? undefined };
      }
      return { kind: "view", label: `Viewed ${row.path ?? "/"}`, time: Number(row.ts), country: row.country ?? undefined };
    }),
    ...recentDonations.map((donation): Activity => ({
      kind: "donation",
      label: `Legacy gift - ${donation.currency === "ZAR" ? "R" : donation.currency + " "}${donation.amount.toLocaleString()}`,
      time: donation.time,
    })),
  ]
    .sort((a, b) => b.time - a.time)
    .slice(0, 18);
}

async function getDonationSummary(db: D1Db, todayStart: number): Promise<{
  totalDonations: number;
  totalRaised: number;
  raisedToday: number;
  raisedCurrency: string;
  recentDonations: DonationRow[];
}> {
  const [summary, recent] = await Promise.all([
    db
      .prepare("SELECT COUNT(*) AS n, COALESCE(SUM(amount),0) AS s, COALESCE(SUM(CASE WHEN ts>=?1 THEN amount END),0) AS today FROM donations")
      .bind(todayStart)
      .first<{ n: number; s: number; today: number }>(),
    db.prepare("SELECT amount, currency, ts FROM donations ORDER BY ts DESC LIMIT 12").all<{ amount: number; currency: string; ts: number }>(),
  ]);

  const recentDonations = (recent.results ?? []).map((row) => ({
    time: Number(row.ts),
    amount: Number(row.amount) / 100,
    currency: row.currency ?? "ZAR",
  }));

  return {
    totalDonations: Number(summary?.n ?? 0),
    totalRaised: Number(summary?.s ?? 0) / 100,
    raisedToday: Number(summary?.today ?? 0) / 100,
    raisedCurrency: recentDonations[0]?.currency ?? "ZAR",
    recentDonations,
  };
}

function buildInsights(
  summary: SummaryMetrics,
  changes: AnalyticsChangeSet,
  trafficSources: TrafficSourceRow[],
  music: MusicAnalytics,
  devices: BreakdownRow[],
  comparison: AnalyticsComparison | null,
): Insight[] {
  const insights: Insight[] = [];
  const musicChange = changes.musicPlays;
  if (comparison && musicChange.previous !== null && musicChange.previous > 0 && musicChange.changePct !== null) {
    insights.push({
      title: "Music momentum",
      detail: `Music play clicks are ${musicChange.direction === "up" ? "up" : musicChange.direction === "down" ? "down" : "flat"} ${Math.abs(musicChange.changePct).toFixed(0)}% compared with ${comparison.label.toLowerCase()}.`,
    });
  }

  const leadingSource = trafficSources.filter((source) => source.visitors > 0).sort((a, b) => b.visitors - a.visitors)[0];
  if (leadingSource) {
    insights.push({
      title: "Leading source",
      detail: `${leadingSource.label} accounts for ${leadingSource.percentage.toFixed(0)}% of identifiable entry traffic in this range.`,
    });
  }

  const leadingTrack = music.tracks.filter((track) => track.playClicks > 0).sort((a, b) => b.playClicks - a.playClicks)[0];
  if (leadingTrack) {
    insights.push({
      title: "Top track",
      detail: `${leadingTrack.title} has the most play clicks in the selected period.`,
    });
  }

  const leadingDevice = devices.filter((device) => device.count > 0).sort((a, b) => b.count - a.count)[0];
  if (leadingDevice) {
    insights.push({
      title: "Device focus",
      detail: `${leadingDevice.label} visitors make up ${leadingDevice.percentage.toFixed(0)}% of the tracked audience for this range.`,
    });
  }

  if (summary.primaryCtaClicks > 0 && insights.length < 4) {
    insights.push({
      title: "Primary action",
      detail: `${summary.primaryCtaClicks.toLocaleString()} album download click${summary.primaryCtaClicks === 1 ? "" : "s"} happened in this range.`,
    });
  }

  return insights.slice(0, 4);
}

function trackingAudit(): TrackingAuditRow[] {
  return [
    { event: "Page views", status: "tracked", note: "Tracked with path, anonymous session id, country, referrer source and device." },
    { event: "Music play clicks", status: "tracked", note: "Tracked when the hero player or track preview starts playing." },
    { event: "Track started", status: "partial", note: "A play click is captured, but there is no separate audio-start event schema." },
    { event: "Track progress", status: "missing", note: "No progress or heartbeat events exist yet." },
    { event: "Track completed", status: "missing", note: "No end/completion event exists yet." },
    { event: "Spotify clicks", status: "missing", note: "External platform links are not currently tracked." },
    { event: "Apple Music clicks", status: "missing", note: "External platform links are not currently tracked." },
    { event: "YouTube clicks", status: "missing", note: "External platform links are not currently tracked." },
    { event: "Contact clicks", status: "missing", note: "Contact form and email actions are not currently written to analytics." },
    { event: "Email clicks", status: "missing", note: "Mail actions are not currently written to analytics." },
    { event: "Donation or support clicks", status: "partial", note: "Legacy donation confirmations exist, but support clicks are not tracked and public donations are no longer offered." },
    { event: "Social follow clicks", status: "missing", note: "Social link clicks are not currently written to analytics." },
    { event: "Newsletter signup", status: "missing", note: "No newsletter signup event is present in the current schema." },
    { event: "QR or campaign visits", status: "missing", note: "Referrer host is stored, but UTM campaign fields are not captured yet." },
    { event: "File or press-kit downloads", status: "partial", note: "Album zip downloads are tracked; press-kit or other file downloads are not." },
  ];
}

async function fixedWindowSummary(db: D1Db, now: number, days: number): Promise<SummaryMetrics> {
  const start = startOfDashboardDayMs(now) - (days - 1) * DAY_MS;
  return getSummary(db, start, now);
}

async function fixedDailyRows(db: D1Db, now: number, days: number): Promise<DayRow[]> {
  const start = startOfDashboardDayMs(now) - (days - 1) * DAY_MS;
  const rows = await getSeries(db, start, now, "day");
  return rows.map((row) => ({
    date: row.key,
    views: row.pageViews,
    visitors: row.visitors,
    plays: row.musicPlays,
    downloads: row.primaryCtaClicks,
  }));
}

function compactCountsFromPages(pages: TopPageRow[]): { path: string; count: number }[] {
  return pages.map((page) => ({ path: page.path, count: page.views }));
}

function compactCountsFromBreakdown(rows: BreakdownRow[]): Count[] {
  return rows.map((row) => ({ label: row.label, count: row.count }));
}

function countryCounts(rows: BreakdownRow[]): { code: string; count: number }[] {
  return rows.map((row) => ({ code: row.label, count: row.count }));
}

function compactTrackCounts(rows: TrackMetricRow[]): Count[] {
  return rows
    .filter((row) => row.playClicks > 0)
    .map((row) => ({ label: row.title, count: row.playClicks }));
}

export async function GET(req: Request) {
  const db = await getDb();
  if (!db) return Response.json({ setupNeeded: true });

  const now = Date.now();
  const url = new URL(req.url);
  const requestedRange = normaliseRangeKey(url.searchParams.get("range")) as AnalyticsRangeKey;
  const requestedComparison = normaliseComparisonKey(url.searchParams.get("compare")) as AnalyticsComparisonKey;

  try {
    const bounds = await getTrackedBounds(db);
    const trackedSince = bounds.first ?? now;
    const range = resolveAnalyticsRange(requestedRange, now, bounds.first);
    const rawComparison = resolveComparison(requestedComparison, range, bounds.first);
    const comparison = rawComparison?.available ? rawComparison : rawComparison;
    const comparisonForQuery = rawComparison?.available ? rawComparison : null;
    const todayStart = startOfDashboardDayMs(now);
    const weekStart = todayStart - 6 * DAY_MS;
    const previousWeekStart = todayStart - 13 * DAY_MS;
    const summary = await getSummary(db, range.start, range.end);
    const previousSummary = comparisonForQuery
      ? await getSummary(db, comparisonForQuery.start, comparisonForQuery.end)
      : null;

    const [
      activeNow,
      currentSeries,
      comparisonSeries,
      currentSourceRows,
      previousSourceRows,
      topPagesDetailed,
      devices,
      countries,
      topDownloads,
      music,
      funnel,
      donationSummary,
      todaySummary,
      sevenDaySummary,
      thirtyDaySummary,
      lifetimeSummary,
      thisWeekSummary,
      lastWeekSummary,
      last7Days,
      last30Days,
    ] = await Promise.all([
      getActiveNow(db, now),
      getSeries(db, range.start, range.end, range.granularity),
      comparisonForQuery ? getSeries(db, comparisonForQuery.start, comparisonForQuery.end, range.granularity) : Promise.resolve([]),
      getSourceRows(db, range.start, range.end),
      comparisonForQuery ? getSourceRows(db, comparisonForQuery.start, comparisonForQuery.end) : Promise.resolve([]),
      getTopPageRows(db, range.start, range.end, comparisonForQuery),
      getBreakdown(db, range.start, range.end, comparisonForQuery, "device"),
      getBreakdown(db, range.start, range.end, comparisonForQuery, "country"),
      getTopDownloads(db, range.start, range.end),
      getTrackMetrics(db, range.start, range.end, comparisonForQuery, summary),
      getFunnel(db, range.start, range.end, summary),
      getDonationSummary(db, todayStart),
      getSummary(db, todayStart, now),
      fixedWindowSummary(db, now, 7),
      fixedWindowSummary(db, now, 30),
      getSummary(db, 0, now),
      getSummary(db, weekStart, now),
      getSummary(db, previousWeekStart, weekStart),
      fixedDailyRows(db, now, 7),
      fixedDailyRows(db, now, 30),
    ]);

    const changes = buildChanges(summary, previousSummary);
    const trafficSources = aggregateSources(currentSourceRows, previousSourceRows, Boolean(comparisonForQuery));
    const recentActivity = await getRecentActivity(db, now, donationSummary.recentDonations);
    const insights = buildInsights(summary, changes, trafficSources, music, devices, comparisonForQuery);
    const legacyTopPages = await getTopPageRows(db, 0, now, null);
    const legacyCountries = await getBreakdown(db, 0, now, null, "country");
    const legacyDevices = await getBreakdown(db, 0, now, null, "device");
    const legacySources = aggregateSources(await getSourceRows(db, 0, now), [], false);
    const legacyDownloads = await getTopDownloads(db, 0, now);
    const legacyDownloadCountries = await getDownloadCountries(db, 0, now);
    const legacyMusic = await getTrackMetrics(db, 0, now, null, lifetimeSummary);
    const recentDownloads = await getRecentDownloads(db, 0, now);

    const payload: AnalyticsPayload = {
      fetchedAt: now,
      trackedSince,
      range,
      comparison,
      summary: { ...summary, activeNow },
      previousSummary,
      changes,
      series: {
        current: currentSeries,
        comparison: comparisonSeries,
      },
      trafficSources,
      campaigns: [],
      topPagesDetailed,
      music,
      funnel,
      breakdowns: {
        devices,
        browsers: [],
        countries,
        cities: [],
      },
      recentActivity,
      insights,
      trackingAudit: trackingAudit(),
      unsupportedMetrics: UNSUPPORTED_METRICS,

      totalViews: lifetimeSummary.pageViews,
      viewsToday: todaySummary.pageViews,
      activeNow,
      uniqueVisitors: lifetimeSummary.uniqueVisitors,
      visitorsToday: todaySummary.uniqueVisitors,
      totalDownloads: lifetimeSummary.primaryCtaClicks,
      downloadsToday: todaySummary.primaryCtaClicks,
      totalPlays: lifetimeSummary.musicPlays,
      playsToday: todaySummary.musicPlays,
      views7d: sevenDaySummary.pageViews,
      visitors7d: sevenDaySummary.uniqueVisitors,
      downloads7d: sevenDaySummary.primaryCtaClicks,
      plays7d: sevenDaySummary.musicPlays,
      views30d: thirtyDaySummary.pageViews,
      visitors30d: thirtyDaySummary.uniqueVisitors,
      downloads30d: thirtyDaySummary.primaryCtaClicks,
      plays30d: thirtyDaySummary.musicPlays,
      viewsThisWeek: thisWeekSummary.pageViews,
      viewsLastWeek: lastWeekSummary.pageViews,
      downloadsThisWeek: thisWeekSummary.primaryCtaClicks,
      downloadsLastWeek: lastWeekSummary.primaryCtaClicks,
      playsThisWeek: thisWeekSummary.musicPlays,
      playsLastWeek: lastWeekSummary.musicPlays,
      topPages: compactCountsFromPages(legacyTopPages).slice(0, 10),
      topCountries: countryCounts(legacyCountries).slice(0, 10),
      topDownloadCountries: legacyDownloadCountries,
      topSources: legacySources.map((source) => ({ label: source.label, count: source.visitors })).filter((source) => source.count > 0),
      deviceSplit: compactCountsFromBreakdown(legacyDevices),
      topTracks: compactTrackCounts(legacyMusic.tracks).slice(0, 8),
      topDownloads: legacyDownloads,
      last7Days,
      last30Days,
      recentDownloads,
      totalDonations: donationSummary.totalDonations,
      totalRaised: donationSummary.totalRaised,
      raisedToday: donationSummary.raisedToday,
      raisedCurrency: donationSummary.raisedCurrency,
      recentDonations: donationSummary.recentDonations,
    };

    return Response.json(payload, { headers: { "cache-control": "no-store" } });
  } catch (err) {
    return Response.json(
      {
        setupNeeded: false,
        error: err instanceof Error ? err.message : "D1 read failed",
        timezone: ANALYTICS_TIME_ZONE,
      },
      { status: 500 },
    );
  }
}
