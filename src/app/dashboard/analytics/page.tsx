"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Panel, Stat } from "@/components/dashboard/panel";
import type { AnalyticsPayload } from "@/app/api/analytics/route";

const POLL_MS = 12_000;

// Best-effort country flag emoji from a 2-letter ISO code. Falls back
// to the code itself for "??" and other malformed values.
function flagFromCode(code: string): string {
  if (!code || code.length !== 2) return code || "??";
  const upper = code.toUpperCase();
  // ASCII A-Z → regional-indicator codepoints
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
  // "2026-06-12" → "Fri 12"
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
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

  // Largest 7-day bucket — used to normalise the bar chart heights.
  const maxViewsBucket = data
    ? Math.max(1, ...data.last7Days.map((d) => d.views))
    : 1;
  const maxDlBucket = data
    ? Math.max(1, ...data.last7Days.map((d) => d.downloads))
    : 1;

  return (
    <>
      <div className="dash-pagehead">
        <div>
          <div className="eyebrow eyebrow-amber">Analytics</div>
          <h1 className="dash-title mt-1">Site activity</h1>
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
            <span>Live · refreshes every {POLL_MS / 1000}s</span>
            {lastFetched && (
              <span className="text-[var(--colour-ink-quiet)]">
                · last update {timeAgo(lastFetched)}
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
        <div className="dash-panel" style={{ padding: "16px 20px", marginBottom: 18, borderColor: "rgba(216,178,90,0.35)" }}>
          <div className="eyebrow eyebrow-amber">Heads up</div>
          <p className="text-[13px] text-[var(--colour-ink-soft)] mt-1">
            Couldn&apos;t reach the analytics store: <code className="text-[var(--colour-amber-soft)]">{error}</code>. Will keep retrying.
          </p>
        </div>
      )}

      {data && !setupNeeded && (
        <div className="dash-grid">
          {/* Headline stats */}
          <div className="dash-col-3">
            <Stat
              label="Total visits"
              value={data.totalViews.toLocaleString()}
              hint="All time, public pages"
              tone="amber"
            />
          </div>
          <div className="dash-col-3">
            <Stat
              label="Visiting now"
              value={data.activeNow}
              hint="Active in the last 5 minutes"
              tone="ok"
            />
          </div>
          <div className="dash-col-3">
            <Stat
              label="Visits today"
              value={data.viewsToday.toLocaleString()}
              hint={data.last7Days[6]?.date}
              tone="calm"
            />
          </div>
          <div className="dash-col-3">
            <Stat
              label="Downloads today"
              value={data.downloadsToday.toLocaleString()}
              hint={`${data.totalDownloads.toLocaleString()} all-time`}
              tone="warn"
            />
          </div>

          {/* Last 7 days — views */}
          <div className="dash-col-8">
            <Panel eyebrow="Last 7 days" title="Visits per day">
              <DayBars
                rows={data.last7Days}
                max={maxViewsBucket}
                pick={(r) => r.views}
                colour="var(--colour-amber)"
              />
            </Panel>
          </div>

          {/* Top pages */}
          <div className="dash-col-4">
            <Panel eyebrow="Top pages" title="Most visited">
              {data.topPages.length === 0 ? (
                <div className="text-[12px] text-[var(--colour-ink-quiet)]">
                  No traffic recorded yet.
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {data.topPages.map((p) => (
                    <div
                      key={p.path}
                      className="flex items-baseline justify-between gap-2"
                    >
                      <span
                        className="text-[12.5px] text-[var(--colour-ink-soft)] truncate"
                        title={p.path}
                      >
                        {p.path}
                      </span>
                      <span className="font-display text-[13px] text-[var(--colour-glow)] shrink-0">
                        {p.count.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          {/* Last 7 days — downloads */}
          <div className="dash-col-8">
            <Panel eyebrow="Last 7 days" title="Album downloads per day">
              <DayBars
                rows={data.last7Days}
                max={maxDlBucket}
                pick={(r) => r.downloads}
                colour="var(--colour-amber-soft)"
              />
            </Panel>
          </div>

          {/* Top countries */}
          <div className="dash-col-4">
            <Panel eyebrow="Top countries" title="Where visitors come from">
              {data.topCountries.length === 0 ? (
                <div className="text-[12px] text-[var(--colour-ink-quiet)]">
                  No traffic recorded yet.
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {data.topCountries.map((c) => (
                    <div
                      key={c.code}
                      className="flex items-baseline justify-between gap-2"
                    >
                      <span className="text-[13px] text-[var(--colour-ink-soft)] flex items-center gap-2">
                        <span aria-hidden="true">{flagFromCode(c.code)}</span>
                        {c.code}
                      </span>
                      <span className="font-display text-[13px] text-[var(--colour-glow)]">
                        {c.count.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          {/* Recent downloads */}
          <div className="dash-col-12">
            <Panel eyebrow="Recent downloads" title="Last 20 download events">
              {data.recentDownloads.length === 0 ? (
                <div className="text-[12px] text-[var(--colour-ink-quiet)]">
                  No downloads recorded yet. Once a visitor downloads the
                  album, the event lands here within seconds.
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {data.recentDownloads.map((d, i) => (
                    <div
                      key={`${d.time}-${i}`}
                      className="flex items-baseline justify-between gap-3 text-[12.5px]"
                    >
                      <span className="text-[var(--colour-ink-soft)] truncate">
                        <span aria-hidden="true">{flagFromCode(d.country)}</span>{" "}
                        <span title={d.file}>{d.file}</span>
                      </span>
                      <span className="text-[var(--colour-ink-quiet)] shrink-0">
                        {timeAgo(d.time)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>
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

// ── 7-day bar chart ──────────────────────────────────────────────
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
        const pct = Math.max(2, Math.round((v / max) * 100));
        return (
          <div key={r.date} className="flex flex-col items-center gap-1.5">
            <div
              className="w-full rounded-sm transition-all duration-500"
              style={{
                height: `${pct}%`,
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

// ── Setup card (shown when Vercel KV isn't provisioned yet) ──────
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
      <div className="eyebrow eyebrow-amber">Setup needed · ~2 minutes</div>
      <h2 className="font-display mt-2 text-[22px] md:text-[24px] tracking-tight text-white/95">
        Connect Upstash Redis to start collecting analytics.
      </h2>
      <p className="text-[13.5px] text-[var(--colour-ink-soft)] mt-3 leading-relaxed max-w-xl">
        The tracking + dashboard code is wired up. It needs a Redis store
        on Vercel to keep the counts. The Upstash free tier covers every
        realistic traffic level for this site.
      </p>
      <ol className="text-[13px] text-[var(--colour-ink-soft)] mt-4 leading-relaxed space-y-2 pl-5 list-decimal">
        <li>
          Open the project on{" "}
          <a
            href="https://vercel.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--colour-amber)] hover:text-[var(--colour-glow)] underline"
          >
            vercel.com/dashboard
          </a>
          .
        </li>
        <li>
          Open the <strong>Storage</strong> tab → <strong>Marketplace</strong> →
          search <strong>Upstash</strong> → install the <strong>Redis</strong> integration. Accept the free plan.
        </li>
        <li>
          Connect the integration to the{" "}
          <code className="text-[var(--colour-amber-soft)]">allthegloryclaude</code> project.
          Vercel auto-pushes <code className="text-[var(--colour-amber-soft)]">UPSTASH_REDIS_REST_URL</code> +{" "}
          <code className="text-[var(--colour-amber-soft)]">UPSTASH_REDIS_REST_TOKEN</code> and triggers a redeploy.
        </li>
        <li>
          Refresh this page — real numbers will start flowing in.
        </li>
      </ol>
      <p className="text-[12px] text-[var(--colour-ink-quiet)] mt-4">
        Until the store is connected, page-view and download events get
        silently dropped (no errors for visitors), so it&apos;s safe to
        sit in this state as long as you want.
      </p>
    </div>
  );
}
