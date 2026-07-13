"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Panel } from "@/components/dashboard/panel";
import type { AnalyticsPayload } from "@/app/api/analytics/route";

const POLL_MS = 12_000;

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

function shortDay(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
  });
}

function shortDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function timeAgo(ms: number) {
  const s = Math.max(0, Math.round((Date.now() - ms) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86_400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86_400)}d ago`;
}

function n(value: number) {
  return value.toLocaleString();
}

function pct(value: number, digits = 1) {
  if (!Number.isFinite(value)) return "0%";
  return `${value.toFixed(digits).replace(/\.0$/, "")}%`;
}

function trend(current: number, previous: number) {
  if (previous <= 0 && current <= 0) return "flat";
  if (previous <= 0) return "new activity";
  const change = Math.round(((current - previous) / previous) * 100);
  if (change === 0) return "flat vs previous 7d";
  return `${change > 0 ? "up" : "down"} ${Math.abs(change)}% vs previous 7d`;
}

function money(amount: number, currency: string) {
  const prefix = currency === "ZAR" ? "R" : `${currency} `;
  return `${prefix}${amount.toLocaleString()}`;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [setupNeeded, setSetupNeeded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<number | null>(null);
  const timerRef = useRef<number | null>(null);

  const fetchOnce = useCallback(async () => {
    try {
      const res = await fetch("/api/analytics", { cache: "no-store" });
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
    }
  }, []);

  useEffect(() => {
    fetchOnce();
    timerRef.current = window.setInterval(fetchOnce, POLL_MS);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [fetchOnce]);

  const downloadRate =
    data && data.uniqueVisitors > 0
      ? (data.totalDownloads / data.uniqueVisitors) * 100
      : 0;
  const playRate =
    data && data.uniqueVisitors > 0 ? (data.totalPlays / data.uniqueVisitors) * 100 : 0;
  const downloadFromPlay =
    data && data.totalPlays > 0 ? (data.totalDownloads / data.totalPlays) * 100 : 0;
  const viewsPerVisitor =
    data && data.uniqueVisitors > 0 ? data.totalViews / data.uniqueVisitors : 0;
  const max30 = data
    ? Math.max(
        1,
        ...data.last30Days.map((d) => Math.max(d.views, d.plays, d.downloads)),
      )
    : 1;
  const max7Downloads = data
    ? Math.max(1, ...data.last7Days.map((d) => d.downloads))
    : 1;

  return (
    <>
      <div className="dash-pagehead">
        <div>
          <div className="eyebrow eyebrow-amber">Analytics</div>
          <h1 className="dash-title mt-1">Site command centre</h1>
          <div className="dash-subtitle flex items-center gap-2 flex-wrap">
            <span
              className="inline-flex h-2 w-2 rounded-full"
              style={{
                background: "var(--colour-amber)",
                boxShadow: "0 0 8px var(--colour-amber)",
                animation: "pulse 1.6s ease-in-out infinite",
              }}
              aria-hidden="true"
            />
            <span>Live data · refreshes every {POLL_MS / 1000}s</span>
            {lastFetched && (
              <span className="text-[var(--colour-ink-quiet)]">
                · updated {timeAgo(lastFetched)}
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          className="dash-btn dash-btn-ghost"
          onClick={fetchOnce}
          title="Pull the latest numbers right now"
        >
          ↻ Refresh
        </button>
      </div>

      {setupNeeded && <SetupCard />}
      {error && !setupNeeded && (
        <div
          className="dash-panel"
          style={{
            padding: "16px 20px",
            marginBottom: 18,
            borderColor: "rgba(216,178,90,0.35)",
          }}
        >
          <div className="eyebrow eyebrow-amber">Heads up</div>
          <p className="text-[13px] text-[var(--colour-ink-soft)] mt-1">
            Couldn&apos;t reach the analytics store:{" "}
            <code className="text-[var(--colour-amber-soft)]">{error}</code>.
            Will keep retrying.
          </p>
        </div>
      )}

      {data && !setupNeeded && (
        <div className="dash-grid">
          <div className="dash-col-12">
            <Panel
              eyebrow="Lifetime"
              title="What has happened on the site, all time"
              action={
                <span className="text-[11px] uppercase tracking-[0.22em] text-[var(--colour-ink-quiet)]">
                  Since tracking began
                </span>
              }
            >
              <div className="grid gap-3 md:grid-cols-4">
                <HeroMetric
                  label="Album downloads"
                  value={n(data.totalDownloads)}
                  hint={`${n(data.downloadsToday)} today · ${n(data.downloads7d)} last 7d`}
                  tone="gold"
                />
                <HeroMetric
                  label="Music plays"
                  value={n(data.totalPlays)}
                  hint={`${n(data.playsToday)} today · ${trend(data.playsThisWeek, data.playsLastWeek)}`}
                  tone="warm"
                />
                <HeroMetric
                  label="Unique visitors"
                  value={n(data.uniqueVisitors)}
                  hint={`${n(data.visitors30d)} in the last 30 days`}
                  tone="calm"
                />
                <HeroMetric
                  label="Total page views"
                  value={n(data.totalViews)}
                  hint={`${viewsPerVisitor.toFixed(1)} views per visitor`}
                  tone="cool"
                />
              </div>
            </Panel>
          </div>

          <div className="dash-col-12">
            <div className="grid gap-3 md:grid-cols-5">
              <PulseMetric
                label="Active now"
                value={n(data.activeNow)}
                hint="Last 5 minutes"
                glow
              />
              <PulseMetric
                label="Visitors today"
                value={n(data.visitorsToday)}
                hint={`${n(data.viewsToday)} views`}
              />
              <PulseMetric
                label="Plays today"
                value={n(data.playsToday)}
                hint={`${n(data.plays7d)} last 7d`}
              />
              <PulseMetric
                label="Downloads today"
                value={n(data.downloadsToday)}
                hint={`${n(data.downloads7d)} last 7d`}
              />
              <PulseMetric
                label="30-day downloads"
                value={n(data.downloads30d)}
                hint={`${pct(downloadRate)} visitor-to-download`}
              />
            </div>
          </div>

          <div className="dash-col-7">
            <Panel eyebrow="Last 30 days" title="Traffic, plays and downloads">
              <CompactBars rows={data.last30Days} max={max30} />
              <div className="mt-5 grid gap-2 md:grid-cols-3">
                <MicroStat label="Views" value={n(data.views30d)} />
                <MicroStat label="Plays" value={n(data.plays30d)} />
                <MicroStat label="Downloads" value={n(data.downloads30d)} />
              </div>
            </Panel>
          </div>

          <div className="dash-col-5">
            <Panel eyebrow="Music funnel" title="Visitor behaviour">
              <FunnelRows
                rows={[
                  {
                    label: "Visitor to download",
                    value: pct(downloadRate),
                    detail: `${n(data.totalDownloads)} downloads / ${n(data.uniqueVisitors)} visitors`,
                  },
                  {
                    label: "Visitor to play",
                    value: pct(playRate),
                    detail: `${n(data.totalPlays)} plays / ${n(data.uniqueVisitors)} visitors`,
                  },
                  {
                    label: "Download per play",
                    value: pct(downloadFromPlay),
                    detail: `${n(data.totalDownloads)} downloads / ${n(data.totalPlays)} plays`,
                  },
                  {
                    label: "Downloads this week",
                    value: n(data.downloadsThisWeek),
                    detail: trend(data.downloadsThisWeek, data.downloadsLastWeek),
                  },
                  {
                    label: "Page views this week",
                    value: n(data.viewsThisWeek),
                    detail: trend(data.viewsThisWeek, data.viewsLastWeek),
                  },
                ]}
              />
            </Panel>
          </div>

          <div className="dash-col-8">
            <Panel eyebrow="Downloads" title="Album download momentum">
              <DayBars
                rows={data.last7Days}
                max={max7Downloads}
                pick={(r) => r.downloads}
                colour="var(--colour-amber-soft)"
              />
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <RankedList
                  title="Top downloaded files"
                  empty="No downloads recorded yet."
                  rows={data.topDownloads}
                />
                <CountryList
                  title="Download countries"
                  empty="No download countries yet."
                  rows={data.topDownloadCountries}
                />
              </div>
            </Panel>
          </div>

          <div className="dash-col-4">
            <Panel eyebrow="Pages" title="What people read">
              <RankedList
                empty="No page views yet."
                rows={data.topPages.map((p) => ({ label: p.path, count: p.count }))}
              />
            </Panel>
          </div>

          <div className="dash-col-4">
            <Panel eyebrow="Music" title="Most played">
              <RankedList empty="No plays yet." rows={data.topTracks} />
            </Panel>
          </div>

          <div className="dash-col-4">
            <Panel eyebrow="Audience" title="Visitor countries">
              <CountryList empty="No visitor countries yet." rows={data.topCountries} />
            </Panel>
          </div>

          <div className="dash-col-4">
            <Panel eyebrow="Acquisition" title="How they arrived">
              <RankedList empty="No external sources yet." rows={data.topSources} />
            </Panel>
          </div>

          <div className="dash-col-4">
            <Panel eyebrow="Devices" title="Browsing split">
              <RankedList empty="No device data yet." rows={data.deviceSplit} capitalize />
            </Panel>
          </div>

          <div className="dash-col-8">
            <Panel eyebrow="Live" title="Recent activity">
              <ActivityList rows={data.recentActivity} />
            </Panel>
          </div>

          <div className="dash-col-4">
            <Panel eyebrow="Recent downloads" title="Latest album saves">
              {data.recentDownloads.length === 0 ? (
                <EmptyState>No downloads recorded yet.</EmptyState>
              ) : (
                <div className="flex flex-col gap-2">
                  {data.recentDownloads.map((d, i) => (
                    <div
                      key={`${d.time}-${i}`}
                      className="rounded-xl border border-white/5 bg-white/[0.025] px-3 py-2.5"
                    >
                      <div
                        className="truncate text-[12.5px] text-[var(--colour-ink-soft)]"
                        title={d.file}
                      >
                        <span aria-hidden="true">{flagFromCode(d.country)}</span>{" "}
                        {d.file}
                      </div>
                      <div className="mt-1 text-[11px] uppercase tracking-[0.16em] text-[var(--colour-ink-quiet)]">
                        {timeAgo(d.time)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          {data.totalDonations > 0 && (
            <div className="dash-col-12">
              <Panel eyebrow="Legacy giving" title="Donation history">
                <div className="grid gap-3 md:grid-cols-3">
                  <MicroStat
                    label="Total given"
                    value={money(data.totalRaised, data.raisedCurrency)}
                  />
                  <MicroStat
                    label="Gifts"
                    value={n(data.totalDonations)}
                  />
                  <MicroStat
                    label="Given today"
                    value={money(data.raisedToday, data.raisedCurrency)}
                  />
                </div>
              </Panel>
            </div>
          )}
        </div>
      )}

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50%      { opacity: 1;   transform: scale(1.4); }
        }
      `}</style>
    </>
  );
}

