"use client";

// A day's session video (YouTube), played right inside the day. The player
// only loads when tapped, so a day with a video opens as fast as any other.

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
