"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import type { Project } from "./projects";
import { Reveal } from "./motion";

// The work list. Each site gets its own layout and its own scroll motion,
// built from stills of that site (no video here - the showreel at the top
// is the only thing that plays, so the page stays light):
//   Virgin       - wide window, its real property cards floating over it
//   CrossCoders  - the section turns light like their site; pages fan out
//   Endgame      - full-width black panel, three phones rising in the glow
//   All The Glory- cinematic full-width sky that eases back as you scroll
//   Manuchie     - portrait poster, not live yet so no link

const M = "/media/websites";

// 0 -> 1 as the element travels from entering at the bottom to leaving at the top.
function useTravel() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  return [ref, scrollYProgress] as const;
}

// Maps scroll progress to a value, or holds still when motion is reduced.
function useMove(p: MotionValue<number>, input: number[], output: number[]) {
  const reduce = useReducedMotion();
  const still = output[Math.floor(output.length / 2)];
  return useTransform(p, input, reduce ? output.map(() => still) : output);
}

function Num({ i, n, className = "" }: { i: number; n: number; className?: string }) {
  return (
    <p className={`ws-mono text-[12px] ${className}`}>
      {String(i + 1).padStart(2, "0")} <span className="mx-2">/</span> {String(n).padStart(2, "0")}
    </p>
  );
}

function Palette({ p, ring = "var(--bg)", label = "var(--faint)", className = "" }: { p: Project; ring?: string; label?: string; className?: string }) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <span className="flex" aria-hidden="true">
        {p.palette.map((c) => (
          <span key={c} className="ws-swatch" style={{ background: c, boxShadow: `0 0 0 1px rgba(128,128,128,.25) inset, 0 0 0 2px ${ring}` }} />
        ))}
      </span>
      <span className="ws-mono text-[11px] uppercase tracking-[.14em]" style={{ color: label }}>
        Its colours
      </span>
    </div>
  );
}

// "Visit website", dressed like the site's own main button.
function Visit({ p }: { p: Project }) {
  if (!p.url) {
    return (
      <span className="ws-mono inline-flex h-[46px] items-center gap-3 rounded-full border border-dashed border-white/20 px-5 text-[12px] uppercase tracking-[.14em] text-[var(--muted)]">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.tint }} />
        Launching soon
      </span>
    );
  }
  return (
    <a
      href={p.url}
      target="_blank"
      rel="noopener noreferrer"
      className="ws-sitebtn"
      style={{
        background: p.button.bg,
        color: p.button.fg,
        borderRadius: p.button.radius,
        textTransform: p.button.upper ? "uppercase" : undefined,
        letterSpacing: p.button.upper ? ".12em" : undefined,
        fontSize: p.button.upper ? "12.5px" : undefined,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={p.icon} alt="" width={18} height={18} />
      Visit website
      <span aria-hidden="true">↗</span>
    </a>
  );
}

function Frame({ p, light = false, children, className = "" }: { p: Project; light?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <div className={`ws-window ws-window-sm ${light ? "ws-window-light" : ""} ${className}`}>
      <div className="ws-chrome ws-chrome-sm">
        <span className="ws-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="ws-url ws-url-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.icon} alt="" width={14} height={14} className="ws-fav" />
          <span className="truncate">{p.url ? p.host : `${p.key} - preview`}</span>
        </span>
      </div>
      <div className="ws-screen-wrap">{children}</div>
    </div>
  );
}

function Phone({ src, className = "", style }: { src: string; className?: string; style?: React.ComponentProps<typeof motion.div>["style"] }) {
  return (
    <motion.div className={`ws-phone ${className}`} style={style} aria-hidden="true">
      <div className="ws-phone-screen">
        <Image src={src} alt="" fill sizes="(min-width: 768px) 260px, 34vw" className="object-cover object-top" />
      </div>
      <span className="ws-phone-notch" />
    </motion.div>
  );
}

/* ───────── 01 Virgin Estate Agents ───────── */
function VirginCase({ p, i, n }: { p: Project; i: number; n: number }) {
  const [ref, t] = useTravel();
  const img = useMove(t, [0, 1], [-30, 30]);
  const c0 = useMove(t, [0, 1], [60, -40]);
  const c1 = useMove(t, [0, 1], [130, -70]);
  const c2 = useMove(t, [0, 1], [200, -100]);
  const cards = [c0, c1, c2];
  return (
    <article data-tint={p.tint} className="ws-case">
      <div ref={ref} className="relative">
        <Reveal y={48}>
          <Frame p={p} className="md:w-[86%]">
            <motion.div className="absolute inset-[-6%_0]" style={{ y: img }}>
              <Image src={p.poster} alt={`The ${p.name} website`} fill sizes="(min-width: 1100px) 1080px, 94vw" className="object-cover object-top" />
            </motion.div>
          </Frame>
        </Reveal>
        <div className="ws-cards" aria-hidden="true">
          {cards.map((y, k) => (
            <motion.div key={k} className="ws-card" style={{ y }}>
              <Image src={`${M}/virgin-card${k}.webp`} alt="" fill sizes="(min-width: 768px) 240px, 60vw" className="object-cover object-top" />
            </motion.div>
          ))}
        </div>
      </div>
      <div className="mt-[clamp(40px,7vw,120px)] grid grid-cols-1 gap-x-[clamp(32px,6vw,96px)] gap-y-6 md:grid-cols-12">
        <Reveal className="min-w-0 md:col-span-5">
          <Num i={i} n={n} className="text-[var(--faint)]" />
          <h3 className="ws-serif ws-pname mt-5">{p.name}</h3>
          <p className="ws-label mt-4 !tracking-[.12em]">{p.kind}</p>
        </Reveal>
        <Reveal delay={0.08} className="min-w-0 md:col-span-6 md:col-start-7 md:pt-9">
          <p className="max-w-[32rem] text-[1.02rem] leading-[1.7] text-[var(--muted)]">{p.blurb}</p>
          <Palette p={p} className="mt-7" />
          <div className="mt-8">
            <Visit p={p} />
          </div>
        </Reveal>
      </div>
    </article>
  );
}

