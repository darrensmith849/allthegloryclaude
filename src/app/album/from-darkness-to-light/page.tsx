"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { album } from "@/content/album";

function TrackRow({
  index,
  title,
  href,
  delay,
}: {
  index: number;
  title: string;
  href?: string;
  delay: number;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 md:px-4 md:py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.24em] text-white/40">
            Track {String(index).padStart(2, "0")}
          </div>

          <motion.div
            initial={{ opacity: 0, x: "-90vw" }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 3.5,
              delay,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="mt-0.5 text-sm md:text-base font-semibold text-white/90 truncate"
          >
            {title}
          </motion.div>
        </div>

        {href ? (
          <a
            href={href}
            className="shrink-0 text-[10px] uppercase tracking-[0.26em] text-white/55 hover:text-white"
            target="_blank"
            rel="noreferrer"
          >
            Preview ↗
          </a>
        ) : (
          <span className="shrink-0 text-[10px] uppercase tracking-[0.26em] text-white/40">
            Preview
          </span>
        )}
      </div>
    </div>
  );
}

export default function AlbumPage() {
  return (
    <main className="bg-transparent overflow-x-clip">
      <div className="mx-auto w-full max-w-6xl px-6 py-14 md:py-20">
        {/* Album title ABOVE the grid */}
        <div className="mb-8">
          <div className="text-xs uppercase tracking-[0.28em] text-white/60">
            2025 • Album
          </div>
          <h1 className="subtitle-glyph mt-3 text-3xl md:text-5xl font-semibold text-white">
            {album.title}
          </h1>
          <p className="subtitle-glyph mt-2 text-sm md:text-base text-white/65">
            {album.subtitle}
          </p>
        </div>

        {/* Two-column: art left, tracklist right — tracklist must not extend beyond art height */}
        <div className="grid gap-8 lg:grid-cols-2 items-start">
          {/* LEFT: album art */}
          <motion.div
            initial={{ opacity: 0, x: -22 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="w-full"
          >
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/20 aspect-square">
              <Image
                src={album.coverImage}
                alt="Album cover"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/70" />
            </div>

            {/* Credit */}
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
          </motion.div>

          {/* RIGHT: tracklist — constrained to match album art height */}
          <motion.div
            initial={{ opacity: 0, x: 22 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, delay: 0.03, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col"
          >
            <h2 className="text-lg font-semibold text-white/90 mb-4">
              Tracklist
            </h2>

            <div className="grid gap-2.5">
              {album.tracks.map((t, i) => (
                <TrackRow
                  key={t.title}
                  index={i + 1}
                  title={t.title}
                  href={(t as any).previewUrl}
                  delay={0.8 + i * 0.7}
                />
              ))}
            </div>

            {/* Streaming links */}
            <div className="mt-6 flex flex-wrap gap-5 text-[10px] uppercase tracking-[0.26em] text-white/50">
              <a className="hover:text-white" href="#" onClick={(e) => e.preventDefault()}>
                Spotify ↗
              </a>
              <a className="hover:text-white" href="#" onClick={(e) => e.preventDefault()}>
                Apple Music ↗
              </a>
              <a className="hover:text-white" href="#" onClick={(e) => e.preventDefault()}>
                YouTube ↗
              </a>
            </div>

            {/* CTAs */}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/store" className="btn btn-primary">
                Download free →
              </Link>
              <Link href="/give" className="btn btn-ghost">
                Give / donate →
              </Link>
            </div>

            <p className="mt-3 text-xs text-white/50 leading-relaxed">
              I didn't want to put a price on worship — this is an offering unto the Lord.
              If you feel led to support the work, your gift goes directly into recording,
              production, and releasing more music.
            </p>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
