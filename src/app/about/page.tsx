"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import Testimony from "@/components/sections/testimony";

export default function AboutPage() {
  const reduce = useReducedMotion();

  const heroImageTransition = reduce
    ? { duration: 0.01 }
    : { duration: 1.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] as const };
  const heroTextTransition = reduce
    ? { duration: 0.01 }
    : { duration: 1.4, delay: 0.45, ease: [0.16, 1, 0.3, 1] as const };
  const missionTransition = reduce
    ? { duration: 0.01 }
    : { duration: 1.2, ease: [0.16, 1, 0.3, 1] as const };

  return (
    <main className="bg-transparent overflow-x-clip">
      {/* ── HERO: page-specific, person-led ─────────────────────── */}
      <section className="w-full pt-32 md:pt-40 pb-12 md:pb-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <div className="eyebrow">
              About
            </div>
            <h1 className="font-display mt-4 text-5xl md:text-7xl font-normal text-white tracking-tight">
              Daniel
            </h1>
            <p className="mt-4 text-sm md:text-base text-white/65 max-w-md mx-auto">
              Singer, songwriter, worshipper. Harare, Zimbabwe.
            </p>
          </div>

          {/* Lead image - the dad photo, treated as the rightful
              opening visual. Natural 3:2 fit for the source frame. */}
          <motion.figure
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={heroImageTransition}
            className="relative mx-auto mt-10 md:mt-14 max-w-3xl"
          >
            <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-black/20 panel-scrim aspect-[3/2]">
              <Image
                src="/media/dad.jpg"
                alt="Daniel as a child with his dad"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 820px"
                className="object-cover"
                style={{ objectPosition: "50% 40%" }}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/45" />
            </div>
          </motion.figure>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={heroTextTransition}
            className="mt-8 md:mt-10 text-center text-base md:text-lg text-white/70 max-w-2xl mx-auto leading-relaxed"
          >
            The story behind the music - a testimony of grace, surrender, and the
            relentless pursuit of light in the darkest places.
          </motion.p>
        </div>
      </section>

      {/* ── THE STORY - heading lives inside the Testimony glass panel
           so the eyebrow, title, and body are one aligned block. The
           "darkness" half of the title is rendered in the inverted-glyph
           treatment inline so the motif is folded into the heading
           rather than tacked on as a separate tagline. The aria-label on
           the rendered h2 (added in Testimony.tsx via headingId+title)
           is set elsewhere; here we just emit a fully accessible
           aria-label that matches the readable phrase. ──── */}
      <Testimony
        eyebrow="The Story"
        title={
          <>
            <span aria-hidden="true">Out of </span>
            <span aria-hidden="true" className="subtitle-glyph">
              ᗡɐɹʞuǝss
            </span>
            <span aria-hidden="true"> into the light</span>
            <span className="sr-only">Out of darkness into the light</span>
          </>
        }
        headingId="story-heading"
      />

      {/* ── THE MISSION ─────────────────────────────────────────── */}
      <section
        aria-labelledby="mission-heading"
        className="w-full pb-24 md:pb-32"
      >
        <div className="mx-auto max-w-3xl px-0 md:px-6">
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={missionTransition}
            className="panel-scrim panel-flush-mobile p-7 md:p-10"
          >
            <div className="eyebrow eyebrow-amber">
              The Mission
            </div>
            <h2
              id="mission-heading"
              className="font-display mt-3 text-3xl md:text-4xl font-normal text-white tracking-tight"
            >
              All for the Glory of God
            </h2>
            <div className="mt-6 space-y-5 text-base md:text-lg text-white/75 leading-relaxed">
              <p>
                All The Glory exists to create music that speaks into the silence,
                that reaches into the dark corners where hope feels like a foreign
                language, and translates it into something the heart can understand.
              </p>
              <p>
                Every song is a marker on the journey - a reminder that the God who
                began a good work is faithful to complete it. The music is raw,
                honest, and unapologetically hopeful.
              </p>
              <p>
                Whether on stage or in the studio, the aim is the same: to point
                people to Jesus, and to give God all the glory.
              </p>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href="/album/from-darkness-to-light"
                className="btn btn-primary"
              >
                Listen to the album →
              </Link>
              <Link href="/contact" className="btn btn-ghost">
                Get in touch
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
