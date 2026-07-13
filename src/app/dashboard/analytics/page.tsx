"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Panel } from "@/components/dashboard/panel";
import type { AnalyticsPayload } from "@/app/api/analytics/route";

const POLL_MS = 30_000;

type RangeKey = "7d" | "30d" | "90d" | "ytd" | "all";
type CompareKey = "previous" | "year" | "none";
type ChartMetric = "visitors" | "pageViews" | "musicPlays" | "primaryCtaClicks";
type PageSort = "views" | "uniqueVisitors" | "path";
type Change = AnalyticsPayload["changes"]["pageViews"];

const RANGE_OPTIONS: { value: RangeKey; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "ytd", label: "This year" },
  { value: "all", label: "All time" },
];

const COMPARE_OPTIONS: { value: CompareKey; label: string }[] = [
  { value: "previous", label: "Previous period" },
  { value: "year", label: "Previous year" },
  { value: "none", label: "No comparison" },
];

const CHART_METRICS: { key: ChartMetric; label: string }[] = [
  { key: "visitors", label: "Visitors" },
  { key: "pageViews", label: "Page views" },
  { key: "musicPlays", label: "Music plays" },
  { key: "primaryCtaClicks", label: "CTA clicks" },
];

function normaliseRange(value: string | null): RangeKey {
  return RANGE_OPTIONS.some((option) => option.value === value) ? (value as RangeKey) : "30d";
}

function normaliseCompare(value: string | null): CompareKey {
  return COMPARE_OPTIONS.some((option) => option.value === value) ? (value as CompareKey) : "previous";
}

function flagFromCode(code: string): string {
  if (!code || code.length !== 2) return code || "??";
  const upper = code.toUpperCase();
  return upper
    .split("")
    .map((c) =>
      c >= "A" && c <= "Z"
        ? String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65)
        : c,
    )
    .join("");
}

function n(value: number) {
  return value.toLocaleString();
}

function pct(value: number | null, digits = 1) {
  if (value === null || !Number.isFinite(value)) return "Not enough data yet";
  return `${value.toFixed(digits).replace(/\.0$/, "")}%`;
}

function duration(seconds: number | null) {
  if (seconds === null || !Number.isFinite(seconds)) return "Not enough data yet";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  return `${minutes}m ${rest}s`;
}

function timeAgo(ms: number) {
  const s = Math.max(0, Math.round((Date.now() - ms) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86_400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86_400)}d ago`;
}

function formatUpdated(ms: number | null) {
  if (!ms) return "Not updated yet";
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(ms);
}

function changeLabel(change: Change | null): string {
  if (!change || change.previous === null) return "No comparison";
  if (change.direction === "new") return "New activity";
  if (change.changePct === null || change.changePct === 0) return "Flat";
  const sign = change.changePct > 0 ? "+" : "";
  return `${sign}${change.changePct.toFixed(0)}%`;
}

function changeTone(change: Change | null): "up" | "down" | "flat" | "none" {
  if (!change || change.previous === null) return "none";
  if (change.direction === "up" || change.direction === "new") return "up";
  if (change.direction === "down") return "down";
  return "flat";
}

function money(amount: number, currency: string) {
  const prefix = currency === "ZAR" ? "R" : `${currency} `;
  return `${prefix}${amount.toLocaleString()}`;
}

function csvCell(value: unknown): string {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function exportAnalyticsCsv(data: AnalyticsPayload) {
  const rows: unknown[][] = [
    ["section", "label", "metric", "value", "extra"],
    ["range", data.range.label, "start", new Date(data.range.start).toISOString(), data.range.timezone],
    ["range", data.range.label, "end", new Date(data.range.end).toISOString(), data.range.timezone],
    ["summary", "Unique visitors", "count", data.summary.uniqueVisitors, ""],
    ["summary", "Page views", "count", data.summary.pageViews, ""],
    ["summary", "Music play clicks", "count", data.summary.musicPlays, ""],
    ["summary", "Album download CTA clicks", "count", data.summary.primaryCtaClicks, ""],
    ...data.series.current.map((row) => ["series", row.label, "visitors", row.visitors, row.key]),
    ...data.series.current.map((row) => ["series", row.label, "page_views", row.pageViews, row.key]),
    ...data.series.current.map((row) => ["series", row.label, "music_play_clicks", row.musicPlays, row.key]),
    ...data.series.current.map((row) => ["series", row.label, "cta_clicks", row.primaryCtaClicks, row.key]),
    ...data.trafficSources.map((row) => ["source", row.label, "visitors", row.visitors, `${row.percentage.toFixed(1)}%`]),
    ...data.topPagesDetailed.map((row) => ["page", row.path, "views", row.views, row.title]),
    ...data.music.tracks.map((row) => ["track", row.title, "play_clicks", row.playClicks, row.rawLabels.join("; ")]),
    ...data.breakdowns.devices.map((row) => ["device", row.label, "visitors", row.count, `${row.percentage.toFixed(1)}%`]),
    ...data.breakdowns.countries.map((row) => ["country", row.label, "visitors", row.count, `${row.percentage.toFixed(1)}%`]),
  ];
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `all-the-glory-analytics-${data.range.key}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<AnalyticsShellSkeleton />}>
      <AnalyticsPageInner />
    </Suspense>
  );
}

function AnalyticsPageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const range = normaliseRange(searchParams.get("range"));
  const compare = normaliseCompare(searchParams.get("compare"));

  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [setupNeeded, setSetupNeeded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastFetched, setLastFetched] = useState<number | null>(null);
  const [chartMetric, setChartMetric] = useState<ChartMetric>("visitors");
  const [pageQuery, setPageQuery] = useState("");
  const [pageSort, setPageSort] = useState<PageSort>("views");
  const [pageIndex, setPageIndex] = useState(0);
  const timerRef = useRef<number | null>(null);

  const updateQuery = useCallback(
    (next: Partial<{ range: RangeKey; compare: CompareKey }>) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("range", next.range ?? range);
      params.set("compare", next.compare ?? compare);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [compare, pathname, range, router, searchParams],
  );

  const fetchOnce = useCallback(
    async (manual = false) => {
      try {
        if (!data) setLoading(true);
        if (manual) setRefreshing(true);
        const res = await fetch(`/api/analytics?range=${range}&compare=${compare}`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (json?.setupNeeded) {
          setSetupNeeded(true);
          setError(null);
          return;
        }
        if (!res.ok) {
          setError(String(json?.error ?? `HTTP ${res.status}`));
          return;
        }
        setSetupNeeded(false);
        setError(null);
        setData(json as AnalyticsPayload);
        setLastFetched(Date.now());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Fetch failed");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [compare, data, range],
  );

  useEffect(() => {
    setPageIndex(0);
    void fetchOnce();
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => void fetchOnce(), POLL_MS);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [fetchOnce]);

  const filteredPages = useMemo(() => {
    if (!data) return [];
    const q = pageQuery.trim().toLowerCase();
    const rows = q
      ? data.topPagesDetailed.filter(
          (row) =>
            row.path.toLowerCase().includes(q) ||
            row.title.toLowerCase().includes(q),
        )
      : data.topPagesDetailed;

    return [...rows].sort((a, b) => {
      if (pageSort === "path") return a.path.localeCompare(b.path);
      return b[pageSort] - a[pageSort];
    });
  }, [data, pageQuery, pageSort]);

  const pageSize = 8;
  const pageCount = Math.max(1, Math.ceil(filteredPages.length / pageSize));
  const visiblePages = filteredPages.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

  return (
    <>
      <div className="dash-pagehead analytics-pagehead">
        <div>
          <div className="eyebrow eyebrow-amber">Dashboard</div>
          <h1 className="dash-title mt-1">Analytics</h1>
          <div className="dash-subtitle">
            Understand how people discover and engage with All The Glory.
          </div>
        </div>

        <div className="analytics-controls" aria-label="Analytics controls">
          <label className="sr-only" htmlFor="analytics-range">
            Date range
          </label>
          <select
            id="analytics-range"
            className="dash-select analytics-select"
            value={range}
            onChange={(e) => updateQuery({ range: e.target.value as RangeKey })}
          >
            {RANGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <label className="sr-only" htmlFor="analytics-comparison">
            Comparison
          </label>
          <select
            id="analytics-comparison"
            className="dash-select analytics-select"
            value={compare}
            onChange={(e) => updateQuery({ compare: e.target.value as CompareKey })}
          >
            {COMPARE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="dash-btn dash-btn-ghost"
            onClick={() => void fetchOnce(true)}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          <button
            type="button"
            className="dash-btn dash-btn-primary"
            onClick={() => data && exportAnalyticsCsv(data)}
            disabled={!data}
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3 text-[12px] text-[var(--colour-ink-quiet)]">
        <span>Last updated {formatUpdated(lastFetched)}</span>
        {data?.range && (
          <span>
            {data.range.label} - {data.range.timezone}
          </span>
        )}
        {data?.comparison?.available === false && (
          <span className="analytics-note-pill">
            {data.comparison.reason ?? "Not enough comparison data yet"}
          </span>
        )}
      </div>

      {setupNeeded && <SetupCard />}
      {error && !setupNeeded && (
        <div className="dash-panel analytics-alert">
          <div className="eyebrow eyebrow-amber">Heads up</div>
          <p>
            Couldn&apos;t reach the analytics store:{" "}
            <code>{error}</code>. The page will keep retrying.
          </p>
        </div>
      )}

      {loading && !data && <AnalyticsShellSkeleton />}

      {data && !setupNeeded && (
        <div className="dash-grid">
          <div className="dash-col-12">
            <KpiGrid data={data} />
          </div>

          <div className="dash-col-8">
            <Panel
              eyebrow={data.range.label}
              title="Performance over time"
              action={
                <div className="analytics-segment" role="tablist" aria-label="Chart metric">
                  {CHART_METRICS.map((metric) => (
                    <button
                      key={metric.key}
                      type="button"
                      role="tab"
                      aria-selected={chartMetric === metric.key}
                      className={chartMetric === metric.key ? "is-active" : ""}
                      onClick={() => setChartMetric(metric.key)}
                    >
                      {metric.label}
                    </button>
                  ))}
                </div>
              }
            >
              <PerformanceChart
                metric={chartMetric}
                rows={data.series.current}
                comparisonRows={data.series.comparison}
                comparisonLabel={data.comparison?.available ? data.comparison.label : null}
              />
            </Panel>
          </div>

          <div className="dash-col-4">
            <Panel eyebrow="Attention" title="Key insights">
              <InsightsList rows={data.insights} />
            </Panel>
          </div>

          <div className="dash-col-5">
            <Panel eyebrow="Acquisition" title="How people found you">
              <TrafficSources rows={data.trafficSources} />
              <div className="mt-5">
                <div className="analytics-subhead">Campaign links</div>
                {data.campaigns.length > 0 ? (
                  <CampaignTable rows={data.campaigns} />
                ) : (
                  <EmptyState>Not enough data yet. UTM campaign fields are not currently captured.</EmptyState>
                )}
              </div>
            </Panel>
          </div>

          <div className="dash-col-7">
            <Panel
              eyebrow="Content"
              title="Most viewed pages"
              action={
                <input
                  className="dash-input analytics-search"
                  value={pageQuery}
                  onChange={(e) => {
                    setPageQuery(e.target.value);
                    setPageIndex(0);
                  }}
                  placeholder="Search pages"
                  aria-label="Search pages"
                />
              }
            >
              <TopPagesTable
                rows={visiblePages}
                totalRows={filteredPages.length}
                sort={pageSort}
                setSort={setPageSort}
              />
              {filteredPages.length > pageSize && (
                <Pagination
                  pageIndex={pageIndex}
                  pageCount={pageCount}
                  onPrev={() => setPageIndex((value) => Math.max(0, value - 1))}
                  onNext={() => setPageIndex((value) => Math.min(pageCount - 1, value + 1))}
                />
              )}
            </Panel>
          </div>

          <div className="dash-col-12">
            <MusicEngagement data={data} />
          </div>

          <div className="dash-col-6">
            <Panel eyebrow="Journey" title="Visitor journey">
              <Funnel rows={data.funnel.steps} overall={data.funnel.overallConversionPct} largest={data.funnel.largestDropoff} />
            </Panel>
          </div>

          <div className="dash-col-6">
            <Panel eyebrow="Audience" title="Devices and locations">
              <div className="grid gap-4 md:grid-cols-2">
                <Breakdown title="Devices" rows={data.breakdowns.devices} empty="No device data yet." />
                <Breakdown title="Countries" rows={data.breakdowns.countries} empty="No country data yet." country />
                <div>
                  <div className="analytics-subhead">Browsers</div>
                  <EmptyState>Not enough data yet. Browsers are not stored.</EmptyState>
                </div>
                <div>
                  <div className="analytics-subhead">Cities</div>
                  <EmptyState>Not enough data yet. City-level location is not stored.</EmptyState>
                </div>
              </div>
            </Panel>
          </div>

          <div className="dash-col-7">
            <Panel eyebrow="Last 24 hours" title="Recent activity">
              <ActivityList rows={data.recentActivity} />
            </Panel>
          </div>

          <div className="dash-col-5">
            <Panel eyebrow="Data quality" title="Tracking audit">
              <TrackingAudit rows={data.trackingAudit} />
            </Panel>
          </div>

          {data.totalDonations > 0 && (
            <div className="dash-col-12">
              <Panel eyebrow="Legacy giving" title="Donation history">
                <div className="grid gap-3 md:grid-cols-3">
                  <MicroStat label="Total given" value={money(data.totalRaised, data.raisedCurrency)} />
                  <MicroStat label="Gifts" value={n(data.totalDonations)} />
                  <MicroStat label="Given today" value={money(data.raisedToday, data.raisedCurrency)} />
                </div>
              </Panel>
            </div>
          )}
        </div>
      )}

      <style jsx global>{`
        .analytics-pagehead {
          align-items: flex-start;
        }
        .analytics-pagehead,
        .analytics-pagehead > div,
        .analytics-controls,
        .dash-main,
        .dash-grid,
        .dash-grid > [class*="dash-col-"],
        .analytics-table-wrap,
        .analytics-kpi {
          min-width: 0;
        }
        .analytics-controls {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          flex-wrap: wrap;
        }
        .analytics-select {
          width: auto;
          min-width: 156px;
        }
        .analytics-note-pill {
          border: 1px solid rgba(216,178,90,0.25);
          border-radius: 999px;
          padding: 4px 10px;
          color: var(--colour-amber-soft);
          background: rgba(216,178,90,0.06);
        }
        .analytics-alert {
          padding: 16px 20px;
          margin-bottom: 18px;
          border-color: rgba(216,178,90,0.35);
        }
        .analytics-alert p {
          margin-top: 4px;
          color: var(--colour-ink-soft);
          font-size: 13px;
        }
        .analytics-alert code {
          color: var(--colour-amber-soft);
        }
        .analytics-segment {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.035);
        }
        .analytics-segment button {
          border: 0;
          border-radius: 9px;
          background: transparent;
          color: var(--colour-ink-quiet);
          padding: 7px 9px;
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
        }
        .analytics-segment button.is-active {
          background: rgba(216,178,90,0.18);
          color: var(--colour-glow);
        }
        .analytics-search {
          width: min(220px, 38vw);
        }
        .analytics-subhead {
          margin-bottom: 8px;
          color: var(--colour-ink-quiet);
          font-size: 10.5px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
        }
        .analytics-table-wrap {
          width: 100%;
          overflow-x: auto;
        }
        .analytics-table {
          width: 100%;
          min-width: 720px;
          border-collapse: collapse;
        }
        .analytics-table th,
        .analytics-table td {
          border-bottom: 1px solid rgba(255,255,255,0.06);
          padding: 10px 8px;
          text-align: left;
          vertical-align: top;
          font-size: 12.5px;
        }
        .analytics-table th {
          color: var(--colour-ink-quiet);
          font-size: 10.5px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .analytics-sort {
          color: inherit;
          background: transparent;
          border: 0;
          padding: 0;
          cursor: pointer;
          letter-spacing: inherit;
          text-transform: inherit;
        }
        .analytics-muted {
          color: var(--colour-ink-quiet);
        }
        @media (max-width: 760px) {
          .analytics-pagehead {
            flex-direction: column;
            align-items: stretch;
          }
          .analytics-controls {
            justify-content: flex-start;
            width: 100%;
          }
          .analytics-select,
          .analytics-controls .dash-btn {
            width: 100%;
            justify-content: center;
          }
          .analytics-segment {
            width: 100%;
            overflow-x: auto;
          }
          .analytics-segment button {
            white-space: nowrap;
          }
          .analytics-search {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}

function KpiGrid({ data }: { data: AnalyticsPayload }) {
  const kpis = [
    {
      label: "Unique visitors",
      value: n(data.summary.uniqueVisitors),
      rawValue: data.summary.uniqueVisitors,
      change: data.changes.uniqueVisitors,
      tooltip: "Distinct anonymous sessions with at least one page view in the selected range.",
      metric: "visitors" as ChartMetric,
      supported: true,
    },
    {
      label: "Total page views",
      value: n(data.summary.pageViews),
      rawValue: data.summary.pageViews,
      change: data.changes.pageViews,
      tooltip: "All tracked page view events in the selected range.",
      metric: "pageViews" as ChartMetric,
      supported: true,
    },
    {
      label: "Music plays",
      value: n(data.summary.musicPlays),
      rawValue: data.summary.musicPlays,
      change: data.changes.musicPlays,
      tooltip: "Play-click events from the hero player and song previews. These are not verified completed streams.",
      metric: "musicPlays" as ChartMetric,
      supported: true,
    },
    {
      label: "Primary CTA clicks",
      value: n(data.summary.primaryCtaClicks),
      rawValue: data.summary.primaryCtaClicks,
      change: data.changes.primaryCtaClicks,
      tooltip: "Currently measured as album download clicks, the primary tracked call to action.",
      metric: "primaryCtaClicks" as ChartMetric,
      supported: true,
    },
    {
      label: "Avg engagement time",
      value: duration(data.summary.avgEngagementTimeSec),
      rawValue: 0,
      change: null,
      tooltip: "Needs a duration or heartbeat event before it can be calculated reliably.",
      metric: "pageViews" as ChartMetric,
      supported: false,
    },
    {
      label: "Returning visitor %",
      value: pct(data.summary.returningVisitorPct),
      rawValue: 0,
      change: null,
      tooltip: "Needs a longer-lived anonymous visitor identifier. Current session ids reset by tab.",
      metric: "visitors" as ChartMetric,
      supported: false,
    },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
      {kpis.map((kpi) => (
        <KpiCard
          key={kpi.label}
          label={kpi.label}
          value={kpi.value}
          change={kpi.change}
          tooltip={kpi.tooltip}
          supported={kpi.supported}
          sparkline={kpi.supported ? data.series.current.map((row) => row[kpi.metric]) : []}
        />
      ))}
    </div>
  );
}

function KpiCard({
  label,
  value,
  change,
  tooltip,
  supported,
  sparkline,
}: {
  label: string;
  value: ReactNode;
  change: Change | null;
  tooltip: string;
  supported: boolean;
  sparkline: number[];
}) {
  const tone = changeTone(change);
  return (
    <div className="dash-stat analytics-kpi">
      <div className="flex items-start justify-between gap-2">
        <div className="eyebrow">{label}</div>
        <span
          tabIndex={0}
          role="note"
          aria-label={tooltip}
          title={tooltip}
          className="analytics-help"
        >
          ?
        </span>
      </div>
      <div className={`dash-stat-value font-display ${supported ? "" : "analytics-small-value"}`}>
        {value}
      </div>
      <div className={`analytics-change analytics-change-${tone}`}>
        {supported ? changeLabel(change) : "Not enough data yet"}
      </div>
      {supported && <MiniSparkline values={sparkline} />}
    </div>
  );
}

function MiniSparkline({ values }: { values: number[] }) {
  if (values.length < 2 || values.every((value) => value === 0)) {
    return <div className="mt-3 h-7 rounded-md bg-white/[0.025]" aria-hidden="true" />;
  }
  const max = Math.max(1, ...values);
  const points = values
    .map((value, index) => {
      const x = (index / Math.max(1, values.length - 1)) * 100;
      const y = 28 - (value / max) * 24;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg className="mt-3 h-7 w-full" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={points} fill="none" stroke="var(--colour-amber)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
    </svg>
  );
}

function PerformanceChart({
  metric,
  rows,
  comparisonRows,
  comparisonLabel,
}: {
  metric: ChartMetric;
  rows: AnalyticsPayload["series"]["current"];
  comparisonRows: AnalyticsPayload["series"]["comparison"];
  comparisonLabel: string | null;
}) {
  const metricLabel = CHART_METRICS.find((item) => item.key === metric)?.label ?? "Metric";
  const values = rows.map((row) => row[metric]);
  const comparisonValues = comparisonRows.map((row) => row[metric]);
  const max = Math.max(1, ...values, ...comparisonValues);
  const hasData = values.some((value) => value > 0) || comparisonValues.some((value) => value > 0);

  if (!hasData) {
    return <EmptyState>Not enough data yet. This metric has no events in the selected range.</EmptyState>;
  }

  const currentPoints = pointsFor(values, max);
  const previousPoints = pointsFor(comparisonValues, max);
  const labelIndexes = labelStops(rows.length);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-4 text-[10.5px] uppercase tracking-[0.18em] text-[var(--colour-ink-quiet)]">
        <Legend colour="var(--colour-amber)" label="Current" />
        {comparisonLabel && comparisonRows.length > 0 && <Legend colour="#b7e4c7" label={comparisonLabel} />}
      </div>
      <div className="rounded-xl border border-white/5 bg-black/10 p-3">
        <svg role="img" aria-label={`${metricLabel} over time`} viewBox="0 0 640 260" className="h-64 w-full">
          <title>{metricLabel} over time</title>
          {[0, 1, 2, 3].map((line) => (
            <line key={line} x1="28" x2="626" y1={28 + line * 56} y2={28 + line * 56} stroke="rgba(255,255,255,0.06)" />
          ))}
          {previousPoints && comparisonLabel && (
            <polyline points={previousPoints} fill="none" stroke="#b7e4c7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.55" />
          )}
          <polyline points={currentPoints} fill="none" stroke="var(--colour-amber)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          {rows.map((row, index) => {
            const x = 28 + (index / Math.max(1, rows.length - 1)) * 598;
            const y = 224 - (row[metric] / max) * 188;
            return (
              <circle key={row.key} cx={x} cy={y} r="4" fill="var(--colour-amber)">
                <title>{`${row.label}: ${n(row[metric])}`}</title>
              </circle>
            );
          })}
          {labelIndexes.map((index) => (
            <text key={index} x={28 + (index / Math.max(1, rows.length - 1)) * 598} y="248" textAnchor={index === 0 ? "start" : index === rows.length - 1 ? "end" : "middle"} fill="rgba(255,255,255,0.45)" fontSize="12">
              {rows[index]?.label}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}

function pointsFor(values: number[], max: number) {
  if (values.length === 0) return "";
  return values
    .map((value, index) => {
      const x = 28 + (index / Math.max(1, values.length - 1)) * 598;
      const y = 224 - (value / max) * 188;
      return `${x},${y}`;
    })
    .join(" ");
}

function labelStops(length: number) {
  if (length <= 2) return Array.from({ length }, (_, i) => i);
  return [0, Math.floor((length - 1) / 2), length - 1];
}

function TrafficSources({ rows }: { rows: AnalyticsPayload["trafficSources"] }) {
  const max = Math.max(1, ...rows.map((row) => row.visitors));
  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => (
        <div key={row.key}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[13px] text-[var(--colour-ink-soft)]">{row.label}</div>
              <div className="mt-0.5 text-[11.5px] text-[var(--colour-ink-quiet)]">
                {row.topDomain ? `Top domain: ${row.topDomain}` : "No referring domain"}
              </div>
            </div>
            <div className="text-right">
              <div className="font-display text-[18px] text-[var(--colour-glow)]">{n(row.visitors)}</div>
              <div className="text-[11px] text-[var(--colour-ink-quiet)]">{pct(row.percentage)}</div>
            </div>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
            <div className="h-full rounded-full bg-[var(--colour-amber)]/80" style={{ width: `${Math.max(row.visitors > 0 ? 5 : 1, (row.visitors / max) * 100)}%` }} />
          </div>
          <div className={`mt-1 text-[11px] analytics-change-${changeTone(row.change)}`}>
            {changeLabel(row.change)}
          </div>
        </div>
      ))}
    </div>
  );
}

function CampaignTable({ rows }: { rows: AnalyticsPayload["campaigns"] }) {
  return (
    <div className="analytics-table-wrap">
      <table className="analytics-table">
        <thead>
          <tr>
            <th>Campaign</th>
            <th>Source</th>
            <th>Medium</th>
            <th>Visitors</th>
            <th>Music plays</th>
            <th>CTA clicks</th>
            <th>Conversion</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.campaign}-${row.source}-${row.medium}`}>
              <td>{row.campaign}</td>
              <td>{row.source}</td>
              <td>{row.medium}</td>
              <td>{n(row.visitors)}</td>
              <td>{n(row.musicPlays)}</td>
              <td>{n(row.primaryCtaClicks)}</td>
              <td>{pct(row.conversionRate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TopPagesTable({
  rows,
  totalRows,
  sort,
  setSort,
}: {
  rows: AnalyticsPayload["topPagesDetailed"];
  totalRows: number;
  sort: PageSort;
  setSort: (sort: PageSort) => void;
}) {
  if (totalRows === 0) return <EmptyState>No page views match this search.</EmptyState>;
  return (
    <div className="analytics-table-wrap">
      <table className="analytics-table">
        <thead>
          <tr>
            <th>Page title</th>
            <th>
              <button className="analytics-sort" type="button" onClick={() => setSort("path")}>
                Path {sort === "path" ? "↓" : ""}
              </button>
            </th>
            <th>
              <button className="analytics-sort" type="button" onClick={() => setSort("views")}>
                Views {sort === "views" ? "↓" : ""}
              </button>
            </th>
            <th>
              <button className="analytics-sort" type="button" onClick={() => setSort("uniqueVisitors")}>
                Visitors {sort === "uniqueVisitors" ? "↓" : ""}
              </button>
            </th>
            <th>Avg engagement</th>
            <th>CTA clicks</th>
            <th>Change</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.path}>
              <td className="text-[var(--colour-ink-soft)]">{row.title}</td>
              <td className="analytics-muted">{row.path}</td>
              <td>{n(row.views)}</td>
              <td>{n(row.uniqueVisitors)}</td>
              <td className="analytics-muted">Not enough data yet</td>
              <td className="analytics-muted">Not enough data yet</td>
              <td className={`analytics-change-${changeTone(row.change)}`}>{changeLabel(row.change)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Pagination({
  pageIndex,
  pageCount,
  onPrev,
  onNext,
}: {
  pageIndex: number;
  pageCount: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="mt-4 flex items-center justify-between gap-3 text-[12px] text-[var(--colour-ink-quiet)]">
      <button type="button" className="dash-btn dash-btn-ghost" onClick={onPrev} disabled={pageIndex === 0}>
        Previous
      </button>
      <span>
        Page {pageIndex + 1} of {pageCount}
      </span>
      <button type="button" className="dash-btn dash-btn-ghost" onClick={onNext} disabled={pageIndex >= pageCount - 1}>
        Next
      </button>
    </div>
  );
}

function MusicEngagement({ data }: { data: AnalyticsPayload }) {
  return (
    <Panel eyebrow="Music" title="Music engagement">
      <div className="grid gap-3 md:grid-cols-4">
        <MicroStat label="Play clicks" value={n(data.music.totalPlayClicks)} />
        <MicroStat
          label="Unique listeners"
          value={data.music.uniqueListenersSupported && data.music.uniqueListeners !== null ? n(data.music.uniqueListeners) : "Not enough data yet"}
        />
        <MicroStat label="Completion rate" value="Not enough data yet" />
        <MicroStat label="External platform clicks" value="Not enough data yet" />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_280px]">
        <div className="analytics-table-wrap">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Track title</th>
                <th>Play clicks</th>
                <th>Unique listeners</th>
                <th>Avg listening time</th>
                <th>Completion</th>
                <th>External clicks</th>
                <th>Change</th>
              </tr>
            </thead>
            <tbody>
              {data.music.tracks.map((track) => (
                <tr key={track.title}>
                  <td className="text-[var(--colour-ink-soft)]">{track.title}</td>
                  <td>{n(track.playClicks)}</td>
                  <td>{track.uniqueListenersSupported && track.uniqueListeners !== null ? n(track.uniqueListeners) : "Not enough data yet"}</td>
                  <td className="analytics-muted">Not enough data yet</td>
                  <td className="analytics-muted">Not enough data yet</td>
                  <td className="analytics-muted">Not enough data yet</td>
                  <td className={`analytics-change-${changeTone(track.change)}`}>{changeLabel(track.change)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <div className="analytics-subhead">Platform clicks</div>
          <div className="flex flex-col gap-2">
            {["Spotify", "Apple Music", "YouTube", "Other platforms"].map((label) => (
              <div key={label} className="rounded-xl border border-white/5 bg-white/[0.025] px-3 py-3">
                <div className="text-[12.5px] text-[var(--colour-ink-soft)]">{label}</div>
                <div className="mt-1 text-[11.5px] text-[var(--colour-ink-quiet)]">Not enough data yet</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}

function Funnel({
  rows,
  overall,
  largest,
}: {
  rows: AnalyticsPayload["funnel"]["steps"];
  overall: number | null;
  largest: string | null;
}) {
  if (rows.length === 0) return <EmptyState>Not enough data yet.</EmptyState>;
  const max = Math.max(1, ...rows.map((row) => row.count));
  return (
    <div>
      <div className="flex flex-col gap-3">
        {rows.map((row) => (
          <div key={row.label} className="rounded-xl border border-white/5 bg-white/[0.025] p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[13px] text-[var(--colour-ink-soft)]">{row.label}</div>
                <div className="mt-1 text-[11.5px] leading-relaxed text-[var(--colour-ink-quiet)]">{row.detail}</div>
              </div>
              <div className="font-display text-[20px] text-[var(--colour-glow)]">{n(row.count)}</div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
              <div className="h-full rounded-full bg-[var(--colour-amber)]/80" style={{ width: `${Math.max(row.count > 0 ? 4 : 1, (row.count / max) * 100)}%` }} />
            </div>
            <div className="mt-2 text-[11px] text-[var(--colour-ink-quiet)]">
              {row.continuationPct === null ? "Start of journey" : `${pct(row.continuationPct)} continue to the next step`}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <MicroStat label="Overall conversion" value={pct(overall)} />
        <MicroStat label="Largest drop-off" value={largest ?? "Not enough data yet"} />
      </div>
    </div>
  );
}

function Breakdown({
  title,
  rows,
  empty,
  country = false,
}: {
  title: string;
  rows: AnalyticsPayload["breakdowns"]["devices"];
  empty: string;
  country?: boolean;
}) {
  return (
    <div>
      <div className="analytics-subhead">{title}</div>
      {rows.length === 0 ? (
        <EmptyState>{empty}</EmptyState>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((row) => (
            <div key={row.label}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-[12.5px] text-[var(--colour-ink-soft)]">
                  {country && row.label !== "Unknown" ? `${flagFromCode(row.label)} ` : ""}
                  {row.label}
                </span>
                <span className="font-display text-[14px] text-[var(--colour-glow)]">{n(row.count)}</span>
              </div>
              <div className="mt-1 h-1 rounded-full bg-white/5">
                <div className="h-full rounded-full bg-[var(--colour-amber)]/75" style={{ width: `${Math.max(row.count > 0 ? 5 : 1, row.percentage)}%` }} />
              </div>
              <div className="mt-1 text-[11px] text-[var(--colour-ink-quiet)]">{pct(row.percentage)} · {changeLabel(row.change)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InsightsList({ rows }: { rows: AnalyticsPayload["insights"] }) {
  if (rows.length === 0) {
    return <EmptyState>Not enough data yet. Insights appear once the selected range has enough activity.</EmptyState>;
  }
  return (
    <div className="flex flex-col gap-2">
      {rows.map((row) => (
        <div key={row.title} className="rounded-xl border border-white/5 bg-white/[0.025] px-3 py-3">
          <div className="text-[13px] text-[var(--colour-ink-soft)]">{row.title}</div>
          <div className="mt-1 text-[12px] leading-relaxed text-[var(--colour-ink-quiet)]">{row.detail}</div>
        </div>
      ))}
    </div>
  );
}

function ActivityList({ rows }: { rows: AnalyticsPayload["recentActivity"] }) {
  if (rows.length === 0) {
    return <EmptyState>No activity in the last 24 hours.</EmptyState>;
  }
  return (
    <div className="flex flex-col gap-2">
      {rows.map((activity, index) => (
        <div key={`${activity.time}-${index}`} className="flex items-baseline justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.025] px-3 py-2.5 text-[12.5px]">
          <span className="min-w-0 truncate text-[var(--colour-ink-soft)]">
            {activity.country ? <span aria-hidden="true">{flagFromCode(activity.country)} </span> : null}
            <span className={activity.kind === "download" ? "text-[var(--colour-glow)]" : ""}>
              {activity.label}
            </span>
          </span>
          <span className="shrink-0 text-[var(--colour-ink-quiet)]">{timeAgo(activity.time)}</span>
        </div>
      ))}
    </div>
  );
}

function TrackingAudit({ rows }: { rows: AnalyticsPayload["trackingAudit"] }) {
  return (
    <div className="flex flex-col gap-2">
      {rows.map((row) => (
        <div key={row.event} className="rounded-xl border border-white/5 bg-white/[0.025] px-3 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[12.5px] text-[var(--colour-ink-soft)]">{row.event}</div>
            <span className={`analytics-audit analytics-audit-${row.status}`}>{row.status}</span>
          </div>
          <div className="mt-1 text-[11.5px] leading-relaxed text-[var(--colour-ink-quiet)]">{row.note}</div>
        </div>
      ))}
    </div>
  );
}

function MicroStat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.025] px-3 py-3">
      <div className="text-[10.5px] uppercase tracking-[0.2em] text-[var(--colour-ink-quiet)]">
        {label}
      </div>
      <div className="font-display mt-1 text-[20px] leading-tight text-[var(--colour-glow)]">
        {value}
      </div>
    </div>
  );
}

function Legend({ colour, label }: { colour: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-block h-2 w-2 rounded-full" style={{ background: colour }} aria-hidden="true" />
      {label}
    </span>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.025] px-3 py-3 text-[12.5px] leading-relaxed text-[var(--colour-ink-quiet)]">
      {children}
    </div>
  );
}

function AnalyticsShellSkeleton() {
  return (
    <>
      <div className="dash-pagehead">
        <div>
          <div className="eyebrow eyebrow-amber">Dashboard</div>
          <h1 className="dash-title mt-1">Analytics</h1>
          <div className="dash-subtitle">Understand how people discover and engage with All The Glory.</div>
        </div>
      </div>
      <div className="dash-grid">
        <div className="dash-col-12">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="dash-stat">
                <div className="h-3 w-24 rounded bg-white/5" />
                <div className="mt-4 h-8 w-20 rounded bg-white/10" />
                <div className="mt-4 h-6 rounded bg-white/5" />
              </div>
            ))}
          </div>
        </div>
        <div className="dash-col-8">
          <div className="dash-panel p-6">
            <div className="h-5 w-52 rounded bg-white/10" />
            <div className="mt-6 h-64 rounded-xl bg-white/[0.035]" />
          </div>
        </div>
        <div className="dash-col-4">
          <div className="dash-panel p-6">
            <div className="h-5 w-32 rounded bg-white/10" />
            <div className="mt-6 space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-16 rounded-xl bg-white/[0.035]" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function SetupCard() {
  return (
    <div
      className="dash-panel"
      style={{
        padding: "22px 26px 24px",
        marginBottom: 18,
        borderColor: "rgba(216,178,90,0.35)",
        background:
          "linear-gradient(135deg, rgba(216,178,90,0.10), rgba(216,178,90,0.02) 60%, transparent)",
      }}
    >
      <div className="eyebrow eyebrow-amber">Setup needed</div>
      <h2 className="font-display mt-2 text-[22px] md:text-[24px] tracking-tight text-white/95">
        Connect the Cloudflare D1 analytics binding.
      </h2>
      <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed text-[var(--colour-ink-soft)]">
        The dashboard expects the Cloudflare D1 binding named{" "}
        <code className="text-[var(--colour-amber-soft)]">DB</code>. Once the
        Worker is deployed with that binding, page views, plays and downloads
        will start flowing in.
      </p>
    </div>
  );
}
