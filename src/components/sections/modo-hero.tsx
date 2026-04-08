"use client";

import { motion, useReducedMotion } from "framer-motion";

export default function ModoHero() {
  const reduce = useReducedMotion();
  const ease = [0.25, 0.1, 0.25, 1] as const;

  // Fast, elegant entrance — was 12–14s, now ~3s.
  // Fully bypassed when prefers-reduced-motion.
  const cornerTransition = reduce
    ? { duration: 0.01, delay: 0 }
    : { duration: 2.4, delay: 0.2, ease };
  const titleTransition = reduce
    ? { duration: 0.01, delay: 0 }
    : { duration: 3.2, delay: 0.6, ease };

  return (
    <section className="relative min-h-[92vh] w-full overflow-x-clip">
      {/* Top-left corner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={cornerTransition}
        className="absolute left-6 top-20 md:top-24 hero-corner subtitle-glyph"
      >
        Ⅎɹoɯ ᗡɐɹʞuǝss
      </motion.div>

      {/* Top-right corner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={cornerTransition}
        className="absolute right-6 top-20 md:top-24 hero-corner subtitle-glyph text-right"
      >
        †o 𝕃Ɨ𝕘𝓱𝐓
      </motion.div>

      {/* Caption */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={cornerTransition}
        className="absolute right-6 bottom-8 hero-caption hidden md:block"
      >
        Worship music born from struggle, offering honest stories of pain, freedom, and hope.
      </motion.div>

      {/* "All The Glory" — settles in slightly after the corners */}
      <div className="mx-auto w-full max-w-6xl px-6 pt-28 pb-16 md:pt-36 md:pb-20 flex justify-end">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={titleTransition}
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
