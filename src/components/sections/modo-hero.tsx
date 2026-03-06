"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { site } from "@/content/site";
import { album } from "@/content/album";
import { assets } from "@/content/assets";

export default function ModoHero() {
  const [coverOk, setCoverOk] = useState(true);

  // Parallax drift (very subtle)
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const bgX = useTransform(mx, [-1, 1], [-10, 10]);
  const bgY = useTransform(my, [-1, 1], [-8, 8]);

  // One-time reveal on first load (stored in sessionStorage)
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

  const onMove = (e: React.MouseEvent<HTMLElement>) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    mx.set(Math.max(-1, Math.min(1, dx)));
    my.set(Math.max(-1, Math.min(1, dy)));
  };

  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  // CSS background fallback if cover missing
  const fallback = useMemo(
    () => ({
      background:
        "radial-gradient(900px 520px at 30% 25%, rgba(11,27,52,0.70) 0%, transparent 60%)," +
        "radial-gradient(800px 520px at 78% 38%, rgba(216,178,90,0.22) 0%, transparent 62%)," +
        "radial-gradient(900px 520px at 60% 70%, rgba(154,147,139,0.14) 0%, transparent 62%)," +
        "linear-gradient(180deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.78) 55%, rgba(0,0,0,0.92) 100%)",
    }),
    []
  );

  return (
    <section
      className="relative isolate min-h-[92vh] w-full overflow-hidden"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {/* Background */}
      <div className="absolute inset-0 -z-10 hero-pop">
        {coverOk ? (
          <motion.div style={{ x: bgX, y: bgY }} className="absolute inset-0 scale-[1.06]">
            <Image
              src={assets.cover}
              alt="Album cover background"
              fill
              priority
              sizes="100vw"
              className="object-cover"
              onError={() => setCoverOk(false)}
            />
          </motion.div>
        ) : (
          <div className="absolute inset-0" style={fallback} />
        )}

        {/* Cinematic layers: vignette + warmth + storm */}
        <div className="absolute inset-0 hero-vignette" />
        <div className="absolute inset-0 hero-warmth" />
        <div className="absolute inset-0 hero-storm" />

        {/* Legibility veil */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/80" />

        {/* Grain */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.10] grain-overlay" />

        {/* Unique first-load "light reveal" */}
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

          <div className="mt-8 surface rounded-2xl px-5 py-5 md:px-6 md:py-6">
            <div className="text-xs uppercase tracking-[0.28em] text-white/70">
              New album
            </div>

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
