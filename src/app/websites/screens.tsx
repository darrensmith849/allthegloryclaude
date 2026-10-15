"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Project } from "./projects";

// How long a site without a recording (or a phone that won't autoplay
// video, e.g. iOS Low Power Mode) stays on screen in the showreel.
const STILL_MS = 6500;

function useMotionOk() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = (navigator as { connection?: { saveData?: boolean } }).connection?.saveData;
    setOk(!reduce && !saveData);
  }, []);
  return ok;
}

function useInView<T extends HTMLElement>(threshold = 0.35) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, inView] as const;
}

// One site's screen: its first frame as a still, with the scroll-through
// recording faded in over it once the video is actually playing (so a
// video that can't play never shows a blank box or a play button).
function SiteScreen({
  p,
  play,
  session = 0,
  priority = false,
  sizes,
  onProgress,
  onEnded,
  onStuck,
}: {
  p: Project;
  play: boolean;
  session?: number;
  priority?: boolean;
  sizes: string;
  onProgress?: (t: number) => void;
  onEnded?: () => void;
  onStuck?: () => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [live, setLive] = useState(false);

  // A fresh turn in the showreel starts the recording from the top.
  useEffect(() => {
    const v = ref.current;
    if (v && session > 0) v.currentTime = 0;
  }, [session]);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (play) {
      v.play().catch((err: DOMException) => {
        if (err?.name === "NotAllowedError") onStuck?.();
      });
    } else {
      v.pause();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [play, session]);

  return (
    <div className={`ws-screen ${!p.video && play ? "ws-drift" : ""}`}>
      <Image src={p.poster} alt={`The ${p.name} website`} fill priority={priority} sizes={sizes} className="object-cover object-top" />
      {p.video && (
        <video
          ref={ref}
          src={p.video}
          muted
          playsInline
          preload={priority ? "auto" : "none"}
          aria-hidden="true"
          tabIndex={-1}
          onPlaying={() => setLive(true)}
          onTimeUpdate={(e) => {
            const v = e.currentTarget;
            if (play && v.duration) onProgress?.(v.currentTime / v.duration);
          }}
          onEnded={onEnded}
          className={`absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-500 ${live ? "opacity-100" : "opacity-0"}`}
        />
      )}
    </div>
  );
}

function Phone({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`ws-phone ${className}`} aria-hidden="true">
      <div className="ws-phone-screen">{children}</div>
      <span className="ws-phone-notch" />
    </div>
  );
}

function Lock() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

// The hero: a browser window that plays through every site on its own,
// one tab per site, with the same site on a phone beside it.
export function Showreel({ projects }: { projects: Project[] }) {
  const motionOk = useMotionOk();
  const [rootRef, inView] = useInView<HTMLDivElement>(0.2);
  const [active, setActive] = useState(0);
  const [session, setSession] = useState(0);
  const [progress, setProgress] = useState(0);
  const [stuck, setStuck] = useState(false);
  const progressRef = useRef(0);
  progressRef.current = progress;

  const p = projects[active];
  const running = motionOk && inView;
  const timed = !p.video || stuck;

  const go = useCallback((i: number) => {
    setActive(i);
    setSession((s) => s + 1);
    setProgress(0);
  }, []);
  const next = useCallback(() => go((active + 1) % projects.length), [active, go, projects.length]);

  // Page glow follows the site on screen.
  useEffect(() => {
    const section = rootRef.current?.closest<HTMLElement>("[data-tint]");
    if (section) section.dataset.tint = p.tint;
    window.dispatchEvent(new Event("ws-tint"));
  }, [p.tint, rootRef]);

  // Sites shown as a still move on after a set time.
  useEffect(() => {
    if (!running || !timed) return;
    const start = performance.now() - progressRef.current * STILL_MS;
    let raf = 0;
    const tick = (now: number) => {
      const t = (now - start) / STILL_MS;
      if (t >= 1) return next();
      setProgress(t);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, timed, session, next]);

  return (
    <div ref={rootRef} className="ws-reel">
      <div className="ws-window">
        <div className="ws-chrome">
          <span className="ws-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <div className="ws-tabs" role="tablist" aria-label="Websites I've built">
            {projects.map((q, i) => (
              <button
                key={q.key}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-label={q.name}
                onClick={() => go(i)}
                className="ws-tab"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={q.icon} alt="" width={16} height={16} className="ws-fav" />
                <span className="ws-tab-name">{q.name}</span>
                <span className="ws-tab-bar" style={{ transform: `scaleX(${i === active ? progress : 0})` }} />
              </button>
            ))}
          </div>
        </div>
        <div className="ws-address">
          <span className="ws-url">
            <Lock />
            <span className="truncate">{p.url ? p.host : "manuchie - preview"}</span>
          </span>
          {p.url ? (
            <a href={p.url} target="_blank" rel="noopener noreferrer" className="ws-visit">
              Visit site <span aria-hidden="true">↗</span>
            </a>
          ) : (
            <span className="ws-soon">Launching soon</span>
          )}
        </div>
        <div className="ws-screen-wrap">
          {projects.map((q, i) => (
            <div key={q.key} className={`ws-layer ${i === active ? "is-on" : ""}`} aria-hidden={i !== active}>
              <SiteScreen
                p={q}
                play={i === active && running && !stuck}
                session={i === active ? session : 0}
                priority={i === 0}
                sizes="(min-width: 1100px) 1000px, 92vw"
                onProgress={setProgress}
                onEnded={next}
                onStuck={() => setStuck(true)}
              />
            </div>
          ))}
        </div>
      </div>

      <Phone className="ws-reel-phone">
        {projects.map((q, i) => (
          <div key={q.key} className={`ws-layer ${i === active ? "is-on" : ""}`}>
            <Image src={q.phone} alt="" fill sizes="220px" className="object-cover object-top" priority={i === 0} />
          </div>
        ))}
      </Phone>

      <div className="ws-reel-caption ws-mono">
        <span>
          <span className="text-[var(--ink)]">{p.name}</span>
          <span className="hidden sm:inline"> - {p.kind}</span>
        </span>
        <span>
          {String(active + 1).padStart(2, "0")} / {String(projects.length).padStart(2, "0")}
        </span>
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
