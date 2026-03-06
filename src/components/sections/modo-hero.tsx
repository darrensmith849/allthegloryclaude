"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import { site } from "@/content/site";
import { album } from "@/content/album";
import { assets } from "@/content/assets";

export default function ModoHero() {
  const [heroOk, setHeroOk] = useState(true);
  const [artistOk, setArtistOk] = useState(true);

  return (
    <section className="relative isolate min-h-[92vh] w-full overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        {heroOk ? (
          <Image
            src={assets.hero}
            alt="Hero background"
            fill
            priority
            sizes="100vw"
            className="object-cover"
            onError={() => setHeroOk(false)}
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(1200px 700px at 25% 20%, var(--colour-glow) 0%, transparent 55%), " +
                "radial-gradient(900px 600px at 80% 40%, var(--colour-accent-1) 0%, transparent 60%), " +
                "linear-gradient(180deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.90) 60%, rgba(0,0,0,0.96) 100%)",
            }}
          />
        )}

        {/* Legibility veil */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/40 to-black/88" />

        {/* Artist overlay (masked + blend) */}
        {artistOk && (
          <div className="absolute inset-0">
            <Image
              src={assets.artist}
              alt="Artist portrait"
              fill
              sizes="100vw"
              className="object-cover opacity-[0.82]"
              style={{
                maskImage:
                  "radial-gradient(70% 70% at 70% 45%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 35%, rgba(0,0,0,0) 72%)",
                WebkitMaskImage:
                  "radial-gradient(70% 70% at 70% 45%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 35%, rgba(0,0,0,0) 72%)",
                mixBlendMode: "soft-light",
              }}
              onError={() => setArtistOk(false)}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(650px 420px at 70% 45%, rgba(241,215,166,0.26) 0%, transparent 60%)",
              }}
            />
          </div>
        )}

        {/* Grain */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.12] grain-overlay" />

        {/* Bottom blend gradient into next section */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-b from-transparent to-[var(--colour-bg)]" />
      </div>

      {/* Foreground */}
      <div className="mx-auto w-full max-w-6xl px-6 pt-24 pb-16 md:pt-28 md:pb-20">
        <div className="grid gap-10 md:grid-cols-[160px_1fr] md:items-start">
          {/* Left rail */}
          <div className="hidden md:flex flex-col gap-3 text-xs tracking-[0.22em] uppercase text-white/70">
            <a href={site.socials.instagram} target="_blank" rel="noreferrer" className="hover:text-white">
              Instagram ↗
            </a>
            <a href={site.socials.youtube} target="_blank" rel="noreferrer" className="hover:text-white">
              YouTube ↗
            </a>
          </div>

          {/* Text block */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[56rem]"
          >
            {/* Brand title: TOP-visible, clean wraps, NEVER breaks letters */}
            <h1 className="modo-title modo-wrap text-white">
              <span className="block">All The</span>
              <span className="block">Glory</span>
            </h1>

            {/* Album block */}
            <div className="mt-8 surface rounded-2xl px-5 py-5 md:px-6 md:py-6">
              <div className="text-xs uppercase tracking-[0.28em] text-white/70">
                New album
              </div>

              <div className="mt-2 text-2xl md:text-3xl font-semibold text-white/92">
                {album.title}
              </div>

              <p className="subtitle-glyph mt-2 text-sm md:text-base text-white/78">
                {album.subtitle}
              </p>

              <p className="mt-4 max-w-xl text-sm md:text-base leading-relaxed text-white/72">
                A testimony of truth and freedom — from darkness to light.
              </p>
            </div>

            {/* Mobile socials */}
            <div className="mt-8 flex gap-4 md:hidden text-sm text-white/75">
              <a href={site.socials.instagram} target="_blank" rel="noreferrer" className="hover:text-white">
                Instagram ↗
              </a>
              <a href={site.socials.youtube} target="_blank" rel="noreferrer" className="hover:text-white">
                YouTube ↗
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
