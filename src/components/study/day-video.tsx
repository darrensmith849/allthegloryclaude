"use client";

// A day's session video (YouTube), played right inside the day. The player
// only loads when tapped, so a day with a video opens as fast as any other.
// Once it's playing it stays put at the top of the day's box while the
// notes and the writing box scroll up beneath it (dashboard.css), so you
// can watch the talk and write at the same time.

import { useState } from "react";
import { embedUrl, parseYouTube, watchUrl } from "@/lib/study/youtube";

export function DayVideo({ url, label = "Watch the session" }: { url: string | null | undefined; label?: string }) {
  const [playing, setPlaying] = useState(false);
  const v = parseYouTube(url);
  if (!v) return null;
  return (
    <div className="day-video">
      {playing ? (
        <div className="day-video-frame">
          <iframe
            src={`${embedUrl(v)}&autoplay=1`}
            title={label}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      ) : (
        <button type="button" className="day-video-poster" onClick={() => setPlaying(true)} aria-label={label}>
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
      <a className="dash-word-link day-video-link" href={watchUrl(v)} target="_blank" rel="noreferrer">
        Open in YouTube ↗
      </a>
    </div>
  );
}
