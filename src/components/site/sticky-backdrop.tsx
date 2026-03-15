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

  // Ambient glow — smoothly brightens the whole scene as you scroll
  const glowOpacity = useTransform(scrollYProgress, [0, 0.4, 1], [0, 0.12, 0.28]);

  const filter = useMotionTemplate`brightness(${brightness}) contrast(${contrast}) saturate(${saturate})`;

  return (
    <div className="fixed inset-0 -z-50">
      {/* Cloud layer — subtle base underneath */}
      <div className="absolute inset-0">
        <Image
          src="/media/clouds.webp"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
          quality={90}
          style={{
            filter: "brightness(0.9) contrast(1.1) blur(2px)",
            transform: "scale(1.05)",
          }}
        />
      </div>

      {/* Stars image — overlays the clouds with screen blend */}
      <motion.div
        className="absolute inset-0"
        style={{ filter, mixBlendMode: "screen" }}
      >
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

      {/* Lightning video — subtle, slowed down, screen blended */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ mixBlendMode: "screen", opacity: 0.45 }}
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "brightness(1.3) contrast(1.1)" }}
        >
          <source src="/media/lightning.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Dark veil — fades to nothing as you scroll */}
      <motion.div className="absolute inset-0 bg-black" style={{ opacity: darkVeil }} />

      {/* Ambient glow — smooth scene brightening on scroll */}
      <motion.div
        className="absolute inset-0 pointer-events-none bg-white"
        style={{
          opacity: glowOpacity,
          mixBlendMode: "soft-light",
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

      {/* Bottom fade */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent to-[var(--colour-bg)]" />
    </div>
  );
}
