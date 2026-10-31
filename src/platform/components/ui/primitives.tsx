import Link from "@/platform/components/ui/Link";
import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

export function Eyebrow({ index, children }: { index?: string; children: ReactNode }) {
  return (
    <p className="eyebrow">
      {index ? <span className="eyebrow__index">{index}</span> : null}
      {index ? <span aria-hidden="true">—</span> : null}
      <span>{children}</span>
    </p>
  );
}

export function SectionHead({
  index,
  eyebrow,
  title,
  children,
  split = false,
  id,
}: {
  index?: string;
  eyebrow: string;
  title: ReactNode;
  children?: ReactNode;
  split?: boolean;
  id?: string;
}) {
  return (
    <header className={`section-head${split ? " section-head--split" : ""}`}>
      <Eyebrow index={index}>{eyebrow}</Eyebrow>
      <h2 id={id}>{title}</h2>
      {children ? <div className="lede">{children}</div> : null}
    </header>
  );
}

type ButtonVariant = "accent" | "glass" | "solid" | "ghost";

export function ButtonLink({
  href,
  children,
  variant = "accent",
  icon,
  size,
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  icon?: IconName;
  size?: "sm";
  className?: string;
}) {
  const classes = ["btn", variant !== "glass" ? `btn--${variant}` : "", size ? `btn--${size}` : "", className ?? ""].filter(Boolean).join(" ");
  return (
    <Link href={href} className={classes}>
      {children}
      {icon ? <Icon name={icon} className="btn__icon" /> : null}
    </Link>
  );
}

export function ArrowLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="link-arrow">
      {children}
      <Icon name="arrow-right" className="btn__icon" />
    </Link>
  );
}

export type BadgeKind = "sample" | "proposed" | "demo" | "pending" | "plain";

export function Badge({ kind = "plain", children }: { kind?: BadgeKind; children: ReactNode }) {
  return <span className={`badge badge--${kind}`}>{children}</span>;
}

export function Notice({ kind = "sample", title, children }: { kind?: "sample" | "proposed" | "demo"; title: string; children: ReactNode }) {
  return (
    <div className={`notice notice--${kind}`} role="note">
      <Icon name="info" className="notice__icon" />
      <p>
        <strong>{title}</strong> {children}
      </p>
    </div>
  );
}

export function Checklist({ items }: { items: ReactNode[] }) {
  return (
    <ul className="checklist" role="list">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}
