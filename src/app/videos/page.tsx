"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { site } from "@/content/site";
import { videos } from "@/content/videos";
import FeaturedVideoHero from "./FeaturedVideoHero";
import VideoRow from "./VideoRow";

const channelUrl = site.socials.youtube;

export default function VideosPage() {
  const reduce = useReducedMotion();
  const [hoverReady, setHoverReady] = useState(false);

  // Match the Music page: hold off on hover affordances until the
  // entrance animation has settled, so the rows don't react to a
  // cursor passing through during their fly-in.
  useEffect(() => {
    const t = setTimeout(() => setHoverReady(true), reduce ? 0 : 1800);
    return () => clearTimeout(t);
  }, [reduce]);

  // Hide collection entries that don't have a real YouTube id yet —
  // makes it safe to keep TODO placeholder rows in the data file.
  const collection = videos.collection.filter((v) => v.youtubeId);

  const heroTextTransition = reduce
    ? { duration: 0.01 }
    : { duration: 1.2, delay: 0.1, ease: [0.16, 1, 0.3, 1] as const };
  const heroMediaTransition = reduce
    ? { duration: 0.01 }
    : { duration: 1.4, delay: 0.3, ease: [0.16, 1, 0.3, 1] as const };
  const sectionHeaderTransition = reduce
    ? { duration: 0.01 }
    : { duration: 1.0, ease: [0.16, 1, 0.3, 1] as const };

  return (
    <main className="bg-transparent overflow-x-clip">
      {/* ── HERO ──────────────────────────────────────────────────────
          Asymmetric, editorial. Text-left / video-right composition is
          a deliberate sibling-not-clone of the Music page's flanking-
          artwork grid. */}
      <section
        aria-labelledby="videos-hero-heading"
        className="mx-auto w-full max-w-7xl px-6 pt-32 md:pt-40 pb-10 md:pb-16"
      >
        <div className="grid gap-10 md:gap-14 lg:grid-cols-[1fr_minmax(420px,1.1fr)] lg:items-center">
          {/* LEFT — text */}
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={heroTextTransition}
            className="text-center lg:text-left"
          >
            <div className="eyebrow">Featured Worship Film</div>
            <h1
              id="videos-hero-heading"
              className="font-display mt-4 text-4xl md:text-5xl lg:text-6xl font-normal text-white tracking-tight leading-[1.05]"
            >
              Worship in{" "}
              <span className="italic text-[var(--colour-amber)]">motion</span>
            </h1>

            {/* Italic Fraunces microcopy — mirrors the album page's
                "I didn't want to put a price on worship..." line so the
                two pages share a voice. */}
            <p className="font-display mt-6 text-base md:text-lg italic text-white/75 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Songs were never meant to live only in the studio — they
              breathe in the moments where light breaks through.
            </p>

            <p className="mt-5 text-sm md:text-base text-white/60 leading-relaxed max-w-md mx-auto lg:mx-0">
              {videos.featuredDescription}
            </p>

            <div className="mt-8 flex flex-wrap justify-center lg:justify-start gap-3">
              <a
                href={videos.featuredWatchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                aria-label="Watch the featured film on YouTube (opens in a new tab)"
              >
                Watch now →
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

            {/* Featured details strip — feels editorial, not metadata-y. */}
            <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 text-[10px] uppercase tracking-[0.28em] text-white/45">
              <span className="text-[var(--colour-amber)]/85">
                {videos.featuredKind}
              </span>
              <span className="text-white/20">·</span>
              <span>{videos.featuredTitle}</span>
              {videos.featuredDuration && (
                <>
                  <span className="text-white/20">·</span>
                  <span className="tabular-nums">
                    {videos.featuredDuration}
                  </span>
                </>
              )}
            </div>
          </motion.div>

          {/* RIGHT — featured video, beautifully framed */}
          <motion.div
            initial={
              reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 16 }
            }
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={heroMediaTransition}
            className="relative"
          >
            {/* Soft amber glow behind the player — anchors the media in the
                page atmosphere instead of having it sit on top of the page. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-6 md:-inset-10 -z-10 rounded-[32px] opacity-60"
              style={{
                background:
                  "radial-gradient(60% 60% at 50% 40%, rgba(216,178,90,0.18), transparent 70%)",
              }}
            />
            <FeaturedVideoHero videoId={videos.featuredId} />
          </motion.div>
        </div>
      </section>

      {/* ── CURATED COLLECTION ──────────────────────────────────────────
          Stacked editorial rows. Mirrors the Music page's track list
          rhythm — same alternating-side entrance, same shimmer, same
          hover-to-reveal pattern. */}
      {collection.length > 0 && (
        <section
          aria-labelledby="videos-collection-heading"
          className="mx-auto w-full max-w-3xl px-6 mt-16 md:mt-24"
        >
          <motion.header
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={sectionHeaderTransition}
            className="text-center"
          >
            <div className="eyebrow eyebrow-amber">The Collection</div>
            <h2
              id="videos-collection-heading"
              className="font-display mt-3 text-3xl md:text-4xl font-normal text-white tracking-tight"
            >
              Recent films &amp; sessions
            </h2>
            <p className="mt-4 text-sm md:text-base text-white/55 max-w-md mx-auto leading-relaxed">
              A curated set of moments. New entries land here as they
              release.
            </p>
          </motion.header>

          <div className="mt-10 md:mt-12 grid gap-3">
            {collection.map((item, i) => (
              <VideoRow
                key={item.id}
                item={item}
                index={i}
                hoverReady={hoverReady}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── SCRIPTURAL MOMENT ───────────────────────────────────────────
          One quiet, restrained interlude between the collection and
          the closing channel card. Hairlines + Fraunces italic — the
          same visual language as the Music page's verse modal. */}
      <section
        aria-label="Scripture"
        className="mx-auto w-full max-w-2xl px-6 mt-20 md:mt-28"
      >
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={sectionHeaderTransition}
          className="text-center"
        >
          <div className="mx-auto h-px w-12 bg-[var(--colour-amber)]/35" />
          <p className="font-display mt-7 text-xl md:text-2xl italic text-white/85 leading-relaxed">
            &ldquo;Sing to the Lord a new song; sing to the Lord, all the
            earth.&rdquo;
          </p>
          <p className="mt-4 text-[10px] uppercase tracking-[0.32em] text-[var(--colour-amber)]/85">
            Psalm 96:1
          </p>
          <div className="mx-auto mt-7 h-px w-12 bg-[var(--colour-amber)]/35" />
        </motion.div>
      </section>

      {/* ── CHANNEL / SUBSCRIBE ─────────────────────────────────────────
          Closing editorial card — mirrors the Music page's bottom rhythm.
          Pulls double duty as the closing CTA so visitors don't have to
          scroll back up. */}
      <section
        aria-labelledby="videos-channel-heading"
        className="mx-auto w-full max-w-3xl px-6 mt-16 md:mt-24 pb-24 md:pb-32"
      >
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={
            reduce
              ? { duration: 0.01 }
              : { duration: 1.4, ease: [0.16, 1, 0.3, 1] as const }
          }
          className="panel-scrim p-7 md:p-10 text-center"
        >
          <div className="eyebrow eyebrow-amber">Official Channel</div>
          <h3
            id="videos-channel-heading"
            className="font-display mt-3 text-3xl md:text-4xl font-normal text-white tracking-tight"
          >
            @Allthe_glory
          </h3>
          <p className="mt-4 text-sm md:text-base text-white/65 max-w-md mx-auto leading-relaxed">
            New films and worship sessions release here first. Subscribe so
            the next one finds you.
          </p>
          <div className="mt-7 flex justify-center">
            <a
              href={channelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              aria-label="Subscribe to the All The Glory YouTube channel (opens in a new tab)"
            >
              Subscribe on YouTube ↗
            </a>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
