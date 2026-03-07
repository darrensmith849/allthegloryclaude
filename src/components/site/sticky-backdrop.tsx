"use client";

import Image from "next/image";
import { motion, useMotionTemplate, useScroll, useTransform } from "framer-motion";
import { assets } from "@/content/assets";

export default function StickyBackdrop() {
  const { scrollYProgress } = useScroll();

  // Lighter overall (more pop)
  const darkVeil = useTransform(scrollYProgress, [0, 0.55, 1], [0.42, 0.28, 0.12]);
  const lightWash = useTransform(scrollYProgress, [0, 0.6, 1], [0.14, 0.34, 0.70]);

  const brightness = useTransform(scrollYProgress, [0, 0.7, 1], [1.06, 1.14, 1.22]);
  const contrast = useTransform(scrollYProgress, [0, 1], [1.10, 1.06]);
  const saturate = useTransform(scrollYProgress, [0, 1], [1.12, 1.22]);
  const filter = useMotionTemplate`brightness(${brightness}) contrast(${contrast}) saturate(${saturate})`;

  return (
    <div className="fixed inset-0 -z-50">
      {/* Base image */}
      <motion.div className="absolute inset-0" style={{ filter }}>
        <Image
          src={assets.backdrop}
          alt="Backdrop"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </motion.div>

      {/* 2KO-ish subtle grid + fade */}
      <div className="absolute inset-0 bg-grid bg-grid-fade opacity-[0.14]" />

      {/* Darkness veil fades down page */}
      <motion.div className="absolute inset-0 bg-black" style={{ opacity: darkVeil }} />

      {/* Warm highlight (keeps "light" warm) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.80,
          background:
            "radial-gradient(820px 520px at 70% 38%, rgba(216,178,90,0.18) 0%, transparent 64%)",
          mixBlendMode: "screen",
        }}
      />

      {/* Light wash increases down page */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: lightWash,
          background:
            "radial-gradient(980px 620px at 52% 22%, rgba(255,255,255,0.16) 0%, transparent 70%)," +
            "radial-gradient(980px 620px at 52% 78%, rgba(241,215,166,0.14) 0%, transparent 74%)",
          mixBlendMode: "screen",
        }}
      />

      {/* Grain */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.07] grain-overlay" />

      {/* Bottom blend */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent to-[var(--colour-bg)]" />
    </div>
  );
}
