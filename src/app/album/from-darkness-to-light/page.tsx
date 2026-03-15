"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { album } from "@/content/album";

const ease = [0.22, 1, 0.36, 1] as const;

function TrackRow({
  index,
  title,
  verse,
  verseUrl,
  delay,
  fromRight,
}: {
  index: number;
  title: string;
  verse: string;
  verseUrl: string;
  delay: number;
  fromRight: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: fromRight ? "80vw" : "-80vw" }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 5, delay, ease: [0.08, 1, 0.2, 1] }}
      className="group panel-scrim px-5 py-4 md:px-6 md:py-5 relative overflow-hidden"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-[0.24em] text-white/45">
            Track {String(index).padStart(2, "0")}
          </div>
          <div className="mt-1 text-base md:text-lg font-semibold text-white/90 truncate group-hover:text-[var(--colour-amber)] transition-colors duration-300">
            {title}
          </div>
        </div>

        <span className="shrink-0 text-xs uppercase tracking-[0.26em] text-white/55">
          Preview
        </span>
      </div>

      {/* Verse + read link on hover */}
      <div className="max-h-0 overflow-hidden opacity-0 group-hover:max-h-40 group-hover:opacity-100 transition-all duration-500 ease-out">
        <p className="mt-3 pt-3 border-t border-white/10 text-sm italic text-white/65 leading-relaxed">
          {verse}
        </p>
        <a
          href={verseUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block text-xs uppercase tracking-[0.24em] text-[var(--colour-amber)]/70 hover:text-[var(--colour-amber)] transition-colors duration-300"
        >
          Read verse ↗
        </a>
      </div>

      {/* Shimmer sweep after landing */}
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: "200%" }}
        transition={{
          duration: 1.8,
          delay: delay + 3.2,
          ease: "easeInOut",
        }}
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(105deg, transparent 30%, rgba(216,178,90,0.2) 45%, rgba(255,255,255,0.15) 50%, rgba(216,178,90,0.2) 55%, transparent 70%)",
        }}
      />
    </motion.div>
  );
}

function AlbumArt({ delay, side }: { delay: number; side: "left" | "right" }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: -80 }}
      animate={{ opacity: 0.85, y: 0 }}
      transition={{ duration: 3.5, delay, ease: [0.12, 1, 0.25, 1] }}
    >
      <div
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/20"
        style={{
          width: "100%",
          height: "min(560px, 65vh)",
        }}
      >
        <Image
          src={album.coverImage}
          alt="Album cover"
          fill
          sizes="(max-width: 1024px) 100vw, 33vw"
          className="object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/70" />
      </div>

      <div className="mt-3 text-xs text-white/55">
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
  );
}

export default function AlbumPage() {
  return (
    <main className="bg-transparent overflow-x-clip">
      <div className="mx-auto w-full max-w-7xl px-6 py-14 md:py-20">
        <div className="grid gap-8 lg:grid-cols-[1fr_minmax(380px,520px)_1fr] items-start">
          {/* LEFT artwork */}
          <div className="hidden lg:block">
            <AlbumArt delay={0.08} side="left" />
          </div>

          {/* Mobile artwork */}
          <div className="lg:hidden">
            <AlbumArt delay={0.08} side="left" />
          </div>

          {/* CENTRE: everything centred */}
          <motion.section
            initial={{ opacity: 0, y: -60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 3.5, delay: 0.3, ease: [0.12, 1, 0.25, 1] }}
            className="flex flex-col items-center text-center"
          >
            {/* Album header — panel-scrim glass background */}
            <div className="panel-scrim p-6 md:p-8 rounded-2xl w-full">
              <div className="text-xs uppercase tracking-[0.28em] text-white/60">
                2025 • Album
              </div>
              <h1 className="subtitle-glyph mt-3 text-2xl md:text-4xl font-semibold text-white">
                {album.title}
              </h1>
              <p className="subtitle-glyph mt-2 text-sm text-white/65">
                {album.subtitle}
              </p>

              {/* Download / Give */}
              <div className="mt-6 flex justify-center gap-3">
                <Link href="/store" className="btn btn-primary">
                  Download free →
                </Link>
                <Link href="/give" className="btn btn-ghost">
                  Give →
                </Link>
              </div>

              <p className="mt-4 text-xs text-white/55 leading-relaxed max-w-sm mx-auto">
                I didn't want to put a price on worship — this is an offering unto the Lord.
                If you feel led to support the work, your gift goes directly into recording,
                production, and releasing more music.
              </p>
            </div>

            {/* Tracks — alternating fly-in from left and right */}
            <div className="mt-8 grid gap-3 w-full">
              {album.tracks.map((t, i) => (
                <TrackRow
                  key={t.title}
                  index={i + 1}
                  title={t.title}
                  verse={t.verse}
                  verseUrl={t.verseUrl}
                  delay={0.6 + i * 0.8}
                  fromRight={i % 2 === 1}
                />
              ))}
            </div>

            {/* Streaming links */}
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 3, delay: 6.5, ease: [0.12, 1, 0.25, 1] }}
              className="mt-8 flex flex-wrap justify-center gap-6 text-xs uppercase tracking-[0.26em] text-white/55"
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

          {/* RIGHT artwork (desktop only) */}
          <div className="hidden lg:block">
            <AlbumArt delay={0.14} side="right" />
          </div>
        </div>
      </div>
    </main>
  );
}
