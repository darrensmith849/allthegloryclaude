"use client";

import { Suspense, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Panel } from "@/components/dashboard/panel";
import type { AnalyticsPayload } from "@/app/api/analytics/route";

const POLL_MS = 30_000;

type RangeKey = "7d" | "30d" | "90d" | "ytd" | "all";
type CompareKey = "previous" | "year" | "none";
type ChartMetric = "visitors" | "pageViews" | "musicPlays" | "primaryCtaClicks" | "linkClicks";
type PageSort = "views" | "uniqueVisitors" | "path";
type AnalyticsSection = "overview" | "traffic" | "content" | "music" | "tracking";
type Change = AnalyticsPayload["changes"]["pageViews"];

const SETUP_ACTIONS = [
  "Connect page views tracking",
  "Track outbound Spotify clicks",
  "Add UTM campaign links",
  "Track Show.co / pre-save traffic",
  "Track press kit downloads",
  "Track email signups",
  "Track QR code scans",
];

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
  { key: "primaryCtaClicks", label: "Album downloads" },
  { key: "linkClicks", label: "Link clicks" },
];

const ANALYTICS_SECTIONS: { key: AnalyticsSection; label: string; detail: string }[] = [
  { key: "overview", label: "Overview", detail: "Start here" },
  { key: "traffic", label: "Traffic", detail: "Where visits come from" },
  { key: "content", label: "Content", detail: "Pages and funnel" },
  { key: "music", label: "Music", detail: "Songs and clicks" },
  { key: "tracking", label: "Tracking", detail: "Health and logs" },
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

function hasActivity(data: AnalyticsPayload): boolean {
  return (
    data.summary.pageViews > 0 ||
    data.summary.uniqueVisitors > 0 ||
    data.summary.musicPlays > 0 ||
    data.summary.primaryCtaClicks > 0
  );
}

function releasePageViews(data: AnalyticsPayload): number {
  return data.topPagesDetailed
    .filter((row) => /album|release|from-darkness|darkness-to-light/i.test(`${row.path} ${row.title}`))
    .reduce((sum, row) => sum + row.views, 0);
}

function strongestSource(data: AnalyticsPayload) {
  return data.trafficSources.find((row) => row.visitors > 0) ?? null;
}

function strongestPage(data: AnalyticsPayload) {
  return data.topPagesDetailed.find((row) => row.views > 0) ?? null;
}

function formatChangePct(value: number): string {
  return `${Math.abs(value).toFixed(1).replace(/\.0$/, "")}%`;
}

function unitFor(value: number, singular: string, plural: string): string {
  return value === 1 ? singular : plural;
}

function aboutLabel(label: string): string {
  return `About ${label.toLowerCase()}`;
}

function comparisonCopy({
  change,
  comparisonEnabled,
  compareLabel,
  missingMessage,
  unitSingular,
  unitPlural,
}: {
  change: Change | null;
  comparisonEnabled: boolean;
  compareLabel: string;
  missingMessage: string;
  unitSingular: string;
  unitPlural: string;
}): { tone: "up" | "down" | "flat" | "none"; primary: string; secondary: string | null } {
  if (!comparisonEnabled) {
    return {
      tone: "none",
      primary: "Enable comparison to view period changes",
      secondary: null,
    };
  }

  if (!change || change.previous === null) {
    return { tone: "none", primary: missingMessage, secondary: null };
  }

  if (change.current === 0 && change.previous === 0) {
    return {
      tone: "none",
      primary: `No ${unitPlural.toLowerCase()} recorded in either period`,
      secondary: null,
    };
  }

  if (change.previous === 0 && change.current > 0) {
    return {
      tone: "flat",
      primary: `${unitPlural} recorded - no previous baseline`,
      secondary: `Previous period: 0 ${unitPlural.toLowerCase()}`,
    };
  }

  if (change.changePct === null) {
    return { tone: "none", primary: missingMessage, secondary: null };
  }

  const arrow = change.changePct > 0 ? "↑" : change.changePct < 0 ? "↓" : "→";
  const tone = change.changePct > 0 ? "up" : change.changePct < 0 ? "down" : "flat";
  const previousUnit = unitFor(change.previous, unitSingular, unitPlural).toLowerCase();

  return {
    tone,
    primary: `${arrow} ${formatChangePct(change.changePct)} vs ${compareLabel.toLowerCase()}`,
    secondary: `Previous period: ${n(change.previous)} ${previousUnit}`,
  };
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
    ["summary", "Outbound link clicks", "count", data.summary.linkClicks, ""],
    ...data.series.current.map((row) => ["series", row.label, "visitors", row.visitors, row.key]),
    ...data.series.current.map((row) => ["series", row.label, "page_views", row.pageViews, row.key]),
    ...data.series.current.map((row) => ["series", row.label, "music_play_clicks", row.musicPlays, row.key]),
    ...data.series.current.map((row) => ["series", row.label, "cta_clicks", row.primaryCtaClicks, row.key]),
    ...data.series.current.map((row) => ["series", row.label, "link_clicks", row.linkClicks, row.key]),
    ...data.last30Days.map((row) => ["daily", row.date, "downloads", row.downloads, `links:${row.links}; plays:${row.plays}; views:${row.views}`]),
    ...data.trafficSources.map((row) => ["source", row.label, "visitors", row.visitors, `${row.percentage.toFixed(1)}%`]),
    ...data.clickedLinks.map((row) => ["clicked_link", row.label, "clicks", row.clicks, `${row.platform}; ${row.target}`]),
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
  const [activeSection, setActiveSection] = useState<AnalyticsSection>("overview");
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
            <WeeklyInsightPanel data={data} />
          </div>

          <div className="dash-col-12">
            <AnalyticsSectionTabs activeSection={activeSection} onChange={setActiveSection} />
          </div>

          {activeSection === "overview" && (
            <>
              <div className="dash-col-12">
                <KpiGrid
                  data={data}
                  comparisonEnabled={compare !== "none"}
                  compareLabel={data.comparison?.label ?? "Previous period"}
                />
              </div>

              <div className="dash-col-12">
                <CountBoard data={data} />
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
                <RecommendedActions data={data} />
              </div>

              <div className="dash-col-12">
                <DownloadsPerDay rows={data.last30Days} />
              </div>
            </>
          )}

          {activeSection === "traffic" && (
            <>
              <div className="dash-col-5">
                <Panel eyebrow="Acquisition" title="Traffic sources">
                  <TrafficSources rows={data.trafficSources} />
                </Panel>
              </div>

              <div className="dash-col-7">
                <Panel eyebrow="Audience" title="Audience details">
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

              <div className="dash-col-12">
                <CampaignsPanel rows={data.campaigns} />
              </div>

              <div className="dash-col-12">
                <ClickedLinksPanel rows={data.clickedLinks} />
              </div>
            </>
          )}

          {activeSection === "content" && (
            <>
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

              <div className="dash-col-5">
                <Panel eyebrow="Journey" title="Release funnel">
                  <Funnel rows={data.funnel.steps} overall={data.funnel.overallConversionPct} largest={data.funnel.largestDropoff} />
                  <ReleaseSetupPrompts />
                </Panel>
              </div>

              <div className="dash-col-12">
                <DailyActivityPanel rows={data.last30Days} />
              </div>
            </>
          )}

          {activeSection === "music" && (
            <div className="dash-col-12">
              <MusicEngagement data={data} />
            </div>
          )}

          {activeSection === "tracking" && (
            <>
              <div className="dash-col-7">
                <Panel eyebrow="Last 24 hours" title="Recent activity">
                  <ActivityList rows={data.recentActivity} />
                </Panel>
              </div>

              <div className="dash-col-5">
                <Panel eyebrow="Data quality" title="Tracking health">
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
            </>
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
        .analytics-section-tabs {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 9px;
        }
        .analytics-section-tab {
          min-height: 70px;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          background: rgba(255,255,255,0.025);
          color: var(--colour-ink-quiet);
          cursor: pointer;
          padding: 12px 13px;
          text-align: left;
          transition:
            border-color 160ms ease,
            background 160ms ease,
            color 160ms ease,
            transform 160ms ease;
        }
        .analytics-section-tab:hover,
        .analytics-section-tab:focus-visible {
          border-color: rgba(216,178,90,0.28);
          background: rgba(216,178,90,0.06);
          color: var(--colour-ink-soft);
          outline: none;
          transform: translateY(-1px);
        }
        .analytics-section-tab.is-active {
          border-color: rgba(216,178,90,0.42);
          background:
            linear-gradient(135deg, rgba(216,178,90,0.14), rgba(255,255,255,0.035)),
            rgba(255,255,255,0.04);
          color: var(--colour-glow);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
        }
        .analytics-section-tab span {
          display: block;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.12em;
          line-height: 1.2;
          text-transform: uppercase;
        }
        .analytics-section-tab small {
          display: block;
          margin-top: 7px;
          color: var(--colour-ink-quiet);
          font-size: 11.5px;
          line-height: 1.25;
        }
        .analytics-section-tab.is-active small {
          color: var(--colour-ink-soft);
        }
        .analytics-kpi {
          position: relative;
          display: flex;
          min-height: 184px;
          flex-direction: column;
          overflow: visible;
        }
        .analytics-kpi-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
        }
        .analytics-kpi-title {
          margin: 0;
        }
        .analytics-kpi-unit {
          margin-top: 2px;
          color: var(--colour-ink-quiet);
          font-size: 11px;
          letter-spacing: 0.12em;
          line-height: 1.2;
          text-transform: uppercase;
        }
        .analytics-small-value {
          font-size: clamp(22px, 1.85vw, 28px);
          line-height: 1.05;
        }
        .analytics-change {
          margin-top: 12px;
          font-size: 12px;
          font-weight: 600;
          line-height: 1.35;
          overflow-wrap: anywhere;
        }
        .analytics-change-up { color: #b7e4c7; }
        .analytics-change-down { color: #f1a07d; }
        .analytics-change-flat { color: var(--colour-amber-soft); }
        .analytics-change-none { color: var(--colour-ink-quiet); }
        .analytics-info-wrap {
          position: relative;
          z-index: 5;
          flex: 0 0 auto;
        }
        .analytics-info-button {
          display: inline-grid;
          width: 27px;
          height: 27px;
          place-items: center;
          border: 1px solid rgba(216,178,90,0.24);
          border-radius: 999px;
          background: rgba(255,255,255,0.035);
          color: var(--colour-amber-soft);
          cursor: pointer;
          transition:
            border-color 160ms ease,
            background 160ms ease,
            color 160ms ease;
        }
        .analytics-info-button:hover,
        .analytics-info-button:focus-visible,
        .analytics-info-button[aria-expanded="true"] {
          border-color: rgba(216,178,90,0.5);
          background: rgba(216,178,90,0.12);
          color: var(--colour-glow);
          outline: none;
        }
        .analytics-info-button svg {
          width: 17px;
          height: 17px;
          fill: none;
          stroke: currentColor;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-width: 1.75;
        }
        .analytics-tooltip {
          position: absolute;
          top: -4px;
          right: calc(100% + 8px);
          width: min(260px, calc(100vw - 48px));
          border: 1px solid rgba(216,178,90,0.22);
          border-radius: 12px;
          background:
            linear-gradient(135deg, rgba(36,31,24,0.94), rgba(22,19,16,0.94)),
            rgba(255,255,255,0.08);
          box-shadow: 0 14px 40px rgba(0,0,0,0.38);
          color: var(--colour-ink-soft);
          font-size: 12px;
          line-height: 1.45;
          opacity: 0;
          padding: 10px 11px;
          pointer-events: none;
          transform: translateY(-2px);
          transition:
            opacity 140ms ease,
            transform 140ms ease;
        }
        .analytics-tooltip.is-open {
          opacity: 1;
          transform: translateY(0);
        }
        .analytics-note-pill {
          border: 1px solid rgba(216,178,90,0.25);
          border-radius: 999px;
          padding: 4px 10px;
          color: var(--colour-amber-soft);
          background: rgba(216,178,90,0.06);
        }
        .analytics-week-panel {
          display: grid;
          grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.95fr);
          gap: 16px;
          border-radius: 24px;
          border: 1px solid rgba(216,178,90,0.18);
          background:
            radial-gradient(700px 260px at 10% 0%, rgba(216,178,90,0.13), transparent 70%),
            rgba(255,255,255,0.04);
          box-shadow:
            0 18px 60px rgba(0,0,0,0.28),
            inset 0 1px 0 rgba(255,255,255,0.05);
          padding: 22px;
        }
        .analytics-week-main h2 {
          max-width: 760px;
        }
        .analytics-week-main p {
          max-width: 680px;
        }
        .analytics-week-support {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }
        .analytics-week-card,
        .analytics-action-card,
        .analytics-builder,
        .analytics-setup-row {
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.025);
          border-radius: 14px;
        }
        .analytics-week-card {
          padding: 13px;
        }
        .analytics-week-value {
          margin-top: 6px;
          font-family: var(--font-display), serif;
          font-size: 18px;
          line-height: 1.1;
          color: var(--colour-glow);
          overflow-wrap: anywhere;
        }
        .analytics-action-card {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 10px;
          padding: 12px;
        }
        .analytics-action-dot {
          width: 8px;
          height: 8px;
          margin-top: 5px;
          border-radius: 999px;
          background: rgba(255,255,255,0.24);
        }
        .analytics-action-dot-up { background: #b7e4c7; }
        .analytics-action-dot-down { background: #f1a07d; }
        .analytics-action-dot-flat { background: var(--colour-amber-soft); }
        .analytics-builder {
          padding: 14px;
        }
        .analytics-tracked-url {
          min-height: 42px;
          border-radius: 12px;
          border: 1px solid rgba(216,178,90,0.18);
          background: rgba(0,0,0,0.18);
          color: var(--colour-ink-soft);
          font-size: 12px;
          line-height: 1.45;
          overflow-wrap: anywhere;
          padding: 10px 12px;
        }
        .analytics-setup-row {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 9px 10px;
          color: var(--colour-ink-soft);
          font-size: 12px;
          line-height: 1.35;
        }
        .analytics-previous {
          margin-top: 2px;
          font-size: 11px;
          color: var(--colour-ink-faint);
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
        .download-bars {
          display: flex;
          align-items: flex-end;
          gap: 6px;
          padding: 6px 2px 0;
        }
        .download-bar-col {
          flex: 1 1 0;
          min-width: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 7px;
        }
        .download-bar-count {
          min-height: 13px;
          font-family: var(--font-display), serif;
          font-size: 12.5px;
          line-height: 1;
          color: var(--colour-glow);
        }
        .download-bar-track {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          width: 100%;
          height: 132px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .download-bar-fill {
          width: 60%;
          max-width: 22px;
          min-height: 3px;
          border-radius: 4px 4px 0 0;
          background: linear-gradient(180deg, var(--colour-amber), var(--colour-amber-soft));
        }
        .download-bar-day {
          font-size: 10px;
          letter-spacing: 0.03em;
          color: var(--colour-ink-quiet);
          white-space: nowrap;
        }
        @media (max-width: 620px) {
          .download-bars {
            gap: 4px;
          }
          .download-bar-day {
            font-size: 8.5px;
          }
        }
        .count-board-list {
          display: flex;
          flex-direction: column;
        }
        .count-board-row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 14px;
          padding: 10px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .count-board-row:last-child {
          border-bottom: 0;
        }
        .count-board-label {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: var(--colour-ink-soft);
          font-size: 13.5px;
        }
        .count-board-num {
          flex-shrink: 0;
          font-family: var(--font-display), serif;
          font-size: 17px;
          line-height: 1;
          color: var(--colour-glow);
          font-variant-numeric: tabular-nums;
        }
        @media (max-width: 1100px) {
          .analytics-section-tabs {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        @media (max-width: 760px) {
          .analytics-pagehead {
            flex-direction: column;
            align-items: stretch;
          }
          .analytics-week-panel {
            grid-template-columns: 1fr;
            padding: 18px;
          }
          .analytics-week-support {
            grid-template-columns: 1fr;
          }
          .analytics-section-tabs {
            grid-template-columns: 1fr;
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
          .analytics-tooltip {
            right: 0;
            top: calc(100% + 8px);
          }
          .analytics-table {
            min-width: 0;
            border-collapse: separate;
            border-spacing: 0 10px;
          }
          .analytics-table thead {
            display: none;
          }
          .analytics-table tr {
            display: block;
            border: 1px solid rgba(255,255,255,0.07);
            border-radius: 14px;
            background: rgba(255,255,255,0.025);
            padding: 8px 10px;
          }
          .analytics-table td {
            display: flex;
            justify-content: space-between;
            gap: 14px;
            border-bottom: 0;
            padding: 7px 0;
            text-align: right;
          }
          .analytics-table td::before {
            content: attr(data-label);
            flex: 0 0 auto;
            color: var(--colour-ink-quiet);
            font-size: 10px;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            text-align: left;
          }
        }
      `}</style>
    </>
  );
}

function AnalyticsSectionTabs({
  activeSection,
  onChange,
}: {
  activeSection: AnalyticsSection;
  onChange: (section: AnalyticsSection) => void;
}) {
  return (
    <div className="analytics-section-tabs" role="tablist" aria-label="Analytics sections">
      {ANALYTICS_SECTIONS.map((section) => (
        <button
          key={section.key}
          type="button"
          role="tab"
          aria-selected={activeSection === section.key}
          className={`analytics-section-tab ${activeSection === section.key ? "is-active" : ""}`}
          onClick={() => onChange(section.key)}
        >
          <span>{section.label}</span>
          <small>{section.detail}</small>
        </button>
      ))}
    </div>
  );
}

function KpiGrid({
  data,
  comparisonEnabled,
  compareLabel,
}: {
  data: AnalyticsPayload;
  comparisonEnabled: boolean;
  compareLabel: string;
}) {
  const albumViews = releasePageViews(data);
  const kpis = [
    {
      label: "Website visitors",
      value: n(data.summary.uniqueVisitors),
      unitLabel: "Visitors",
      unitSingular: "Visitor",
      unitPlural: "Visitors",
      change: data.changes.uniqueVisitors,
      comparisonMissing: "No visitor data for the previous period",
      tooltip: "Total visits recorded during the selected date range. A person may be counted more than once if they visit on different occasions.",
      metric: "visitors" as ChartMetric,
      supported: true,
    },
    {
      label: "Public site page views",
      value: n(data.summary.pageViews),
      unitLabel: "Views",
      unitSingular: "View",
      unitPlural: "Views",
      change: data.changes.pageViews,
      comparisonMissing: "No page view data for the previous period",
      tooltip: "All tracked page view events in the selected range.",
      metric: "pageViews" as ChartMetric,
      supported: true,
    },
    {
      label: "Album / release views",
      value: n(albumViews),
      unitLabel: "Views",
      unitSingular: "View",
      unitPlural: "Views",
      change: null,
      comparisonMissing: "No release-page comparison is available yet",
      tooltip: "Real views on pages whose path or title looks like an album or release page.",
      metric: "pageViews" as ChartMetric,
      supported: true,
    },
    {
      label: "Music play clicks",
      value: n(data.summary.musicPlays),
      unitLabel: "Clicks",
      unitSingular: "Click",
      unitPlural: "Clicks",
      change: data.changes.musicPlays,
      comparisonMissing: "No music click data for the previous period",
      tooltip: "Play-click events from the hero player and song previews. These are not verified completed streams.",
      metric: "musicPlays" as ChartMetric,
      supported: true,
    },
    {
      label: "Album downloads",
      value: n(data.summary.primaryCtaClicks),
      unitLabel: "Downloads",
      unitSingular: "Download",
      unitPlural: "Downloads",
      change: data.changes.primaryCtaClicks,
      comparisonMissing: "No download data for the previous period",
      tooltip: "Album download events — each time someone downloads the album zip from the site. See the day-by-day breakdown in the 'Album downloads per day' chart below.",
      metric: "primaryCtaClicks" as ChartMetric,
      supported: true,
    },
    {
      label: "Outbound link clicks",
      value: n(data.summary.linkClicks),
      unitLabel: "Clicks",
      unitSingular: "Click",
      unitPlural: "Clicks",
      change: data.changes.linkClicks,
      comparisonMissing: "No outbound link data for the previous period",
      tooltip: "Tracked opens of public outbound links such as Instagram, Spotify, Apple Music, YouTube, TikTok and partner links.",
      metric: "linkClicks" as ChartMetric,
      supported: true,
    },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {kpis.map((kpi) => (
        <KpiCard
          key={kpi.label}
          label={kpi.label}
          value={kpi.value}
          unitLabel={kpi.unitLabel}
          unitSingular={kpi.unitSingular}
          unitPlural={kpi.unitPlural}
          change={kpi.change}
          comparisonEnabled={comparisonEnabled}
          compareLabel={compareLabel}
          comparisonMissing={kpi.comparisonMissing}
          tooltip={kpi.tooltip}
          supported={kpi.supported}
          sparkline={kpi.supported ? data.series.current.map((row) => row[kpi.metric]) : []}
          sparklineLabel={`${kpi.label} trend for ${data.range.label}`}
        />
      ))}
    </div>
  );
}

function WeeklyInsightPanel({ data }: { data: AnalyticsPayload }) {
  const active = hasActivity(data);
  const topSource = strongestSource(data);
  const topPage = strongestPage(data);
  const mainInsight =
    data.insights[0] ??
    (active
      ? {
          title: "Activity is being tracked.",
          detail: "Use the sections below to see which pages, sources and clicks are strongest in this range.",
        }
      : null);
  const support = [
    data.changes.pageViews.previous !== null
      ? {
          label: "Changed",
          value: changeLabel(data.changes.pageViews),
          detail: `${n(data.summary.pageViews)} page views`,
          tone: changeTone(data.changes.pageViews),
        }
      : {
          label: "Changed",
          value: "No comparison",
          detail: data.comparison?.available === false ? "Previous data missing" : "Waiting for earlier data",
          tone: "none" as const,
        },
    topSource
      ? {
          label: "Worked",
          value: topSource.label,
          detail: `${n(topSource.visitors)} visitors`,
          tone: "up" as const,
        }
      : {
          label: "Worked",
          value: "Waiting",
          detail: "No source yet",
          tone: "none" as const,
        },
    topPage
      ? {
          label: "Strong page",
          value: topPage.title || topPage.path,
          detail: `${n(topPage.views)} views`,
          tone: changeTone(topPage.change),
        }
      : {
          label: "Strong page",
          value: "Waiting",
          detail: "No top page yet",
          tone: "none" as const,
        },
  ];

  return (
    <section className="analytics-week-panel">
      <div className="analytics-week-main">
        <div className="eyebrow eyebrow-amber">Quick read</div>
        <h2 className="font-display mt-2 text-[24px] leading-tight tracking-tight md:text-[28px]">
          {mainInsight?.title ?? "Connect analytics data to surface weekly insights."}
        </h2>
        <p className="mt-3 max-w-2xl text-[13.5px] leading-relaxed text-[var(--colour-ink-soft)]">
          {mainInsight?.detail ??
            "Once page views, outbound clicks and campaign tags are flowing, this panel will summarize what changed and what to do next."}
        </p>
      </div>
      <div className="analytics-week-support">
        {support.map((item) => (
          <div key={item.label} className="analytics-week-card">
            <div className="analytics-subhead">{item.label}</div>
            <div className={`analytics-week-value analytics-change-${item.tone}`}>{item.value}</div>
            <div className="mt-1 text-[12px] leading-relaxed text-[var(--colour-ink-quiet)]">
              {item.detail}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function RecommendedActions({ data }: { data: AnalyticsPayload }) {
  const actions: { title: string; detail: string; tone?: "up" | "down" | "flat" | "none" }[] = [];
  const source = strongestSource(data);
  const topPage = strongestPage(data);

  if (!hasActivity(data)) {
    return (
      <Panel eyebrow="Mission next steps" title="Recommended next actions">
        <SetupChecklist />
      </Panel>
    );
  }

  if (source) {
    actions.push({
      title: `${source.label} is the clearest traffic path.`,
      detail: source.key === "direct"
        ? "Use tracked links for the next share so direct traffic can be separated from WhatsApp, Instagram and QR scans."
        : `Repeat what brought people from ${source.label.toLowerCase()}: share the strongest release link there again.`,
      tone: "up",
    });
  }

  if (topPage) {
    actions.push({
      title: `${topPage.title || topPage.path} is carrying attention.`,
      detail: "Keep the primary streaming / contact action high on that page and remove any friction around it.",
      tone: changeTone(topPage.change),
    });
  }

  if (data.summary.musicPlays > 0 && data.summary.primaryCtaClicks === 0) {
    actions.push({
      title: "People are engaging with music, but not clicking the main CTA yet.",
      detail: "Bring the Spotify / save / download action closer to the player and repeat it after the track list.",
      tone: "flat",
    });
  }

  if (data.campaigns.length === 0) {
    actions.push({
      title: "No UTM campaigns detected.",
      detail: "Use the campaign URL builder below before the next Instagram, WhatsApp or church flyer share.",
      tone: "none",
    });
  }

  if (actions.length < 4) {
    actions.push({
      title: "Tighten tracking health.",
      detail: "Prioritize Spotify/pre-save clicks, QR scans and email signups so the funnel tells the full story.",
      tone: "none",
    });
  }

  return (
    <Panel eyebrow="Mission next steps" title="Recommended next actions">
      <div className="flex flex-col gap-2">
        {actions.slice(0, 4).map((action) => (
          <div key={action.title} className="analytics-action-card">
            <div className={`analytics-action-dot analytics-action-dot-${action.tone ?? "none"}`} />
            <div>
              <div className="text-[13px] text-[var(--colour-ink-strong)]">{action.title}</div>
              <div className="mt-1 text-[12px] leading-relaxed text-[var(--colour-ink-quiet)]">
                {action.detail}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function SetupChecklist() {
  return (
    <div className="flex flex-col gap-2">
      {SETUP_ACTIONS.map((item) => (
        <div key={item} className="analytics-setup-row">
          <span aria-hidden="true">□</span>
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}

function KpiCard({
  label,
  value,
  unitLabel,
  unitSingular,
  unitPlural,
  change,
  comparisonEnabled,
  compareLabel,
  comparisonMissing,
  tooltip,
  supported,
  sparkline,
  sparklineLabel,
}: {
  label: string;
  value: ReactNode;
  unitLabel: string;
  unitSingular: string;
  unitPlural: string;
  change: Change | null;
  comparisonEnabled: boolean;
  compareLabel: string;
  comparisonMissing: string;
  tooltip: string;
  supported: boolean;
  sparkline: number[];
  sparklineLabel: string;
}) {
  const comparison = supported
    ? comparisonCopy({
        change,
        comparisonEnabled,
        compareLabel,
        missingMessage: comparisonMissing,
        unitSingular,
        unitPlural,
      })
    : {
        tone: "none" as const,
        primary: "Tracking missing",
        secondary: "Add event tracking to populate this card.",
      };

  return (
    <div className="dash-stat analytics-kpi">
      <div className="analytics-kpi-head">
        <h2 className="eyebrow analytics-kpi-title">{label}</h2>
        <InfoTooltip ariaLabel={aboutLabel(label)} tooltip={tooltip} />
      </div>
      <div className={`dash-stat-value font-display ${supported ? "" : "analytics-small-value"}`}>
        {value}
      </div>
      <div className="analytics-kpi-unit">{unitLabel}</div>
      <div className={`analytics-change analytics-change-${comparison.tone}`}>
        {comparison.primary}
      </div>
      {comparison.secondary && <div className="analytics-previous">{comparison.secondary}</div>}
      {supported && <MiniSparkline values={sparkline} label={sparklineLabel} />}
    </div>
  );
}

function InfoTooltip({ ariaLabel, tooltip }: { ariaLabel: string; tooltip: string }) {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={wrapperRef}
      className="analytics-info-wrap"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="analytics-info-button"
        aria-label={ariaLabel}
        aria-describedby={tooltipId}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
          <circle cx="10" cy="10" r="8" />
          <path d="M10 9.2v4.5" />
          <path d="M10 6.1h.01" />
        </svg>
      </button>
      <div id={tooltipId} role="tooltip" className={`analytics-tooltip ${open ? "is-open" : ""}`}>
        {tooltip}
      </div>
    </div>
  );
}

function MiniSparkline({ values, label }: { values: number[]; label: string }) {
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
    <svg className="mt-3 h-7 w-full" viewBox="0 0 100 30" preserveAspectRatio="none" role="img" aria-label={label}>
      <title>{label}</title>
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
  // A polyline needs two points to draw anything, so a single bucket would
  // render as an invisible line next to a lone dot. Repeat it at both ends so
  // it reads as a flat line at that value instead of looking broken.
  if (values.length === 1) {
    const y = 224 - (values[0] / max) * 188;
    return `28,${y} 626,${y}`;
  }
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

function targetLabel(target: string): string {
  if (!target) return "Unknown target";
  try {
    const url = new URL(target);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return target.replace(/^mailto:/, "");
  }
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

function ClickedLinksPanel({ rows }: { rows: AnalyticsPayload["clickedLinks"] }) {
  return (
    <Panel eyebrow="Outbound" title="Clicked links">
      {rows.length === 0 ? (
        <EmptyState>
          No outbound link clicks in this range yet. New clicks on Instagram, Spotify, Apple Music, YouTube and other public links will appear here.
        </EmptyState>
      ) : (
        <div className="analytics-table-wrap">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Link</th>
                <th>Platform</th>
                <th>Clicks</th>
                <th>Visitors</th>
                <th>Opened from</th>
                <th>Last opened</th>
                <th>Change</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.label}-${row.target}`}>
                  <td data-label="Link" className="text-[var(--colour-ink-soft)]">
                    <div>{row.label}</div>
                    <div className="mt-0.5 text-[11px] text-[var(--colour-ink-quiet)]">{targetLabel(row.target)}</div>
                  </td>
                  <td data-label="Platform">{row.platform}</td>
                  <td data-label="Clicks">{n(row.clicks)}</td>
                  <td data-label="Visitors">{row.uniqueVisitors > 0 ? n(row.uniqueVisitors) : "Not enough data yet"}</td>
                  <td data-label="Opened from" className="analytics-muted">{row.sourcePath ?? "Unknown"}</td>
                  <td data-label="Last opened" className="analytics-muted">{row.lastClicked ? timeAgo(row.lastClicked) : "Not yet"}</td>
                  <td data-label="Change" className={`analytics-change-${changeTone(row.change)}`}>{changeLabel(row.change)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

function CountBoard({ data }: { data: AnalyticsPayload }) {
  // Link opens tallied by platform — "Instagram opened 100 times" -> 100.
  const byPlatform = new Map<string, number>();
  for (const link of data.clickedLinks) {
    byPlatform.set(link.platform, (byPlatform.get(link.platform) ?? 0) + link.clicks);
  }
  const opens = [...byPlatform.entries()]
    .map(([label, count]) => ({ label, count }))
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count);

  // Page views tallied by page — "viewed /contact" as one number, not a log.
  const pages = data.topPagesDetailed
    .filter((row) => row.views > 0)
    .slice(0, 8)
    .map((row) => ({ label: row.path, count: row.views }));

  return (
    <Panel
      eyebrow="At a glance"
      title="Everything, counted"
      action={
        <span className="text-[12px] text-[var(--colour-ink-quiet)]">{data.range.label}</span>
      }
    >
      <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
        <div>
          <div className="analytics-subhead">Link opens by platform</div>
          {opens.length === 0 ? (
            <EmptyState>No link opens tracked in this period yet.</EmptyState>
          ) : (
            <div className="count-board-list">
              {opens.map((row) => (
                <div key={row.label} className="count-board-row">
                  <span className="count-board-label" title={row.label}>{row.label}</span>
                  <span className="count-board-num">{n(row.count)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <div className="analytics-subhead">Page views by page</div>
          {pages.length === 0 ? (
            <EmptyState>No page views tracked in this period yet.</EmptyState>
          ) : (
            <div className="count-board-list">
              {pages.map((row) => (
                <div key={row.label} className="count-board-row">
                  <span className="count-board-label" title={row.label}>{row.label}</span>
                  <span className="count-board-num">{n(row.count)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}

function DownloadsPerDay({ rows }: { rows: AnalyticsPayload["last30Days"] }) {
  const days = rows.slice(-14);
  const total = days.reduce((sum, row) => sum + row.downloads, 0);
  const max = Math.max(1, ...days.map((row) => row.downloads));

  return (
    <Panel
      eyebrow="Downloads"
      title="Album downloads per day"
      action={
        total > 0 ? (
          <span className="text-[12px] text-[var(--colour-ink-quiet)]">
            {n(total)} in the last 14 days
          </span>
        ) : undefined
      }
    >
      {total === 0 ? (
        <EmptyState>
          No album downloads tracked yet. Each day&apos;s count shows here as a bar the moment people start downloading the album.
        </EmptyState>
      ) : (
        <div
          className="download-bars"
          role="img"
          aria-label="Album downloads per day for the last 14 days"
        >
          {days.map((row) => {
            const parts = row.date.split("-");
            const dayLabel = parts.length === 3 ? `${parts[2]}/${parts[1]}` : row.date;
            const height = row.downloads === 0 ? 0 : Math.max(8, (row.downloads / max) * 100);
            return (
              <div
                key={row.date}
                className="download-bar-col"
                title={`${row.date}: ${n(row.downloads)} download${row.downloads === 1 ? "" : "s"}`}
              >
                <div className="download-bar-count">{row.downloads > 0 ? n(row.downloads) : ""}</div>
                <div className="download-bar-track">
                  <div className="download-bar-fill" style={{ height: `${height}%` }} />
                </div>
                <div className="download-bar-day">{dayLabel}</div>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

function DailyActivityPanel({ rows }: { rows: AnalyticsPayload["last30Days"] }) {
  const visibleRows = rows.slice(-14).reverse();
  return (
    <Panel eyebrow="Daily" title="Daily downloads & activity">
      {visibleRows.length === 0 ? (
        <EmptyState>No daily activity has been tracked yet.</EmptyState>
      ) : (
        <div className="analytics-table-wrap">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Downloads</th>
                <th>Link clicks</th>
                <th>Music plays</th>
                <th>Page views</th>
                <th>Visitors</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.date}>
                  <td data-label="Date" className="text-[var(--colour-ink-soft)]">{row.date}</td>
                  <td data-label="Downloads">{n(row.downloads)}</td>
                  <td data-label="Link clicks">{n(row.links)}</td>
                  <td data-label="Music plays">{n(row.plays)}</td>
                  <td data-label="Page views">{n(row.views)}</td>
                  <td data-label="Visitors">{n(row.visitors)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

function CampaignsPanel({ rows }: { rows: AnalyticsPayload["campaigns"] }) {
  return (
    <Panel eyebrow="Campaign tracking" title="Campaigns">
      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="analytics-subhead">Detected campaign links</div>
          {rows.length > 0 ? (
            <CampaignTable rows={rows} />
          ) : (
            <EmptyState>
              No UTM campaign traffic in this range yet. Build tracked links before the next Instagram bio, WhatsApp share, QR flyer or Show.co push.
            </EmptyState>
          )}
        </div>
        <CampaignUrlBuilder />
      </div>
    </Panel>
  );
}

function CampaignUrlBuilder() {
  const [destination, setDestination] = useState("https://www.alltheglory.co.za/album/from-darkness-to-light");
  const [source, setSource] = useState("instagram");
  const [medium, setMedium] = useState("bio");
  const [campaign, setCampaign] = useState("from-darkness-to-light");
  const [content, setContent] = useState("");
  const [copied, setCopied] = useState(false);

  const trackedUrl = useMemo(() => {
    try {
      const url = new URL(destination);
      url.searchParams.set("utm_source", source.trim() || "source");
      url.searchParams.set("utm_medium", medium.trim() || "medium");
      url.searchParams.set("utm_campaign", campaign.trim() || "campaign");
      if (content.trim()) url.searchParams.set("utm_content", content.trim());
      return url.toString();
    } catch {
      return "";
    }
  }, [campaign, content, destination, medium, source]);

  async function copy() {
    if (!trackedUrl) return;
    await navigator.clipboard?.writeText(trackedUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="analytics-builder">
      <div className="analytics-subhead">UTM helper</div>
      <div className="grid gap-2">
        <input className="dash-input" value={destination} onChange={(e) => setDestination(e.target.value)} aria-label="Destination URL" />
        <div className="grid gap-2 sm:grid-cols-2">
          <input className="dash-input" value={source} onChange={(e) => setSource(e.target.value)} aria-label="UTM source" placeholder="source" />
          <input className="dash-input" value={medium} onChange={(e) => setMedium(e.target.value)} aria-label="UTM medium" placeholder="medium" />
          <input className="dash-input" value={campaign} onChange={(e) => setCampaign(e.target.value)} aria-label="UTM campaign" placeholder="campaign" />
          <input className="dash-input" value={content} onChange={(e) => setContent(e.target.value)} aria-label="UTM content" placeholder="content (optional)" />
        </div>
        <div className="analytics-tracked-url">
          {trackedUrl || "Enter a valid https:// URL to generate a campaign link."}
        </div>
        <button type="button" className="dash-btn dash-btn-primary" onClick={copy} disabled={!trackedUrl}>
          {copied ? "Copied" : "Copy tracked URL"}
        </button>
      </div>
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
              <td data-label="Campaign">{row.campaign}</td>
              <td data-label="Source">{row.source}</td>
              <td data-label="Medium">{row.medium}</td>
              <td data-label="Visitors">{n(row.visitors)}</td>
              <td data-label="Music plays">{n(row.musicPlays)}</td>
              <td data-label="CTA clicks">{n(row.primaryCtaClicks)}</td>
              <td data-label="Conversion">{pct(row.conversionRate)}</td>
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
              <td data-label="Page" className="text-[var(--colour-ink-soft)]">{row.title}</td>
              <td data-label="Path" className="analytics-muted">{row.path}</td>
              <td data-label="Views">{n(row.views)}</td>
              <td data-label="Visitors">{n(row.uniqueVisitors)}</td>
              <td data-label="Avg engagement" className="analytics-muted">Not enough data yet</td>
              <td data-label="CTA clicks" className="analytics-muted">Not enough data yet</td>
              <td data-label="Change" className={`analytics-change-${changeTone(row.change)}`}>{changeLabel(row.change)}</td>
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
  const platformCounts = ["Spotify", "Apple Music", "YouTube", "Instagram"].map((platform) => ({
    label: platform === "Instagram" ? "Social links" : platform,
    count: data.clickedLinks
      .filter((row) =>
        platform === "Instagram"
          ? ["Instagram", "Facebook", "TikTok"].includes(row.platform)
          : row.platform === platform,
      )
      .reduce((sum, row) => sum + row.clicks, 0),
  }));

  return (
    <Panel eyebrow="Music" title="Music engagement">
      <div className="grid gap-3 md:grid-cols-4">
        <MicroStat label="Play clicks" value={n(data.music.totalPlayClicks)} />
        <MicroStat
          label="Unique listeners"
          value={data.music.uniqueListenersSupported && data.music.uniqueListeners !== null ? n(data.music.uniqueListeners) : "Not enough data yet"}
        />
        <MicroStat label="Completion rate" value="Not enough data yet" />
        <MicroStat label="External link clicks" value={n(data.summary.linkClicks)} />
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
                  <td data-label="Track" className="text-[var(--colour-ink-soft)]">{track.title}</td>
                  <td data-label="Play clicks">{n(track.playClicks)}</td>
                  <td data-label="Unique listeners">{track.uniqueListenersSupported && track.uniqueListeners !== null ? n(track.uniqueListeners) : "Not enough data yet"}</td>
                  <td data-label="Avg listening time" className="analytics-muted">Not enough data yet</td>
                  <td data-label="Completion" className="analytics-muted">Not enough data yet</td>
                  <td data-label="External clicks" className="analytics-muted">Not enough data yet</td>
                  <td data-label="Change" className={`analytics-change-${changeTone(track.change)}`}>{changeLabel(track.change)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <div className="analytics-subhead">Platform clicks</div>
          <div className="flex flex-col gap-2">
            {platformCounts.map((item) => (
              <div key={item.label} className="rounded-xl border border-white/5 bg-white/[0.025] px-3 py-3">
                <div className="text-[12.5px] text-[var(--colour-ink-soft)]">{item.label}</div>
                <div className="mt-1 text-[11.5px] text-[var(--colour-ink-quiet)]">{n(item.count)} clicks</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}

function ReleaseSetupPrompts() {
  const prompts = [
    "Add tracking to Spotify buttons",
    "Add UTM tags to Show.co / pre-save links",
    "Track QR code scans from flyers",
    "Track email signups as a funnel step",
  ];
  return (
    <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.02] p-3">
      <div className="analytics-subhead">Setup prompts</div>
      <div className="grid gap-2 sm:grid-cols-2">
        {prompts.map((prompt) => (
          <div key={prompt} className="analytics-setup-row">
            <span aria-hidden="true">□</span>
            <span>{prompt}</span>
          </div>
        ))}
      </div>
    </div>
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
        <div key={`${activity.time}-${index}`} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.025] px-3 py-2.5 text-[12.5px]">
          <span className="min-w-0 truncate text-[var(--colour-ink-soft)]">
            {activity.country ? <span aria-hidden="true">{flagFromCode(activity.country)} </span> : null}
            <span className={activity.kind === "download" || activity.kind === "link" ? "text-[var(--colour-glow)]" : ""}>
              {activity.label}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-2.5">
            <span className="text-[10.5px] text-[var(--colour-ink-quiet)]">{timeAgo(activity.time)}</span>
            <span
              className="min-w-[1.75rem] rounded-md bg-white/[0.06] px-1.5 py-0.5 text-center font-display text-[13px] font-semibold text-[var(--colour-glow)]"
              style={{ fontVariantNumeric: "tabular-nums" }}
              title={`${activity.count} time${activity.count === 1 ? "" : "s"}`}
            >
              {activity.count > 999 ? "999+" : activity.count}
            </span>
          </span>
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
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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
