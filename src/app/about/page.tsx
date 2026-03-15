"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import Testimony from "@/components/sections/testimony";

export default function AboutPage() {
  return (
    <div className="pt-24 overflow-x-clip">
      {/* Dad image — flies in from top like music page art */}
      <section className="w-full pt-20 md:pt-28 pb-10">
        <div className="mx-auto max-w-xl px-6 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: -80 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 3.5, ease: [0.12, 1, 0.25, 1] }}
            className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-black/20 h-[280px] md:h-[360px]"
          >
            <Image
              src="/media/dad.jpg"
              alt="All The Glory"
              fill
              sizes="(max-width: 768px) 100vw, 520px"
              className="object-cover"
              style={{ objectPosition: "50% 40%" }}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/5 to-black/55" />
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 3, delay: 1.5, ease: "easeOut" }}
            className="mt-6 text-lg md:text-xl text-white/60 max-w-2xl"
          >
            The story behind the music — a testimony of grace, surrender, and
            the relentless pursuit of light in the darkest places.
          </motion.p>
        </div>
      </section>

      <Testimony />

      {/* The Mission — glass panel */}
      <section className="w-full py-24 md:py-32">
        <div className="max-w-3xl mx-auto px-6">
          <div className="panel-scrim p-6 md:p-10">
            <h2 className="text-2xl md:text-3xl font-semibold text-white mb-8">
              The Mission
            </h2>
            <div className="space-y-6 text-white/70 text-lg leading-relaxed">
              <p>
                All The Glory exists to create music that speaks into the silence,
                that reaches into the dark corners where hope feels like a foreign
                language, and translates it into something the heart can understand.
              </p>
              <p>
                Every song is a marker on the journey — a reminder that the God who
                began a good work is faithful to complete it. The music is raw,
                honest, and unapologetically hopeful.
              </p>
              <p>
                Whether on stage or in the studio, the aim is the same: to point
                beyond the art to the Artist, beyond the song to the Singer, beyond
                the story to the Author.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
