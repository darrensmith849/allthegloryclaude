"use client";

import { motion, useReducedMotion } from "framer-motion";
import { site } from "@/content/site";
import { videos } from "@/content/videos";
import FeaturedVideoHero from "./FeaturedVideoHero";

const channelUrl = site.socials.youtube;

/**
 * Minimal Videos page - every path leads to YouTube.
 *
 *   eyebrow → headline → one-line description → two CTAs → featured video.
 *
 * No collection, no scripture interlude, no subscribe panel below the
 * video. Deliberately spare; the channel is the destination.
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

          <p className="mt-6 text-sm md:text-base text-white/65 leading-relaxed max-w-md mx-auto">
            Live worship, performances, and music videos - shared as they
            release on the channel.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href={videos.featuredWatchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              aria-label="Watch the featured video on YouTube (opens in a new tab)"
            >
              Watch on YouTube ↗
            </a>
            <a
              href={channelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost"
              aria-label="Visit the All The Glory YouTube channel (opens in a new tab)"
            >
              Visit the channel ↗
            </a>
          </div>
        </motion.div>

        {/* Featured video - sits below the text block as a wide,
            cinematic banner. Soft amber glow anchors it in the page
            atmosphere instead of having it sit on top of the page. */}
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

          {/* Open-in-YouTube CTA directly under the player - gives the
              viewer a one-click path off the embed when they want sound,
              full controls, or to keep watching on the channel. */}
          <div className="mt-6 md:mt-8 flex justify-center">
            <a
              href={videos.featuredWatchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost"
              aria-label="Open the featured video on YouTube (opens in a new tab)"
            >
              Open in YouTube ↗
            </a>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
