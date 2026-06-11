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
          {/* The headline IS the motif — same canonical phrase the
              homepage corners use ("Ⅎɹoɯ ᗡɐɹʞuǝss†o 𝕃Ɨ𝕘𝓱𝐓"), split
              into two stacked lines:
                line 1 — "Ⅎɹoɯ ᗡɐɹʞuǝss" (From Darkness, upside-down)
                line 2 — "†o 𝕃Ɨ𝕘𝓱𝐓"   (To Light, cross-T, right-side-up)
              Screen readers get the clean "From darkness to light"
              string via aria-label on the H1. */}
          <h1
            aria-label="From darkness to light"
            className="font-display mt-4 text-4xl md:text-6xl font-normal tracking-tight leading-[1.15]"
          >
            {/* inline display:block beats the .subtitle-glyph rule's
                `display: inline-block` (same specificity, but inline-style
                always wins) so the two halves actually stack vertically
                instead of flowing inline on a wide viewport. */}
            <span
              aria-hidden="true"
              className="subtitle-glyph text-white"
              style={{ display: "block" }}
            >
              Ⅎɹoɯ ᗡɐɹʞuǝss
            </span>
            <span
              aria-hidden="true"
              className="subtitle-glyph italic text-[var(--colour-amber)] mt-2 md:mt-3"
              style={{ display: "block" }}
            >
              †o 𝕃Ɨ𝕘𝓱𝐓
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
          {/* Forward-looking note — this page is the home of Daniel's
              own testimony today, but the longer plan is for it to grow
              into a shared wall of testimonies. Setting that expectation
              up front so visitors know what to look for over time. */}
          <p className="mt-6 text-xs md:text-sm tracking-[0.18em] uppercase text-[var(--colour-amber-soft)] max-w-xl mx-auto">
            More testimonies coming
          </p>
          <p className="mt-2 text-sm md:text-base text-white/65 leading-relaxed max-w-xl mx-auto">
            This page will become a home for other people&apos;s testimonies
            too — stories of Jesus rescuing, healing, and setting free,
            added here over time.
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
