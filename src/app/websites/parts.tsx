"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { fireLinkClick } from "@/lib/track-event";
import { CONTACT, type Project } from "./projects";

/* ───────── Click tracking: one listener logs every button/link for the dashboard ───────── */
export function WxClicks() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const href = a.getAttribute("href") ?? "";
      const text = (a.textContent ?? "").replace(/[↗→]/g, "").trim();
      let label: string;
      if (href.includes("wa.me") || href.includes("whatsapp")) label = "WhatsApp";
      else if (href.startsWith("mailto:")) label = "Email";
      else if (href.startsWith("tel:")) label = "Phone call";
      else if (href.startsWith("#")) label = `Button · ${text || href}`;
      else if (/^https?:/.test(href)) {
        const name = a.closest(".wx-wo-cap")?.querySelector("h3")?.textContent;
        label = `Visit site · ${name || new URL(href).hostname.replace(/^www\./, "")}`;
      } else label = `Link · ${text || href}`;
      fireLinkClick(label.slice(0, 150), href);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  return null;
}

/* ───────── Top bar: clear over the hero, frosted once you scroll ───────── */
export function WxNav() {
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const on = () => setSolid(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header className={`wx-nav ${solid ? "solid" : ""}`}>
      <a href="#top" className="wx-logo" aria-label="Daniel Jenkins - back to top">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/media/logo-dove-440.webp" alt="" className="wx-logo-dove" width={44} height={44} />
        Daniel Jenkins
      </a>
      <nav className="wx-navlinks" aria-label="Primary">
        <a href="#work">Work</a>
        <a href="#about">About</a>
        <a href="#contact">Contact</a>
        <a href="#contact" className="wx-pill wx-pill-gold">
          Let&apos;s talk
        </a>
      </nav>
    </header>
  );
}

/* ───────── Fades each .wx-reveal in as it scrolls into view ───────── */
export function WxReveal() {
  // Menu and in-page links glide to their section instead of jumping.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const id = a.getAttribute("href") ?? "";
      const el = id === "#top" ? document.body : document.querySelector<HTMLElement>(id);
      if (!el) return;
      e.preventDefault();
      const bar = document.querySelector<HTMLElement>(".wx-nav")?.offsetHeight ?? 70;
      const from = window.scrollY;
      const to = id === "#top" ? 0 : el.getBoundingClientRect().top + from - (id === "#work" ? 0 : bar);
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        window.scrollTo(0, to);
        return;
      }
      const dist = to - from;
      const dur = Math.min(1600, Math.max(700, Math.abs(dist) * 0.35));
      const start = performance.now();
      const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / dur);
        window.scrollTo(0, from + dist * ease(t));
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      // Keep the address as plain /websites - no #top / #work on the end.
      history.replaceState(null, "", location.pathname + location.search);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    document.querySelector(".wx")?.classList.add("wx-js");
    const els = Array.from(document.querySelectorAll(".wx-reveal"));
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("in");
            io.unobserve(en.target);
          }
        }),
      { threshold: 0.15, rootMargin: "0px 0px -6% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}

/* ───────── Hero layers drift at their own pace as you scroll ───────── */
export function HeroLayer({ children, className, speed = 220, fade = 0.35 }: { children: React.ReactNode; className: string; speed?: number; fade?: number }) {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 900], [0, reduce ? 0 : speed]);
  const opacity = useTransform(scrollY, [0, 700], [1, fade]);
  return (
    <motion.div className={className} style={{ y, opacity }} aria-hidden="true">
      {children}
    </motion.div>
  );
}

/* ───────── Pinned: two circles draw themselves as you scroll ───────── */
export function Venn() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start 0.75", "end end"] });
  const left = useTransform(p, [0.02, 0.4], reduce ? [1, 1] : [0, 1]);
  const right = useTransform(p, [0.12, 0.5], reduce ? [1, 1] : [0, 1]);
  const core = useTransform(p, [0.45, 0.6], reduce ? [1, 1] : [0, 1]);
  const labels = useTransform(p, [0.3, 0.5], reduce ? [1, 1] : [0, 1]);
  const cap = useTransform(p, [0.55, 0.72], reduce ? [1, 1] : [0, 1]);
  const capY = useTransform(p, [0.55, 0.72], reduce ? [0, 0] : [24, 0]);
  const spread = useTransform(p, [0.5, 0.95], reduce ? [0, 0] : [0, 14]);
  const spreadL = useTransform(spread, (v) => -v);
  return (
    <section className="wx-venn" ref={ref} aria-label="Design and development">
      <div className="wx-sticky">
        <div className="wx-venn-glow" />
        <svg viewBox="0 0 680 420" role="img" aria-label="Design and development, meeting at your website">
          <motion.g style={{ x: spreadL }}>
            <motion.circle className="ring" cx="265" cy="210" r="160" style={{ pathLength: left }} />
          </motion.g>
          <motion.g style={{ x: spread }}>
            <motion.circle className="ring" cx="415" cy="210" r="160" style={{ pathLength: right }} />
          </motion.g>
          <motion.g style={{ scale: core, opacity: core }}>
            <image href="/media/logo-dove-440.webp" x="300" y="170" width="80" height="80" />
          </motion.g>
          <motion.g style={{ opacity: labels }}>
            <text x="40" y="214" textAnchor="middle">DESIGN</text>
            <text x="652" y="214" textAnchor="middle">BUILD</text>
          </motion.g>
        </svg>
        <motion.div className="wx-venn-cap" style={{ opacity: cap, y: capY }}>
          <p className="wx-micro">Where beautiful design meets solid build</p>
          <a href="#work" className="wx-pill">
            See my work
          </a>
        </motion.div>
      </div>
    </section>
  );
}

