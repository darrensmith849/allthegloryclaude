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
  reduce,
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
  reduce: boolean;
  onTogglePlay: () => void;
  onReadVerse: () => void;
}) {
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
      className={`${hoverReady ? "group" : ""} panel-scrim px-5 py-4 md:px-6 md:py-5 relative overflow-hidden`}
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
          className={`shrink-0 text-[11px] font-semibold uppercase tracking-[0.26em] transition-colors duration-300 ${
            isPlaying ? "text-[var(--colour-amber)]" : "text-white/55 hover:text-white/85"
          }`}
        >
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
          Read verse ↗
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
  onClose,
}: {
  verseRef: string;
  fullVerse: string;
  reflection?: string;
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
        className="relative max-w-lg w-full panel-scrim border border-white/10 rounded-2xl px-8 py-10 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--colour-amber)]/50"
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
}: {
  delay: number;
  side: "left" | "right";
  showCredit?: boolean;
}) {
  const reduce = useReducedMotion();
  const transition = reduce
    ? { duration: 0.01 }
    : { duration: 1.6, delay, ease: [0.25, 0.1, 0.25, 1] as const };
  void side;
  return (
    <motion.section
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: -20 }}
      animate={{ opacity: 0.85, y: 0 }}
      transition={transition}
    >
      <div
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/20"
        style={{
          width: "100%",
          height: "min(560px, 65vh)",
        }}
      >
        <Image
          src={album.coverImage}
          alt="Album cover"
          fill
          sizes="(max-width: 1024px) 100vw, 33vw"
          className="object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/70" />
      </div>

      {showCredit && (
        <div className="mt-3 text-[11px] uppercase tracking-[0.22em] text-white/55">
          Artwork by{" "}
          <a
            href="https://debbieclarkart.com/"
            target="_blank"
            rel="noreferrer"
            className="text-white/80 hover:text-white transition-colors"
          >
            Debbie Clarke
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
  const [verseModal, setVerseModal] = useState<{ ref: string; fullVerse: string; reflection?: string } | null>(null);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Track which audio element owns the current "ended" listener so we can
  // detach it cleanly when the user switches tracks — otherwise a late-firing
  // ended event on the previous track could flip a newly-started track back
  // to "Preview".
  const endedHandlerRef = useRef<(() => void) | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    // Was 10s — now matches the actual entrance length so hover works
    // shortly after the tracks land. Instant when reduced motion.
    const timer = setTimeout(() => setHoverReady(true), reduce ? 0 : 3500);
    return () => clearTimeout(timer);
  }, [reduce]);

  const detachAudio = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      if (endedHandlerRef.current) {
        audio.removeEventListener("ended", endedHandlerRef.current);
        endedHandlerRef.current = null;
      }
    }
  }, []);

  const togglePlay = useCallback((index: number, src: string) => {
    if (playingIndex === index) {
      detachAudio();
      setPlayingIndex(null);
      return;
    }

    // Switching to a new track — tear down the previous one completely
    // before we start the new one.
    detachAudio();

    const audio = new Audio(src);
    audio.preload = "auto";
    const onEnded = () => setPlayingIndex(null);
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

  useEffect(() => {
    return () => {
      detachAudio();
    };
  }, [detachAudio]);

  return (
    <main className="relative bg-transparent overflow-x-clip">
      {/* Full-bleed BTS studio video sitting behind the entire top banner —
          behind the left artwork, the album header card, and the right
          artwork. Fades into the page background before the track list so
          the rest of the page stays calm. Skipped under reduced-motion. */}
      {!reduce && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px] md:h-[720px] overflow-hidden"
        >
          <video
            src="/media/music-bts.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            tabIndex={-1}
            className="absolute inset-0 h-full w-full object-cover opacity-55"
          />
          {/* Legibility + fade-to-bg scrim */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/40 to-[var(--colour-bg)]" />
        </div>
      )}
      <div className="mx-auto w-full max-w-7xl px-6 py-14 md:py-20">
        <div className="grid gap-8 lg:grid-cols-[1fr_minmax(380px,520px)_1fr] items-start">
          {/* LEFT artwork — sticky so it follows the tracks as they scroll.
              Credit is hidden here so it doesn't collide with the fixed
              bottom-left social dock; the right side keeps the credit. */}
          <div className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
            <AlbumArt delay={0.08} side="left" showCredit={false} />
          </div>

          {/* Mobile artwork */}
          <div className="lg:hidden">
            <AlbumArt delay={0.08} side="left" />
          </div>

          {/* CENTRE: everything centred */}
          <section className="flex flex-col items-center text-center">
            {/* Album header — animates independently and locks in place */}
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
                I didn&apos;t want to put a price on worship — this is an
                offering unto the Lord. Take it, listen, and let it lead you
                to Him.
              </p>
            </motion.div>

            {/* Tracks — animate independently, don't affect header */}
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
                  reduce={!!reduce}
                  onTogglePlay={() => togglePlay(i, t.previewSrc)}
                  onReadVerse={() => setVerseModal({ ref: t.ref, fullVerse: t.fullVerse, reflection: t.reflection })}
                />
              ))}
            </div>

            {/* Primary download CTA — sits between the track list and the
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

            {/* Streaming links — only the platforms that actually exist */}
            <motion.div
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                reduce
                  ? { duration: 0.01 }
                  : { duration: 1.4, delay: 2.4, ease: [0.06, 1, 0.18, 1] as const }
              }
              className="mt-8 flex flex-wrap justify-center gap-8 text-[11px] font-semibold uppercase tracking-[0.26em] text-white/55"
            >
              <a
                href={site.socials.spotify}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                Spotify ↗
              </a>
              {site.socials.appleMusic && (
                <a
                  href={site.socials.appleMusic}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Apple Music ↗
                </a>
              )}
              <a
                href={site.socials.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                YouTube ↗
              </a>
            </motion.div>
          </section>

          {/* RIGHT artwork (desktop only) — sticky so it follows the tracks as they scroll */}
          <div className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
            <AlbumArt delay={0.14} side="right" />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {verseModal && (
          <VerseModal
            verseRef={verseModal.ref}
            fullVerse={verseModal.fullVerse}
            reflection={verseModal.reflection}
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
