"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/platform/components/ui/Icon";
import { track } from "@/platform/lib/analytics";

// One shared audio player for the whole public site (MASTER_PLAN §7): only one
// track plays at a time, nothing autoplays, and no audio is fetched until a
// visitor presses play. Approved recordings use `{ kind: "url" }`. Sample
// profiles use a short synthesised placeholder so no real recording is ever
// attributed to a fictional creative.

export type AudioSource = { kind: "url"; src: string } | { kind: "synth"; seed: number };

export interface Track {
  id: string;
  title: string;
  artist: string;
  source: AudioSource;
  /** Seconds; synthesised placeholders run for this long. */
  duration: number;
  isSample: boolean;
}

interface PlayerState {
  current: Track | null;
  playing: boolean;
  progress: number;
  toggle: (track: Track) => void;
  stop: () => void;
}

const PlayerContext = createContext<PlayerState | null>(null);

export function usePlayer(): PlayerState {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used inside <AudioProvider>");
  return ctx;
}

/** A gentle, seeded chord progression — clearly a placeholder, never a "song". */
function scheduleSynth(ctx: AudioContext, seed: number, duration: number): GainNode {
  const master = ctx.createGain();
  master.gain.value = 0.0001;
  master.connect(ctx.destination);
  master.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.4);

  const roots = [220, 196, 174.61, 246.94, 207.65];
  const root = roots[seed % roots.length] ?? 220;
  const progressions = [
    [0, 5, 3, 4],
    [0, 3, 4, 2],
    [0, 4, 5, 3],
  ];
  const prog = progressions[seed % progressions.length] ?? [0, 5, 3, 4];
  const scale = [0, 2, 3, 5, 7, 8, 10];
  const chordLength = 2.4;
  const semitone = (n: number) => root * Math.pow(2, n / 12);

  for (let t = 0, i = 0; t < duration; t += chordLength, i++) {
    const degree = prog[i % prog.length] ?? 0;
    const notes = [0, 2, 4].map((step) => {
      const idx = degree + step;
      return (scale[idx % 7] ?? 0) + 12 * Math.floor(idx / 7);
    });
    notes.forEach((n, j) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = j === 0 ? "triangle" : "sine";
      osc.frequency.value = semitone(n) * (j === 0 ? 0.5 : 1);
      const start = ctx.currentTime + t;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.25, start + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + chordLength * 0.98);
      osc.connect(gain).connect(master);
      osc.start(start);
      osc.stop(start + chordLength);
    });
  }
  return master;
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<Track | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioEl = useRef<HTMLAudioElement | null>(null);
  const audioCtx = useRef<AudioContext | null>(null);
  const synthStartedAt = useRef(0);
  const synthElapsed = useRef(0);
  const synthGain = useRef<GainNode | null>(null);
  const raf = useRef<number | null>(null);

  const stopSynth = useCallback(() => {
    if (synthGain.current && audioCtx.current) {
      const g = synthGain.current;
      g.gain.cancelScheduledValues(audioCtx.current.currentTime);
      g.gain.setTargetAtTime(0.0001, audioCtx.current.currentTime, 0.05);
      setTimeout(() => g.disconnect(), 300);
    }
    synthGain.current = null;
  }, []);

  const stop = useCallback(() => {
    audioEl.current?.pause();
    stopSynth();
    synthElapsed.current = 0;
    setPlaying(false);
    setProgress(0);
    setCurrent(null);
  }, [stopSynth]);

  const startSynth = useCallback((track: Track, offset: number) => {
    if (track.source.kind !== "synth") return;
    audioCtx.current ??= new AudioContext();
    void audioCtx.current.resume();
    synthGain.current = scheduleSynth(audioCtx.current, track.source.seed, track.duration - offset);
    synthStartedAt.current = performance.now() - offset * 1000;
  }, []);

  const toggle = useCallback(
    (track: Track) => {
      const same = current?.id === track.id;
      if (same && playing) {
        if (track.source.kind === "url") audioEl.current?.pause();
        else {
          synthElapsed.current = (performance.now() - synthStartedAt.current) / 1000;
          stopSynth();
        }
        setPlaying(false);
        return;
      }
      if (!same) {
        audioEl.current?.pause();
        stopSynth();
        synthElapsed.current = 0;
        setProgress(0);
        setCurrent(track);
      }
      if (track.source.kind === "url") {
        audioEl.current ??= new Audio();
        audioEl.current.preload = "none";
        if (!same) audioEl.current.src = track.source.src;
        void audioEl.current.play();
      } else {
        startSynth(track, same ? synthElapsed.current : 0);
      }
      setPlaying(true);
      track_play(track);
    },
    [current, playing, startSynth, stopSynth],
  );

  useEffect(() => {
    if (!playing || !current) return;
    const tick = () => {
      let p = 0;
      if (current.source.kind === "url" && audioEl.current) {
        p = audioEl.current.duration ? audioEl.current.currentTime / audioEl.current.duration : 0;
      } else {
        p = (performance.now() - synthStartedAt.current) / 1000 / current.duration;
      }
      if (p >= 1) {
        stop();
        return;
      }
      setProgress(p);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [playing, current, stop]);

  useEffect(() => () => {
    audioEl.current?.pause();
    void audioCtx.current?.close();
  }, []);

  const value = useMemo(() => ({ current, playing, progress, toggle, stop }), [current, playing, progress, toggle, stop]);

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <MiniPlayer />
    </PlayerContext.Provider>
  );
}

function track_play(t: Track) {
  track("media_play", { track: t.id, sample: t.isSample });
}

export function PlayButton({ track: t, label }: { track: Track; label?: string }) {
  const { current, playing, toggle } = usePlayer();
  const active = current?.id === t.id && playing;
  return (
    <button
      type="button"
      className="play-button"
      aria-pressed={active}
      aria-label={`${active ? "Pause" : "Play"} ${label ?? `${t.title} by ${t.artist}`}`}
      onClick={() => toggle(t)}
    >
      <Icon name={active ? "pause" : "play"} />
    </button>
  );
}

function MiniPlayer() {
  const { current, playing, progress, toggle, stop } = usePlayer();
  if (!current) return null;
  return (
    <section className="mini-player" aria-label="Audio player">
      <button type="button" className="play-button" aria-label={`${playing ? "Pause" : "Play"} ${current.title}`} onClick={() => toggle(current)}>
        <Icon name={playing ? "pause" : "play"} />
      </button>
      <div style={{ minWidth: 0 }}>
        <p className="mini-player__title">{current.title}</p>
        <p className="mini-player__meta">
          {current.artist}
          {current.isSample ? " · Sample profile · synthesised placeholder audio" : ""}
        </p>
        <div className="mini-player__progress" aria-hidden="true">
          <span style={{ transform: `scaleX(${progress})` }} />
        </div>
      </div>
      <button type="button" className="mini-player__close" aria-label="Close player" onClick={stop}>
        <Icon name="close" />
      </button>
    </section>
  );
}
