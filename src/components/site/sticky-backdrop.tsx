"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { assets } from "@/content/assets";
import { useState, useEffect } from "react";

export default function StickyBackdrop() {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");
  // Lightning video runs as part of the painted backdrop ONLY on the
  // home page, so it reads as part of the hero scene as the visitor
  // lands. Other pages keep the calmer clouds + stars only. The footer
  // still has its own separate lightning instance (in site-footer.tsx)
  // — this doesn't touch or replace that.
  const isHome = pathname === "/";
  const [starsReady, setStarsReady] = useState(false);
  const [cloudsReady, setCloudsReady] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  // Decorative lightning video renders on desktop only. On touch / compact
  // screens iOS paints a native play button over a <video> that can't
  // autoplay (e.g. Low Power Mode), which showed as a stray play control
  // stuck in the hero. Starts false so the video is never in the initial or
  // mobile DOM (no flash before hydration); enabled only once we confirm a
  // non-touch, roomy viewport.
  const [allowVideo, setAllowVideo] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const compact = window.matchMedia("(pointer: coarse), (max-width: 820px)").matches;
    setPrefersReducedMotion(reduce);
    setAllowVideo(!reduce && !compact);
  }, []);

  // NOTE: this backdrop is intentionally static. It used to drive the
  // stars filter + dark-veil + glow opacities off scroll position via
  // framer-motion useScroll/useTransform, which repainted this full
  // viewport, screen/soft-light–blended layer on every scroll frame and
  // made scrolling feel sluggish. Rendering it once keeps the scene
  // identical at rest while leaving scroll completely native and snappy.

  if (isDashboard) return <div className="fixed inset-0 -z-50 bg-[var(--colour-bg)]" />;

  return (
    <div className="fixed inset-0 -z-50 bg-[var(--colour-bg)]">
      {/* Cloud layer - subtle base underneath */}
      <div
        className="absolute inset-0"
        style={{
          opacity: prefersReducedMotion || cloudsReady ? 1 : 0,
          transform: prefersReducedMotion || cloudsReady ? "scale(1.05)" : "scale(1.08)",
          transition: prefersReducedMotion
            ? "none"
            : "opacity 2.4s cubic-bezier(0.16, 1, 0.3, 1), transform 3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <Image
          src="/media/clouds.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
          quality={90}
          onLoad={() => setCloudsReady(true)}
          style={{
            filter: "brightness(0.9) contrast(1.1) blur(2px)",
          }}
        />
      </div>

      {/* Stars image - overlays the clouds with screen blend. Static
          filter (no longer scroll-linked). */}
      <div
        className="absolute inset-0"
        style={{
          filter: "brightness(1.18) contrast(1.16) saturate(1.2)",
          mixBlendMode: "screen",
          opacity: prefersReducedMotion || starsReady ? 1 : 0,
          transition: prefersReducedMotion
            ? "none"
            : "opacity 1.6s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <Image
          src={assets.backdrop}
          alt="Backdrop"
          fill
          priority
          sizes="100vw"
          className="object-cover"
          quality={100}
          onLoad={() => setStarsReady(true)}
          style={{
            objectPosition: "50% 58%",
            filter: "brightness(1.6) contrast(1.2)",
            imageRendering: "auto",
          }}
        />
      </div>

      {/* Lightning video — home page only. Sits above stars / below
          the dark veil + glow so the veil still tints it down. Same
          screen-blend treatment as the footer's lightning so the two
          read as one storm. Muted + autoplay + playsInline so it kicks
          in on first paint without sound. */}
      {isHome && allowVideo && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ mixBlendMode: "screen", opacity: 0.2 }}
          aria-hidden="true"
        >
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: "brightness(1.3) contrast(1.1)" }}
          >
            <source src="/media/lightning.mp4" type="video/mp4" />
          </video>
        </div>
      )}

      {/* Dark veil - static depth at the top of the scene */}
      <div className="absolute inset-0 bg-black" style={{ opacity: 0.24 }} />

      {/* Ambient glow - static soft brightening */}
      <div
        className="absolute inset-0 pointer-events-none bg-white"
        style={{ opacity: 0.08, mixBlendMode: "soft-light" }}
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
