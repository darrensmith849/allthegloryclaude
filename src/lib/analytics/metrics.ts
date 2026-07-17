export const ANALYTICS_TIME_ZONE = "Africa/Johannesburg";
export const DAY_MS = 86_400_000;
export const HOUR_MS = 3_600_000;

const JOHANNESBURG_OFFSET_MS = 2 * 60 * 60 * 1000;

export type AnalyticsRangeKey = "7d" | "30d" | "90d" | "ytd" | "all";
export type AnalyticsComparisonKey = "previous" | "year" | "none";
export type BucketGranularity = "hour" | "day" | "month";
export type MetricDirection = "up" | "down" | "flat" | "new" | "none";

export interface AnalyticsRange {
  key: AnalyticsRangeKey;
  label: string;
  start: number;
  end: number;
  granularity: BucketGranularity;
  timezone: typeof ANALYTICS_TIME_ZONE;
}

export interface AnalyticsComparison {
  key: AnalyticsComparisonKey;
  label: string;
  start: number;
  end: number;
  available: boolean;
  reason?: string;
}

export interface TimeBucket {
  key: string;
  label: string;
  start: number;
  end: number;
}

export interface MetricComparison {
  current: number;
  previous: number | null;
  changePct: number | null;
  direction: MetricDirection;
}

export interface TrafficSourceClass {
  key: "direct" | "search" | "social" | "referral" | "email" | "campaign" | "unknown";
  label: string;
}

const RANGE_LABELS: Record<AnalyticsRangeKey, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  ytd: "This year",
  all: "All time",
};

const SOURCE_LABELS: Record<TrafficSourceClass["key"], string> = {
  direct: "Direct",
  search: "Google / search",
  social: "Social",
  referral: "Referral websites",
  email: "Email",
  campaign: "Campaign links",
  unknown: "Unknown",
};

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function shiftedDate(ms: number): Date {
  return new Date(ms + JOHANNESBURG_OFFSET_MS);
}

function localDateKey(ms: number): string {
  const d = shiftedDate(ms);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

function monthKey(ms: number): string {
  const d = shiftedDate(ms);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}`;
}

/** Must match sqliteBucketExpression("hour") exactly: 2026-07-17T08 */
function hourKey(ms: number): string {
  const d = shiftedDate(ms);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}T${pad2(d.getUTCHours())}`;
}

function startOfDashboardHourMs(ms: number): number {
  const d = shiftedDate(ms);
  return (
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours()) -
    JOHANNESBURG_OFFSET_MS
  );
}

export function startOfDashboardDayMs(ms: number = Date.now()): number {
  const d = shiftedDate(ms);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - JOHANNESBURG_OFFSET_MS;
}

export function startOfDashboardYearMs(ms: number = Date.now()): number {
  const d = shiftedDate(ms);
  return Date.UTC(d.getUTCFullYear(), 0, 1) - JOHANNESBURG_OFFSET_MS;
}

function startOfDashboardMonthMs(ms: number): number {
  const d = shiftedDate(ms);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1) - JOHANNESBURG_OFFSET_MS;
}

function addDashboardMonths(ms: number, months: number): number {
  const d = shiftedDate(ms);
  return (
    Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth() + months,
      1,
      d.getUTCHours(),
      d.getUTCMinutes(),
      d.getUTCSeconds(),
      d.getUTCMilliseconds(),
    ) - JOHANNESBURG_OFFSET_MS
  );
}

function addDashboardYears(ms: number, years: number): number {
  const d = shiftedDate(ms);
  return (
    Date.UTC(
      d.getUTCFullYear() + years,
      d.getUTCMonth(),
      d.getUTCDate(),
      d.getUTCHours(),
      d.getUTCMinutes(),
      d.getUTCSeconds(),
      d.getUTCMilliseconds(),
    ) - JOHANNESBURG_OFFSET_MS
  );
}

