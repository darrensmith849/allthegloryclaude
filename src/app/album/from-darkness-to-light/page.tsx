"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { album } from "@/content/album";
import { site } from "@/content/site";

function TrackRow({
  index,
  title,
  verseRef,
  isPlaying,
  onTogglePlay,
  onReadVerse,
}: {
  index: number;
  title: string;
  verseRef: string;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onReadVerse: () => void;
}) {
  return (
    <li className="track-row" data-playing={isPlaying || undefined}>
      <span className="track-number" aria-hidden="true">
        {String(index).padStart(2, "0")}
      </span>

      <div className="min-w-0">
        <span className="track-title truncate block">{title}</span>
        <button
          type="button"
          onClick={onReadVerse}
          className="track-verse-ref hover:underline underline-offset-4 focus:outline-none focus-visible:text-[var(--colour-amber)]"
          aria-label={`Read ${verseRef} in full`}
        >
          {verseRef}
        </button>
      </div>

      <div className="track-actions">
        <button
          type="button"
          onClick={onTogglePlay}
          className="track-action"
          data-playing={isPlaying || undefined}
          aria-label={`${isPlaying ? "Pause" : "Preview"} ${title}`}
        >
          {isPlaying ? "Pause" : "Preview"}
        </button>
      </div>
    </li>
  );
}

function VerseModal({
  verseRef,
  fullVerse,
  onClose,
}: {
  verseRef: string;
  fullVerse: string;
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
          className="text-xs uppercase tracking-[0.28em] text-[var(--colour-amber)]/70 mb-5"
        >
          {verseRef}
        </div>
        <p className="text-lg md:text-xl italic text-white/85 leading-relaxed">
          &ldquo;{fullVerse}&rdquo;
        </p>
        <div className="mt-4 text-xs text-white/40">ESV</div>
        <button
          type="button"
          onClick={onClose}
          className="mt-8 text-xs uppercase tracking-[0.24em] text-white/50 hover:text-white/80 transition-colors duration-300"
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  );
}

function AlbumArt() {
  const reduce = useReducedMotion();
  const transition = reduce
    ? { duration: 0.01 }
    : { duration: 1.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] as const };
  return (
    <motion.figure
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transition}
      className="relative"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-white/10 bg-black/20 shadow-[0_40px_100px_rgba(0,0,0,0.5)]">
        <Image
          src={album.coverImage}
          alt={`${album.name} — album cover`}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 520px"
          className="object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/30" />
      </div>

      <figcaption className="mt-4 text-[11px] uppercase tracking-[0.22em] text-white/45">
        Artwork by{" "}
        <a
          href="https://debbieclarkart.com/"
          target="_blank"
          rel="noreferrer"
          className="text-white/70 hover:text-white transition-colors"
        >
          Debbie Clarke
        </a>
      </figcaption>
    </motion.figure>
  );
}

export default function AlbumPage() {
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [verseModal, setVerseModal] = useState<{ ref: string; fullVerse: string } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const reduce = useReducedMotion();

  const togglePlay = useCallback((index: number, src: string) => {
    if (playingIndex === index) {
      audioRef.current?.pause();
      setPlayingIndex(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(src);
    audio.addEventListener("ended", () => setPlayingIndex(null));
    audio.play();
    audioRef.current = audio;
    setPlayingIndex(index);
  }, [playingIndex]);

  useEffect(() => {
    return () => { audioRef.current?.pause(); };
  }, []);

  const headerTransition = reduce
    ? { duration: 0.01 }
    : { duration: 1.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] as const };
  const listTransition = reduce
    ? { duration: 0.01 }
    : { duration: 1.4, delay: 0.35, ease: [0.16, 1, 0.3, 1] as const };
  const footerTransition = reduce
    ? { duration: 0.01 }
    : { duration: 1.2, delay: 0.55, ease: [0.16, 1, 0.3, 1] as const };

  return (
    <main className="bg-transparent overflow-x-clip">
      <div className="mx-auto w-full max-w-6xl px-6 pt-32 md:pt-40 pb-20 md:pb-28">
        {/* ── Editorial album header ─────────────────────── */}
        <motion.header
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={headerTransition}
          className="text-center"
        >
          <div className="eyebrow eyebrow-amber">
            2025 · Album
          </div>
          <h1 className="subtitle-glyph mt-4 text-3xl md:text-5xl font-semibold text-white">
            {album.title}
          </h1>
          <p className="mt-4 text-sm md:text-base text-white/65 max-w-md mx-auto leading-relaxed">
            A seven-track worship album woven through scripture. Free to
            download, free to share.
          </p>
        </motion.header>

        {/* ── Two-column layout: artwork + tracklist ─────── */}
        <div className="mt-12 md:mt-16 grid gap-10 md:gap-14 lg:grid-cols-[minmax(280px,1fr)_minmax(0,1.35fr)] items-start">
          {/* Left — album artwork */}
          <AlbumArt />

          {/* Right — tracklist + actions */}
          <motion.section
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={listTransition}
            className="panel-scrim p-6 md:p-8"
            aria-label="Tracklist"
          >
            <div className="flex items-end justify-between mb-5 md:mb-6">
              <div className="eyebrow">Tracklist</div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-white/40">
                {album.tracks.length} tracks
              </div>
            </div>

            <ol className="tracklist">
              {album.tracks.map((t, i) => (
                <TrackRow
                  key={t.title}
                  index={i + 1}
                  title={t.title}
                  verseRef={t.ref}
                  isPlaying={playingIndex === i}
                  onTogglePlay={() => togglePlay(i, t.previewSrc)}
                  onReadVerse={() => setVerseModal({ ref: t.ref, fullVerse: t.fullVerse })}
                />
              ))}
            </ol>

            {/* Primary actions */}
            <div className="mt-8 md:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <a href="/downloads/from-darkness-to-light.zip" className="btn btn-primary">
                Download free →
              </a>
              <Link href="/give" className="btn btn-ghost">
                Support the work
              </Link>
            </div>

            <p className="mt-5 text-xs text-white/55 leading-relaxed max-w-md">
              I didn&apos;t want to put a price on worship — this is an
              offering unto the Lord. If you feel led to support the work,
              your gift goes directly into recording, production, and
              releasing more music.
            </p>
          </motion.section>
        </div>

        {/* ── Streaming row ─────────────────────────────── */}
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={footerTransition}
          className="mt-14 md:mt-20 text-center"
        >
          <div className="eyebrow mb-4">Also on</div>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs uppercase tracking-[0.24em] text-white/55">
            <a
              href={site.socials.spotify}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Spotify ↗
            </a>
            <a
              href={site.socials.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              YouTube ↗
            </a>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {verseModal && (
          <VerseModal
            verseRef={verseModal.ref}
            fullVerse={verseModal.fullVerse}
            onClose={() => setVerseModal(null)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
