"use client";

import { motion } from "framer-motion";

export default function ModoHero() {
  return (
    <section className="relative min-h-[92vh] w-full overflow-x-clip">
      {/* Top-left: dissolve in */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 4, delay: 1.5, ease: "easeOut" }}
        className="absolute left-6 top-20 md:top-24 hero-corner subtitle-glyph"
      >
        Ⅎɹoɯ ᗡɐɹʞuǝss
      </motion.div>

      {/* Top-right: dissolve in */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 4, delay: 2, ease: "easeOut" }}
        className="absolute right-6 top-20 md:top-24 hero-corner subtitle-glyph text-right"
      >
        †o 𝕃Ɨ𝕘𝓱𝐓
      </motion.div>

      {/* Caption: dissolve in */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 5, delay: 4.5, ease: "easeOut" }}
        className="absolute right-6 bottom-8 hero-caption hidden md:block"
      >
        Worship music born from struggle, offering honest stories of pain, freedom, and hope.
      </motion.div>

      {/* "All The Glory" — each line fades up gently, staggered */}
      <div className="mx-auto w-full max-w-6xl px-6 pt-28 pb-16 md:pt-36 md:pb-20 flex justify-end">
        <div className="w-full max-w-[56rem] text-right">
          <h1 className="modo-title modo-wrap inline-block text-right ml-auto uppercase tracking-[0.22em] text-[rgba(244,240,232,0.72)]">
            <motion.span
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 3, delay: 0.5, ease: [0.08, 1, 0.2, 1] }}
              className="block"
            >
              All The
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 3, delay: 1.5, ease: [0.08, 1, 0.2, 1] }}
              className="block"
            >
              Glory
            </motion.span>
          </h1>
        </div>
      </div>
    </section>
  );
}