export function normaliseRangeKey(value: string | null | undefined): AnalyticsRangeKey {
  if (value === "7d" || value === "30d" || value === "90d" || value === "ytd" || value === "all") {
    return value;
  }
  return "30d";
}

export function normaliseComparisonKey(value: string | null | undefined): AnalyticsComparisonKey {
  if (value === "previous" || value === "year" || value === "none") return value;
  return "previous";
}

export function pickBucketGranularity(start: number, end: number): BucketGranularity {
  // A window of a couple of days or less (launch day itself, once the launch
  // floor clamps the range to "today") yields only one daily point, and a
  // single point cannot draw a line. Bucket by hour so the chart is a real
  // curve from the first day, then widen automatically as history builds up.
  if (end - start <= 2 * DAY_MS) return "hour";
  const days = Math.max(1, Math.ceil((end - start) / DAY_MS));
  return days > 120 ? "month" : "day";
}

export function resolveAnalyticsRange(
  key: AnalyticsRangeKey,
  now: number = Date.now(),
  trackedSince: number | null = null,
): AnalyticsRange {
  const todayStart = startOfDashboardDayMs(now);
  let start = todayStart - 29 * DAY_MS;

  if (key === "7d") start = todayStart - 6 * DAY_MS;
  if (key === "90d") start = todayStart - 89 * DAY_MS;
  if (key === "ytd") start = startOfDashboardYearMs(now);
  if (key === "all") {
    start = trackedSince ? startOfDashboardDayMs(trackedSince) : todayStart;
  }

  return {
    key,
    label: RANGE_LABELS[key],
    start,
    end: now,
    granularity: pickBucketGranularity(start, now),
    timezone: ANALYTICS_TIME_ZONE,
  };
}

export function resolveComparison(
  key: AnalyticsComparisonKey,
  range: Pick<AnalyticsRange, "key" | "start" | "end">,
  trackedSince: number | null = null,
): AnalyticsComparison | null {
  if (key === "none") return null;
  if (range.key === "all") {
    return {
      key,
      label: key === "year" ? "Previous year" : "Previous period",
      start: range.start,
      end: range.start,
      available: false,
      reason: "All-time views do not have a like-for-like comparison period.",
    };
  }

  if (key === "year") {
    const start = addDashboardYears(range.start, -1);
    const end = addDashboardYears(range.end, -1);
    return {
      key,
      label: "Previous year",
      start,
      end,
      available: !trackedSince || end >= trackedSince,
      reason: trackedSince && end < trackedSince ? "No tracking data existed for the previous-year period." : undefined,
    };
  }

  const duration = range.end - range.start;
  const start = range.start - duration;
  const end = range.start;
  return {
    key,
    label: "Previous period",
    start,
    end,
    available: !trackedSince || end >= trackedSince,
    reason: trackedSince && end < trackedSince ? "No tracking data existed for the previous period." : undefined,
  };
}