function HeroMetric({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: ReactNode;
  hint: string;
  tone: "gold" | "warm" | "calm" | "cool";
}) {
  const colours = {
    gold: "rgba(216,178,90,0.18)",
    warm: "rgba(241,194,125,0.14)",
    calm: "rgba(210,200,184,0.12)",
    cool: "rgba(183,228,199,0.10)",
  };
  return (
    <div
      className="rounded-2xl border border-white/10 px-4 py-4"
      style={{
        background: `linear-gradient(135deg, ${colours[tone]}, rgba(255,255,255,0.025))`,
      }}
    >
      <div className="eyebrow">{label}</div>
      <div className="font-display mt-2 text-[34px] leading-none tracking-tight text-white/95">
        {value}
      </div>
      <div className="mt-2 text-[12px] leading-relaxed text-[var(--colour-ink-quiet)]">
        {hint}
      </div>
    </div>
  );
}

function PulseMetric({
  label,
  value,
  hint,
  glow = false,
}: {
  label: string;
  value: ReactNode;
  hint: string;
  glow?: boolean;
}) {
  return (
    <div className="dash-stat">
      <div className="eyebrow">{label}</div>
      <div
        className="dash-stat-value font-display"
        style={{ color: glow ? "#b7e4c7" : undefined }}
      >
        {value}
      </div>
      <div className="dash-stat-hint">{hint}</div>
    </div>
  );
}

