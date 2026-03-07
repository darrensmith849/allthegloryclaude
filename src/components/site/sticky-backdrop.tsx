"use client";

import Image from "next/image";
import { motion, useMotionTemplate, useScroll, useTransform } from "framer-motion";
import { assets } from "@/content/assets";

export default function StickyBackdrop() {
  const { scrollYProgress } = useScroll();

  // Darkness -> Light grade
  const darkVeil = useTransform(scrollYProgress, [0, 0.55, 1], [0.68, 0.45, 0.12]);
  const lightWash = useTransform(scrollYProgress, [0, 0.55, 1], [0.06, 0.28, 0.68]);
  const warmth = useTransform(scrollYProgress, [0, 0.70, 1], [0.16, 0.22, 0.30]);

  // Gentle "grade" (no movement/parallax)
  const brightness = useTransform(scrollYProgress, [0, 0.70, 1], [0.96, 1.04, 1.14]);
  const contrast = useTransform(scrollYProgress, [0, 1], [1.10, 1.04]);
  const saturate = useTransform(scrollYProgress, [0, 1], [1.06, 1.16]);

  const filter = useMotionTemplate`brightness(${brightness}) contrast(${contrast}) saturate(${saturate})`;

  return (
    <div className="fixed inset-0 -z-50">
      {/* Base image */}
      <motion.div className="absolute inset-0" style={{ filter }}>
        <Image
          src={assets.cover}
          alt="Background"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </motion.div>

      {/* Darkness veil (strong at top, fades down) */}
      <motion.div className="absolute inset-0 bg-black" style={{ opacity: darkVeil }} />

      {/* Warmth (keeps the "light" emotionally correct) */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: warmth,
          background:
            "radial-gradient(760px 460px at 72% 38%, rgba(216,178,90,0.22) 0%, transparent 62%)",
          mixBlendMode: "screen",
        }}
      />

      {/* Light wash (increases as you scroll) */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: lightWash,
          background:
            "radial-gradient(900px 520px at 55% 22%, rgba(255,255,255,0.16) 0%, transparent 68%)," +
            "radial-gradient(900px 520px at 52% 78%, rgba(241,215,166,0.14) 0%, transparent 70%)",
          mixBlendMode: "screen",
        }}
      />

      {/* Subtle grain */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] grain-overlay" />

      {/* Bottom blend into "site ink" */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent to-[var(--colour-bg)]" />
    </div>
  );
}
