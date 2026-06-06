"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { album } from "@/content/album";

type Props = {
  onClose: () => void;
};

/**
 * Clean download view - opens when the user clicks "Download free".
 *
 * No bible verses, no extra commentary. Just the album cover, the title
 * "From Darkness To Light", the track list (display only - for context),
 * and a single primary action: Download all (.zip).
 *
 * The zip already has its files numbered "01 - …" → "07 - …" so they
 * extract in album order in any music app. The browser's download
 * filename is set client-side via the `download` attribute.
 */
export default function DownloadModal({ onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement | null;

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
      previousFocusRef.current?.focus?.();
    };
  }, [onClose]);

  const overlayTransition = reduce ? { duration: 0.01 } : { duration: 0.3 };
  const dialogTransition = reduce
    ? { duration: 0.01 }
    : { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={overlayTransition}
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 overflow-y-auto"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />

      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="download-modal-title"
        tabIndex={-1}
        initial={
          reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 16 }
        }
        animate={
          reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }
        }
        exit={
          reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 16 }
        }
        transition={dialogTransition}
        className="relative w-full max-w-md panel-scrim border border-white/10 rounded-2xl p-7 md:p-9 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--colour-amber)]/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Album cover - small, premium */}
        <div className="mx-auto relative w-32 h-32 md:w-36 md:h-36 overflow-hidden rounded-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <Image
            src={album.coverImage}
            alt=""
            fill
            sizes="160px"
            className="object-cover"
          />
        </div>

        <div className="eyebrow eyebrow-amber mt-6">All The Glory</div>
        <h2
          id="download-modal-title"
          className="font-display mt-2 text-2xl md:text-3xl font-normal text-white tracking-tight"
        >
          From Darkness To Light
        </h2>
        <p className="mt-2 text-xs uppercase tracking-[0.22em] text-white/55">
          7 tracks + lyric cards · {album.releaseYear}
        </p>

        {/* Track list - display only, for context */}
        <ol className="mt-6 text-left text-sm text-white/70 space-y-1.5">
          {album.tracks.map((t, i) => (
            <li key={t.title} className="flex gap-3">
              <span className="text-[10px] uppercase tracking-[0.18em] text-white/40 tabular-nums w-5 shrink-0 pt-0.5">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="font-display truncate">{t.title}</span>
            </li>
          ))}
        </ol>

        {/* Primary action */}
        <a
          href={album.downloadZipSrc}
          download={album.downloadZipFilename}
          className="mt-7 btn btn-primary w-full justify-center inline-flex"
          onClick={() => {
            // Close the modal shortly after the browser starts the download,
            // so the user lands back on the album page.
            setTimeout(onClose, 300);
          }}
        >
          Download album (.zip) →
        </a>

        <p className="mt-4 text-[11px] text-white/45 leading-relaxed">
          Free. The album and lyric cards are yours - take them, share
          them, let them lead you to Him.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 text-[11px] font-semibold uppercase tracking-[0.26em] text-white/45 hover:text-white/85 transition-colors duration-300"
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  );
}
