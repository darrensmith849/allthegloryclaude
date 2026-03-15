"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { assets } from "@/content/assets";

export default function VideosPage() {
  return (
    <main className="bg-transparent overflow-x-clip">
      <div className="mx-auto w-full max-w-4xl px-6 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 3, delay: 0.3, ease: "easeOut" }}
          className="text-center"
        >
          <div className="text-xs uppercase tracking-[0.28em] text-white/60">
            Videos
          </div>
          <h1 className="subtitle-glyph mt-3 text-2xl md:text-4xl font-semibold text-white">
            Coming Soon
          </h1>
          <p className="mt-3 text-sm md:text-base text-white/65 max-w-md mx-auto">
            Official music videos and visual content are on the way.
            Subscribe to be the first to see them.
          </p>
        </motion.div>

        {/* YouTube channel link with album art */}
        <motion.a
          href="https://www.youtube.com/@Allthe_glory"
          target="_blank"
          rel="noreferrer"
          initial={{ opacity: 0, y: -60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 4, delay: 0.5, ease: [0.06, 1, 0.18, 1] }}
          className="group block mt-10"
        >
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/20 h-[240px] md:h-[380px]">
            <Image
              src={assets.albumArt}
              alt="All The Glory"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 800px"
              className="object-cover group-hover:scale-[1.03] transition-transform duration-700"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/70" />

            {/* Play-style overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:bg-white/20 transition-colors duration-300">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white" className="ml-1">
                  <polygon points="6,3 20,12 6,21" />
                </svg>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div>
              <div className="text-base md:text-lg font-semibold text-white/90 group-hover:text-[var(--colour-amber)] transition-colors duration-300">
                All The Glory - YouTube
              </div>
              <div className="mt-1 text-xs text-white/50">
                Subscribe for upcoming music videos
              </div>
            </div>
            <span className="text-xs uppercase tracking-[0.24em] text-white/55 group-hover:text-white/80 transition-colors duration-300">
              Visit channel ↗
            </span>
          </div>
        </motion.a>
      </div>
    </main>
  );
}
