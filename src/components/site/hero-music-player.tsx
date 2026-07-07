"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { fireTrack } from "@/lib/track-event";

// Log a "played the opening song" event once per session.
function logHeroPlay() {
  try {
    if (sessionStorage.getItem("atg:played:hero")) return;
    sessionStorage.setItem("atg:played:hero", "1");
  } catch {
    /* storage blocked — still log once per load */
  }
  fireTrack({ event: "play", file: "Hero · John 19:30 (opening song)" });
}

/**
 * Hero music — the album's opening track ("John 19:30 — It is finished")
 * as an ambient bed for the site.
 *
 * Browsers block *audible* autoplay until the visitor interacts with the
 * page, so we can't truly "play on open". Instead the track starts on the
 * visitor's first gesture (tap / click / key) — which feels almost
 * immediate — and an icon-only button lets them pause/resume at any time.
 *
 * The component is mounted once in the root layout, so it keeps playing
 * across client-side navigation (Home → About → …) without restarting.
 * If the visitor pauses, we remember that (localStorage) and never
 * auto-start on them again. Shown on every page so the song is always
 * pausable — the Music page included, where a visitor may want to stop it
 * before playing a per-track preview. Only the private /dashboard (owner
 * analytics, its own chrome) is excluded.
 */
const SRC = "/audio/john-19-vs-30.mp3";
const STORE_KEY = "atg-hero-music"; // value "paused" once the visitor opts out

export default function HeroMusicPlayer() {
  const pathname = usePathname();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false); // hides the "tap me" pulse once it has ever played

  const hidden = !!pathname && pathname.startsWith("/dashboard");

  const optedOut = useCallback(() => {
    try {
      return localStorage.getItem(STORE_KEY) === "paused";
    } catch {
      return false;
    }
  }, []);

  // Start on the first user gesture anywhere on the page (a real gesture is
  // what browsers require to allow sound). One-shot: listeners remove
  // themselves after firing.
  useEffect(() => {
    if (hidden) return;
    const a = audioRef.current;
    if (!a) return;
    a.volume = 0.85;

    let fired = false;
    const start = () => {
      if (fired) return;
      fired = true;
      cleanup();
      if (optedOut()) return;
      a.play()
        .then(() => setStarted(true))
        .catch(() => {
          /* still blocked (e.g. Low Power Mode) — the button is right there */
        });
    };
    const cleanup = () => {
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
      window.removeEventListener("touchstart", start);
    };
    window.addEventListener("pointerdown", start);
    window.addEventListener("keydown", start);
    window.addEventListener("touchstart", start);
    return cleanup;
  }, [hidden, optedOut]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      try {
        localStorage.removeItem(STORE_KEY);
      } catch {
        /* ignore */
      }
      a.play()
        .then(() => setStarted(true))
        .catch(() => {
          /* ignore */
        });
    } else {
      a.pause();
      try {
        localStorage.setItem(STORE_KEY, "paused");
      } catch {
        /* ignore */
      }
    }
  };

  if (hidden) return null;

  return (
    <>
      <audio
        ref={audioRef}
        src={SRC}
        preload="metadata"
        onPlay={() => {
          setPlaying(true);
          logHeroPlay();
        }}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause music" : "Play the album’s opening song"}
        title={playing ? "Pause" : "Play ‘John 19:30’"}
        className="hero-music-btn"
      >
        {!started && <span className="hero-music-ping" aria-hidden="true" />}
        {playing ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <rect x="6" y="5" width="4" height="14" rx="1.2" />
            <rect x="14" y="5" width="4" height="14" rx="1.2" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8 5.14v13.72a1 1 0 0 0 1.54.84l10.79-6.86a1 1 0 0 0 0-1.68L9.54 4.3A1 1 0 0 0 8 5.14Z" />
          </svg>
        )}
      </button>
    </>
  );
}
