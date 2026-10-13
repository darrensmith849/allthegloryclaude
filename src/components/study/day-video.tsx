"use client";

// A day's session video (YouTube), played right inside the day. YouTube's
// player is heavy (a few seconds and ~1MB before a video can start), so it
// loads quietly in the background once the video is on screen - then a tap
// starts it straight away. (Not on phones asking to save data: there it
// loads on the tap.) Once it's playing it stays put at the top of the day's
// box while the notes and the writing box scroll up beneath it
// (dashboard.css), so you can watch the talk and write at the same time.

import { useEffect, useRef, useState } from "react";
import { embedUrl, parseYouTube, subscribeUrl, watchUrl } from "@/lib/study/youtube";

const PLAYER_ORIGIN = "https://www.youtube-nocookie.com";

export function DayVideo({ url, label = "Watch the session" }: { url: string | null | undefined; label?: string }) {
  const v = parseYouTube(url);
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
  const src = `${embedUrl(v)}&enablejsapi=1&playsinline=1${origin}${autoplay ? "&autoplay=1" : ""}`;

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
            ▶ {label}
            {v.start ? ` · from ${Math.floor(v.start / 3600) ? `${Math.floor(v.start / 3600)}:` : ""}${String(Math.floor((v.start % 3600) / 60)).padStart(Math.floor(v.start / 3600) ? 2 : 1, "0")}:${String(v.start % 60).padStart(2, "0")}` : ""}
          </span>
        </button>
      )}
      <div className="day-video-links">
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
      </div>
    </div>
  );
}
