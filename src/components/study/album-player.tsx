"use client";

// "Listen while you study": the album From Darkness To Light, streamed in
// full (from R2, downloads.alltheglory.co.za/stream/) in a small player that
// lives in The Study's shell - so it keeps playing as members move between
// pages. It never starts on its own; the reader chooses to press play.

import Image from "next/image";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { album } from "@/content/album";

const STREAM_BASE = "https://downloads.alltheglory.co.za/stream/";
const STATE_KEY = "atg:study:player";

// Each full track sits next to its preview's file name, e.g. 01-john-19-vs-30.mp3.
const TRACKS = album.tracks.map((t) => ({
  title: t.title,
  verse: t.verse,
  src: STREAM_BASE + t.previewSrc.split("/").pop(),
}));

interface Player {
  open: boolean;
  setOpen: (v: boolean) => void;
  index: number;
  playing: boolean;
  play: (i?: number) => void;
  pause: () => void;
}

const PlayerContext = createContext<Player | null>(null);
export const useAlbumPlayer = () => useContext(PlayerContext);

const time = (s: number) =>
  Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "0:00";

export function AlbumPlayerProvider({ children }: { children: React.ReactNode }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState({ at: 0, of: 0 });

  // Start where they left off last time (which song - not autoplay).
  useEffect(() => {
    try {
      const saved = Number(window.localStorage.getItem(STATE_KEY));
      if (Number.isInteger(saved) && saved >= 0 && saved < TRACKS.length) setIndex(saved);
    } catch {
      // private window
    }
  }, []);

  const load = useCallback((i: number) => {
    const a = audio.current;
    if (!a) return;
    if (a.dataset.index !== String(i)) {
      a.src = TRACKS[i].src;
      a.dataset.index = String(i);
    }
    setIndex(i);
    try {
      window.localStorage.setItem(STATE_KEY, String(i));
    } catch {
      // private window
    }
  }, []);

  const play = useCallback(
    (i?: number) => {
      const a = audio.current;
      if (!a) return;
      load(i ?? index);
      void a.play().catch(() => setPlaying(false));
    },
    [index, load],
  );
  const pause = useCallback(() => audio.current?.pause(), []);

  // Lock-screen / headphone controls and the song name on phones.
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: TRACKS[index].title,
      artist: "All The Glory",
      album: "From Darkness To Light",
      artwork: [{ src: album.coverImage, sizes: "717x528", type: "image/jpeg" }],
    });
    navigator.mediaSession.setActionHandler("play", () => play());
    navigator.mediaSession.setActionHandler("pause", () => pause());
    navigator.mediaSession.setActionHandler("previoustrack", () => play((index + TRACKS.length - 1) % TRACKS.length));
    navigator.mediaSession.setActionHandler("nexttrack", () => play((index + 1) % TRACKS.length));
  }, [index, play, pause]);

  return (
    <PlayerContext.Provider value={{ open, setOpen, index, playing, play, pause }}>
      {children}
      <audio
        ref={audio}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setPos({ at: e.currentTarget.currentTime, of: e.currentTarget.duration || 0 })}
        onLoadedMetadata={(e) => setPos({ at: 0, of: e.currentTarget.duration || 0 })}
        onEnded={() => {
          // The album plays through, then stops.
          if (index < TRACKS.length - 1) play(index + 1);
        }}
      />
      {open && (
        <div className="study-player" role="dialog" aria-label="Listen to the album">
          <div className="study-player-head">
            <Image src={album.coverImage} alt="" width={56} height={42} className="study-player-cover" />
            <div className="min-w-0 flex-1">
              <div className="study-player-album">From Darkness To Light</div>
              <div className="study-player-artist">All The Glory · {TRACKS.length} songs</div>
            </div>
            <button type="button" className="study-player-x" onClick={() => setOpen(false)} aria-label="Close the player">
              ×
            </button>
          </div>

          <div className="study-player-now">
            <div className="study-player-title">{TRACKS[index].title}</div>
            <div className="study-player-verse">{TRACKS[index].verse}</div>
          </div>

          <input
            type="range"
            className="study-player-seek"
            min={0}
            max={pos.of || 1}
            step={1}
            value={Math.min(pos.at, pos.of || 1)}
            onChange={(e) => {
              if (audio.current) audio.current.currentTime = Number(e.target.value);
            }}
            aria-label="Position in the song"
          />
          <div className="study-player-times">
            <span>{time(pos.at)}</span>
            <span>{time(pos.of)}</span>
          </div>

          <div className="study-player-controls">
            <button type="button" onClick={() => play((index + TRACKS.length - 1) % TRACKS.length)} aria-label="Previous song">
              ⏮
            </button>
            <button
              type="button"
              className="study-player-play"
              onClick={() => (playing ? pause() : play())}
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? "❚❚" : "▶"}
            </button>
            <button type="button" onClick={() => play((index + 1) % TRACKS.length)} aria-label="Next song">
              ⏭
            </button>
          </div>

          <ol className="study-player-list">
            {TRACKS.map((t, i) => (
              <li key={t.src}>
                <button type="button" className={i === index ? "is-on" : ""} onClick={() => play(i)}>
                  <span>{i + 1}</span>
                  {t.title}
                  {i === index && playing && <em>playing</em>}
                </button>
              </li>
            ))}
          </ol>
          <a className="study-player-more" href={album.path}>
            The album, lyrics and free download ↗
          </a>
        </div>
      )}
    </PlayerContext.Provider>
  );
}

// The top-bar button: opens the player, and shows the song while playing.
export function ListenButton() {
  const p = useAlbumPlayer();
  if (!p) return null;
  return (
    <button
      type="button"
      className={`study-listen ${p.playing ? "is-playing" : ""}`}
      onClick={() => p.setOpen(!p.open)}
      aria-expanded={p.open}
    >
      <span aria-hidden>♪</span>
      {p.playing ? TRACKS[p.index].title : "Listen"}
    </button>
  );
}
