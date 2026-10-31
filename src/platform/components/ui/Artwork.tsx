// Line-art figures in the All the Glory /websites language: thin circles,
// orbits and arcs with a gold glow, drawn as inline SVG on the server. They
// stand in for commissioned photography and never depict people, flags,
// maps or sound-waves (MASTER_PLAN §14). Inside a `.reveal` element the
// strokes draw themselves in when scrolled into view.

export type ArtworkVariant = "orbit" | "venn" | "rings" | "horizon";
export type ArtworkTone = "gold" | "sand" | "ink";

const toneStroke: Record<ArtworkTone, string> = {
  gold: "#f1d7a6",
  sand: "#d9cfbb",
  ink: "#eef2f3",
};

function seededRandom(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

const W = 400;
const H = 500;
const r1 = (n: number) => Math.round(n * 10) / 10;
const INK = "rgb(238 242 243 / 0.55)";
const INK_FAINT = "rgb(238 242 243 / 0.14)";

function Ring({ cx, cy, r, stroke, width = 1.2, dashed = false, glow = false }: { cx: number; cy: number; r: number; stroke: string; width?: number; dashed?: boolean; glow?: boolean }) {
  return (
    <circle
      className={dashed ? undefined : "draw"}
      cx={r1(cx)}
      cy={r1(cy)}
      r={r1(r)}
      fill="none"
      stroke={stroke}
      strokeWidth={width}
      strokeDasharray={dashed ? "3 7" : undefined}
      pathLength={dashed ? undefined : 1}
      style={glow ? { filter: "drop-shadow(0 0 8px rgb(216 178 90 / 0.7))" } : undefined}
    />
  );
}

function orbit(rand: () => number, accent: string) {
  const cx = W * (0.42 + rand() * 0.16);
  const cy = H * (0.42 + rand() * 0.14);
  const base = 118 + rand() * 20;
  const angle = rand() * Math.PI * 2;
  const dotR = base * 1.16;
  return (
    <>
      <Ring cx={cx} cy={cy} r={base * 1.34} stroke={INK_FAINT} />
      <Ring cx={cx} cy={cy} r={dotR} stroke={accent} dashed width={1} />
      <Ring cx={cx} cy={cy} r={base} stroke={INK} />
      <Ring cx={cx} cy={cy} r={base * 0.62} stroke={INK_FAINT} />
      <circle cx={r1(cx + Math.cos(angle) * dotR)} cy={r1(cy + Math.sin(angle) * dotR)} r={5} fill="#d8b25a" style={{ filter: "drop-shadow(0 0 8px rgb(216 178 90 / 0.9))" }} />
    </>
  );
}

function venn(rand: () => number, accent: string) {
  const cy = H * (0.45 + rand() * 0.1);
  const r = 104 + rand() * 18;
  const gap = r * 0.95;
  const cx = W / 2;
  return (
    <>
      <Ring cx={cx - gap / 2} cy={cy} r={r} stroke={INK} />
      <Ring cx={cx + gap / 2} cy={cy} r={r} stroke={INK} />
      <Ring cx={cx} cy={cy} r={r * 0.22} stroke={accent} glow width={1.4} />
      <Ring cx={cx} cy={cy} r={r * 1.62} stroke={INK_FAINT} />
    </>
  );
}

function rings(rand: () => number, accent: string) {
  const cx = W * (0.15 + rand() * 0.3);
  const cy = H * (0.6 + rand() * 0.3);
  const goldAt = 2 + Math.floor(rand() * 3);
  return (
    <>
      {Array.from({ length: 8 }, (_, i) => (
        <Ring key={i} cx={cx} cy={cy} r={60 + i * 42} stroke={i === goldAt ? accent : i % 2 ? INK_FAINT : INK} glow={i === goldAt} width={i === goldAt ? 1.4 : 1.1} />
      ))}
    </>
  );
}

function horizon(rand: () => number, accent: string) {
  const cx = W * (0.35 + rand() * 0.3);
  const base = H * 1.02;
  return (
    <>
      {Array.from({ length: 6 }, (_, i) => (
        <Ring key={i} cx={cx} cy={base} r={90 + i * 58} stroke={i === 1 ? accent : i % 2 ? INK_FAINT : INK} glow={i === 1} width={i === 1 ? 1.4 : 1.1} />
      ))}
      <circle cx={r1(cx + (rand() - 0.5) * 160)} cy={r1(H * (0.16 + rand() * 0.12))} r={4} fill="#d8b25a" style={{ filter: "drop-shadow(0 0 8px rgb(216 178 90 / 0.9))" }} />
    </>
  );
}

export function Artwork({
  seed,
  variant = "orbit",
  tone = "gold",
  monogram,
  className,
  label,
}: {
  seed: string;
  variant?: ArtworkVariant;
  tone?: ArtworkTone;
  monogram?: string;
  className?: string;
  /** Accessible description; omit when the artwork is purely decorative. */
  label?: string;
}) {
  const rand = seededRandom(`${seed}:${variant}`);
  const accent = toneStroke[tone];
  const shapes = variant === "orbit" ? orbit(rand, accent) : variant === "venn" ? venn(rand, accent) : variant === "rings" ? rings(rand, accent) : horizon(rand, accent);

  return (
    <div className={`artwork ${className ?? ""}`} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" focusable="false" aria-hidden="true">
        {shapes}
      </svg>
      {monogram ? <span className="artwork__monogram">{monogram}</span> : null}
    </div>
  );
}