/* ───────── 02 CrossCoders ───────── */
function CrossCodersCase({ p, i, n }: { p: Project; i: number; n: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress: t } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const lx = useMove(t, [0, 1], [0, -34]);
  const rx = useMove(t, [0, 1], [0, 34]);
  const lr = useMove(t, [0, 1], [0, -7]);
  const rr = useMove(t, [0, 1], [0, 7]);
  const left = useTransform(lx, (v) => `${v}%`);
  const right = useTransform(rx, (v) => `${v}%`);
  const ph = useMove(t, [0, 1], [120, 0]);
  const shots = [`${M}/crosscoders-s1.webp`, `${M}/crosscoders-poster.webp`, `${M}/crosscoders-s2.webp`];
  return (
    <article data-tint={p.tint} className="ws-case">
      <div className="ws-cc">
        <Reveal className="relative z-10 mx-auto max-w-[40rem] text-center">
          <Num i={i} n={n} className="text-[#8a8174]" />
          <h3 className="ws-serif ws-pname mt-5">{p.name}</h3>
          <p className="ws-mono mt-4 text-[11px] uppercase tracking-[.12em] text-[#13b24a]">{p.kind}</p>
          <p className="mx-auto mt-6 max-w-[34rem] text-[1.02rem] leading-[1.7] text-[#5b544b]">{p.blurb}</p>
          <Palette p={p} ring="#f7f2e8" label="#8a8174" className="mt-7 justify-center" />
          <div className="mt-8">
            <Visit p={p} />
          </div>
        </Reveal>
        <div ref={ref} className="ws-fan">
          {[
            { src: shots[0], x: left, r: lr, z: 1 },
            { src: shots[2], x: right, r: rr, z: 1 },
            { src: shots[1], x: undefined, r: undefined, z: 2 },
          ].map((s, k) => (
            <motion.div key={k} className="ws-fan-item" style={{ x: s.x, rotate: s.r, zIndex: s.z }}>
              <Frame p={p} light>
                <Image src={s.src} alt={k === 2 ? `The ${p.name} website` : ""} fill sizes="(min-width: 768px) 640px, 80vw" className="object-cover object-top" />
              </Frame>
            </motion.div>
          ))}
          <Phone src={`${M}/crosscoders-m1.webp`} className="ws-fan-phone" style={{ y: ph }} />
        </div>
      </div>
    </article>
  );
}

/* ───────── 03 Endgame Strategy Lab ───────── */
function EndgameCase({ p, i, n }: { p: Project; i: number; n: number }) {
  const [ref, t] = useTravel();
  const a = useMove(t, [0, 0.6], [220, 40]);
  const b = useMove(t, [0, 0.6], [120, -10]);
  const c = useMove(t, [0, 0.6], [300, 60]);
  return (
    <article data-tint={p.tint} className="ws-case ws-bleed ws-eg">
      <div className="ws-wrap relative z-10 text-center">
        <Reveal>
          <Num i={i} n={n} className="text-[#7de6f5]/60" />
          <h3 className="ws-eg-name mt-6">
            Endgame Strategy <span>Lab</span>
          </h3>
          <p className="ws-mono mt-5 text-[11px] uppercase tracking-[.3em] text-[#7de6f5]/80">{p.kind}</p>
          <p className="mx-auto mt-6 max-w-[34rem] text-[1.02rem] leading-[1.7] text-white/60">{p.blurb}</p>
          <Palette p={p} ring="#000" label="rgba(255,255,255,.4)" className="mt-7 justify-center" />
          <div className="mt-8">
            <Visit p={p} />
          </div>
        </Reveal>
        <div ref={ref} className="ws-eg-phones">
          <Phone src={`${M}/endgame-m1.webp`} className="ws-eg-phone -rotate-[5deg]" style={{ y: a }} />
          <Phone src={`${M}/endgame-m0.webp`} className="ws-eg-phone ws-eg-phone-mid" style={{ y: b }} />
          <Phone src={`${M}/endgame-m2.webp`} className="ws-eg-phone rotate-[5deg]" style={{ y: c }} />
        </div>
      </div>
    </article>
  );
}

