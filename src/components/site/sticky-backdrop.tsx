"use client";

import Image from "next/image";
import { motion, useMotionTemplate, useScroll, useTransform } from "framer-motion";
import { assets } from "@/content/assets";

export default function StickyBackdrop() {
  const { scrollYProgress } = useScroll();

  const brightness = useTransform(scrollYProgress, [0, 0.7, 1], [1.12, 1.20, 1.28]);
  const contrast = useTransform(scrollYProgress, [0, 1], [1.18, 1.10]);
  const saturate = useTransform(scrollYProgress, [0, 1], [1.18, 1.28]);

  const darkVeil = useTransform(scrollYProgress, [0, 0.55, 1], [0.22, 0.14, 0.06]);
  const lightWash = useTransform(scrollYProgress, [0, 0.6, 1], [0.10, 0.24, 0.48]);

  const filter = useMotionTemplate`brightness(${brightness}) contrast(${contrast}) saturate(${saturate})`;

  return (
    <div className="fixed inset-0 -z-50">
      {/* Stars image — single HD layer */}
      <motion.div className="absolute inset-0" style={{ filter }}>
        <Image
          src={assets.backdrop}
          alt="Backdrop"
          fill
          priority
          sizes="100vw"
          className="object-cover"
          quality={100}
          style={{
            objectPosition: "50% 58%",
            filter: "brightness(1.6) contrast(1.2)",
            imageRendering: "auto",
          }}
        />
      </motion.div>

      {/* Dark veil */}
      <motion.div className="absolute inset-0 bg-black" style={{ opacity: darkVeil }} />

      {/* DIVINE LIGHT — striking beam breaking through darkness */}
      {/* Central pillar of light from above */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.65,
          background:
            "conic-gradient(from 180deg at 50% 15%, transparent 40%, rgba(255,255,255,0.08) 46%, rgba(255,255,255,0.18) 49.5%, rgba(255,255,255,0.08) 53%, transparent 59%)",
          mixBlendMode: "screen",
        }}
      />

      {/* Radiant glow at the source — where the light originates */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.80,
          background:
            "radial-gradient(280px 180px at 50% 12%, rgba(255,255,255,0.30) 0%, rgba(220,230,255,0.12) 40%, transparent 70%)",
          mixBlendMode: "screen",
        }}
      />

      {/* Scattered light rays — secondary beams */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.35,
          background:
            "conic-gradient(from 180deg at 50% 15%, transparent 35%, rgba(255,255,255,0.04) 42%, transparent 45%, rgba(255,255,255,0.06) 48%, transparent 52%, rgba(255,255,255,0.04) 56%, transparent 63%)",
          mixBlendMode: "screen",
        }}
      />

      {/* Light wash — grows as you scroll (darkness → light) */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: lightWash,
          background:
            "radial-gradient(1200px 800px at 50% 30%, rgba(255,255,255,0.16) 0%, transparent 65%)",
          mixBlendMode: "screen",
        }}
      />

      {/* Lightning flash */}
      <div className="absolute inset-0 lightning-flash" />

      {/* Starfield CSS overlays */}
      <div className="absolute inset-0 stars-glow" />
      <div className="absolute inset-0 stars-layer-1" />
      <div className="absolute inset-0 stars-layer-2" />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(1200px 860px at 50% 45%, rgba(0,0,0,0) 0%, rgba(7,6,16,0.52) 70%, rgba(7,6,16,0.78) 100%)",
        }}
      />

      {/* Grain + bottom fade */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] grain-overlay" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent to-[var(--colour-bg)]" />
    </div>
  );
}
