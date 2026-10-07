"use client";

// A day's session video (YouTube), played right inside the day. The player
// only loads when tapped, so a day with a video opens as fast as any other.
// Once it's playing, scrolling down keeps it in view - a small player in
// the corner (across the top on phones) - so you can watch the talk and
// write notes at the same time. "Back in the day" puts it back.

import { useEffect, useRef, useState } from "react";
import { embedUrl, parseYouTube, watchUrl } from "@/lib/study/youtube";

export function DayVideo({ url, label = "Watch the session" }: { url: string | null | undefined; label?: string }) {
  const [playing, setPlaying] = useState(false);
  const [floating, setFloating] = useState(false);
  const [docked, setDocked] = useState(false); // "Back in the day" - stop floating until it's back in view
  const spot = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!playing) return;
    // Scrolled past the video (above the top of the screen): float it.
    const check = () => {
      const el = spot.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const gone = r.bottom < 0;
      setFloating(gone);
      if (!gone) setDocked(false);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [playing]);
  const float = floating && !docked;
  // The cards' frosted-glass effect would hold a floating player inside its
  // card - switch it off while the video floats.
  useEffect(() => {
    document.documentElement.classList.toggle("video-floating", float);
    return () => document.documentElement.classList.remove("video-floating");
  }, [float]);
  const v = parseYouTube(url);
  if (!v) return null;
  return (
    <div className="day-video">
      {playing ? (
        // The spot keeps its size while the player floats, so nothing jumps.
        <div className="day-video-spot" ref={spot}>
        <div className={`day-video-frame ${float ? "is-floating" : ""}`}>
          {float && (
            <button type="button" className="day-video-dock" onClick={() => setDocked(true)} aria-label="Put the video back in the day">
              ✕
            </button>
          )}
          <iframe
            src={`${embedUrl(v)}&autoplay=1`}
            title={label}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
        </div>
      ) : (
        <button type="button" className="day-video-poster" onClick={() => setPlaying(true)} aria-label={label}>
          <img
            src={`https://img.youtube.com/vi/${v.id}/hqdefault.jpg`}
            alt=""
            loading="lazy"
            onError={(e) => (e.currentTarget.style.visibility = "hidden")}
          />
          <span className="day-video-play" aria-hidden>
            <svg viewBox="0 0 24 24">
              <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
            </svg>
          </span>
          <span className="day-video-label">
            ▶ {label}
            {v.start ? ` · from ${Math.floor(v.start / 3600) ? `${Math.floor(v.start / 3600)}:` : ""}${String(Math.floor((v.start % 3600) / 60)).padStart(Math.floor(v.start / 3600) ? 2 : 1, "0")}:${String(v.start % 60).padStart(2, "0")}` : ""}
          </span>
        </button>
      )}
      <a className="dash-word-link day-video-link" href={watchUrl(v)} target="_blank" rel="noreferrer">
        Open in YouTube ↗
      </a>
    </div>
  );
}