function MicroStat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.025] px-3 py-3">
      <div className="text-[10.5px] uppercase tracking-[0.2em] text-[var(--colour-ink-quiet)]">
        {label}
      </div>
      <div className="font-display mt-1 text-[20px] text-[var(--colour-glow)]">
        {value}
      </div>
    </div>
  );
}

function FunnelRows({
  rows,
}: {
  rows: { label: string; value: ReactNode; detail: string }[];
}) {
  return (
    <div className="flex flex-col gap-2">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-start justify-between gap-4 rounded-xl border border-white/5 bg-white/[0.025] px-3 py-3"
        >
          <div className="min-w-0">
            <div className="text-[12.5px] text-[var(--colour-ink-soft)]">
              {row.label}
            </div>
            <div className="mt-1 text-[11.5px] leading-relaxed text-[var(--colour-ink-quiet)]">
              {row.detail}
            </div>
          </div>
          <div className="font-display text-[20px] text-[var(--colour-glow)] shrink-0">
            {row.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function RankedList({
  title,
  rows,
  empty,
  capitalize = false,
}: {
  title?: string;
  rows: { label: string; count: number }[];
  empty: string;
  capitalize?: boolean;
}) {
  if (rows.length === 0) return <EmptyState>{empty}</EmptyState>;
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div>
      {title && (
        <div className="mb-2 text-[10.5px] uppercase tracking-[0.2em] text-[var(--colour-ink-quiet)]">
          {title}
        </div>
      )}
      <div className="flex flex-col gap-2">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="flex items-baseline justify-between gap-3">
              <span
                className={`truncate text-[12.5px] text-[var(--colour-ink-soft)] ${capitalize ? "capitalize" : ""}`}
                title={row.label}
              >
                {row.label}
              </span>
              <span className="font-display text-[13px] text-[var(--colour-glow)] shrink-0">
                {n(row.count)}
              </span>
            </div>
            <div className="mt-1 h-1 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--colour-amber)]/75"
                style={{ width: `${Math.max(5, (row.count / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CountryList({
  title,
  rows,
  empty,
}: {
  title?: string;
  rows: { code: string; count: number }[];
  empty: string;
}) {
  return (
    <RankedList
      title={title}
      empty={empty}
      rows={rows.map((row) => ({
        label: `${flagFromCode(row.code)} ${row.code}`,
        count: row.count,
      }))}
    />
  );
}

function ActivityList({ rows }: { rows: AnalyticsPayload["recentActivity"] }) {
  if (rows.length === 0) {
    return (
      <EmptyState>
        Visits, plays and downloads appear here within seconds.
      </EmptyState>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {rows.map((a, i) => (
        <div
          key={`${a.time}-${i}`}
          className="flex items-baseline justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.025] px-3 py-2.5 text-[12.5px]"
        >
          <span className="min-w-0 truncate text-[var(--colour-ink-soft)]">
            {a.country ? (
              <span aria-hidden="true">{flagFromCode(a.country)} </span>
            ) : null}
            <span className={a.kind === "download" ? "text-[var(--colour-glow)]" : ""}>
              {a.label}
            </span>
          </span>
          <span className="text-[var(--colour-ink-quiet)] shrink-0">
            {timeAgo(a.time)}
          </span>
        </div>
      ))}
    </div>
  );
}

function CompactBars({
  rows,
  max,
}: {
  rows: AnalyticsPayload["last30Days"];
  max: number;
}) {
  return (
    <div>
      <div className="flex items-center gap-4 text-[10.5px] uppercase tracking-[0.18em] text-[var(--colour-ink-quiet)] mb-3">
        <Legend colour="var(--colour-amber)" label="Views" />
        <Legend colour="#b7e4c7" label="Plays" />
        <Legend colour="var(--colour-amber-soft)" label="Downloads" />
      </div>
      <div className="grid grid-cols-[repeat(30,minmax(0,1fr))] gap-1 items-end h-44">
        {rows.map((r, i) => {
          const values = [
            { key: "views", value: r.views, colour: "var(--colour-amber)" },
            { key: "plays", value: r.plays, colour: "#b7e4c7" },
            { key: "downloads", value: r.downloads, colour: "var(--colour-amber-soft)" },
          ];
          return (
            <div key={r.date} className="h-full min-w-0 flex flex-col justify-end">
              <div className="grid h-full grid-cols-3 items-end gap-px">
                {values.map((v) => (
                  <div
                    key={v.key}
                    className="rounded-[2px]"
                    style={{
                      height: `${Math.max(v.value > 0 ? 4 : 1, (v.value / max) * 100)}%`,
                      minHeight: v.value > 0 ? 4 : 1,
                      background: v.colour,
                      opacity: v.value > 0 ? 0.82 : 0.12,
                    }}
                    title={`${shortDate(r.date)} ${v.key}: ${v.value}`}
                  />
                ))}
              </div>
              {(i === 0 || i === rows.length - 1) && (
                <div className="mt-1 text-[9px] text-[var(--colour-ink-quiet)] -rotate-45 origin-top-left whitespace-nowrap">
                  {shortDate(r.date)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Legend({ colour, label }: { colour: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ background: colour }}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}

function DayBars({
  rows,
  max,
  pick,
  colour,
}: {
  rows: AnalyticsPayload["last7Days"];
  max: number;
  pick: (r: AnalyticsPayload["last7Days"][number]) => number;
  colour: string;
}) {
  return (
    <div className="grid grid-cols-7 gap-2 items-end" style={{ minHeight: 140 }}>
      {rows.map((r) => {
        const v = pick(r);
        const height = Math.max(2, Math.round((v / max) * 100));
        return (
          <div key={r.date} className="flex flex-col items-center gap-1.5">
            <div
              className="w-full rounded-sm transition-all duration-500"
              style={{
                height: `${height}%`,
                minHeight: 6,
                background: colour,
                opacity: v === 0 ? 0.18 : 0.9,
              }}
              aria-label={`${shortDay(r.date)} · ${v}`}
            />
            <div className="text-[10.5px] text-[var(--colour-ink-quiet)] uppercase tracking-[0.12em]">
              {shortDay(r.date)}
            </div>
            <div className="text-[12px] text-[var(--colour-ink-soft)] font-display">
              {v}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.025] px-3 py-3 text-[12.5px] leading-relaxed text-[var(--colour-ink-quiet)]">
      {children}
    </div>
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
      <p className="text-[13.5px] text-[var(--colour-ink-soft)] mt-3 leading-relaxed max-w-xl">
        The dashboard expects the Cloudflare D1 binding named{" "}
        <code className="text-[var(--colour-amber-soft)]">DB</code>. Once the
        Worker is deployed with that binding, page views, plays and downloads
        will start flowing in.
      </p>
    </div>
  );
}
