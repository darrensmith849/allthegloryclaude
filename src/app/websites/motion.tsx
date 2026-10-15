"use client";

import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";

// Fades and lifts its children in once they scroll into view.
export function Reveal({
  children,
  delay = 0,
  className,
  y = 32,
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

// Shifts the page's glow colour (--tint on .ws) to whichever [data-tint]
// section sits across the middle of the screen. The showreel changes its
// own section's data-tint as it moves between sites and fires "ws-tint".
export function TintWatcher() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".ws");
    if (!root) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const mid = window.innerHeight * 0.45;
      let tint: string | undefined;
      document.querySelectorAll<HTMLElement>("[data-tint]").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top <= mid && r.bottom >= mid) tint = el.dataset.tint;
      });
      if (tint) root.style.setProperty("--tint", tint);
    };
    const queue = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    window.addEventListener("ws-tint", queue);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", queue);
      window.removeEventListener("resize", queue);
      window.removeEventListener("ws-tint", queue);
    };
  }, []);
  return null;
}
