"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { site } from "@/content/site";
import { album } from "@/content/album";
import { assets } from "@/content/assets";

export default function ModoHero() {
  const [coverOk, setCoverOk] = useState(true);

  // One-time reveal on first load
  const [reveal, setReveal] = useState(false);

  useEffect(() => {
    try {
      const key = "atg_hero_reveal_v1";
      const seen = sessionStorage.getItem(key);
      if (!seen) {
        setReveal(true);
        sessionStorage.setItem(key, "1");
      }
    } catch {
      // ignore
    }
  }, []);

  return (
    <section className="relative isolate min-h-[92vh] w-full overflow-hidden">
      {/* Background — STATIC cover, no parallax */}
      <div className="absolute inset-0 -z-10">
        {coverOk ? (
          <div className="absolute inset-0 hero-cover-pop hero-pop-2ko">
            <Image
              src={assets.cover}
              alt="Album cover background"
              fill
              priority
              sizes="100vw"
              className="object-cover"
              onError={() => setCoverOk(false)}
            />
          </div>
        ) : (
          <div className="absolute inset-0 hero-gradient" />
        )}

        {/* Cinematic layers: deep blue + vignette + warmth + storm */}
        <div className="absolute inset-0 hero-deep" />
        <div className="absolute inset-0 hero-vignette" />
        <div className="absolute inset-0 hero-warmth" />
        <div className="absolute inset-0 hero-storm" />

        {/* Legibility veil */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/80" />

        {/* Grain */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.10] grain-overlay" />

        {/* First-load light reveal */}
        {reveal && (
          <motion.div
            className="pointer-events-none absolute inset-0 hero-reveal"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              className="absolute inset-0 hero-reveal-beam"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            />
          </motion.div>
        )}

        {/* Bottom blend into next section */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-b from-transparent to-[var(--colour-bg)]" />
      </div>

      {/* Foreground */}
      <div className="mx-auto w-full max-w-6xl px-6 pt-24 pb-16 md:pt-28 md:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[56rem]"
        >
          <h1 className="modo-title modo-wrap text-white">
            <span className="block">All The</span>
            <span className="block">Glory</span>
          </h1>

          <div className="pill mt-6 mb-4">
            <span>New Album</span>
          </div>

          <div className="mt-4 panel panel-hover px-5 py-5 md:px-6 md:py-6">

            <div className="mt-2 text-2xl md:text-3xl font-semibold text-white/92">
              {album.title}
            </div>

            <p className="subtitle-glyph mt-2 text-sm md:text-base" style={{ color: "var(--colour-amber)", opacity: 0.9 }}>
              {album.subtitle}
            </p>

            <p className="mt-4 max-w-xl text-sm md:text-base leading-relaxed text-white/72">
              A testimony of truth and freedom — from darkness to light.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Bottom-left socials — small + subtle */}
      <div className="absolute bottom-8 left-6 z-10 flex gap-4">
        <a
          href={site.socials.instagram}
          target="_blank"
          rel="noreferrer"
          className="hero-social text-white/50 hover:text-white/90 transition-colors"
        >
          Instagram ↗
        </a>
        <a
          href={site.socials.youtube}
          target="_blank"
          rel="noreferrer"
          className="hero-social text-white/50 hover:text-white/90 transition-colors"
        >
          YouTube ↗
        </a>
      </div>
    </section>
  );
}
