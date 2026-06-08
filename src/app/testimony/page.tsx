"use client";

import { motion, useReducedMotion } from "framer-motion";

const VIDEO_ID = "Lkyv24RO1KQ";

export default function TestimonyPage() {
  const reduce = useReducedMotion();

  const headerTransition = reduce
    ? { duration: 0.01 }
    : { duration: 1.2, delay: 0.1, ease: [0.16, 1, 0.3, 1] as const };
  const mediaTransition = reduce
    ? { duration: 0.01 }
    : { duration: 1.4, delay: 0.35, ease: [0.16, 1, 0.3, 1] as const };

  return (
    <main className="bg-transparent overflow-x-clip">
      <section className="mx-auto w-full max-w-4xl px-6 pt-32 md:pt-40 pb-24 md:pb-32">
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={headerTransition}
          className="text-center"
        >
          <div className="eyebrow">Testimony</div>
          {/* The headline IS the motif. Two stacked lines:
                line 1 — "From Darkness" rendered with the inverted-glyph
                          treatment so the words read upside-down;
                line 2 — "into the light" right-side-up, but styled with
                          the same mathematical / dagger-as-cross glyphs
                          used in the home-page top-corner ("†o 𝕃Ɨ𝕘𝓱𝐓")
                          so the two lines feel like a deliberate pair —
                          inversion on top, cross-T resurrection beneath.
              Screen readers get the clean "From darkness into the light"
              string via aria-label on the H1. */}
          <h1
            aria-label="From darkness into the light"
            className="font-display mt-4 text-4xl md:text-6xl font-normal tracking-tight leading-[1.15]"
          >
            <span
              aria-hidden="true"
              className="subtitle-glyph block text-white"
            >
              Ⅎɹoɯ ᗡɐɹʞuǝss
            </span>
            <span
              aria-hidden="true"
              className="subtitle-glyph block italic text-[var(--colour-amber)] mt-2 md:mt-3"
            >
              in†o †he 𝕃Ɨ𝕘𝓱𝐓
            </span>
          </h1>

          <p className="font-display mt-7 text-base md:text-lg italic text-white/80 leading-relaxed max-w-xl mx-auto">
            Jesus rescued me from addiction and a 20-year battle with
            suicidal thoughts, and gave me a new life.
          </p>
          <p className="mt-4 text-sm md:text-base text-white/65 leading-relaxed max-w-xl mx-auto">
            Take a few minutes to watch the full story below - Jesus is
            still setting people free.
          </p>
          <p className="mt-4 text-sm md:text-base text-white/65 leading-relaxed max-w-xl mx-auto">
            If you know someone this testimony could help, please share it
            with them.
          </p>
        </motion.div>

        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={mediaTransition}
          className="relative mt-12 md:mt-16"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-6 md:-inset-10 -z-10 rounded-[32px] opacity-60"
            style={{
              background:
                "radial-gradient(50% 60% at 50% 40%, rgba(216,178,90,0.18), transparent 70%)",
            }}
          />
          <div className="relative overflow-hidden rounded-2xl border border-white/10 panel-scrim aspect-video">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${VIDEO_ID}?rel=0&modestbranding=1&playsinline=1`}
              title="All The Glory - testimony"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
              className="absolute inset-0 h-full w-full border-0"
            />
          </div>
        </motion.div>
      </section>
    </main>
  );
}
