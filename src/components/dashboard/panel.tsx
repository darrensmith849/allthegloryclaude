import { ReactNode } from "react";

interface Props {
  title?: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Panel({ title, eyebrow, action, children, className = "" }: Props) {
  return (
    <section className={`dash-panel ${className}`}>
      {(title || eyebrow || action) && (
        <header className="dash-panel-head">
          <div>
            {eyebrow && <div className="eyebrow eyebrow-amber">{eyebrow}</div>}
            {title && <h2 className="font-display text-[22px] tracking-tight mt-1">{title}</h2>}
          </div>
          {action && <div>{action}</div>}
        </header>
      )}
      <div className="dash-panel-body">{children}</div>
    </section>
  );
}

interface StatProps {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "amber" | "calm" | "warn" | "ok";
}

export function Stat({ label, value, hint, tone = "amber" }: StatProps) {
  return (
    <div className={`dash-stat dash-stat-${tone}`}>
      <div className="eyebrow">{label}</div>
      <div className="dash-stat-value font-display">{value}</div>
      {hint && <div className="dash-stat-hint">{hint}</div>}
    </div>
  );
}

export function Tag({ tone, children }: { tone: string; children: ReactNode }) {
  return (
    <span
      className="dash-tag"
      style={{
        background: `color-mix(in srgb, ${tone} 14%, transparent)`,
        color: tone,
        borderColor: `color-mix(in srgb, ${tone} 32%, transparent)`,
      }}
    >
      {children}
    </span>
  );
}
