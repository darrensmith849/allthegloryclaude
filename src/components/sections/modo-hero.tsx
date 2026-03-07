"use client";

import { motion } from "framer-motion";

export default function ModoHero() {
  return (
    <section className="relative min-h-[92vh] w-full">
      {/* Bottom-right caption */}
      <div className="absolute right-6 bottom-8 hero-caption hidden md:block">
        Worship music born from struggle, offering honest stories of pain,
        freedom, and hope.
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 pt-28 pb-16 md:pt-36 md:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[56rem] ml-auto text-right"
        >
          <h1 className="modo-title modo-wrap text-white ml-auto">
            <span className="block">All The</span>
            <span className="block">Glory</span>
          </h1>
        </motion.div>
      </div>
    </section>
  );
}
