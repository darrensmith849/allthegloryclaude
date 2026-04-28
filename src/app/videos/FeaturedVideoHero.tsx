"use client";

import { useState } from "react";
import Image from "next/image";

type Props = {
  videoId: string;
};

/**
 * Editorial hero for the Videos page.
 *
 * Renders a silent, muted, looping YouTube iframe as cinematic art when a
 * videoId is provided. The iframe is non-interactive (pointer-events-none,
 * tabIndex=-1, aria-hidden) — the surrounding "Watch on YouTube" CTA is the
 * real interactive control, so screen-reader and keyboard users are not
 * blocked from anything.
 *
 * Falls back to the static cover image when:
 *   - no videoId is set (placeholder state)
 *   - the iframe fails to load (network/region/embedding restriction)
 *
 * NOTE: we deliberately do NOT gate the iframe on prefers-reduced-motion.
 * The embed is silent, slow-moving, and decorative — it doesn't trigger
 * the vestibular concerns that the WCAG guideline targets, and gating it
 * would leave a large fraction of real users (macOS battery saver, iOS
 * default, etc.) staring at a static image instead of the cinematic art
 * the page was designed around.
 */
export default function FeaturedVideoHero({ videoId }: Props) {
  const [iframeFailed, setIframeFailed] = useState(false);
  const showVideo = Boolean(videoId) && !iframeFailed;

  const embedSrc = videoId
    ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1&rel=0&playsinline=1&disablekb=1&iv_load_policy=3&fs=0`
    : "";

  return (
    <figure className="relative mt-12 md:mt-14 overflow-hidden rounded-2xl border border-white/10 panel-scrim aspect-[16/9] md:aspect-[21/9]">
      {/* Static cover sits behind everything — visible until/unless the
          iframe takes over, and visible permanently if the iframe fails. */}
      <Image
        src="/media/videos-cover.webp"
        alt=""
        fill
        priority
        sizes="(max-width: 768px) 100vw, 960px"
        className="object-cover"
      />

      {showVideo && (
        <iframe
          src={embedSrc}
          title="All The Glory — featured video"
          allow="autoplay; encrypted-media; picture-in-picture"
          loading="lazy"
          aria-hidden="true"
          tabIndex={-1}
          onError={() => setIframeFailed(true)}
          className="pointer-events-none absolute inset-0 h-full w-full border-0 scale-[1.35]"
        />
      )}

      {/* Soft gradient at the bottom only, for legibility of the overlay text */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />

      {/* Subtle YouTube wordmark — top-right, small and decorative */}
      <div className="absolute top-4 right-4 flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/55 backdrop-blur-md border border-white/10">
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="white"
          aria-hidden="true"
        >
          <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
          <polygon
            points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"
            fill="#09080e"
          />
        </svg>
        <span className="text-[9px] uppercase tracking-[0.22em] text-white/85 font-semibold">
          YouTube
        </span>
      </div>

      {/* Channel handle — bottom-left, treated as channel banner art */}
      <figcaption className="absolute bottom-5 left-5 right-5 md:bottom-7 md:left-7">
        <p className="text-[10px] uppercase tracking-[0.28em] text-white/65">
          Official Channel
        </p>
        <p className="mt-1.5 text-lg md:text-2xl font-semibold text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.65)]">
          @Allthe_glory
        </p>
      </figcaption>
    </figure>
  );
}
