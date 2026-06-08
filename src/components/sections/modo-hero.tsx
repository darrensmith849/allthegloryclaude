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
    <section className="hero-section">
      {/* Top-left micro label.
          Hidden on phones — the corner labels read as accidental
          clipping at narrow widths. The cluster still carries the
          motif via the album promo and inline page taglines. */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={cornerTransition}
        className="hero-micro hero-micro-left hero-corner subtitle-glyph"
      >
        Ⅎɹoɯ ᗡɐɹʞuǝss
      </motion.div>

      {/* Top-right micro label — pair to the left one. */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={cornerTransition}
        className="hero-micro hero-micro-right hero-corner subtitle-glyph"
      >
        †o 𝕃Ɨ𝕘𝓱𝐓
      </motion.div>

      {/* Bottom-right description — pinned to the same rails as the
          fixed social dock on the bottom-left so they share a
          baseline. Hidden on phones (the dock alone is enough chrome
          at the bottom of a small screen). */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={cornerTransition}
        className="hero-bottom-caption hero-caption"
      >
        Worship music born from struggle, offering honest stories of pain, freedom, and hope.
      </motion.div>

      {/* Headline + CTA — one content block.
          Mobile: centred. Desktop: right-aligned against --page-pad
          so the title's right edge sits on the same vertical rail
          as the caption and (above it) the right edge of the nav. */}
      <div className="hero-content">
        <div className="hero-title-block">
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

          {/* CTA — sits tight against the title so they read as one
              cluster, not two separate elements. */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={ctaTransition}
            className="hero-cta"
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
