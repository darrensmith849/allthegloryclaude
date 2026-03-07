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

      {/* Light wash — brightens on scroll */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: lightWash,
          background:
            "radial-gradient(980px 620px at 52% 22%, rgba(255,255,255,0.12) 0%, transparent 70%)," +
            "radial-gradient(980px 620px at 52% 78%, rgba(255,255,255,0.08) 0%, transparent 74%)",
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
