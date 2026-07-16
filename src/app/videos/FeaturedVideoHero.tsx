"use client";

import { useState } from "react";
import Image from "next/image";

type Props = {
  videoId: string;
};

/**
 * Interactive hero for the Videos page.
 *
 * A cinematic still of the album artwork with the dove mark floating at
 * its centre - the dove IS the play control (no chrome, no play
 * triangle). It breathes with a soft amber glow, lifts on hover, and a
 * quiet "watch" caption confirms the affordance. Nothing loads or plays
 * until the viewer clicks; the click swaps in the YouTube embed with
 * autoplay, which is allowed with sound because it is user-initiated.
 * The artwork also serves as the permanent fallback for the placeholder
 * + load-failure cases (no videoId, network error, embed restriction).
 */
export default function FeaturedVideoHero({ videoId }: Props) {
  const [playing, setPlaying] = useState(false);
  const [iframeFailed, setIframeFailed] = useState(false);
  const showVideo = playing && Boolean(videoId) && !iframeFailed;

  const embedSrc = videoId
    ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`
    : "";

  return (
    <figure className="relative overflow-hidden rounded-2xl border border-white/10 panel-scrim aspect-video">
      {/* Album artwork as the cinematic backdrop - darkened towards the
          centre so the dove reads clearly against the storm. */}
      <Image
        src="/media/ocean.jpg"
        alt=""
        fill
        priority
        sizes="(max-width: 768px) 100vw, 960px"
        className="object-cover"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      {!showVideo && Boolean(videoId) && (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label="Play the featured video"
          className="group absolute inset-0 flex flex-col items-center justify-center"
        >
          <Image
            src="/media/logo-dove.png"
            alt=""
            width={160}
            height={160}
            className="dove-play h-28 w-28 md:h-40 md:w-40 transition-transform duration-300 ease-out group-hover:scale-110"
          />
          <span
            className="mt-1 text-[10px] uppercase tracking-[0.42em] opacity-50 transition-opacity duration-300 group-hover:opacity-90"
            style={{ color: "var(--colour-amber)" }}
          >
            Watch
          </span>
        </button>
      )}

      {showVideo && (
        <iframe
          src={embedSrc}
          title="All The Glory - featured video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="eager"
          onError={() => setIframeFailed(true)}
          className="absolute inset-0 h-full w-full border-0"
        />
      )}
    </figure>
  );
}