/* ───────── Words light up one by one as the sentence scrolls through ───────── */
function Word({ p, range, children, gold }: { p: MotionValue<number>; range: [number, number]; children: string; gold?: boolean }) {
  const opacity = useTransform(p, range, [0.16, 1]);
  return (
    <motion.span className={`w ${gold ? "gold" : ""}`} style={{ opacity }}>
      {children}
    </motion.span>
  );
}

export function WordReveal({ text, gold = [] }: { text: string; gold?: string[] }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.45"] });
  const words = text.split(" ");
  return (
    <p ref={ref} className="wx-state-text">
      {words.map((w, i) => {
        const start = i / words.length;
        const range: [number, number] = reduce ? [0, 0.0001] : [start, start + 1 / words.length];
        return (
          <Word key={i} p={scrollYProgress} range={range} gold={gold.includes(w.replace(/[.,]/g, ""))}>
            {w}
          </Word>
        );
      })}
    </p>
  );
}

/* ───────── Work: the sites sit on a turning 3D ring ───────── */
// Scrolling turns the ring one site at a time - it pauses with each site
// facing you, then swings the next one round. Only the front site can be
// clicked; it opens the live site.
const smooth = (x: number) => x * x * (3 - 2 * x);

function OrbitCard({ p, i, step, depth, rot, active }: { p: Project; i: number; step: number; depth: number; rot: MotionValue<number>; active: boolean }) {
  // How directly this card faces you: 1 at the front, 0 side-on or behind.
  const facing = useTransform(rot, (r) => {
    const a = ((((i * step + r) % 360) + 540) % 360) - 180;
    return Math.max(0, Math.cos((a * Math.PI) / 180));
  });
  const opacity = useTransform(facing, (c) => (c <= 0.02 ? 0 : 0.2 + 0.8 * c * c));
  const shade = useTransform(facing, (c) => 0.75 * (1 - c));
  const style = { transform: `rotateY(${i * step}deg) translateZ(calc(var(--cw) * ${depth}))`, opacity };
  const inner = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={p.shot} alt={`The ${p.name} website`} loading="lazy" decoding="async" width={1600} height={1000} />
      <span className="wx-oc-no">{String(i + 1).padStart(2, "0")}</span>
      {!p.url && <span className="wx-oc-soon">Coming soon</span>}
      <motion.span className="wx-oc-shade" style={{ opacity: shade }} />
    </>
  );
  return p.url ? (
    <motion.a
      href={p.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`wx-oc ${active ? "on" : ""}`}
      style={style}
      tabIndex={active ? 0 : -1}
      aria-hidden={!active}
      aria-label={`${p.name} - open the live site (new tab)`}
    >
      {inner}
    </motion.a>
  ) : (
    <motion.div className={`wx-oc ${active ? "on" : ""}`} style={style} aria-hidden={!active}>
      {inner}
    </motion.div>
  );
}

