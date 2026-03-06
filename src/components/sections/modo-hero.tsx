"use client";

import { motion } from "framer-motion";
import { album } from "@/content/album";
import { assets } from "@/content/assets";
import { useState } from "react";

export default function ModoHero() {
  const [imgError, setImgError] = useState(false);

  return (
    <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background image with fallback */}
      {!imgError ? (
        <img
          src={assets.artistPortrait}
          alt=""
          onError={() => setImgError(true)}
          className="absolute inset-0 w-full h-full object-cover"
          aria-hidden="true"
        />
      ) : (
        <div className="absolute inset-0 fallback-gradient" aria-hidden="true" />
      )}

      {/* Legibility veil */}
      <div className="hero-legibility-veil" aria-hidden="true" />

      {/* Bottom gradient blend */}
      <div className="hero-bottom-blend" aria-hidden="true" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-32 md:py-40">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="modo-wrap"
        >
          <h1 className="modo-title" style={{ color: "var(--colour-ink)" }}>
            All The Glory
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 md:mt-12"
        >
          <p
            className="text-xl md:text-2xl lg:text-3xl font-light tracking-wide"
            style={{ color: "var(--colour-ink)", opacity: 0.8 }}
          >
            {album.title}
          </p>
          <p
            className="subtitle-glyph mt-3"
            style={{ color: "var(--colour-accent-1)", opacity: 0.9 }}
          >
            {album.subtitle}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-10 flex gap-4 flex-wrap"
        >
          {album.ctas.map((cta) => (
            <a
              key={cta.label}
              href={cta.href}
              className="inline-block px-8 py-3 text-sm font-semibold uppercase tracking-widest transition-colors duration-300"
              style={{
                background: "var(--colour-accent-1)",
                color: "var(--colour-bg)",
              }}
            >
              {cta.label}
            </a>
          ))}
          <a
            href="/about"
            className="inline-block px-8 py-3 text-sm font-semibold uppercase tracking-widest transition-colors duration-300 border"
            style={{
              borderColor: "rgba(244,240,232,0.25)",
              color: "var(--colour-ink)",
            }}
          >
            The Story
          </a>
        </motion.div>
      </div>
    </section>
  );
}
