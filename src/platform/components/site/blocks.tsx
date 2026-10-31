import type { ReactNode } from "react";
import { ButtonLink, Eyebrow } from "@/platform/components/ui/primitives";

export function PageHero({
  eyebrow,
  index,
  title,
  lede,
  aside,
  children,
}: {
  eyebrow: string;
  index?: string;
  title: ReactNode;
  lede?: ReactNode;
  aside?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="page-hero">
      <div className="page-hero__rings" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="container">
        <div className="page-hero__grid">
          <div className="stack" style={{ ["--stack-gap" as string]: "1.6rem" }}>
            <Eyebrow index={index}>{eyebrow}</Eyebrow>
            <h1>{title}</h1>
            {lede ? <p className="lede">{lede}</p> : null}
            {children}
          </div>
          {aside ? <div className="page-hero__aside">{aside}</div> : null}
        </div>
      </div>
    </section>
  );
}

/** Closing call to action, set like the contact block on the All the Glory /websites page. */
export function CtaBand({
  title,
  body,
  primary,
  secondary,
}: {
  title: ReactNode;
  body: ReactNode;
  primary: { href: string; label: string };
  secondary?: { href: string; label: string };
}) {
  return (
    <section className="cta-band" aria-label="Next step">
      <div className="cta-band__mark reveal" aria-hidden="true">
        <svg viewBox="0 0 32 32">
          <circle cx="12" cy="16" r="9" fill="none" stroke="currentColor" strokeWidth="1.3" />
          <circle cx="20" cy="16" r="9" fill="none" stroke="currentColor" strokeWidth="1.3" />
          <circle cx="16" cy="16" r="2.2" fill="#d8b25a" />
        </svg>
      </div>
      <h2 className="reveal">{title}</h2>
      <p className="reveal">{body}</p>
      <div className="cluster reveal">
        <ButtonLink href={primary.href} variant="solid">
          {primary.label}
        </ButtonLink>
        {secondary ? <ButtonLink href={secondary.href}>{secondary.label}</ButtonLink> : null}
      </div>
    </section>
  );
}

export function Faq({ items }: { items: { q: string; a: ReactNode }[] }) {
  return (
    <div className="faq">
      {items.map((item) => (
        <details key={item.q}>
          <summary>{item.q}</summary>
          <div>{item.a}</div>
        </details>
      ))}
    </div>
  );
}

export function DemoPreview() {
  return (
    <div className="preview-frame" aria-label="Preview of the artist workspace demonstration" role="img">
      <div className="preview-frame__bar">
        <span>Artist workspace</span>
        <span className="badge badge--demo">Demo data</span>
      </div>
      <dl className="preview-stats">
        <div className="preview-stat">
          <dt>Opportunities</dt>
          <dd>6</dd>
        </div>
        <div className="preview-stat">
          <dt>Projects</dt>
          <dd>3</dd>
        </div>
        <div className="preview-stat">
          <dt>Statements</dt>
          <dd>12</dd>
        </div>
      </dl>
      <div className="preview-rows">
        <div className="preview-row">
          <span>Split sheet · “Placeholder sketch I”</span>
          <span className="pill pill--good">Signed</span>
        </div>
        <div className="preview-row">
          <span>Payout statement · PRJ-0142</span>
          <span className="pill pill--info">Issued</span>
        </div>
        <div className="preview-row">
          <span>Business Passport · Training</span>
          <span className="pill pill--warn">2 of 6</span>
        </div>
      </div>
    </div>
  );
}
