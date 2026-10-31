"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

// Scroll motion for the public site, without an animation library:
// - RevealObserver fades `.reveal` elements in as they enter the viewport.
// - ScrollScene writes the element's scroll progress (0–1) to `--p`, and CSS
//   does the rest (circles drawing, words lighting up, a sentence sliding).
// Content is fully visible without JavaScript and with reduced motion.

export function RevealObserver() {
  const pathname = usePathname();
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("js");
    const els = Array.from(document.querySelectorAll(".reveal:not(.in)"));
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        }),
      { threshold: 0.15, rootMargin: "0px 0px -6% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);
  return null;
}

const FULL: [number, number] = [0, 1];

/**
 * Progress is 0 when the element's top reaches `start` (fraction of viewport
 * height) and 1 when its bottom reaches `end`. `range` remaps that span.
 */
export function ScrollScene({
  as: Tag = "section",
  className,
  children,
  start = 0.75,
  end = 1,
  range = FULL,
  reducedProgress = 1,
  measureOverflow = false,
  ...rest
}: {
  as?: "section" | "div";
  className?: string;
  children: ReactNode;
  start?: number;
  end?: number;
  range?: [number, number];
  reducedProgress?: number;
  measureOverflow?: boolean;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-hidden"?: boolean;
  id?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const measure = () => {
      if (!measureOverflow) return;
      const run = el.querySelector<HTMLElement>("[data-run]");
      if (run) el.style.setProperty("--overflow", `${Math.max(0, run.scrollWidth - el.clientWidth)}px`);
    };

    const update = () => {
      frame = 0;
      if (reduce.matches) {
        el.style.setProperty("--p", String(reducedProgress));
        return;
      }
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const raw = (vh * start - rect.top) / (rect.height + vh * (start - end));
      const [a, b] = range;
      const p = Math.min(1, Math.max(0, (raw - a) / (b - a)));
      el.style.setProperty("--p", p.toFixed(4));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    measure();
    update();
    const ro = new ResizeObserver(() => {
      measure();
      onScroll();
    });
    ro.observe(el);
    window.addEventListener("scroll", onScroll, { passive: true });
    reduce.addEventListener("change", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      reduce.removeEventListener("change", onScroll);
    };
  }, [start, end, range, reducedProgress, measureOverflow]);

  return (
    <Tag ref={ref as never} className={className} {...rest}>
      {children}
    </Tag>
  );
}
