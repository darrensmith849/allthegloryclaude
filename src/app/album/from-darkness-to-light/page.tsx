"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { album } from "@/content/album";
import { site } from "@/content/site";
import DownloadModal from "./DownloadModal";

function TrackRow({
  index,
  title,
  verse,
  delay,
  fromRight,
  hoverReady,
  isPlaying,
  isLoading,
  progress,
  reduce,
  hasLyrics,
  onTogglePlay,
  onReadVerse,
}: {
  index: number;
  title: string;
  verse: string;
  delay: number;
  fromRight: boolean;
  hoverReady: boolean;
  isPlaying: boolean;
  isLoading: boolean;
  /** Preview playback progress in [0, 1]. Drives the circular ring around
   *  the play / pause button so visitors can see how much of the snippet
   *  is left. Only meaningful when isPlaying is true. */
  progress: number;
  reduce: boolean;
  hasLyrics: boolean;
  onTogglePlay: () => void;
  onReadVerse: () => void;
}) {
  // Progress ring geometry — drawn inside the 20×20 button slot. r = 9 so
  // the ring sits just inside the circle, leaving room for the 1.5px stroke.
  const RING_R = 9;
  const RING_C = 2 * Math.PI * RING_R;
  const dashOffset =
    isPlaying && Number.isFinite(progress)
      ? RING_C * (1 - Math.max(0, Math.min(1, progress)))
      : RING_C;
  const trackTransition = reduce
    ? { duration: 0.01 }
    : { duration: 1.4, delay: delay * 0.4, ease: [0.06, 1, 0.18, 1] as const };
  const shimmerTransition = reduce
    ? { duration: 0 }
    : { duration: 1.6, delay: delay * 0.4 + 1.6, ease: "easeInOut" as const };

  return (
    <motion.div
      initial={
        reduce
          ? { opacity: 0 }
          : { opacity: 0, x: fromRight ? "30vw" : "-30vw" }
      }
      animate={{ opacity: 1, x: 0 }}
      transition={trackTransition}
      className={`${hoverReady ? "group" : ""} panel-scrim panel-flush-mobile px-5 py-4 md:px-6 md:py-5 relative overflow-hidden`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 text-left">
          <div className="eyebrow">
            Track {String(index).padStart(2, "0")}
          </div>
          <div className="font-display mt-1 text-lg md:text-2xl font-normal text-white/95 truncate tracking-tight group-hover:text-[var(--colour-amber)] transition-colors duration-300">
            {title}
          </div>
        </div>

        <button
          onClick={onTogglePlay}
          aria-label={
            isPlaying
              ? `Pause preview of ${title}`
              : isLoading
                ? `Loading preview of ${title}`
                : `Play preview of ${title}`
          }
          aria-pressed={isPlaying}
          className={`shrink-0 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.26em] transition-colors duration-300 ${
            isPlaying ? "text-[var(--colour-amber)]" : "text-white/55 hover:text-white/85"
          }`}
        >
          {/* Play / pause / loading glyph — gives the row an unmistakable
              audio affordance without leaning on color alone.
              When playing, the surrounding circle becomes a progress ring
              that fills from 12 o'clock clockwise as the preview plays. */}
          <span
            aria-hidden="true"
            className="relative inline-flex items-center justify-center w-5 h-5"
          >
            {/* Background ring (always visible, takes the place of the old
                static border) + foreground progress ring (only when playing). */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              className="absolute inset-0"
              fill="none"
            >
              <circle
                cx="10"
                cy="10"
                r={RING_R}
                stroke="currentColor"
                strokeWidth="1"
                opacity={isPlaying ? 0.25 : 0.85}
              />
              {isPlaying && (
                <circle
                  cx="10"
                  cy="10"
                  r={RING_R}
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeDasharray={RING_C}
                  strokeDashoffset={dashOffset}
                  // rotate -90deg so dash starts at 12 o'clock and runs CW
                  transform="rotate(-90 10 10)"
                  style={{ transition: "stroke-dashoffset 120ms linear" }}
                />
              )}
            </svg>
            {/* Icon, centered inside the ring */}
            <span className="relative inline-flex items-center justify-center">
              {isPlaying ? (
                // Pause icon
                <svg width="9" height="9" viewBox="0 0 10 10" fill="currentColor">
                  <rect x="1.5" y="1" width="2" height="8" rx="0.5" />
                  <rect x="6.5" y="1" width="2" height="8" rx="0.5" />
                </svg>
              ) : isLoading ? (
                // Tiny spinner
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  className="animate-spin"
                >
                  <circle cx="6" cy="6" r="4.5" opacity="0.3" />
                  <path d="M10.5 6a4.5 4.5 0 0 0-4.5-4.5" strokeLinecap="round" />
                </svg>
              ) : (
                // Play triangle — nudged 1px right of center so the
                // optical centre matches the circle's geometric centre.
                <svg width="8" height="8" viewBox="0 0 10 10" fill="currentColor">
                  <path d="M3 1.5 L8 5 L3 8.5 Z" />
                </svg>
              )}
            </span>
          </span>
          {isPlaying ? "Pause" : isLoading ? "Loading…" : "Preview"}
        </button>
      </div>

      {/* Verse + read link on hover */}
      <div className="max-h-0 overflow-hidden opacity-0 group-hover:max-h-40 group-hover:opacity-100 transition-all duration-500 ease-out text-left">
        <p className="font-display mt-4 pt-4 border-t border-white/10 text-base md:text-lg italic text-white/80 leading-relaxed">
          {verse}
        </p>
        <button
          onClick={onReadVerse}
          className="mt-3 inline-block text-[10px] font-semibold uppercase tracking-[0.26em] text-[var(--colour-amber)]/70 hover:text-[var(--colour-amber)] transition-colors duration-300"
        >
          {hasLyrics ? "Read verse + lyrics ↗" : "Read verse ↗"}
        </button>
      </div>

      {/* Shimmer sweep after landing */}
      {!reduce && (
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: "200%" }}
          transition={shimmerTransition}
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(105deg, transparent 30%, rgba(216,178,90,0.2) 45%, rgba(255,255,255,0.15) 50%, rgba(216,178,90,0.2) 55%, transparent 70%)",
          }}
        />
      )}
    </motion.div>
  );
}