export function percentageChange(current: number, previous: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null;
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

export function compareMetric(current: number, previous: number | null): MetricComparison {
  if (previous === null) {
    return { current, previous, changePct: null, direction: "none" };
  }

  const changePct = percentageChange(current, previous);
  if (previous === 0 && current > 0) {
    return { current, previous, changePct, direction: "new" };
  }
  if (changePct === null || changePct === 0) {
    return { current, previous, changePct, direction: "flat" };
  }
  return { current, previous, changePct, direction: changePct > 0 ? "up" : "down" };
}

export function conversionRate(part: number, whole: number): number | null {
  if (whole <= 0) return null;
  return (part / whole) * 100;
}

export function classifyTrafficSource(ref: string | null | undefined): TrafficSourceClass {
  const raw = (ref ?? "").trim().toLowerCase();
  if (!raw) return { key: "unknown", label: SOURCE_LABELS.unknown };
  if (raw === "direct") return { key: "direct", label: SOURCE_LABELS.direct };
  if (raw === "internal") return { key: "unknown", label: SOURCE_LABELS.unknown };
  if (raw.includes("utm_")) return { key: "campaign", label: SOURCE_LABELS.campaign };

  let host = raw.replace(/^https?:\/\//, "").split("/")[0].replace(/^(www|l|m|lm)\./, "");
  host = host.split(":")[0];

  if (!host || host === "unknown") return { key: "unknown", label: SOURCE_LABELS.unknown };
  if (/mail|newsletter|email/.test(host)) return { key: "email", label: SOURCE_LABELS.email };
  if (/google|bing|duckduckgo|yahoo|ecosia/.test(host)) return { key: "search", label: SOURCE_LABELS.search };
  if (/instagram|facebook|fb\.|threads|tiktok|youtube|youtu\.be|twitter|x\.com|linkedin|whatsapp|pinterest/.test(host)) {
    return { key: "social", label: SOURCE_LABELS.social };
  }
  return { key: "referral", label: SOURCE_LABELS.referral };
}

export function normaliseDevice(device: string | null | undefined): "mobile" | "desktop" | "tablet" | "unknown" {
  const value = (device ?? "").toLowerCase();
  if (value === "mobile" || value === "desktop" || value === "tablet") return value;
  return "unknown";
}

export function buildTimeBuckets(start: number, end: number, granularity: BucketGranularity): TimeBucket[] {
  const buckets: TimeBucket[] = [];
  let cursor =
    granularity === "month"
      ? startOfDashboardMonthMs(start)
      : granularity === "hour"
        ? startOfDashboardHourMs(start)
        : startOfDashboardDayMs(start);

  while (cursor < end) {
    const next =
      granularity === "month"
        ? addDashboardMonths(cursor, 1)
        : granularity === "hour"
          ? cursor + HOUR_MS
          : cursor + DAY_MS;
    const key =
      granularity === "month"
        ? monthKey(cursor)
        : granularity === "hour"
          ? hourKey(cursor)
          : localDateKey(cursor);
    buckets.push({
      key,
      label:
        granularity === "month"
          ? formatMonthLabel(cursor)
          : granularity === "hour"
            ? formatHourLabel(cursor)
            : formatDayLabel(cursor),
      start: cursor,
      end: next,
    });
    cursor = next;
  }

  return buckets;
}

export function bucketKeyForTimestamp(ms: number, granularity: BucketGranularity): string {
  if (granularity === "month") return monthKey(ms);
  if (granularity === "hour") return hourKey(ms);
  return localDateKey(ms);
}

export function sqliteBucketExpression(granularity: BucketGranularity): string {
  if (granularity === "month") {
    return "strftime('%Y-%m', (ts / 1000) + 7200, 'unixepoch')";
  }
  if (granularity === "hour") {
    // Matches hourKey(): 2026-07-17T08, in SAST (+7200s).
    return "strftime('%Y-%m-%dT%H', (ts / 1000) + 7200, 'unixepoch')";
  }
  return "date((ts / 1000) + 7200, 'unixepoch')";
}

function formatHourLabel(ms: number): string {
  return new Intl.DateTimeFormat("en-ZA", {
    timeZone: ANALYTICS_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(ms);
}

function formatDayLabel(ms: number): string {
  return new Intl.DateTimeFormat("en-ZA", {
    timeZone: ANALYTICS_TIME_ZONE,
    month: "short",
    day: "numeric",
  }).format(ms);
}

function formatMonthLabel(ms: number): string {
  return new Intl.DateTimeFormat("en-ZA", {
    timeZone: ANALYTICS_TIME_ZONE,
    month: "short",
    year: "2-digit",
  }).format(ms);
}

export function safeHost(ref: string | null | undefined): string {
  const raw = (ref ?? "").trim().toLowerCase();
  if (!raw || raw === "direct" || raw === "internal") return raw || "unknown";
  return raw.replace(/^https?:\/\//, "").split("/")[0].replace(/^(www|l|m|lm)\./, "").split(":")[0] || "unknown";
}
