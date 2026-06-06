"use client";

import { useState } from "react";
import Image from "next/image";

type Props = {
  videoId: string;
};

/**
 * Interactive hero for the Videos page.
 *
 * Renders the YouTube embed as a real, playable player - controls on,
 * sound on, full pointer + keyboard interaction. A static cover image
 * sits behind the iframe as a fallback for the placeholder + load-failure
 * cases (no videoId, network error, embed restriction).
 */
export default function FeaturedVideoHero({ videoId }: Props) {
  const [iframeFailed, setIframeFailed] = useState(false);
  const showVideo = Boolean(videoId) && !iframeFailed;

  const embedSrc = videoId
    ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`
    : "";

  return (
    <figure className="relative mt-12 md:mt-14 overflow-hidden rounded-2xl border border-white/10 panel-scrim aspect-video">
      {/* Static cover sits behind everything - visible until/unless the
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
          title="All The Glory - featured video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          onError={() => setIframeFailed(true)}
          className="absolute inset-0 h-full w-full border-0"
        />
      )}
    </figure>
  );
}
