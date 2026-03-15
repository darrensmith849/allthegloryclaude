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
    <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 md:px-6 md:py-5">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-[0.24em] text-white/45">
            Track {String(index).padStart(2, "0")}
          </div>

          <motion.div
            initial={{ opacity: 0, x: "-60vw" }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 2,
              delay,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="mt-1 text-base md:text-lg font-semibold text-white/90 truncate"
          >
            {title}
          </motion.div>
        </div>

        {href ? (
          <a
            href={href}
            className="shrink-0 text-xs uppercase tracking-[0.26em] text-white/55 hover:text-white"
            target="_blank"
            rel="noreferrer"
          >
            Preview ↗
          </a>
        ) : (
          <span className="shrink-0 text-xs uppercase tracking-[0.26em] text-white/40">
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
        <div className="grid gap-10 lg:grid-cols-[minmax(380px,540px)_1fr] items-start">
          {/* LEFT: album art — tall to match right column */}
          <motion.div
            initial={{ opacity: 0, x: -22 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="w-full"
          >
            <div
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/20"
              style={{
                width: "100%",
                maxWidth: "540px",
                aspectRatio: "1 / 1",
              }}
            >
              <Image
                src={album.coverImage}
                alt="Album cover"
                fill
                sizes="(max-width: 1024px) 100vw, 540px"
                className="object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/70" />
            </div>

            {/* Credit under the image */}
            <div className="mt-3 text-xs text-white/55 max-w-[540px]">
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

            {/* CTAs */}
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/store" className="btn btn-primary">
                Download free →
              </Link>
              <Link href="/give" className="btn btn-ghost">
                Give / donate →
              </Link>
            </div>

            <p className="mt-4 text-xs text-white/55 leading-relaxed max-w-[540px]">
              I didn't want to put a price on worship — this is an offering unto the Lord.
              If you feel led to support the work, your gift goes directly into recording, production,
              and releasing more music.
            </p>
          </motion.div>

          {/* RIGHT: title + tracklist */}
          <motion.div
            initial={{ opacity: 0, x: 22 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, delay: 0.03, ease: [0.22, 1, 0.36, 1] }}
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

            <h2 className="mt-10 text-xl md:text-2xl font-semibold text-white/90">
              Tracklist
            </h2>

            {/* Tracklist: titles fly slowly across from the album art side, one by one */}
            <div className="mt-6 grid gap-4">
              {album.tracks.map((t, i) => (
                <TrackRow
                  key={t.title}
                  index={i + 1}
                  title={t.title}
                  href={(t as any).previewUrl}
                  delay={0.5 + i * 0.55}
                />
              ))}
            </div>

            {/* Optional streaming row */}
            <div className="mt-10 flex flex-wrap gap-6 text-xs uppercase tracking-[0.26em] text-white/55">
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
          </motion.div>
        </div>
      </div>
    </main>
  );
}
