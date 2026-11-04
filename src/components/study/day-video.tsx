"use client";

// A day's session video (YouTube), played right inside the day. YouTube's
// player is heavy (a few seconds and ~1MB before a video can start), so it
// loads quietly in the background once the video is on screen - then a tap
// starts it straight away. (Not on phones asking to save data: there it
// loads on the tap.) Once it's playing it stays put at the top of the day's
// box while the notes and the writing box scroll up beneath it
// (dashboard.css), so you can watch the talk and write at the same time.
// With resumeKey it also remembers where you got to (on this device) and
// picks up from there next time - a refresh doesn't lose your place.

import { useEffect, useRef, useState } from "react";
import { embedUrl, parseYouTube, subscribeUrl, watchUrl } from "@/lib/study/youtube";

const PLAYER_ORIGIN = "https://www.youtube-nocookie.com";

const clock = (sec: number) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${h ? `${h}:` : ""}${String(m).padStart(h ? 2 : 1, "0")}:${String(sec % 60).padStart(2, "0")}`;
};

export function DayVideo({
  url,
  label = "Watch the session",
  links = true,
  resumeKey,
}: {
  url: string | null | undefined;
  label?: string;
  links?: boolean; // false: no "Subscribe" / "Open in YouTube" row (e.g. someone else's sermon)
  resumeKey?: string; // remember the place in the video under this name (this device)
}) {
  const v = parseYouTube(url);
  const storeKey = resumeKey && v ? `atg:video-pos:${resumeKey}:${v.id}` : null;
  const [resumeAt, setResumeAt] = useState(0); // seconds to pick up from (0 = the link's own start)
  const [playing, setPlaying] = useState(false);
  const [load, setLoad] = useState(false); // the player is in the page (hidden until playing)
  const [autoplay, setAutoplay] = useState(false); // loaded by the tap itself
  const [ready, setReady] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const wantPlay = useRef(false);

  // A different video: start again.
  useEffect(() => {
    setPlaying(false);
    setLoad(false);
    setAutoplay(false);
    setReady(false);
    wantPlay.current = false;
  }, [v?.id]);

  // Where this video got to last time.
  useEffect(() => {
    let at = 0;
    if (storeKey) {
      try {
        const n = Number(localStorage.getItem(storeKey));
        if (Number.isFinite(n) && n > 5) at = Math.floor(n);
      } catch {
        /* storage blocked */
      }
    }
    setResumeAt(at);
  }, [storeKey]);

  // While it plays, the player reports the time; keep it every few seconds,
  // and once more as the page is left or refreshed.
  useEffect(() => {
    if (!storeKey || !load) return;
    let last = 0;
    let latest = 0;
    let heard = false;
    // The player only reports once it's been asked, and it ignores the ask
    // until it's ready - so keep asking until it answers.
    const ask = () => frame.current?.contentWindow?.postMessage(JSON.stringify({ event: "listening", id: 1, channel: "widget" }), PLAYER_ORIGIN);
    let tries = 0;
    const asking = window.setInterval(() => {
      if (heard || ++tries > 60) return window.clearInterval(asking);
      ask();
    }, 500);
    const keep = () => {
      try {
        if (latest >= 5) localStorage.setItem(storeKey, String(Math.floor(latest)));
      } catch {
        /* storage blocked */
      }
    };
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== PLAYER_ORIGIN || e.source !== frame.current?.contentWindow) return;
      heard = true;
      let data: { info?: { currentTime?: unknown; playerState?: unknown } } | null = null;
      try {
        data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
      } catch {
        return;
      }
      const info = data?.info;
      if (!info) return;
      try {
        if (info.playerState === 0) return localStorage.removeItem(storeKey); // finished: next time from the start
        const t = info.currentTime;
        if (typeof t !== "number" || t < 5) return;
        latest = t;
        if (Date.now() - last < 2000) return;
        last = Date.now();
        localStorage.setItem(storeKey, String(Math.floor(t)));
      } catch {
        /* storage blocked */
      }
    };
    window.addEventListener("message", onMessage);
    window.addEventListener("pagehide", keep);
    return () => {
      window.clearInterval(asking);
      window.removeEventListener("message", onMessage);
      window.removeEventListener("pagehide", keep);
      keep();
    };
  }, [storeKey, load, resumeAt, autoplay]); // the player reloads when these change: ask again

  // Get the player ready once the video is on screen.
  useEffect(() => {
    if (!v || load) return;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (saveData || !box.current || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setLoad(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(box.current);
    return () => io.disconnect();
  }, [v, load]);

  // Ask the loaded player to play (a few times: it may still be starting up).
  const command = (func: string) =>
    frame.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args: [] }), PLAYER_ORIGIN);
  const startIt = () => {
    for (const ms of [0, 400, 1200]) window.setTimeout(() => command("playVideo"), ms);
  };

  function play() {
    setPlaying(true);
    if (!load) {
      setAutoplay(true);
      setLoad(true);
    } else if (ready) startIt();
    else wantPlay.current = true;
  }

  if (!v) return null;
  const origin = typeof window === "undefined" ? "" : `&origin=${encodeURIComponent(window.location.origin)}`;
  const src = `${embedUrl(resumeAt ? { ...v, start: resumeAt } : v)}&enablejsapi=1&playsinline=1${origin}${autoplay ? "&autoplay=1" : ""}`;

  return (
    <div className="day-video" ref={box}>
      {load && (
        <div className={playing ? "day-video-frame" : "day-video-preload"} aria-hidden={!playing}>
          <iframe
            ref={frame}
            src={src}
            title={label}
            tabIndex={playing ? 0 : -1}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            onLoad={() => {
              setReady(true);
              if (wantPlay.current) {
                wantPlay.current = false;
                startIt();
              }
            }}
          />
        </div>
      )}
      {!playing && (
        <button type="button" className="day-video-poster" onClick={play} aria-label={label}>
          <img
            src={`https://img.youtube.com/vi/${v.id}/hqdefault.jpg`}
            alt=""
            loading="lazy"
            onError={(e) => (e.currentTarget.style.visibility = "hidden")}
          />
          {/* YouTube's own play button. */}
          <span className="day-video-play" aria-hidden>
            <svg viewBox="0 0 68 48">
              <path d="M66.5 7.7c-.8-2.9-3-5.2-5.9-6C55.3.3 34 .3 34 .3s-21.3 0-26.6 1.4c-2.9.8-5.1 3.1-5.9 6C0 13 0 24 0 24s0 11 1.5 16.3c.8 2.9 3 5.2 5.9 6C12.7 47.7 34 47.7 34 47.7s21.3 0 26.6-1.4c2.9-.8 5.1-3.1 5.9-6C68 35 68 24 68 24s0-11-1.5-16.3z" fill="#f00" />
              <path d="M45 24 27 14v20z" fill="#fff" />
            </svg>
          </span>
          <span className="day-video-label">
            {resumeAt ? `▶ Pick up where you left off · ${clock(resumeAt)}` : `▶ ${label}${v.start ? ` · from ${clock(v.start)}` : ""}`}
          </span>
        </button>
      )}
      {resumeAt > 0 && !playing && (
        <button
          type="button"
          className="dash-word-link day-video-link"
          onClick={() => {
            try {
              if (storeKey) localStorage.removeItem(storeKey);
            } catch {
              /* storage blocked */
            }
            setResumeAt(0);
          }}
        >
          Start from the beginning
        </button>
      )}
      {links && <div className="day-video-links">
        <a className="day-video-subscribe" href={subscribeUrl} target="_blank" rel="noreferrer">
          <svg viewBox="0 0 68 48" aria-hidden>
            <path d="M66.5 7.7c-.8-2.9-3-5.2-5.9-6C55.3.3 34 .3 34 .3s-21.3 0-26.6 1.4c-2.9.8-5.1 3.1-5.9 6C0 13 0 24 0 24s0 11 1.5 16.3c.8 2.9 3 5.2 5.9 6C12.7 47.7 34 47.7 34 47.7s21.3 0 26.6-1.4c2.9-.8 5.1-3.1 5.9-6C68 35 68 24 68 24s0-11-1.5-16.3z" fill="#f00" />
            <path d="M45 24 27 14v20z" fill="#fff" />
          </svg>
          Subscribe on YouTube
        </a>
        <a className="dash-word-link day-video-link" href={watchUrl(v)} target="_blank" rel="noreferrer">
          Open in YouTube ↗
        </a>
      </div>}
    </div>
  );
}
