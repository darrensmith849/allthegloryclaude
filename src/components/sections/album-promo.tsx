"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { assets } from "@/content/assets";

export default function AlbumPromo() {
  return (
    <section className="bg-transparent">
      <div className="mx-auto w-full max-w-5xl px-6 py-14 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="panel-scrim overflow-hidden md:flex md:items-stretch">
            {/* Tunnel / cover image */}
            <div className="relative w-full md:w-[45%] aspect-[4/3] md:aspect-auto flex-shrink-0">
              <Image
                src={assets.tunnel}
                alt="From Darkness To Light"
                fill
                sizes="(max-width: 768px) 100vw, 45vw"
                className="object-cover album-promo-img"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/40 hidden md:block" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 md:hidden" />
            </div>

            {/* Copy */}
            <div className="p-6 md:p-10 flex flex-col justify-center">
              <p className="text-xs uppercase tracking-[0.28em] text-white/60 mb-2">
                New Album
              </p>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-white/95 tracking-tight">
                From Darkness To Light
              </h2>
              <p className="glyph-line subtitle-glyph mt-2 text-sm md:text-base text-white/65">
                Ⅎɹoɯ ᗡɐɹʞuǝss †o 𝕃Ɨ𝕘𝓱𝐓
              </p>
              <p className="mt-4 text-sm md:text-base leading-relaxed text-white/70 max-w-md">
                A testimony of truth and freedom — from darkness to light.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/store"
                  className="inline-block px-6 py-3 bg-[var(--colour-amber)] text-[var(--colour-bg)] text-sm font-semibold uppercase tracking-widest hover:opacity-90 transition-opacity rounded-lg"
                >
                  Buy Album
                </Link>
                <Link
                  href="/album/from-darkness-to-light"
                  className="inline-block px-6 py-3 border border-white/20 text-white/80 text-sm font-semibold uppercase tracking-widest hover:border-white/40 transition-colors rounded-lg"
                >
                  Listen
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
