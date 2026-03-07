"use client";

import { motion } from "framer-motion";
import { album } from "@/content/album";

export default function ModoHero() {
  return (
    <section className="relative min-h-[92vh] w-full">
      {/* Stylised split corners */}
      <div className="absolute left-6 top-20 md:top-24 hero-corner subtitle-glyph">
        Ⅎɹoɯ ᗡɐɹʞǝss
      </div>
      <div className="absolute right-6 top-20 md:top-24 hero-corner subtitle-glyph text-right">
        †o 𝕃ɨ𝕘𝓱𝐓
      </div>

      {/* Bottom-right caption */}
      <div className="absolute right-6 bottom-8 hero-caption hidden md:block">
        Worship music born from struggle, offering honest stories of pain, freedom, and hope.
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 pt-28 pb-16 md:pt-36 md:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[56rem] ml-auto text-right"
        >
          {/* Title on the RIGHT */}
          <h1 className="modo-title modo-wrap text-white ml-auto">
            <span className="block">All The</span>
            <span className="block">Glory</span>
          </h1>

          {/* Album card stays readable */}
          <div className="mt-8 panel-scrim px-5 py-5 md:px-6 md:py-6 ml-auto">
            <div className="text-xs uppercase tracking-[0.28em] text-white/70">
              New album
            </div>

            <div className="mt-2 text-2xl md:text-3xl font-semibold text-white/92">
              {album.title}
            </div>

            <p className="subtitle-glyph mt-2 text-sm md:text-base text-white/75">
              {album.subtitle}
            </p>

            <p className="mt-4 max-w-xl text-sm md:text-base leading-relaxed text-white/72 ml-auto">
              A testimony of truth and freedom — from darkness to light.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
