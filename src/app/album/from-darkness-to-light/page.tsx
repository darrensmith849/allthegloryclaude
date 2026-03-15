"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { album } from "@/content/album";

const ease = [0.22, 1, 0.36, 1] as const;

function TrackRow({
  index,
  title,
  delay,
}: {
  index: number;
  title: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -28 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.55, delay, ease }}
      className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 md:px-6 md:py-5"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-[0.24em] text-white/45">
            Track {String(index).padStart(2, "0")}
          </div>
          <div className="mt-1 text-base md:text-lg font-semibold text-white/90 truncate">
            {title}
          </div>
        </div>

        <span className="shrink-0 text-xs uppercase tracking-[0.26em] text-white/55">
          Preview
        </span>
      </div>
    </motion.div>
  );
}

function SupportCard({ delay }: { delay: number }) {
  return (
    <motion.aside
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease }}
      className="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-7"
    >
      <div className="flex flex-wrap gap-3">
        <Link href="/store" className="btn btn-primary">
          Download free →
        </Link>
        <Link href="/give" className="btn btn-ghost">
          Give →
        </Link>
      </div>

      <p className="mt-5 text-sm text-white/65 leading-relaxed">
        I didn't want to put a price on worship — this is an offering unto the Lord.
      </p>

      <p className="mt-3 text-xs text-white/55 leading-relaxed">
        If you feel led to support the work, your gift goes directly into recording, production,
        and releasing more music.
      </p>
    </motion.aside>
  );
}

export default function AlbumPage() {
  return (
    <main className="bg-transparent">
      <div className="mx-auto w-full max-w-6xl px-6 py-14 md:py-20">
        {/* Header / Title */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
        >
          <div className="text-xs uppercase tracking-[0.28em] text-white/60">
            2025 • Album
          </div>

          <h1 className="mt-3 text-3xl md:text-5xl font-semibold text-white">
            {album.title}
          </h1>

          <p className="subtitle-glyph mt-3 text-sm md:text-base text-white/75">
            {album.subtitle}
          </p>
        </motion.div>

        {/* Layout:
           - Desktop: 3 columns (art | tracks | support)
           - Mobile: stacked (art, support, tracks)
        */}
        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(320px,460px)_minmax(420px,1fr)_340px] items-start">
          {/* ART (left) */}
          <motion.section
            initial={{ opacity: 0, x: -22 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, delay: 0.08, ease }}
          >
            <div
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/20"
              style={{
                width: "100%",
                maxWidth: "460px",
                height: "min(520px, 62vh)",
              }}
            >
              <Image
                src={album.coverImage}
                alt="Album cover"
                fill
                sizes="(max-width: 1024px) 100vw, 460px"
                className="object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/70" />
            </div>

            <div className="mt-3 text-xs text-white/55 max-w-[460px]">
              Artwork by{" "}
              <a
                href="https://debbieclarkart.com/"
                target="_blank"
                rel="noreferrer"
                className="text-white/75 underline decoration-white/20 underline-offset-4 hover:text-white"
              >
                Debbie Clarke
              </a>
            </div>
          </motion.section>

          {/* SUPPORT CARD (mobile) */}
          <div className="lg:hidden">
            <SupportCard delay={0.14} />
          </div>

          {/* TRACKLIST (middle) */}
          <motion.section
            initial={{ opacity: 0, x: 22 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, delay: 0.12, ease }}
          >
            <h2 className="text-xl md:text-2xl font-semibold text-white/90">
              Tracklist
            </h2>

            <div className="mt-6 grid gap-4">
              {album.tracks.map((t, i) => (
                <TrackRow
                  key={t.title}
                  index={i + 1}
                  title={t.title}
                  delay={0.18 + i * 0.06}
                />
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.28, ease }}
              className="mt-10 flex flex-wrap gap-6 text-xs uppercase tracking-[0.26em] text-white/55"
            >
              <a className="hover:text-white" href="#" onClick={(e) => e.preventDefault()}>
                Spotify ↗
              </a>
              <a className="hover:text-white" href="#" onClick={(e) => e.preventDefault()}>
                Apple Music ↗
              </a>
              <a className="hover:text-white" href="#" onClick={(e) => e.preventDefault()}>
                YouTube ↗
              </a>
            </motion.div>
          </motion.section>

          {/* SUPPORT CARD (desktop right column) */}
          <div className="hidden lg:block">
            <SupportCard delay={0.18} />
          </div>
        </div>
      </div>
    </main>
  );
}