export function WorkOrbit({ projects }: { projects: Project[] }) {
  const ref = useRef<HTMLElement>(null);
  const n = projects.length;
  const step = 360 / n;
  const depth = 1 / (2 * Math.tan(Math.PI / n)); // ring radius, in card widths
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  // Scroll position -> which site faces you, with a pause on each one.
  const pos = useTransform(scrollYProgress, (v) => {
    const t = Math.min(Math.max(v, 0), 1) * (n - 1);
    const k = Math.floor(t);
    const f = t - k;
    const e = f < 0.28 ? 0 : f > 0.72 ? 1 : smooth((f - 0.28) / 0.44);
    return Math.min(k + e, n - 1);
  });
  const rot = useTransform(pos, (q) => -q * step);
  const [active, setActive] = useState(0);
  useMotionValueEvent(pos, "change", (q) => setActive(Math.round(q)));
  const p = projects[active];
  const goTo = (i: number) => {
    const el = ref.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY + (el.offsetHeight - window.innerHeight) * (i / (n - 1));
    window.scrollTo({ top, behavior: "smooth" });
  };
  return (
    <section id="work" ref={ref} className="wx-wo" style={{ height: `${100 + (n - 1) * 75}vh` }}>
      <div className="wx-wo-sticky">
        <div className="wx-wo-head">
          <p className="wx-micro">Selected work · {String(n).padStart(2, "0")}</p>
          <h2 className="wx-h2">Websites I&apos;ve built</h2>
        </div>
        <div className="wx-wo-stage">
          <div className="wx-wo-pull" style={{ transform: `rotateX(-5deg) translateZ(calc(var(--cw) * -${depth}))` }}>
            <motion.div className="wx-wo-ring" style={{ rotateY: rot }}>
              {projects.map((q, i) => (
                <OrbitCard key={q.key} p={q} i={i} step={step} depth={depth} rot={rot} active={i === active} />
              ))}
            </motion.div>
          </div>
        </div>
        <div className="wx-wo-cap" key={p.key}>
          <div className="wx-wo-name">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.logo} alt="" className={p.logo.includes("logo-dove") ? "dove" : undefined} />
            <div>
              <h3>{p.name}</h3>
              <span>{p.kind}</span>
            </div>
          </div>
          {p.url ? (
            <a href={p.url} target="_blank" rel="noopener noreferrer" className="wx-pill wx-pill-gold">
              Visit site ↗
            </a>
          ) : (
            <span className="wx-pill">Launching soon</span>
          )}
        </div>
        <div className="wx-wo-dots">
          {projects.map((q, i) => (
            <button key={q.key} type="button" className={i === active ? "on" : ""} onClick={() => goTo(i)} aria-label={`Show ${q.name}`} />
          ))}
          <span>
            {String(active + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
          </span>
        </div>
      </div>
    </section>
  );
}

/* ───────── A big sentence that slides past - start to finish - as you scroll ───────── */
export function BigSentence({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const run = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [overflow, setOverflow] = useState(0);
  useEffect(() => {
    const measure = () => {
      if (!ref.current || !run.current) return;
      setOverflow(Math.max(0, run.current.scrollWidth - ref.current.clientWidth));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (run.current) ro.observe(run.current);
    if (ref.current) ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.9", "end 0.1"] });
  // Begins with the first word on screen and ends with the last one.
  const x = useTransform(scrollYProgress, [0.15, 0.85], reduce ? [0, 0] : [0, -overflow]);
  return (
    <div ref={ref} className="wx-big" aria-hidden="true">
      <motion.div ref={run} className="wx-big-run" style={{ x }}>
        {children}
      </motion.div>
    </div>
  );
}

/* ───────── Enquiry form - emails Daniel through the site's own /api/contact ───────── */
export function EnquiryForm() {
  const [state, setState] = useState<"idle" | "sending" | "ok" | "err">("idle");
  const [msg, setMsg] = useState("");
  return (
    <form
      className="wx-form wx-reveal"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        if (!form.reportValidity()) return;
        const data = new FormData(form);
        setState("sending");
        setMsg("");
        try {
          const res = await fetch("/api/contact", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              kind: "contact",
              source: "websites",
              name: String(data.get("name") ?? ""),
              email: String(data.get("email") ?? ""),
              message: String(data.get("message") ?? ""),
              website: String(data.get("website") ?? ""),
            }),
          });
          const out = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };
          if (res.ok && out.success) {
            form.reset();
            fireLinkClick("Websites enquiry sent", "/api/contact");
            setState("ok");
            setMsg("Thank you - I'll be in touch soon.");
          } else {
            setState("err");
            setMsg(out.error ?? "Something went wrong. Please message me on WhatsApp instead.");
          }
        } catch {
          setState("err");
          setMsg("Something went wrong. Please message me on WhatsApp instead.");
        }
      }}
    >
      <input type="text" name="website" className="wx-hp" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <input type="text" name="name" autoComplete="name" required placeholder="What is your name?" aria-label="Your name" />
      <input type="email" name="email" autoComplete="email" required placeholder="And your email address?" aria-label="Your email" />
      <textarea name="message" rows={4} required minLength={10} placeholder="Tell me a little about your website idea" aria-label="Your project" />
      <div className="wx-form-actions">
        <button type="submit" className="wx-pill wx-pill-solid" disabled={state === "sending"}>
          {state === "sending" ? "Sending..." : "Send my idea"}
        </button>
        <a href={CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer" className="wx-pill wx-pill-gold">
          WhatsApp me
        </a>
      </div>
      <p className={`wx-status ${state === "ok" ? "ok" : state === "err" ? "err" : ""}`} role="status" aria-live="polite">
        {msg}
      </p>
    </form>
  );
}
