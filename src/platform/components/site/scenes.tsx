import type { CSSProperties, ReactNode } from "react";
import { ScrollScene } from "./motion";

// Scroll scenes from the All the Glory /websites page, re-told for the
// platform. Server components; ScrollScene supplies the `--p` progress.

const RANGE_BIG: [number, number] = [0.15, 0.85];

export function Venn({ left, right, core, caption, children }: { left: string; right: string; core: string; caption: string; children?: ReactNode }) {
  return (
    <ScrollScene className="venn" start={0.75} end={1} aria-label={`${left} and ${right}, meeting at ${core}`}>
      <div className="venn__sticky">
        <div className="venn__glow" />
        <svg viewBox="0 0 680 420" role="img" aria-label={`${left} and ${right} meeting at ${core}`}>
          <circle className="ring ring--l" cx="265" cy="210" r="160" pathLength={1} />
          <circle className="ring ring--r" cx="415" cy="210" r="160" pathLength={1} />
          <circle className="core" cx="340" cy="210" r="34" />
          <circle className="core-dot" cx="340" cy="210" r="4" />
          <text x="88" y="214" textAnchor="end">
            {left.toUpperCase()}
          </text>
          <text x="592" y="214" textAnchor="start">
            {right.toUpperCase()}
          </text>
          <text className="venn__core-label" x="340" y="268" textAnchor="middle">
            {core.toUpperCase()}
          </text>
        </svg>
        <div className="venn__cap">
          <p className="eyebrow">{caption}</p>
          {children}
        </div>
      </div>
    </ScrollScene>
  );
}

export function WordReveal({ text, gold = [] }: { text: string; gold?: string[] }) {
  const words = text.split(" ");
  return (
    <ScrollScene as="div" start={0.85} end={0.45}>
      <p className="statement__text" style={{ "--n": words.length } as CSSProperties}>
        {words.map((w, i) => (
          <span key={i} className={`w${gold.includes(w.replace(/[.,]/g, "")) ? " gold" : ""}`} style={{ "--i": i } as CSSProperties}>
            {w}
          </span>
        ))}
      </p>
    </ScrollScene>
  );
}

export function BigSentence({ children }: { children: ReactNode }) {
  return (
    <ScrollScene as="div" className="big" start={0.9} end={0.1} range={RANGE_BIG} reducedProgress={0} measureOverflow aria-hidden>
      <div className="big__run" data-run>
        {children}
      </div>
    </ScrollScene>
  );
}

export function Orbit({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`orbit ${className ?? ""}`}>
      <span className="orbit__ring orbit__ring--3" />
      <span className="orbit__ring orbit__ring--2" />
      <span className="orbit__ring" />
      <span className="orbit__dot" />
      <div className="orbit__core">{children}</div>
    </div>
  );
}
