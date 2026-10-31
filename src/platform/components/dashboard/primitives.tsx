import type { CSSProperties, ReactNode } from "react";
import { Icon, type IconName } from "@/platform/components/ui/Icon";

// Server-rendered building blocks for the dashboard demonstrations. They hold
// no data of their own and no client state, so the same components will
// render real tenant data in Phase 2.

export type Span = 4 | 5 | 6 | 7 | 8 | 12;

export function DashGrid({ children }: { children: ReactNode }) {
  return <div className="dash-grid">{children}</div>;
}

export function Panel({
  title,
  description,
  actions,
  span = 12,
  tone,
  children,
  id,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  span?: Span;
  tone?: "accent" | "night" | "rings";
  children: ReactNode;
  id?: string;
}) {
  const headingId = id ?? `panel-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
  return (
    <section className={`panel span-${span}${tone ? ` panel--${tone}` : ""}`} aria-labelledby={headingId}>
      <div className="panel__head">
        <div>
          <h2 id={headingId}>{title}</h2>
          {description ? <p className="panel__desc">{description}</p> : null}
        </div>
        {actions ? <div className="panel__actions">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}

export interface Stat {
  label: string;
  value: ReactNode;
  note?: ReactNode;
  trend?: "up" | "down";
  accent?: boolean;
}

export function StatGrid({ stats, label }: { stats: Stat[]; label?: string }) {
  return (
    <dl className="stat-grid" aria-label={label}>
      {stats.map((s) => (
        <div className={`stat${s.accent ? " stat--accent" : ""}`} key={s.label}>
          <dt>{s.label}</dt>
          <dd className={`stat__value${typeof s.value === "string" && s.value.length > 6 ? " stat__value--long" : ""}`}>{s.value}</dd>
          {s.note ? <dd className={`stat__note${s.trend ? ` stat__note--${s.trend}` : ""}`}>{s.note}</dd> : null}
        </div>
      ))}
    </dl>
  );
}

// ── Status pills ────────────────────────────────────────────────────────

export type Tone = "good" | "warn" | "bad" | "info" | "accent" | "neutral";

const toneByStatus: Record<string, Tone> = {
  // good
  signed: "good", paid: "good", verified: "good", approved: "good", won: "good", complete: "good", completed: "good",
  active: "good", reconciled: "good", delivered: "good", granted: "good", accepted: "good", clean: "good", available: "good",
  current: "good", valid: "good", consented: "good", closed: "neutral", published: "good", live: "good", booked: "good",
  // warn
  pending: "warn", "awaiting signature": "warn", "partially signed": "warn", "in review": "warn", "under-review": "warn",
  due: "warn", draft: "warn", scheduled: "info", "awaiting evidence": "warn", "client review": "warn", verification: "warn",
  "changes requested": "warn", hold: "warn", expiring: "warn", "action needed": "warn", unreconciled: "warn", scanning: "warn",
  "needs review": "warn", "awaiting approval": "warn",
  // bad
  overdue: "bad", declined: "bad", lost: "bad", spam: "bad", failed: "bad", withdrawn: "bad", suppressed: "bad",
  expired: "bad", blocked: "bad", invalid: "bad", disputed: "bad",
  // info
  sent: "info", issued: "info", "in progress": "info", quoted: "info", scoping: "info", triaged: "info", new: "info",
  received: "info", shortlisted: "accent", acknowledged: "info", referred: "info", open: "info", matched: "accent",
  "not started": "neutral", archived: "neutral", private: "neutral", "public — approved": "good",
};

export function StatusPill({ status, tone }: { status: string; tone?: Tone }) {
  const t = tone ?? toneByStatus[status.toLowerCase()] ?? "neutral";
  return <span className={`pill${t === "neutral" ? "" : ` pill--${t}`}`}>{status}</span>;
}

// ── Table ───────────────────────────────────────────────────────────────

export interface Column<T> {
  key: string;
  header: string;
  /** Right-aligned, tabular figures. */
  numeric?: boolean;
  /** Render this column's cells as row headers (th scope="row"). */
  rowHeader?: boolean;
  nowrap?: boolean;
  render: (row: T) => ReactNode;
}

export function DataTable<T>({
  caption,
  columns,
  rows,
  rowKey,
  minWidth = 560,
  footer,
}: {
  caption: string;
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  minWidth?: number;
  footer?: ReactNode;
}) {
  return (
    <div className="dtable-wrap" role="region" aria-label={`${caption} (scrolls horizontally)`} tabIndex={0}>
      <table className="dtable" style={{ minWidth }}>
        <caption>{caption}</caption>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col" className={c.numeric ? "num" : undefined}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((c) => {
                const cls = [c.numeric ? "num" : "", c.nowrap ? "nowrap" : ""].filter(Boolean).join(" ") || undefined;
                return c.rowHeader ? (
                  <th key={c.key} scope="row" className={cls}>
                    {c.render(row)}
                  </th>
                ) : (
                  <td key={c.key} className={cls}>
                    {c.render(row)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
        {footer ? <tfoot>{footer}</tfoot> : null}
      </table>
    </div>
  );
}

// ── Charts ──────────────────────────────────────────────────────────────

export interface Series {
  name: string;
  values: number[];
  /** CSS colour; defaults to the workspace accent. */
  color?: string;
}

function ChartData({ caption, categories, series, format }: { caption: string; categories: string[]; series: Series[]; format: (n: number) => string }) {
  // Tables ignore width: 1px, so the hiding wrapper is a block element.
  return (
    <div className="visually-hidden">
      <table>
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Period</th>
            {series.map((s) => (
              <th scope="col" key={s.name}>
                {s.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {categories.map((c, i) => (
            <tr key={c}>
              <th scope="row">{c}</th>
              {series.map((s) => (
                <td key={s.name}>{format(s.values[i] ?? 0)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Legend({ series }: { series: Series[] }) {
  if (series.length < 2) return null;
  return (
    <div className="chart__legend" aria-hidden="true">
      {series.map((s, i) => (
        <span key={s.name}>
          <i style={{ background: s.color ?? defaultColors[i] }} />
          {s.name}
        </span>
      ))}
    </div>
  );
}

const defaultColors = ["var(--accent)", "var(--ink-quiet)", "var(--accent-2)"];
const fmtDefault = (n: number) => n.toLocaleString("en-GB");

/** Grouped vertical bars. The SVG is decorative; the data is in a hidden table. */
export function BarChart({
  label,
  categories,
  series,
  format = fmtDefault,
  height = 200,
}: {
  label: string;
  categories: string[];
  series: Series[];
  format?: (n: number) => string;
  height?: number;
}) {
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const groupWidth = 100 / categories.length;
  const barGap = 0.18;
  const barWidth = (groupWidth * (1 - barGap * 2)) / series.length;
  return (
    <figure className="chart" style={{ margin: 0 }}>
      <div className="chart__plot" style={{ "--chart-h": `${height}px` } as CSSProperties} role="img" aria-label={`${label}. Highest value ${format(max)}.`}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          {categories.map((c, ci) =>
            series.map((s, si) => {
              const v = s.values[ci] ?? 0;
              const h = (v / max) * 100;
              return (
                <rect
                  key={`${c}-${s.name}`}
                  x={ci * groupWidth + groupWidth * barGap + si * barWidth}
                  y={100 - h}
                  width={Math.max(barWidth - 0.6, 0.5)}
                  height={h}
                  rx={0.6}
                  fill={s.color ?? defaultColors[si]}
                />
              );
            }),
          )}
        </svg>
      </div>
      <div className="chart__axis" style={{ "--cols": categories.length } as CSSProperties} aria-hidden="true">
        {categories.map((c) => (
          <span key={c}>{c}</span>
        ))}
      </div>
      <Legend series={series} />
      <ChartData caption={label} categories={categories} series={series} format={format} />
    </figure>
  );
}

/** Line/area chart with non-scaling strokes so it stays crisp at any width. */
export function LineChart({
  label,
  categories,
  series,
  format = fmtDefault,
  height = 200,
}: {
  label: string;
  categories: string[];
  series: Series[];
  format?: (n: number) => string;
  height?: number;
}) {
  const max = Math.max(1, ...series.flatMap((s) => s.values)) * 1.08;
  const n = categories.length;
  const x = (i: number) => (n === 1 ? 50 : (i / (n - 1)) * 100);
  const y = (v: number) => 100 - (v / max) * 100;
  return (
    <figure className="chart" style={{ margin: 0 }}>
      <div className="chart__plot" style={{ "--chart-h": `${height}px` } as CSSProperties} role="img" aria-label={`${label}. Latest ${series.map((s) => `${s.name}: ${format(s.values.at(-1) ?? 0)}`).join(", ")}.`}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          {series.map((s, si) => {
            const color = s.color ?? defaultColors[si];
            const points = s.values.map((v, i) => `${x(i).toFixed(2)},${y(v).toFixed(2)}`).join(" ");
            return (
              <g key={s.name}>
                {si === 0 ? <polygon points={`0,100 ${points} 100,100`} fill={color} opacity={0.1} /> : null}
                <polyline points={points} fill="none" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
              </g>
            );
          })}
        </svg>
      </div>
      <div className="chart__axis" style={{ "--cols": n } as CSSProperties} aria-hidden="true">
        {categories.map((c, i) => (
          <span key={c}>{n > 8 && i % 2 === 1 ? "" : c}</span>
        ))}
      </div>
      <Legend series={series} />
      <ChartData caption={label} categories={categories} series={series} format={format} />
    </figure>
  );
}

/** Ranked horizontal bars — readable at every width, no SVG needed. */
export function HBars({ items, format = fmtDefault, label }: { items: { label: string; value: number }[]; format?: (n: number) => string; label: string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="hbars" aria-label={label} role="list">
      {items.map((item) => (
        <li className="hbar" key={item.label}>
          <div className="hbar__label">
            <span>{item.label}</span>
            <span>{format(item.value)}</span>
          </div>
          <div className="hbar__track" aria-hidden="true">
            <div className="hbar__fill" style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Progress({ label, value, max, detail }: { label: string; value: number; max: number; detail?: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="progress">
      <div className="progress__label">
        <span>{label}</span>
        <span>{detail ?? `${pct}%`}</span>
      </div>
      <div className="progress__track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-valuetext={detail ?? `${pct}%`}>
        <div className="progress__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Board, timeline, lists ──────────────────────────────────────────────

export interface BoardColumn {
  title: string;
  items: { id: string; title: string; meta?: string; status?: string }[];
}

export function Board({ columns, label }: { columns: BoardColumn[]; label: string }) {
  return (
    <div className="board" role="group" aria-label={label}>
      {columns.map((col) => (
        <section className="board__col" key={col.title} aria-label={`${col.title}, ${col.items.length} items`}>
          <h3>
            <span>{col.title}</span>
            <span>{col.items.length}</span>
          </h3>
          <ul role="list" style={{ display: "grid", gap: "0.6rem", padding: 0, margin: 0, listStyle: "none" }}>
            {col.items.map((item) => (
              <li className="board__card" key={item.id}>
                <strong>{item.title}</strong>
                {item.meta ? <span>{item.meta}</span> : null}
                {item.status ? (
                  <div>
                    <StatusPill status={item.status} />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export interface TimelineItem {
  date: string;
  title: string;
  detail?: string;
  done?: boolean;
  status?: string;
}

export function Timeline({ items, label }: { items: TimelineItem[]; label: string }) {
  return (
    <ol className="timeline" aria-label={label} role="list">
      {items.map((item) => (
        <li key={`${item.date}-${item.title}`}>
          <span className="timeline__date">{item.date}</span>
          <div className="timeline__body" data-done={item.done ? "true" : "false"}>
            <span className="timeline__title">
              {item.title}
              {item.done ? <span className="visually-hidden"> (complete)</span> : null}
            </span>
            {item.detail ? <span className="timeline__detail">{item.detail}</span> : null}
            {item.status ? (
              <span>
                <StatusPill status={item.status} />
              </span>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function KeyValues({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="kv-list">
      {items.map(([k, v]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ItemList({ items }: { items: { id: string; title: ReactNode; meta?: ReactNode; aside?: ReactNode }[] }) {
  return (
    <ul className="item-list" role="list">
      {items.map((item) => (
        <li key={item.id}>
          <div className="item-list__main">
            <strong>{item.title}</strong>
            {item.meta ? <span>{item.meta}</span> : null}
          </div>
          {item.aside}
        </li>
      ))}
    </ul>
  );
}

export function Callout({ children, tone, icon = "info" }: { children: ReactNode; tone?: "warn"; icon?: IconName }) {
  return (
    <div className={`callout${tone ? ` callout--${tone}` : ""}`} role="note">
      <Icon name={icon} />
      <p>{children}</p>
    </div>
  );
}

/** A disabled control that explains why it does nothing in the demonstration. */
export function DemoButton({ children, variant = "default" }: { children: ReactNode; variant?: "default" | "accent" | "solid" }) {
  return (
    <button type="button" className={`btn btn--sm${variant === "default" ? "" : ` btn--${variant}`}`} aria-disabled="true" title="Not active in this demonstration">
      {children}
      <span className="visually-hidden"> (not active in this demonstration)</span>
    </button>
  );
}
