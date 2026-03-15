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
    <div className="panel-scrim rounded-xl px-3 py-2.5 md:px-4 md:py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.24em] text-white/40">
            Track {String(index).padStart(2, "0")}
          </div>

          <motion.div
            initial={{ opacity: 0, x: "-90vw" }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 5,
              delay,
              ease: [0.12, 1, 0.25, 1],
            }}
            className="mt-0.5 relative overflow-hidden"
          >
            {/* The title text */}
            <span className="text-sm md:text-base font-semibold text-white/90 truncate block">
              {title}
            </span>

            {/* Shimmer sweep — a golden light that passes across the text after it lands */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "200%" }}
              transition={{
                duration: 1.8,
                delay: delay + 4.2,
                ease: "easeInOut",
              }}
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(105deg, transparent 30%, rgba(216,178,90,0.25) 45%, rgba(255,255,255,0.18) 50%, rgba(216,178,90,0.25) 55%, transparent 70%)",
              }}
            />
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
  const firstHalf = album.tracks.slice(0, 4);
  const secondHalf = album.tracks.slice(4);

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

        {/* Two-column: bigger art left, tracklist right */}
        <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr] items-start">
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

          {/* RIGHT: tracklist with download/give in the middle */}
          <motion.div
            initial={{ opacity: 0, x: 22 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, delay: 0.03, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col"
          >
            {/* Tracks 1–4 */}
            <div className="grid gap-2.5">
              {firstHalf.map((t, i) => (
                <TrackRow
                  key={t.title}
                  index={i + 1}
                  title={t.title}
                  href={(t as any).previewUrl}
                  delay={0.8 + i * 0.9}
                />
              ))}
            </div>

            {/* Download / Give panel — in the middle */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 4.5, ease: [0.22, 1, 0.36, 1] }}
              className="panel-scrim my-3 p-4 md:p-5 rounded-xl"
            >
              <div className="flex flex-wrap gap-3">
                <Link href="/store" className="btn btn-primary">
                  Download free →
                </Link>
                <Link href="/give" className="btn btn-ghost">
                  Give / donate →
                </Link>
              </div>
              <p className="mt-3 text-xs text-white/55 leading-relaxed">
                I didn't want to put a price on worship — this is an offering unto the Lord.
                If you feel led to support the work, your gift goes directly into recording,
                production, and releasing more music.
              </p>
            </motion.div>

            {/* Tracks 5–7 */}
            <div className="grid gap-2.5">
              {secondHalf.map((t, i) => (
                <TrackRow
                  key={t.title}
                  index={i + 5}
                  title={t.title}
                  href={(t as any).previewUrl}
                  delay={4.8 + i * 0.9}
                />
              ))}
            </div>

            {/* Streaming links */}
            <div className="panel-scrim mt-4 px-4 py-3 rounded-xl">
              <div className="flex flex-wrap gap-5 text-[10px] uppercase tracking-[0.26em] text-white/50">
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
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
