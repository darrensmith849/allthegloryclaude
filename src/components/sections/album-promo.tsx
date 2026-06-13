"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { assets } from "@/content/assets";

export default function AlbumPromo() {
  const reduce = useReducedMotion();

  return (
    <motion.section
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration: reduce ? 0.01 : 1.1,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="bg-transparent"
    >
      <div className="mx-auto w-full max-w-3xl px-6 pt-0 pb-44 md:pt-0 md:pb-56">
        <Link
          href="/album/from-darkness-to-light"
          className="block group"
        >
          {/* Album image - hero-sized so it owns the lower half of the home page */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/20 h-[400px] md:h-[560px]">
            <Image
              src={assets.albumArt}
              alt="Album artwork"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover group-hover:scale-[1.03] transition-transform duration-700"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/5 to-black/55" />
          </div>
        </Link>

        <div className="mt-2 mb-4 text-center text-xs text-white/55">
          Artwork by{" "}
          <a
            href="https://debbieclarkart.com/"
            target="_blank"
            rel="noreferrer"
            className="text-white/75 underline decoration-white/20 underline-offset-4 hover:text-white"
          >
            Debbie Clarke ↗
          </a>
        </div>

        <Link
          href="/album/from-darkness-to-light"
          className="block group"
        >
          {/* Glass panel with text — copy per the press-kit spec.
              Heading kept as the inverted-glyph "From Darkness To Light"
              brand mark; body line + small "Available …" line + button
              text per the spec. */}
          <div className="panel-scrim panel-flush-mobile p-6 md:p-7 text-center group-hover:border-white/20 transition-colors duration-300">
            <div className="eyebrow eyebrow-amber">The Album</div>

            <p
              className="subtitle-glyph mt-3 text-lg md:text-xl text-white/90 group-hover:text-[var(--colour-amber)] transition-colors duration-300"
              aria-label="From Darkness To Light"
            >
              <span aria-hidden="true">Ⅎɹoɯ ᗡɐɹʞuǝss †o 𝕃Ɨ𝕘𝓱𝐓</span>
            </p>

            <p className="font-display mt-2 text-base md:text-lg text-white/75 italic max-w-md mx-auto leading-relaxed">
              A seven-track worship album shaped by Scripture, testimony, and surrender.
            </p>

            <p className="mt-4 text-[11px] uppercase tracking-[0.22em] text-[var(--colour-amber-soft)]">
              Available 17 July 2026
            </p>

            <div className="mt-3 text-[11px] uppercase tracking-[0.22em] text-white/55 group-hover:text-[var(--colour-amber)] transition-colors duration-300">
              Explore The Album →
            </div>
          </div>
        </Link>
      </div>
    </motion.section>
  );
}
