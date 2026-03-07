"use client";

import Image from "next/image";
import { motion, useMotionTemplate, useScroll, useTransform } from "framer-motion";
import { assets } from "@/content/assets";

export default function StickyBackdrop() {
  const { scrollYProgress } = useScroll();

  // Cinematic grade (keep)
  const brightness = useTransform(scrollYProgress, [0, 0.7, 1], [0.98, 1.04, 1.08]);
  const contrast = useTransform(scrollYProgress, [0, 1], [1.22, 1.12]);
  const saturate = useTransform(scrollYProgress, [0, 1], [1.06, 1.12]);

  const darkVeil = useTransform(scrollYProgress, [0, 0.55, 1], [0.52, 0.36, 0.18]);
  const lightWash = useTransform(scrollYProgress, [0, 0.6, 1], [0.08, 0.18, 0.38]);

  const filter = useMotionTemplate`brightness(${brightness}) contrast(${contrast}) saturate(${saturate})`;

  return (
    <div className="fixed inset-0 -z-50">
      {/* LAYER 1 — fill screen (blurred) */}
      <motion.div className="absolute inset-0" style={{ filter }}>
        <Image
          src={assets.backdrop}
          alt="Backdrop"
          fill
          priority
          sizes="100vw"
          className="object-cover"
          style={{
            objectPosition: "50% 65%",
            filter: "blur(14px) brightness(0.92)",
            transform: "scale(1.08)",
          }}
        />
      </motion.div>

      {/* LAYER 2 — show FULL subject (crisp contain) */}
      <motion.div className="absolute inset-0" style={{ filter }}>
        <Image
          src={assets.backdrop}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-contain"
          style={{
            objectPosition: "50% 85%",
            filter: "blur(0.16px)",
            transform: "translateZ(0)",
          }}
        />
      </motion.div>

      {/* Cinematic darkness veil */}
      <motion.div className="absolute inset-0 bg-black" style={{ opacity: darkVeil }} />

      {/* Gold warmth — subtle */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.45,
          background: "radial-gradient(820px 520px at 70% 38%, rgba(216,178,90,0.14) 0%, transparent 64%)",
          mixBlendMode: "screen",
        }}
      />

      {/* Light wash — subtle */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: lightWash,
          background:
            "radial-gradient(980px 620px at 52% 22%, rgba(255,255,255,0.12) 0%, transparent 72%)," +
            "radial-gradient(980px 620px at 52% 78%, rgba(241,215,166,0.10) 0%, transparent 76%)",
          mixBlendMode: "screen",
        }}
      />

      {/* Tunnel-light ghost overlay (VERY subtle, masked) */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            maskImage:
              "radial-gradient(42% 48% at 62% 38%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.9) 25%, rgba(0,0,0,0) 70%)",
            WebkitMaskImage:
              "radial-gradient(42% 48% at 62% 38%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.9) 25%, rgba(0,0,0,0) 70%)",
            opacity: 0.12,
            mixBlendMode: "screen",
          }}
        >
          <Image
            src={assets.tunnel}
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
            style={{ filter: "brightness(1.25) contrast(1.05)" }}
          />
        </div>
      </div>

      {/* Starfield overlays */}
      <div className="stars-layer-1" />
      <div className="stars-layer-2" />
      <div className="stars-glow" />

      {/* Vignette for text legibility */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(1200px 860px at 50% 45%, rgba(0,0,0,0) 0%, rgba(7,6,16,0.54) 70%, rgba(7,6,16,0.82) 100%)",
        }}
      />

      {/* Grain */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] grain-overlay" />

      {/* Bottom blend */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent to-[var(--colour-bg)]" />
    </div>
  );
}
