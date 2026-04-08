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
  const memoryTransition = reduce
    ? { duration: 0.01 }
    : { duration: 1.2, ease: [0.16, 1, 0.3, 1] as const };
  const missionTransition = reduce
    ? { duration: 0.01 }
    : { duration: 1.2, ease: [0.16, 1, 0.3, 1] as const };

  return (
    <main className="bg-transparent overflow-x-clip">
      {/* ── HERO: page-specific, person-led ─────────────────────── */}
      <section className="w-full pt-32 md:pt-40 pb-12 md:pb-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <div className="text-xs uppercase tracking-[0.28em] text-white/60">
              About
            </div>
            <h1 className="subtitle-glyph mt-3 text-3xl md:text-5xl font-semibold text-white">
              Daniel
            </h1>
            <p className="mt-3 text-sm md:text-base text-white/65 max-w-md mx-auto">
              Singer, songwriter, worshipper. Harare, Zimbabwe.
            </p>
          </div>

          {/* Premium lead image — Daniel as the artist */}
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={heroImageTransition}
            className="relative mx-auto mt-10 md:mt-14 max-w-4xl"
          >
            <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-black/20 panel-scrim aspect-[16/9]">
              <Image
                src="/media/guitar.jpg"
                alt="Daniel with his guitar"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 960px"
                className="object-cover"
                style={{ objectPosition: "50% 35%" }}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/55" />
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={heroTextTransition}
            className="mt-8 md:mt-10 text-center text-base md:text-lg text-white/70 max-w-2xl mx-auto leading-relaxed"
          >
            The story behind the music — a testimony of grace, surrender, and the
            relentless pursuit of light in the darkest places.
          </motion.p>
        </div>
      </section>

      {/* ── THE STORY (testimony body, no album-style heading) ──── */}
      <section
        aria-labelledby="story-heading"
        className="w-full pb-4 md:pb-8"
      >
        <div className="mx-auto max-w-3xl px-6">
          <div className="text-center mb-8 md:mb-10">
            <div className="text-xs uppercase tracking-[0.28em] text-[var(--colour-amber)]/80">
              The Story
            </div>
            <h2
              id="story-heading"
              className="mt-2 text-2xl md:text-3xl font-semibold text-white"
            >
              From a heavy place to freedom
            </h2>
          </div>
        </div>
        <Testimony showHeader={false} />
      </section>

      {/* ── WHERE IT BEGAN: smaller framed memory image ─────────── */}
      <section className="w-full py-14 md:py-20">
        <div className="mx-auto max-w-3xl px-6">
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={memoryTransition}
            className="panel-scrim p-6 md:p-8 grid gap-6 md:gap-8 md:grid-cols-[200px_1fr] md:items-center"
          >
            <div className="relative w-full mx-auto md:mx-0 max-w-[220px] aspect-square overflow-hidden rounded-xl border border-white/10 bg-black/20">
              <Image
                src="/media/dad.jpg"
                alt="Daniel as a child with family"
                fill
                sizes="(max-width: 768px) 60vw, 200px"
                className="object-cover"
                style={{ objectPosition: "50% 40%" }}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/0 to-black/35" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.26em] text-[var(--colour-amber)]/80">
                Where it began
              </div>
              <p className="mt-3 text-sm md:text-base text-white/75 leading-relaxed">
                Long before the music, before the stage, before any of it — there
                was a kid in Harare being shaped by the people who loved him,
                planted in soil he didn&apos;t choose, learning to listen for a voice
                bigger than his own.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── THE MISSION ─────────────────────────────────────────── */}
      <section
        aria-labelledby="mission-heading"
        className="w-full pb-24 md:pb-32"
      >
        <div className="mx-auto max-w-3xl px-6">
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={missionTransition}
            className="panel-scrim p-7 md:p-10"
          >
            <div className="text-xs uppercase tracking-[0.28em] text-[var(--colour-amber)]/80">
              The Mission
            </div>
            <h2
              id="mission-heading"
              className="mt-2 text-2xl md:text-3xl font-semibold text-white"
            >
              Point beyond the art to the Artist
            </h2>
            <div className="mt-6 space-y-5 text-base md:text-lg text-white/75 leading-relaxed">
              <p>
                All The Glory exists to create music that speaks into the silence,
                that reaches into the dark corners where hope feels like a foreign
                language, and translates it into something the heart can understand.
              </p>
              <p>
                Every song is a marker on the journey — a reminder that the God who
                began a good work is faithful to complete it. The music is raw,
                honest, and unapologetically hopeful.
              </p>
              <p>
                Whether on stage or in the studio, the aim is the same: to point
                beyond the art to the Artist, beyond the song to the Singer, beyond
                the story to the Author.
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