function VerseModal({
  verseRef,
  fullVerse,
  reflection,
  lyricCards,
  lyricCardsPdf,
  onClose,
}: {
  verseRef: string;
  fullVerse: string;
  reflection?: string;
  lyricCards?: string[];
  lyricCardsPdf?: string;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    // Capture previously focused element so we can restore on close
    previousFocusRef.current = document.activeElement as HTMLElement | null;

    // Focus the dialog itself once mounted
    const raf = requestAnimationFrame(() => {
      dialogRef.current?.focus();
    });

    const focusableSelector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector)
        ).filter(
          (el) => !el.hasAttribute("disabled") && el.offsetParent !== null
        );
        if (focusables.length === 0) {
          e.preventDefault();
          dialogRef.current.focus();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && (active === first || active === dialogRef.current)) {
          last.focus();
          e.preventDefault();
        } else if (!e.shiftKey && active === last) {
          first.focus();
          e.preventDefault();
        }
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", handleKey);
      // Restore focus to whatever opened the modal
      previousFocusRef.current?.focus?.();
    };
  }, [onClose]);

  const overlayTransition = reduce ? { duration: 0.01 } : { duration: 0.3 };
  const dialogTransition = reduce
    ? { duration: 0.01 }
    : { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={overlayTransition}
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="verse-modal-title"
        tabIndex={-1}
        initial={
          reduce
            ? { opacity: 0 }
            : { opacity: 0, scale: 0.92, y: 20 }
        }
        animate={
          reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }
        }
        exit={
          reduce
            ? { opacity: 0 }
            : { opacity: 0, scale: 0.92, y: 20 }
        }
        transition={dialogTransition}
        className="relative max-w-lg w-full max-h-[90vh] overflow-y-auto panel-scrim border border-white/10 rounded-2xl px-8 py-10 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--colour-amber)]/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          id="verse-modal-title"
          className="eyebrow eyebrow-amber mb-5"
        >
          {verseRef}
        </div>
        <p className="font-display text-xl md:text-2xl italic text-white/90 leading-relaxed">
          &ldquo;{fullVerse}&rdquo;
        </p>
        <div className="mt-4 text-[10px] uppercase tracking-[0.26em] text-white/40">ESV</div>

        {reflection && (
          <>
            <div className="mt-7 mx-auto h-px w-12 bg-[var(--colour-amber)]/30" />
            <p className="mt-6 text-sm md:text-base text-white/65 leading-relaxed max-w-md mx-auto">
              {reflection}
            </p>
          </>
        )}

        {lyricCards && lyricCards.length > 0 && (
          <>
            <div className="mt-8 mx-auto h-px w-12 bg-[var(--colour-amber)]/30" />
            <div className="eyebrow eyebrow-amber mt-6">Lyrics</div>
            <div className="mt-5 flex flex-col gap-4">
              {lyricCards.map((src, i) => (
                <Image
                  key={src}
                  src={src}
                  alt={`${verseRef} lyric card ${i + 1}`}
                  width={1200}
                  height={2000}
                  sizes="(max-width: 640px) 90vw, 480px"
                  className="w-full h-auto rounded-xl border border-white/10"
                  loading={i === 0 ? "eager" : "lazy"}
                />
              ))}
            </div>
            {lyricCardsPdf && (
              <a
                href={lyricCardsPdf}
                download
                className="mt-5 inline-block text-[10px] font-semibold uppercase tracking-[0.26em] text-[var(--colour-amber)]/70 hover:text-[var(--colour-amber)] transition-colors duration-300"
              >
                Download lyric cards (PDF) ↓
              </a>
            )}
          </>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-8 text-[11px] font-semibold uppercase tracking-[0.26em] text-white/50 hover:text-white/85 transition-colors duration-300"
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  );
}

