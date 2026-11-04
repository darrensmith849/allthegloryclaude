"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

// Fades and lifts its children in once they scroll into view.
export function Reveal({
  children,
  delay = 0,
  className,
  y = 40,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: reduce ? 0.01 : 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

// Big headline words that rise up out of a mask, one after another.
export function RiseWords({ words, className, delay = 0 }: { words: string[]; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <span className={className}>
      {words.map((w, i) => (
        <span key={i} className="block overflow-hidden pb-[0.04em]">
          <motion.span
            className="block"
            initial={{ y: reduce ? 0 : "105%" }}
            animate={{ y: 0 }}
            transition={{ duration: reduce ? 0.01 : 1.1, delay: delay + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
          >
            {w}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

// Hero photo that slowly settles in and drifts as the page scrolls.
export function HeroImage({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 900], [0, reduce ? 0 : 160]);
  return (
    <motion.div
      className="absolute inset-0"
      style={{ y }}
      initial={{ scale: reduce ? 1 : 1.15, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: reduce ? 0.01 : 2.2, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

// Counts a number up from zero the first time it's seen.
export function CountUp({ to, from = 0, suffix = "" }: { to: number; from?: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(from);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(to);
      return;
    }
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      const start = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - start) / 1600);
        setN(Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [to, from]);
  return (
    <span ref={ref}>
      {n}
      {suffix}
    </span>
  );
}
