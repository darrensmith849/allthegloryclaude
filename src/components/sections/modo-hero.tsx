"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

export default function ModoHero() {
  const reduce = useReducedMotion();
  const ease = [0.25, 0.1, 0.25, 1] as const;

  // Fast, elegant entrance - was 12–14s, now ~3s.
  // Fully bypassed when prefers-reduced-motion.
  const cornerTransition = reduce
    ? { duration: 0.01, delay: 0 }
    : { duration: 2.4, delay: 0.2, ease };
  const titleTransition = reduce
    ? { duration: 0.01, delay: 0 }
    : { duration: 3.2, delay: 0.6, ease };
  const ctaTransition = reduce
    ? { duration: 0.01, delay: 0 }
    : { duration: 1.8, delay: 1.6, ease };

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

      {/* "All The Glory" - centred on mobile (larger, more vertical breathing room),
          right-aligned on desktop. */}
      <div className="mx-auto w-full max-w-6xl px-6 pt-[26vh] pb-20 md:pt-32 md:pb-24 flex justify-center md:justify-end">
        <div className="w-full max-w-[52rem] flex flex-col items-center md:items-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={titleTransition}
            className="w-full text-center md:text-right"
          >
            <h1 className="modo-title modo-title-tight modo-wrap inline-block text-center md:text-right md:ml-auto uppercase tracking-[0.22em] text-[rgba(244,240,232,0.72)]">
              <span className="block">All The</span>
              <span className="block">Glory</span>
            </h1>
          </motion.div>

          {/* Single primary CTA - fades in after the title settles */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={ctaTransition}
            className="mt-7 md:mt-9"
          >
            <Link
              href="/album/from-darkness-to-light"
              className="btn btn-primary"
              aria-label="Listen to the album From Darkness To Light"
            >
              Listen now →
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
