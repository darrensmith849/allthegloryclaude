"use client";

import { useState } from "react";
import Image from "next/image";

type Props = {
  videoId: string;
};

/**
 * Interactive hero for the Videos page.
 *
 * Shows the static cover with a play button - nothing loads or plays
 * until the viewer clicks. The click swaps in the YouTube embed with
 * autoplay, which is allowed with sound because it is user-initiated.
 * The cover also serves as the permanent fallback for the placeholder +
 * load-failure cases (no videoId, network error, embed restriction).
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
      {/* Static cover sits behind everything - visible until the viewer
          presses play, and visible permanently if the iframe fails. */}
      <Image
        src="/media/videos-cover.webp"
        alt=""
        fill
        priority
        sizes="(max-width: 768px) 100vw, 960px"
        className="object-cover"
      />

      {!showVideo && Boolean(videoId) && (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label="Play the featured video"
          className="group absolute inset-0 flex items-center justify-center"
        >
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full border transition-transform duration-200 group-hover:scale-110"
            style={{
              background: "rgba(0, 0, 0, 0.55)",
              borderColor: "var(--colour-amber)",
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="var(--colour-amber)"
              aria-hidden="true"
              className="ml-1"
            >
              <path d="M8 5.14v13.72L19 12 8 5.14z" />
            </svg>
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
