"use client";

import Image from "next/image";
import { motion, useMotionTemplate, useScroll, useTransform } from "framer-motion";
import { assets } from "@/content/assets";

export default function StickyBackdrop() {
  const { scrollYProgress } = useScroll();

  const brightness = useTransform(scrollYProgress, [0, 0.7, 1], [1.08, 1.16, 1.24]);
  const contrast = useTransform(scrollYProgress, [0, 1], [1.14, 1.08]);
  const saturate = useTransform(scrollYProgress, [0, 1], [1.10, 1.20]);

  const darkVeil = useTransform(scrollYProgress, [0, 0.55, 1], [0.28, 0.18, 0.08]);
  const lightWash = useTransform(scrollYProgress, [0, 0.6, 1], [0.10, 0.24, 0.48]);

  const filter = useMotionTemplate`brightness(${brightness}) contrast(${contrast}) saturate(${saturate})`;

  return (
    <div className="fixed inset-0 -z-50">
      {/* Stars image — single crisp layer */}
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
          }}
        />
      </motion.div>

      {/* Cover — tunnel light screen-blended over stars */}
      <div
        className="absolute inset-0"
        style={{ mixBlendMode: "screen", opacity: 0.55 }}
      >
        <Image
          src={assets.cover}
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
          quality={90}
          style={{
            objectPosition: "50% 38%",
            filter: "brightness(1.4) contrast(1.1)",
          }}
        />
      </div>

      {/* Dark veil */}
      <motion.div className="absolute inset-0 bg-black" style={{ opacity: darkVeil }} />

      {/* Cool indigo / tunnel-grade haze (replaces heavy gold) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.62,
          background:
            "radial-gradient(980px 620px at 30% 28%, rgba(11,27,52,0.50) 0%, transparent 62%)," +
            "radial-gradient(980px 620px at 72% 40%, rgba(30,27,75,0.34) 0%, transparent 66%)," +
            "radial-gradient(1200px 780px at 50% 60%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.22) 70%, rgba(0,0,0,0.40) 100%)",
          mixBlendMode: "screen",
        }}
      />

      {/* Very subtle warm "light" accent (keeps the theme without gold wash) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.18,
          background:
            "radial-gradient(740px 460px at 62% 42%, rgba(241,215,166,0.22) 0%, transparent 62%)",
          mixBlendMode: "screen",
        }}
      />

      {/* Light wash — brightens on scroll */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: lightWash,
          background:
            "radial-gradient(980px 620px at 52% 22%, rgba(255,255,255,0.12) 0%, transparent 70%)," +
            "radial-gradient(980px 620px at 52% 78%, rgba(180,195,220,0.10) 0%, transparent 74%)",
          mixBlendMode: "screen",
        }}
      />

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
