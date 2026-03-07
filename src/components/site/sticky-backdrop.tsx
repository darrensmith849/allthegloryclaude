"use client";

import Image from "next/image";
import { motion, useMotionTemplate, useScroll, useTransform } from "framer-motion";

export default function StickyBackdrop() {
  const { scrollYProgress } = useScroll();

  const darkVeil = useTransform(scrollYProgress, [0, 0.55, 1], [0.42, 0.28, 0.12]);
  const lightWash = useTransform(scrollYProgress, [0, 0.6, 1], [0.14, 0.34, 0.70]);

  const brightness = useTransform(scrollYProgress, [0, 0.7, 1], [1.12, 1.20, 1.28]);
  const contrast = useTransform(scrollYProgress, [0, 1], [1.14, 1.08]);
  const saturate = useTransform(scrollYProgress, [0, 1], [1.18, 1.28]);

  // No blur — keep it sharp / HD
  const filter = useMotionTemplate`brightness(${brightness}) contrast(${contrast}) saturate(${saturate})`;

  return (
    <div className="fixed inset-0 -z-50">
      <motion.div className="absolute inset-0" style={{ filter }}>
        <Image
          src="/media/IMG_0442.jpg"
          alt="Backdrop"
          fill
          priority
          sizes="100vw"
          className="object-cover"
          quality={100}
          style={{ objectPosition: "50% 50%", imageRendering: "auto" }}
        />
      </motion.div>

      <div className="absolute inset-0 bg-grid bg-grid-fade opacity-[0.12]" />
      <motion.div className="absolute inset-0 bg-black" style={{ opacity: darkVeil }} />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.85,
          background: "radial-gradient(820px 520px at 70% 38%, rgba(216,178,90,0.18) 0%, transparent 64%)",
          mixBlendMode: "screen",
        }}
      />

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

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(1200px 860px at 50% 45%, rgba(0,0,0,0) 0%, rgba(7,6,16,0.52) 70%, rgba(7,6,16,0.78) 100%)",
        }}
      />

      <div className="pointer-events-none absolute inset-0 opacity-[0.06] grain-overlay" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent to-[var(--colour-bg)]" />
    </div>
  );
}
