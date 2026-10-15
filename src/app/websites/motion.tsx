"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Project } from "./projects";

const EASE = [0.16, 1, 0.3, 1] as const;

// Fades and lifts its children in once they scroll into view.
export function Reveal({
  children,
  delay = 0,
  className,
  y = 28,
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
      transition={{ duration: reduce ? 0.01 : 0.9, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

// Headline lines that rise up out of a mask, one after another.
export function RiseLines({ lines, className }: { lines: React.ReactNode[]; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <span className={className}>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden pb-[0.06em]">
          <motion.span
            className="block"
            initial={{ y: reduce ? 0 : "105%" }}
            animate={{ y: 0 }}
            transition={{ duration: reduce ? 0.01 : 1.1, delay: 0.1 + i * 0.12, ease: EASE }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

// A small live window onto a site: its scroll-through plays while it's on
// screen and pauses when it isn't. Until the video is actually playing the
// window just shows the site's icon and name - no screenshots.
export function Preview({ p }: { p: Project }) {
  const box = useRef<HTMLDivElement>(null);
  const vid = useRef<HTMLVideoElement>(null);
  const [live, setLive] = useState(false);
  useEffect(() => {
    const el = box.current;
    const v = vid.current;
    if (!el || !v) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = (navigator as { connection?: { saveData?: boolean } }).connection?.saveData;
    if (reduce || saveData) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={box} className="ws-prev">
      <div className="ws-prev-bar" aria-hidden="true">
        <span className="ws-prev-dots">
          <i />
          <i />
          <i />
        </span>
        <span className="ws-prev-host">{p.url ? p.host : `${p.host} · coming soon`}</span>
      </div>
      <div className="ws-prev-screen">
        <span className="ws-prev-wait" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.icon} alt="" width={28} height={28} />
          {p.name}
        </span>
        <video
          ref={vid}
          src={p.video}
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
          tabIndex={-1}
          onPlaying={() => setLive(true)}
          className={`absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-700 ${live ? "opacity-100" : "opacity-0"}`}
        />
      </div>
    </div>
  );
}

// Copies the email address, for people whose computer has no mail app set up.
export function CopyEmail({ email }: { email: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(email).then(
          () => {
            setDone(true);
            setTimeout(() => setDone(false), 2000);
          },
          () => {},
        );
      }}
      className="ws-copy ws-mono"
      aria-label={`Copy ${email}`}
    >
      {done ? "Copied" : "Copy"}
    </button>
  );
}
