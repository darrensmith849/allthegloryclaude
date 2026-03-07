"use client";

import Image from "next/image";
import { motion, useMotionTemplate, useScroll, useTransform } from "framer-motion";
import { assets } from "@/content/assets";

export default function StickyBackdrop() {
  const { scrollYProgress } = useScroll();

  const brightness = useTransform(scrollYProgress, [0, 0.5, 1], [1.12, 1.30, 1.55]);
  const contrast = useTransform(scrollYProgress, [0, 1], [1.18, 1.04]);
  const saturate = useTransform(scrollYProgress, [0, 1], [1.18, 1.28]);

  const darkVeil = useTransform(scrollYProgress, [0, 0.5, 1], [0.30, 0.12, 0.0]);

  // Light band — moves down + gets brighter as you scroll
  const lightY = useTransform(scrollYProgress, [0, 1], [5, 65]);
  const lightOpacity = useTransform(scrollYProgress, [0, 0.3, 1], [0.30, 0.55, 0.90]);
  const lightSize = useTransform(scrollYProgress, [0, 1], [300, 600]);
  const lightBg = useMotionTemplate`radial-gradient(120% ${lightSize}px at 50% ${lightY}%, rgba(255,255,255,0.28) 0%, rgba(220,230,255,0.10) 40%, transparent 70%)`;

  const filter = useMotionTemplate`brightness(${brightness}) contrast(${contrast}) saturate(${saturate})`;

  return (
    <div className="fixed inset-0 -z-50">
      {/* Stars image — base layer */}
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

      {/* Cloud layer — on top with screen blend so it merges with the stars */}
      <div
        className="absolute inset-0"
        style={{ mixBlendMode: "screen", opacity: 0.5 }}
      >
        <Image
          src="/media/clouds.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
          quality={90}
          style={{
            filter: "brightness(0.8) contrast(1.2)",
          }}
        />
      </div>

      {/* Dark veil — fades to nothing as you scroll */}
      <motion.div className="absolute inset-0 bg-black" style={{ opacity: darkVeil }} />

      {/* LIGHT BAND — wide glow across the top, moves down + intensifies on scroll */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: lightOpacity,
          background: lightBg,
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
