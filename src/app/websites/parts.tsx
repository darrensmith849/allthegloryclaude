"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from "framer-motion";
import { CONTACT } from "./projects";

// Runs before paint in the browser, harmlessly as a normal effect on the server.
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

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
        <span className="wx-logo-ring" aria-hidden="true" />
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

/* ───────── A soft ring that follows the mouse, and says "Visit" over work ───────── */
export function WxCursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 500, damping: 40, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 500, damping: 40, mass: 0.4 });
  const [label, setLabel] = useState<string | null>(null);
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      const t = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-cursor]");
      setLabel(t ? t.dataset.cursor ?? null : null);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [x, y]);
  return (
    <motion.div className="wx-cursor" style={{ x: sx, y: sy }} aria-hidden="true">
      <div className={`wx-cursor-ring ${label ? "big" : ""}`}>
        <span className="wx-cursor-label">{label}</span>
      </div>
    </motion.div>
  );
}

/* ───────── The wall of sites behind the hero drifts away as you scroll ───────── */
export function HeroWall({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 900], [0, reduce ? 0 : 220]);
  const opacity = useTransform(scrollY, [0, 700], [1, 0.35]);
  return (
    <motion.div className="wx-wall-holder" style={{ y, opacity }} aria-hidden="true">
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
          <motion.circle className="core" cx="340" cy="210" r="20" style={{ scale: core, opacity: core }} />
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

/* ───────── Work: on desktop the cards slide sideways as you scroll down ───────── */
export function WorkScroller({ children }: { children: React.ReactNode }) {
  const outer = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [dist, setDist] = useState(0);
  const [wide, setWide] = useState(false);
  const reduce = useReducedMotion();
  useIsoLayoutEffect(() => {
    const mq = window.matchMedia("(min-width: 900px)");
    const measure = () => {
      setWide(mq.matches && !reduce);
      if (track.current) setDist(Math.max(0, track.current.scrollWidth - window.innerWidth));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (track.current) ro.observe(track.current);
    window.addEventListener("resize", measure);
    mq.addEventListener("change", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      mq.removeEventListener("change", measure);
    };
  }, [reduce]);
  const { scrollYProgress } = useScroll({ target: outer, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], [0, -dist]);
  return (
    <section id="work" ref={outer} className="wx-work" style={wide ? { height: `calc(100svh + ${dist}px)` } : undefined}>
      <div className="wx-work-sticky">
        <motion.div ref={track} className="wx-work-track" style={wide ? { x } : undefined}>
          {children}
        </motion.div>
      </div>
    </section>
  );
}

/* ───────── A huge sentence that slides as you scroll past ───────── */
export function BigSentence({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const x = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["4%", "-48%"]);
  return (
    <div ref={ref} className="wx-big" aria-hidden="true">
      <motion.div className="wx-big-run" style={{ x }}>
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
