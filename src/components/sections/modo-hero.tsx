"use client";

import { motion } from "framer-motion";

export default function ModoHero() {
  return (
    <section className="relative min-h-[92vh] w-full overflow-x-clip">
      <div className="absolute left-6 top-20 md:top-24 hero-corner subtitle-glyph">
        Ⅎɹoɯ ᗡɐɹʞuǝss
      </div>
      <div className="absolute right-6 top-20 md:top-24 hero-corner subtitle-glyph text-right">
        †o 𝕃Ɨ𝕘𝓱𝐓
      </div>

      <div className="absolute right-6 bottom-8 hero-caption hidden md:block">
        Worship music born from struggle, offering honest stories of pain, freedom, and hope.
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 pt-28 pb-16 md:pt-36 md:pb-20 flex justify-end">
        <motion.div
          initial={{ opacity: 0, x: "60vw" }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 7, ease: [0.06, 1, 0.18, 1] }}
          className="w-full max-w-[56rem] text-right"
        >
          <h1 className="modo-title modo-wrap inline-block text-right ml-auto uppercase tracking-[0.22em] text-[rgba(244,240,232,0.72)]">
            <span className="block">All The</span>
            <span className="block">Glory</span>
          </h1>
        </motion.div>
      </div>
    </section>
  );
}