/* ───────── 04 All The Glory ───────── */
function GloryCase({ p, i, n }: { p: Project; i: number; n: number }) {
  const [ref, t] = useTravel();
  const scale = useMove(t, [0, 0.55], [1.22, 1]);
  const ph = useMove(t, [0, 1], [90, -60]);
  return (
    <article data-tint={p.tint} className="ws-case">
      <div ref={ref} className="relative">
        <div className="ws-glory">
          <motion.div className="absolute inset-0" style={{ scale }}>
            <Image src={`${M}/alltheglory-wide.webp`} alt={`The ${p.name} website`} fill sizes="(min-width: 1100px) 1240px, 100vw" className="object-cover object-[94%_30%] md:object-[72%_30%]" />
          </motion.div>
          <div className="ws-glory-shade" aria-hidden="true" />
          <span className="ws-url ws-glory-url">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.icon} alt="" width={14} height={14} className="ws-fav" />
            {p.host}
          </span>
          <div className="ws-glory-meta hidden md:block">
            <Num i={i} n={n} className="text-white/50" />
            <h3 className="ws-serif ws-pname mt-4 text-white">{p.name}</h3>
            <p className="ws-mono mt-3 text-[11px] uppercase tracking-[.12em] text-[#d8b25a]">{p.kind}</p>
          </div>
        </div>
        <Phone src={`${M}/alltheglory-m1.webp`} className="ws-glory-phone" style={{ y: ph }} />
      </div>
      <div className="mt-[clamp(32px,5vw,72px)] grid grid-cols-1 gap-x-[clamp(32px,6vw,96px)] gap-y-6 md:grid-cols-12">
        <Reveal className="min-w-0 md:hidden">
          <Num i={i} n={n} className="text-[var(--faint)]" />
          <h3 className="ws-serif ws-pname mt-5">{p.name}</h3>
          <p className="ws-label mt-4 !tracking-[.12em]">{p.kind}</p>
        </Reveal>
        <Reveal className="min-w-0 md:col-span-6">
          <p className="max-w-[32rem] text-[1.02rem] leading-[1.7] text-[var(--muted)]">{p.blurb}</p>
        </Reveal>
        <Reveal delay={0.08} className="flex min-w-0 flex-col gap-7 md:col-span-4 md:col-start-7">
          <Palette p={p} />
          <Visit p={p} />
        </Reveal>
      </div>
    </article>
  );
}

/* ───────── 05 Manuchie ───────── */
function ManuchieCase({ p, i, n }: { p: Project; i: number; n: number }) {
  const [ref, t] = useTravel();
  const img = useMove(t, [0, 1], [-40, 40]);
  const card = useMove(t, [0, 1], [40, -40]);
  const shot = useMove(t, [0, 1], [90, -50]);
  return (
    <article data-tint={p.tint} className="ws-case">
      <div ref={ref} className="grid grid-cols-1 items-center gap-x-[clamp(32px,6vw,96px)] gap-y-12 md:grid-cols-12">
        <motion.div className="relative min-w-0 md:col-span-5" style={{ y: card }}>
          <div className="ws-poster">
            <motion.div className="absolute inset-[-8%_0]" style={{ y: img }}>
              <Image src={`${M}/manuchie-portrait.webp`} alt="Manuchie's website - his portrait on an orange backdrop" fill sizes="(min-width: 768px) 480px, 92vw" className="object-cover object-[50%_30%]" />
            </motion.div>
            <span className="ws-poster-chip ws-mono">Launching soon</span>
          </div>
        </motion.div>
        <div className="min-w-0 md:col-span-6 md:col-start-7">
          <Reveal>
            <Num i={i} n={n} className="text-[var(--faint)]" />
            <h3 className="ws-serif mt-5 text-[clamp(4rem,9vw,8.5rem)] leading-[.9] tracking-[-.03em]">
              Manu<em className="ws-accent">chie</em>
            </h3>
            <p className="ws-label mt-5 !tracking-[.12em]">{p.kind}</p>
            <p className="mt-6 max-w-[30rem] text-[1.02rem] leading-[1.7] text-[var(--muted)]">{p.blurb}</p>
            <Palette p={p} className="mt-7" />
            <div className="mt-8">
              <Visit p={p} />
            </div>
          </Reveal>
          <motion.div className="mt-12 md:w-[88%]" style={{ y: shot }}>
            <Frame p={p}>
              <Image src={p.poster} alt="" fill sizes="(min-width: 768px) 520px, 92vw" className="object-cover object-top" />
            </Frame>
          </motion.div>
        </div>
      </div>
    </article>
  );
}

const CASES: Record<string, (props: { p: Project; i: number; n: number }) => React.ReactElement> = {
  virgin: VirginCase,
  crosscoders: CrossCodersCase,
  endgame: EndgameCase,
  alltheglory: GloryCase,
  manuchie: ManuchieCase,
};

export function Cases({ projects }: { projects: Project[] }) {
  return (
    <>
      {projects.map((p, i) => {
        const Case = CASES[p.key];
        return Case ? <Case key={p.key} p={p} i={i} n={projects.length} /> : null;
      })}
    </>
  );
}
