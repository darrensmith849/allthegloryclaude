"use client";

import { motion, useReducedMotion } from "framer-motion";

export default function VerseMarquee() {
  const reduce = useReducedMotion();

  return (
    <section className="bg-transparent">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{
          duration: reduce ? 0.01 : 1.1,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="mx-auto w-full max-w-6xl px-0 md:px-6 py-10 md:py-14"
      >
        <div className="panel-soft panel-flush-mobile relative overflow-hidden">
          <div className="marquee-single">
            <div className="marquee-single-track">
              <div className="verse-block">
                <div className="verse-text">
                  &ldquo;The light shines in the darkness, and the darkness
                  has not overcome it.&rdquo;
                </div>
                <div className="verse-ref text-center mt-1">John 1:5</div>
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-black/45 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-black/45 to-transparent" />
        </div>
      </motion.div>
    </section>
  );
}
