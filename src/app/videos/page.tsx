"use client";

import { motion, useReducedMotion } from "framer-motion";
import { videos } from "@/content/videos";
import FeaturedVideoHero from "./FeaturedVideoHero";

/**
 * Minimal Videos page - the video itself is the hero.
 *
 *   eyebrow → headline → one-line description → autoplaying video → one
 *   Watch-on-YouTube CTA below.
 *
 * Deliberately spare; the channel is the destination.
 */
export default function VideosPage() {
  const reduce = useReducedMotion();

  const heroTextTransition = reduce
    ? { duration: 0.01 }
    : { duration: 1.2, delay: 0.1, ease: [0.16, 1, 0.3, 1] as const };
  const heroMediaTransition = reduce
    ? { duration: 0.01 }
    : { duration: 1.4, delay: 0.3, ease: [0.16, 1, 0.3, 1] as const };

  return (
    <main className="bg-transparent overflow-x-clip">
      <section
        aria-labelledby="videos-hero-heading"
        className="mx-auto w-full max-w-5xl px-6 pt-32 md:pt-40 pb-24 md:pb-32"
      >
        {/* Text block */}
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={heroTextTransition}
          className="text-center max-w-2xl mx-auto"
        >
          <div className="eyebrow">Featured</div>
          <h1
            id="videos-hero-heading"
            className="font-display mt-4 text-4xl md:text-5xl lg:text-6xl font-normal text-white tracking-tight leading-[1.05]"
          >
            Worship in{" "}
            <span className="italic text-[var(--colour-amber)]">motion</span>
          </h1>
          <p
            aria-label="From Darkness To Light"
            className="subtitle-glyph mt-4 text-xs md:text-sm tracking-[0.18em] text-white/55"
          >
            Ⅎɹoɯ ᗡɐɹʞuǝss †o 𝕃Ɨ𝕘𝓱𝐓
          </p>

          <p className="mt-6 text-sm md:text-base text-white/65 leading-relaxed max-w-md mx-auto">
            Live worship, performances, and music videos - shared as they
            release on the channel.
          </p>
        </motion.div>

        {/* Featured video - autoplays muted; viewer unmutes with one click.
            Soft amber glow anchors it in the page atmosphere instead of
            having it sit on top of the page. */}
        <motion.div
          initial={
            reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 18 }
          }
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={heroMediaTransition}
          className="relative mt-12 md:mt-16"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-6 md:-inset-10 -z-10 rounded-[32px] opacity-60"
            style={{
              background:
                "radial-gradient(50% 60% at 50% 40%, rgba(216,178,90,0.18), transparent 70%)",
            }}
          />
          <FeaturedVideoHero videoId={videos.featuredId} />

          {/* Single Watch-on-YouTube CTA, directly under the player. */}
          <div className="mt-6 md:mt-8 flex justify-center">
            <a
              href={videos.featuredWatchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              aria-label="Watch the featured video on YouTube (opens in a new tab)"
            >
              Watch on YouTube ↗
            </a>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
