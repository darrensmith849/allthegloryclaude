"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { album } from "@/content/album";

function TrackRow({
  index,
  title,
  previewSrc,
}: {
  index: number;
  title: string;
  previewSrc?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-white/50">
            Track {String(index).padStart(2, "0")}
          </div>
          <div className="mt-1 text-base md:text-lg font-semibold text-white/90">
            {title}
          </div>
        </div>

        <Link href="/store" className="btn btn-ghost">
          Download free →
        </Link>
      </div>

      {previewSrc ? (
        <div className="mt-4">
          <div className="text-xs text-white/55 mb-2">30s preview</div>
          <audio controls preload="none" className="w-full" src={previewSrc} />
        </div>
      ) : (
        <div className="mt-4 text-xs text-white/45">Preview coming soon.</div>
      )}
    </div>
  );
}

export default function AlbumPage() {
  return (
    <main className="bg-transparent">
      <div className="mx-auto w-full max-w-6xl px-6 py-14 md:py-20">
        {/* NOTE: align-start + constrained image prevents overlap */}
        <div className="grid gap-10 lg:grid-cols-[minmax(320px,480px)_1fr] items-start">
          {/* LEFT: album art, sized to never exceed right column feel */}
          <motion.div
            initial={{ opacity: 0, x: -26 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="w-full"
          >
            {/* Square, responsive, capped */}
            <div
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/20"
              style={{
                width: "100%",
                maxWidth: "480px",
                aspectRatio: "1 / 1",
              }}
            >
              <Image
                src={album.coverImage}
                alt="Album cover"
                fill
                sizes="(max-width: 1024px) 100vw, 480px"
                className="object-cover"
              />

              {/* Depth + polish */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/70" />
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                {/* subtle sheen */}
                <div className="absolute -left-24 top-10 h-40 w-64 rotate-12 bg-white/10 blur-2xl" />
              </div>

              {/* Optional: hover label */}
              <div className="pointer-events-none absolute bottom-4 left-4 right-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className="text-xs text-white/70">
                  Artwork by{" "}
                  <a
                    href="https://debbieclarkart.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="pointer-events-auto underline decoration-white/20 underline-offset-4 hover:text-white"
                  >
                    Debbie Clarke
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-3 text-xs text-white/55 max-w-[480px]">
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

            {/* CTAs under art */}
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/store" className="btn btn-primary">
                Download free →
              </Link>
              <Link href="/give" className="btn btn-ghost">
                Give / donate →
              </Link>
            </div>

            <p className="mt-4 text-xs text-white/55 leading-relaxed max-w-[480px]">
              I didn't want to put a price on worship — this is an offering unto the Lord.
              If you feel led to support the work, your gift goes directly into recording, production,
              and releasing more music.
            </p>
          </motion.div>

          {/* RIGHT: text + tracklist */}
          <motion.div
            initial={{ opacity: 0, x: 26 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="text-xs uppercase tracking-[0.28em] text-white/60">
              2025 • Album
            </div>

            <h1 className="mt-3 text-3xl md:text-5xl font-semibold text-white">
              {album.title}
            </h1>

            {/* keep glyph safe from clipping */}
            <p className="subtitle-glyph mt-3 text-sm md:text-base text-white/75">
              {album.subtitle}
            </p>

            <h2 className="mt-10 text-xl md:text-2xl font-semibold text-white/90">
              Tracklist
            </h2>

            <div className="mt-6 grid gap-4">
              {album.tracks.map((t, i) => (
                <TrackRow
                  key={t.title}
                  index={i + 1}
                  title={t.title}
                  previewSrc={t.previewSrc}
                />
              ))}
            </div>

            {/* Optional streaming row (if you want it back later) */}
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