function AlbumArt({
  delay,
  side,
  showCredit = true,
  cardSrc,
  cardAlt,
  cardAspect,
  onClick,
  onHoverChange,
}: {
  delay: number;
  side: "left" | "right";
  showCredit?: boolean;
  /** Optional lyric-card image to render in place of the album cover.
   *  When this prop changes, the panel crossfades to the new card. */
  cardSrc?: string;
  /** Accessible label for the lyric card variant. */
  cardAlt?: string;
  /** Aspect ratio for the lyric-card container (CSS aspect-ratio syntax,
   *  e.g. "1200 / 1800"). Each card has its own native aspect; the
   *  container shrinks/grows to match so the gold border always sits
   *  flush with the panel edge. */
  cardAspect?: string;
  /** Click handler - when set, the whole panel becomes a button that opens
   *  the verse modal for the linked track. */
  onClick?: () => void;
  /** Notifies the parent when the panel is hovered/focused so the parent
   *  can pause an auto-rotation while the visitor is reading. */
  onHoverChange?: (hovered: boolean) => void;
}) {
  const reduce = useReducedMotion();
  const transition = reduce
    ? { duration: 0.01 }
    : { duration: 1.6, delay, ease: [0.25, 0.1, 0.25, 1] as const };
  // A slow, generous crossfade. Both the old card's exit (1 -> 0) and the
  // new card's entrance (0 -> 1) overlap fully so neither one snaps.
  const crossfade = reduce
    ? { duration: 0.01 }
    : { duration: 1.6, ease: [0.4, 0, 0.2, 1] as const };
  void side;
  const isCard = Boolean(cardSrc);

  const panelInner = (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 ${
        onClick
          ? "transition-transform duration-500 ease-out group-hover:scale-[1.015] group-focus-visible:scale-[1.015] group-focus-visible:ring-2 group-focus-visible:ring-[var(--colour-amber)]/50"
          : ""
      }`}
      style={
        isCard
          ? // Per-card aspect ratio - the container shrinks/grows so the gold
            // ornate border on every card sits flush with the panel edge.
            // Tailwind handles the smooth height interpolation on transition.
            {
              width: "100%",
              aspectRatio: cardAspect ?? "1200 / 2133",
              transition: "aspect-ratio 1.4s cubic-bezier(0.4, 0, 0.2, 1)",
            }
          : { width: "100%", height: "min(560px, 65vh)" }
      }
    >
      {isCard ? (
        <AnimatePresence initial={false} mode="sync">
          <motion.div
            key={cardSrc}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={crossfade}
            className="absolute inset-0"
          >
            <Image
              src={cardSrc!}
              alt={cardAlt ?? "Lyric card"}
              fill
              sizes="(max-width: 1024px) 100vw, 33vw"
              className="object-cover"
              priority
            />
          </motion.div>
        </AnimatePresence>
      ) : (
        <>
          <Image
            src={album.coverImage}
            alt="Album cover"
            fill
            sizes="(max-width: 1024px) 100vw, 33vw"
            className="object-cover"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/70" />
        </>
      )}
    </div>
  );

  const hoverProps = onHoverChange
    ? {
        onMouseEnter: () => onHoverChange(true),
        onMouseLeave: () => onHoverChange(false),
        onFocus: () => onHoverChange(true),
        onBlur: () => onHoverChange(false),
      }
    : {};

  return (
    <motion.section
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: -20 }}
      animate={{ opacity: isCard ? 1 : 0.85, y: 0 }}
      transition={transition}
    >
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          {...hoverProps}
          className="group block w-full text-left focus:outline-none rounded-2xl"
          aria-label={cardAlt ?? "Open lyrics"}
        >
          {panelInner}
        </button>
      ) : (
        panelInner
      )}

      {showCredit && (
        <div className="mt-3 text-[11px] uppercase tracking-[0.22em] text-white/55">
          Artwork by{" "}
          <a
            href="https://debbieclarkart.com/"
            target="_blank"
            rel="noreferrer"
            className="text-white/80 hover:text-white transition-colors"
          >
            Debbie Clarke ↗
          </a>
        </div>
      )}
    </motion.section>
  );
}

export default function AlbumPage() {
  const [hoverReady, setHoverReady] = useState(false);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);
  const [verseModal, setVerseModal] = useState<{ ref: string; fullVerse: string; reflection?: string; lyricCards?: string[]; lyricCardsPdf?: string } | null>(null);
  const [downloadOpen, setDownloadOpen] = useState(false);
  // Share-this-album state: visitors get a single "Share" button that opens
  // the native share sheet on mobile (navigator.share) and falls back to
  // copy-to-clipboard on desktop. `shareState` drives the button label.
  const [shareState, setShareState] = useState<"idle" | "copied" | "error">(
    "idle"
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Track which audio element owns the current "ended" listener so we can
  // detach it cleanly when the user switches tracks - otherwise a late-firing
  // ended event on the previous track could flip a newly-started track back
  // to "Preview".
  const endedHandlerRef = useRef<(() => void) | null>(null);
  // Same dance for the timeupdate listener that drives the progress ring.
  const timeUpdateHandlerRef = useRef<(() => void) | null>(null);
  // Preview progress in [0, 1] — fed to the active TrackRow's circular
  // progress ring. Reset to 0 on every track switch / end / pause.
  const [progress, setProgress] = useState(0);
  // Self-ref so the onEnded handler can auto-advance to the next track
  // without capturing a stale togglePlay closure.
  const togglePlayRef = useRef<((index: number, src: string) => void) | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    // Was 10s - now matches the actual entrance length so hover works
    // shortly after the tracks land. Instant when reduced motion.
    const timer = setTimeout(() => setHoverReady(true), reduce ? 0 : 3500);
    return () => clearTimeout(timer);
  }, [reduce]);

  // --- Rotating side lyric cards ---------------------------------------------
  // Both side panels show cards from the same track and advance together
  // every 9 seconds. Paused while the visitor hovers/focuses either panel
  // so they have time to read. Reduced-motion users see only the first
  // track and no rotation.
  const [featuredTrackIdx, setFeaturedTrackIdx] = useState(0);
  const [rotationPaused, setRotationPaused] = useState(false);
  // Refs let the always-on interval read the latest values without
  // re-creating itself on every state change - otherwise React's strict-
  // mode double-mount + the useReducedMotion null->false transition would
  // tear the interval down before its 9-second tick fires.
  const reduceRef = useRef(reduce);
  const pausedRef = useRef(rotationPaused);
  useEffect(() => { reduceRef.current = reduce; }, [reduce]);
  useEffect(() => { pausedRef.current = rotationPaused; }, [rotationPaused]);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;
    const tick = () => {
      if (cancelled) return;
      if (!reduceRef.current && !pausedRef.current) {
        setFeaturedTrackIdx((i) => (i + 1) % album.tracks.length);
      }
      timeoutId = setTimeout(tick, 9000);
    };
    timeoutId = setTimeout(tick, 9000);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, []);

  const featuredTrack = album.tracks[featuredTrackIdx];
  const featuredLeftCard = featuredTrack.lyricCards?.[0];
  const featuredRightCard =
    featuredTrack.lyricCards?.[1] ?? featuredTrack.lyricCards?.[0];

  const openFeaturedModal = useCallback(() => {
    setVerseModal({
      ref: featuredTrack.ref,
      fullVerse: featuredTrack.fullVerse,
      reflection: featuredTrack.reflection,
      lyricCards: featuredTrack.lyricCards,
      lyricCardsPdf: featuredTrack.lyricCardsPdf,
    });
  }, [featuredTrack]);

  const detachAudio = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      if (endedHandlerRef.current) {
        audio.removeEventListener("ended", endedHandlerRef.current);
        endedHandlerRef.current = null;
      }
      if (timeUpdateHandlerRef.current) {
        audio.removeEventListener("timeupdate", timeUpdateHandlerRef.current);
        timeUpdateHandlerRef.current = null;
      }
    }
    setProgress(0);
  }, []);

  const togglePlay = useCallback((index: number, src: string) => {
    if (playingIndex === index) {
      detachAudio();
      setPlayingIndex(null);
      return;
    }

    // Switching to a new track - tear down the previous one completely
    // before we start the new one.
    detachAudio();

    const audio = new Audio(src);
    audio.preload = "auto";

    // Progress ring: refresh on each timeupdate (~250ms intervals on most
    // browsers). Cheap enough — single setState — and the SVG transition
    // smooths the visual jump between ticks.
    const onTimeUpdate = () => {
      const d = audio.duration;
      if (d && Number.isFinite(d) && d > 0) {
        setProgress(audio.currentTime / d);
      }
    };
    timeUpdateHandlerRef.current = onTimeUpdate;
    audio.addEventListener("timeupdate", onTimeUpdate);

    // Auto-advance: when this preview finishes, kick off the next track's
    // preview automatically (only if there is one). Defer with setTimeout
    // so the React state from setPlayingIndex(null) settles before the
    // recursive togglePlayRef call reads it.
    const onEnded = () => {
      setPlayingIndex(null);
      setProgress(0);
      const nextIndex = index + 1;
      const nextTrack = album.tracks[nextIndex];
      if (nextTrack?.previewSrc) {
        setTimeout(() => {
          togglePlayRef.current?.(nextIndex, nextTrack.previewSrc);
        }, 0);
      }
    };
    endedHandlerRef.current = onEnded;
    audio.addEventListener("ended", onEnded);
    audioRef.current = audio;

    setLoadingIndex(index);
    const clearLoading = () => {
      // Only clear if this is still the track the user is waiting on.
      setLoadingIndex((current) => (current === index ? null : current));
    };

    audio
      .play()
      .then(() => {
        clearLoading();
        setPlayingIndex(index);
      })
      .catch(() => {
        // Playback was blocked (autoplay policy) or aborted by a newer click.
        clearLoading();
      });
  }, [playingIndex, detachAudio]);

  // Keep the self-ref pointed at the latest togglePlay so the onEnded
  // handler in a previous closure can call into the current implementation.
  useEffect(() => {
    togglePlayRef.current = togglePlay;
  }, [togglePlay]);

  useEffect(() => {
    return () => {
      detachAudio();
    };
  }, [detachAudio]);

  // Share the album page — copy the URL straight to the clipboard.
  // The native share sheet was confusing visitors ("share via AirDrop?
  // Mail? Reminders?"); a plain copy-link action is what's actually
  // useful and matches what most people expect a Share button to do.
  const handleShare = useCallback(async () => {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    try {
      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard?.writeText
      ) {
        await navigator.clipboard.writeText(url);
        setShareState("copied");
        setTimeout(() => setShareState("idle"), 2400);
        return;
      }
      // No clipboard API available — surface a hint so the visitor knows
      // they can grab the URL out of the address bar instead.
      setShareState("error");
      setTimeout(() => setShareState("idle"), 2400);
    } catch {
      setShareState("error");
      setTimeout(() => setShareState("idle"), 2400);
    }
  }, []);

  return (
    <main className="bg-transparent overflow-x-clip">
      <div className="mx-auto w-full max-w-7xl px-6 py-14 md:py-20">
        <div className="grid gap-8 lg:grid-cols-[1fr_minmax(380px,520px)_1fr] items-start">
          {/* LEFT - verse card from the currently-featured track. Both side
              panels auto-rotate through all 7 tracks together. Click opens
              the verse modal for whichever track is showing right now. */}
          <div className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
            <AlbumArt
              delay={0.08}
              side="left"
              showCredit={false}
              cardSrc={featuredLeftCard}
              cardAlt={`${featuredTrack.ref} - opens lyrics`}
              cardAspect={featuredTrack.lyricCardAspect}
              onClick={openFeaturedModal}
              onHoverChange={setRotationPaused}
            />
          </div>

          {/* Mobile artwork - keep the original painting as the hero on
              small screens; the lyric-card flank only shows on desktop. */}
          <div className="lg:hidden">
            <AlbumArt delay={0.08} side="left" />
          </div>

          {/* CENTRE: everything centred */}
          <section className="flex flex-col items-center text-center">
            {/* Album header - animates independently and locks in place */}
            <motion.div
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                reduce
                  ? { duration: 0.01 }
                  : { duration: 1.6, delay: 0, ease: [0.25, 0.1, 0.25, 1] as const }
              }
              className="p-6 md:p-8 w-full drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]"
            >
              <div className="eyebrow eyebrow-amber">
                2026 · Album
              </div>
              <h1 className="subtitle-glyph mt-3 text-2xl md:text-4xl font-semibold text-white">
                {album.title}
              </h1>
              <p className="subtitle-glyph mt-2 text-sm text-white/65">
                {album.subtitle}
              </p>

              {/* Download */}
              <div className="mt-6 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setDownloadOpen(true)}
                  className="btn btn-primary"
                >
                  Download free →
                </button>
              </div>

              <p className="font-display mt-5 text-sm md:text-base italic text-white/65 leading-relaxed max-w-sm mx-auto">
                This album is a free offering unto the Lord.
                <br />
                May every song lead you closer to Him.
              </p>
            </motion.div>

            {/* Tracks - animate independently, don't affect header */}
            <div className="mt-8 grid gap-3 w-full">
              {album.tracks.map((t, i) => (
                <TrackRow
                  key={t.title}
                  index={i + 1}
                  title={t.title}
                  verse={t.verse}
                  delay={0.6 + i * 0.8}
                  fromRight={i % 2 === 1}
                  hoverReady={hoverReady}
                  isPlaying={playingIndex === i}
                  isLoading={loadingIndex === i && playingIndex !== i}
                  progress={playingIndex === i ? progress : 0}
                  reduce={!!reduce}
                  hasLyrics={!!t.lyricCards && t.lyricCards.length > 0}
                  onTogglePlay={() => togglePlay(i, t.previewSrc)}
                  onReadVerse={() => setVerseModal({ ref: t.ref, fullVerse: t.fullVerse, reflection: t.reflection, lyricCards: t.lyricCards, lyricCardsPdf: t.lyricCardsPdf })}
                />
              ))}
            </div>

            {/* Primary download CTA - sits between the track list and the
                streaming row so listeners always have a clear path to take
                the album with them. */}
            <motion.div
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                reduce
                  ? { duration: 0.01 }
                  : { duration: 1.2, delay: 2.0, ease: [0.06, 1, 0.18, 1] as const }
              }
              className="mt-10 flex justify-center"
            >
              <button
                type="button"
                onClick={() => setDownloadOpen(true)}
                className="btn btn-primary"
              >
                Download free →
              </button>
            </motion.div>

            {/* Streaming row — icon-only, no per-link captions. Each icon
                only renders when its URL is filled in, so the row gracefully
                stays empty until CD Baby distribution lands. Same vocabulary
                of brand glyphs the social dock uses, kept small + amber on
                hover so it reads as a quiet "also available here" line
                rather than a competing CTA. */}
            <StreamingRow reduce={!!reduce} />

            {/* Production credit — one role per line so each contributor's
                name stays intact on a single line at every breakpoint and
                the section reads as a clean stacked attribution block. */}
            <div className="mt-10 text-[11px] uppercase tracking-[0.22em] text-white/55 leading-relaxed space-y-1.5">
              <p>
                <span className="whitespace-nowrap">Engineered &amp; Produced by</span>{" "}
                <a
                  href="https://www.optimusik.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/80 hover:text-[var(--colour-amber)] transition-colors whitespace-nowrap"
                >
                  Simba Moyo ↗
                </a>
                {" · "}
                <a
                  href="https://soundbetter.com/profiles/9495-riffi-wacho"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/80 hover:text-[var(--colour-amber)] transition-colors whitespace-nowrap"
                >
                  Riffi Wacho ↗
                </a>
              </p>
              <p>
                <span className="whitespace-nowrap">Backing vocals by</span>{" "}
                <a
                  href="https://www.endgamestrategylab.co.za"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/80 hover:text-[var(--colour-amber)] transition-colors whitespace-nowrap"
                >
                  Christina Ribeiro ↗
                </a>
                {" · "}
                <a
                  href="https://music.apple.com/za/album/thought-i-was-over-you-radio-edit-single/1643703974"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/80 hover:text-[var(--colour-amber)] transition-colors whitespace-nowrap"
                >
                  Dimakatso Machingaifa ↗
                </a>
              </p>
              <p>
                <span className="whitespace-nowrap">Drums by</span>{" "}
                <a
                  href="https://www.instagram.com/dhowardondrums"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/80 hover:text-[var(--colour-amber)] transition-colors whitespace-nowrap"
                >
                  Darnell Howard ↗
                </a>
              </p>
            </div>

            {/* Artwork credit - moved here from under the side artwork now
                that the side panels show lyric cards. Same painting tops
                every lyric card, so the credit is still attribution-correct. */}
            <p className="mt-4 text-[11px] uppercase tracking-[0.22em] text-white/45">
              Artwork by{" "}
              <a
                href="https://debbieclarkart.com/"
                target="_blank"
                rel="noreferrer"
                className="text-white/70 hover:text-white transition-colors"
              >
                Debbie Clarke ↗
              </a>
            </p>

            {/* ── PASS IT ON ────────────────────────────────────────
                 The closing word: this music is free, so if it lands
                 with someone, encourage them to send it on. The button
                 copies the album URL straight to the visitor's
                 clipboard so they can paste it into whatever app they
                 want — no native share sheet, no extra step. */}
            <div className="mt-14 md:mt-20 max-w-md mx-auto text-center">
              <div className="mx-auto h-px w-12 bg-[var(--colour-amber)]/30" />
              <div className="eyebrow eyebrow-amber mt-6">Pass it on</div>
              <p className="font-display mt-3 text-lg md:text-xl italic text-white/80 leading-relaxed">
                This album is a free offering. If it speaks to you,
                share it with someone who may need it — a friend, a
                family member, anyone walking through the dark.
              </p>
              <p
                aria-label="From Darkness To Light"
                className="subtitle-glyph mt-4 text-xs md:text-sm tracking-[0.18em] text-white/55"
              >
                Ⅎɹoɯ ᗡɐɹʞuǝss †o 𝕃Ɨ𝕘𝓱𝐓
              </p>

              {/* Mirror the "Download free →" CTA above so the closing
                  beat reads as a deliberate pair with the opening CTA. */}
              <div className="mt-7 flex justify-center">
                <button
                  type="button"
                  onClick={handleShare}
                  aria-live="polite"
                  className="btn btn-primary"
                >
                  {shareState === "copied"
                    ? "Link copied ✓"
                    : shareState === "error"
                      ? "Copy from URL bar →"
                      : "Share this album →"}
                </button>
              </div>
            </div>

          </section>

          {/* RIGHT - chorus card from the currently-featured track. */}
          <div className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
            <AlbumArt
              delay={0.14}
              side="right"
              showCredit={false}
              cardSrc={featuredRightCard}
              cardAlt={`${featuredTrack.ref} - opens lyrics`}
              cardAspect={featuredTrack.lyricCardAspect}
              onClick={openFeaturedModal}
              onHoverChange={setRotationPaused}
            />
          </div>
        </div>

      </div>

      <AnimatePresence>
        {verseModal && (
          <VerseModal
            verseRef={verseModal.ref}
            fullVerse={verseModal.fullVerse}
            reflection={verseModal.reflection}
            lyricCards={verseModal.lyricCards}
            lyricCardsPdf={verseModal.lyricCardsPdf}
            onClose={() => setVerseModal(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {downloadOpen && (
          <DownloadModal onClose={() => setDownloadOpen(false)} />
        )}
      </AnimatePresence>
    </main>
  );
}

// ── Streaming row ────────────────────────────────────────────────
// Icon-only "also on streaming" row below the download CTA. Reads from
// site.socials so the URLs live in one place; each platform is only
// rendered when its URL is non-empty, so this row gracefully shows just
// Spotify today and quietly grows as Apple Music / YouTube Music come
// online via CD Baby distribution.

function StreamingRow({ reduce }: { reduce: boolean }) {
  // Search-URL fallbacks for platforms that don't have a real artist URL
  // pasted into site.socials yet (Apple Music + YouTube Music will get
  // theirs when CD Baby distribution lands). Visitors land on a search
  // result page for the album in the meantime, which still beats a
  // hidden icon. The moment the real URL is added to site.socials, the
  // fallback is dropped automatically — no other change required.
  const albumQuery = "All The Glory From Darkness To Light";
  const appleMusicHref =
    site.socials.appleMusic ||
    `https://music.apple.com/search?term=${encodeURIComponent(albumQuery)}`;
  const youtubeMusicHref =
    site.socials.youtubeMusic ||
    `https://music.youtube.com/search?q=${encodeURIComponent(albumQuery)}`;

  const links: { href: string; label: string; icon: React.ReactNode }[] = [];
  if (site.socials.spotify) {
    links.push({
      href: site.socials.spotify,
      label: "Listen on Spotify",
      icon: <SpotifyIcon />,
    });
  }
  links.push({
    href: appleMusicHref,
    label: site.socials.appleMusic
      ? "Listen on Apple Music"
      : "Find on Apple Music",
    icon: <AppleMusicIcon />,
  });
  links.push({
    href: youtubeMusicHref,
    label: site.socials.youtubeMusic
      ? "Listen on YouTube Music"
      : "Find on YouTube Music",
    icon: <YouTubeMusicIcon />,
  });
  if (links.length === 0) return null;

  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reduce
          ? { duration: 0.01 }
          : { duration: 1.2, delay: 2.2, ease: [0.06, 1, 0.18, 1] as const }
      }
      className="mt-8 flex flex-col items-center gap-3"
    >
      <div className="eyebrow eyebrow-amber">Also on streaming</div>
      <div className="flex items-center gap-7">
        {links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={l.label}
            title={l.label}
            className="text-white/55 hover:text-[var(--colour-amber)] transition-colors duration-300"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center">
              {l.icon}
            </span>
          </a>
        ))}
      </div>
    </motion.div>
  );
}

function SpotifyIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

function AppleMusicIcon() {
  // Clean beamed-eighth-note silhouette (Heroicons musical-note, solid).
  // No container box — matches the silhouette weight of the Spotify
  // circle next to it and reads cleanly at small icon sizes.
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M19.952 1.651a.75.75 0 0 1 .298.599V16.303a3 3 0 0 1-2.176 2.884l-1.32.377a2.553 2.553 0 1 1-1.403-4.909l2.311-.66a1.5 1.5 0 0 0 1.088-1.442V6.994l-9 2.572v9.737a3 3 0 0 1-2.176 2.884l-1.32.377a2.553 2.553 0 1 1-1.402-4.909l2.31-.66a1.5 1.5 0 0 0 1.088-1.442V5.25a.75.75 0 0 1 .544-.721l10.5-3a.75.75 0 0 1 .658.122Z"
      />
    </svg>
  );
}

function YouTubeMusicIcon() {
  // Outlined circle with a play triangle — the universally readable
  // "YouTube Music" silhouette, kept currentColor so it inherits the
  // hover amber treatment.
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none" />
    </svg>
  );
}
