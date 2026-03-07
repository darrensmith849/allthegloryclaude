"use client";

import Image from "next/image";
import { motion, useMotionTemplate, useScroll, useTransform } from "framer-motion";

export default function StickyBackdrop() {
  const { scrollYProgress } = useScroll();

  const darkVeil = useTransform(scrollYProgress, [0, 0.55, 1], [0.22, 0.14, 0.06]);
  const lightWash = useTransform(scrollYProgress, [0, 0.6, 1], [0.14, 0.34, 0.70]);

  const brightness = useTransform(scrollYProgress, [0, 0.7, 1], [1.08, 1.16, 1.24]);
  const contrast = useTransform(scrollYProgress, [0, 1], [1.12, 1.06]);
  const saturate = useTransform(scrollYProgress, [0, 1], [1.14, 1.24]);

  const filter = useMotionTemplate`brightness(${brightness}) contrast(${contrast}) saturate(${saturate})`;

  return (
    <div className="fixed inset-0 -z-50">
      {/* Layer 1: Base — night sky + stars (IMG_2746) */}
      <motion.div className="absolute inset-0" style={{ filter }}>
        <Image
          src="/media/IMG_2746.jpg"
          alt="Backdrop"
          fill
          priority
          sizes="100vw"
          className="object-cover"
          quality={100}
          style={{ objectPosition: "50% 58%", filter: "brightness(1.6) contrast(1.2)" }}
        />
      </motion.div>

      {/* Layer 2: Ocean (IMG_2678) — subtle soft-light blend */}
      <div
        className="absolute inset-0"
        style={{ mixBlendMode: "soft-light", opacity: 0.35 }}
      >
        <Image
          src="/media/IMG_2678.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
          quality={90}
          style={{ objectPosition: "50% 35%" }}
        />
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-grid bg-grid-fade opacity-[0.12]" />

      {/* Dark veil — eases off on scroll */}
      <motion.div className="absolute inset-0 bg-black" style={{ opacity: darkVeil }} />

      {/* Wide subtle golden wash across the whole sky */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.70,
          background:
            "linear-gradient(180deg, rgba(216,178,90,0.14) 0%, rgba(232,184,75,0.10) 40%, rgba(241,215,166,0.06) 70%, transparent 100%)",
          mixBlendMode: "screen",
        }}
      />

      {/* Light wash — brightens on scroll */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: lightWash,
          background:
            "radial-gradient(980px 620px at 52% 22%, rgba(241,215,166,0.18) 0%, transparent 70%)," +
            "radial-gradient(980px 620px at 52% 78%, rgba(216,178,90,0.16) 0%, transparent 74%)",
          mixBlendMode: "screen",
        }}
      />

      {/* Vignette / scrim */}
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
